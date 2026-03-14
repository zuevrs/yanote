---
id: T02
parent: S03
milestone: M004
provides:
  - Live two-service Kafka proof with per-service JSONL evidence, deterministic merge, and direct async analyzer handoff composed alongside the authoritative single-service republish verifier
key_files:
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java
  - scripts/ci/verify-m004-s01-kafka-recorder.sh
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
key_decisions:
  - Keep `scripts/ci/verify-m004-s02-metadata-propagation.sh` as the authoritative single-service proof and reduce `scripts/ci/verify-m004-s01-kafka-recorder.sh` to a thin delegating alias with its own run/suite defaults so the old surface cannot drift again.
  - Make the composed S03 verifier prove raw producer/consumer ownership and deterministic merge before `yanote async-report`, and simulate analyzer failure by intentionally checking the merged two-service evidence against the republish spec so retained artifacts show a real coverage-gate rejection.
patterns_established:
  - Start two role-scoped `ExampleServiceApplication` contexts in one Testcontainers-backed JUnit test by passing command-line overrides (`--server.port=0`, service name, events path, role flags) so `application.properties` defaults do not steal precedence.
  - Name retained two-service proof files lexically (`01-producer...`, `02-consumer...`) so merge-order diagnostics and merged-byte assertions stay deterministic and inspectable.
observability_surfaces:
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`
  - retained `01-producer.events.jsonl`, `02-consumer.events.jsonl`, `merged-two-service.events.jsonl`, and `merge.log` inside the verifier temp directory
  - `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java`
duration: 2h
verification_result: passed
completed_at: 2026-03-14T11:41:54+0300
blocker_discovered: false
---

# T02: Prove the live two-service analyzer handoff and compose the Kafka proof stack

**Added a live producer→consumer Kafka proof with separate per-service evidence files, deterministic merge-to-analyzer handoff, and a composed verifier that still runs the authoritative single-service republish proof first.**

## What Happened

I added `KafkaRecorderTwoServiceIntegrationTest.java`, which starts two differently configured `ExampleServiceApplication` contexts against one Testcontainers Kafka broker: a producer-only HTTP ingress service and a consumer-only listener service. The test drives the producer over real HTTP, waits for the Kafka handoff, and asserts that the producer file contains only its own HTTP + Kafka send evidence while the consumer file contains only its own Kafka receive evidence, with `test.run_id` / `test.suite` preserved end to end.

While implementing that test I hit a startup collision because `SpringApplicationBuilder.properties(...)` behaved like low-precedence defaults underneath `application.properties`, leaving both contexts on port 8080. I fixed that by switching the helper to command-line overrides (`.run("--server.port=0", ...)`), which gave the two-context proof deterministic precedence and eliminated the port conflict without changing the runtime model.

I added `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` as the analyzer contract for the merged two-service evidence. The topology stays truthful and minimal: one `users.created` channel with `send` and `receive` operations and no republish layer hidden in the fixture.

I refreshed `scripts/ci/verify-m004-s01-kafka-recorder.sh` so it no longer carries stale pre-republish expectations. Instead of duplicating the single-service proof logic, it now delegates to `scripts/ci/verify-m004-s02-metadata-propagation.sh` while keeping its own run/suite defaults, making S02 the single authoritative republish verifier for that leg.

I added `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, which composes the full slice proof stack:

- runs the authoritative single-service republish verifier first
- runs the two-service integration proof with explicit producer/consumer event paths
- performs raw JSONL assertions on each per-service file before any analyzer step
- merges the two files with `scripts/ci/merge-async-events-jsonl.mjs`
- proves the merged file is byte-for-byte deterministic concatenation of the input files
- runs `yanote async-report` directly on the merged file with no translation layer

I also wired a retained-artifact failure mode into the S03 verifier. `--simulate-analyzer-failure` intentionally checks the merged two-service evidence against the republish AsyncAPI fixture, which forces a real async coverage-gate failure after the raw-file and merge assertions have already passed. Combined with `--retain-temp-on-failure`, this leaves the producer file, consumer file, merged file, merge log, analyzer stdout/stderr, and report directory available for inspection.

## Verification

Passed task-level verification:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

Passed additional implementation checks:

- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`
- direct retained-artifact inspection of:
  - `/var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-m004-s03-live-proof.PnWWO0/01-producer.events.jsonl`
  - `/var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-m004-s03-live-proof.PnWWO0/02-consumer.events.jsonl`
  - `/var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-m004-s03-live-proof.PnWWO0/merged-two-service.events.jsonl`
  - `/var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-m004-s03-live-proof.PnWWO0/merge.log`

Passed slice-level verification checks runnable in T02:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `git diff --check`

Validated expected failure-path behavior:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`
  - exits with status `1` after raw producer/consumer assertions and deterministic merge pass
  - exposes retained artifact paths plus structured async stderr (`YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE ...`)

## Diagnostics

Future agents can inspect the live proof stack via:

- `KafkaRecorderTwoServiceIntegrationTest`, which proves the real producer-only → consumer-only handoff against one Kafka broker with separate events files
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, which logs the composed proof and fails early on raw-file ownership or merge drift before async coverage is considered
- retained temp artifacts from `--retain-temp-on-failure --simulate-analyzer-failure`, especially:
  - `01-producer.events.jsonl` — producer-only HTTP + Kafka send evidence with `producer-role-service`
  - `02-consumer.events.jsonl` — consumer-only Kafka receive evidence with `consumer-role-service`
  - `merged-two-service.events.jsonl` — deterministic concatenation fed unchanged into `yanote async-report`
  - `merge.log` — exposes `ordered_inputs=...`
  - `async-report.stdout` / `async-report.stderr` — show analyzer summary and gate error shape

## Deviations

- None.

## Known Issues

- None.

## Files Created/Modified

- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — added the real two-context Testcontainers producer→consumer proof with separate per-service evidence files.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — converted the stale single-service verifier into a thin delegating alias of the authoritative S02 republish proof.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — added the composed single-service + two-service + merge + async-report verifier, including retained-artifact failure simulation.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — added the AsyncAPI fixture for the split producer/consumer handoff.
- `.gsd/milestones/M004/slices/S03/S03-PLAN.md` — marked T02 complete.
- `.gsd/milestones/M004/slices/S03/tasks/T02-SUMMARY.md` — recorded the task handoff, verification, and diagnostics.
- `.gsd/STATE.md` — advanced the repo state to T03 as the next action.
