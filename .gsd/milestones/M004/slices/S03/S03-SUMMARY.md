---
id: S03
parent: M004
milestone: M004
provides:
  - Live single-service and two-service Kafka proof surfaces with deterministic per-service evidence merge and CI execution inside the existing required check
requires:
  - slice: S01
    provides: Truthful Spring Kafka producer/consumer evidence capture and analyzer-compatible normalized Kafka JSONL
  - slice: S02
    provides: Suite/run Kafka header propagation and the authoritative single-service republish proof surface
affects:
  - M005/S01
  - M005/S02
key_files:
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java
  - scripts/ci/merge-async-events-jsonl.mjs
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - .github/workflows/yanote-ci.yml
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .gsd/REQUIREMENTS.md
key_decisions:
  - Reuse examples/springmvc-service as role-scoped producer-only, consumer-only, and single-service republish proof instances instead of creating a second demo service.
  - Merge per-service JSONL by lexicographic path order while preserving in-file line order.
  - Keep the authoritative single-service proof in scripts/ci/verify-m004-s02-metadata-propagation.sh and run the composed live Kafka proof inside the existing build-and-test required job.
patterns_established:
  - Start two differently configured ExampleServiceApplication contexts in one Testcontainers-backed integration test with command-line property overrides so runtime role ownership stays deterministic.
  - Name retained per-service proof files lexically (01-producer / 02-consumer) so merge diagnostics and analyzer handoff remain inspectable and byte-stable.
  - Assert raw producer/consumer JSONL ownership before running yanote async-report.
observability_surfaces:
  - ./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'
  - node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure
  - retained temp artifacts: 01-producer.events.jsonl, 02-consumer.events.jsonl, merged-two-service.events.jsonl, merge.log, async-report.stdout, async-report.stderr
drill_down_paths:
  - .gsd/milestones/M004/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M004/slices/S03/tasks/T03-SUMMARY.md
duration: 4h45m
verification_result: passed
completed_at: 2026-03-14T11:54:20+0300
---

# S03: Live Multi-Service Kafka Proof Stack

**Shipped a reproducible live Kafka proof stack that covers both the single-service republish path and a two-service producer→consumer path, merges per-service evidence deterministically, and runs inside the existing `build-and-test` required check.**

## What Happened

S03 closed the operational proof gap left after S01 and S02. The example Spring MVC service now supports deterministic Kafka roles, so the same app can run as producer-only, consumer-only, or the original single-service republisher without accidental self-consume drift. That role split is protected by focused Spring context coverage and by safer defaults for service name, group id, server port, and per-service events paths.

On top of that role boundary, the slice added a deterministic multi-service evidence merge contract. `scripts/ci/merge-async-events-jsonl.mjs` concatenates per-service JSONL files in lexicographic path order while preserving original in-file line order, and its contract test locks both happy-path stability and actionable missing-input failure behavior.

The slice then proved the real two-service handoff against Kafka. `KafkaRecorderTwoServiceIntegrationTest` starts two differently configured `ExampleServiceApplication` contexts against one Testcontainers broker, drives the producer over real HTTP, and asserts that raw evidence stays truthful: the producer file contains only HTTP plus `kafka send`, the consumer file contains only `kafka receive`, and `test.run_id` / `test.suite` survive end to end. The live verifier composes that proof with the authoritative single-service republish verifier, performs raw-file assertions first, merges the files deterministically, and feeds the merged file directly into `yanote async-report` with no translation step.

Finally, S03 promoted that composed proof into CI without changing branch-protection topology. `.github/workflows/yanote-ci.yml` now runs `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` inside the existing `build-and-test` job after JVM and analyzer prerequisites, and the workflow contract test now fails if that step disappears, moves out of `build-and-test`, or if the required dependency chain drifts.

The retained failure path was also proven. Running the verifier with `--retain-temp-on-failure --simulate-analyzer-failure` intentionally checks valid two-service evidence against the republish fixture, producing a real async gate failure only after raw evidence and merge assertions pass. That leaves retained producer, consumer, merged, merge-log, stdout, and stderr artifacts behind for inspection.

## Verification

Verified across the full slice:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` (expected failure verified, exit status 1, retained artifacts present, structured `YANOTE_ASYNC_ERROR` observed)
- `git diff --check`

Confirmed observability surfaces worked from live artifacts:

- producer raw file showed one HTTP record plus one `kafka send` record for `producer-role-service`
- consumer raw file showed one `kafka receive` record for `consumer-role-service`
- `merge.log` exposed deterministic `ordered_inputs=.../01-producer.events.jsonl,.../02-consumer.events.jsonl`
- failure-path stderr exposed `YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE ...`

## Requirements Advanced

- R048 — S03 now provides the live Kafka proof stack, retained-failure diagnostics, and required-workflow wiring that M005 can compose into the final release-grade async trust surface.

## Requirements Validated

- R042 — Producer-side normalized Kafka evidence is now proven end to end against a real broker and analyzer handoff.
- R043 — Consumer-side normalized Kafka evidence is now proven end to end against a real broker with producer/consumer ownership kept separate.
- R044 — Suite/run attribution now stays truthful through both single-service republish and two-service Kafka handoff flows.
- R045 — The repo now proves both required live Kafka scenarios: one service that publishes and consumes, and a split producer→consumer flow.
- R046 — Async proof depth now spans fixture, unit, integration, end-to-end, retained-failure diagnostics, and required CI workflow execution.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

None.

## Known Limitations

- Public async onboarding, support boundaries, and user-facing documentation for the Kafka path are still owned by M005/R047.
- The broader release-grade async trust surface is not fully closed until M005 composes this proof stack into the final public/product acceptance story (R048).
- `example.kafka.enabled` remains as a temporary compatibility umbrella in `application.properties` while downstream callers finish migrating to the narrower role flags.
- Payload validation against AsyncAPI message schemas remains deferred.

## Follow-ups

- M005/S01 should turn the new Kafka proof surfaces into a user-facing onboarding/support path without overselling beyond Kafka-only, Spring Kafka-first scope.
- M005/S02 should compose this live proof stack into the final async end-to-end acceptance/trust surface instead of creating a parallel proof story.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — finalized deterministic producer/listener/republish role wiring.
- `examples/springmvc-service/src/main/resources/application.properties` — added safer service/port-derived defaults for per-service events output and role flags.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java` — proved producer-only and consumer-only boot surfaces.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — kept the single-service proof on the new role-scoped configuration.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — added real two-context Kafka proof with separate events files.
- `scripts/ci/merge-async-events-jsonl.mjs` — added deterministic per-service JSONL merge helper.
- `scripts/ci/merge-async-events-jsonl.test.mjs` — locked merge ordering and missing-input failure behavior.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — reduced the stale S01 verifier to a thin alias of the authoritative S02 single-service proof.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — composed the single-service proof, two-service proof, merge contract, analyzer handoff, and retained-failure diagnostics.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — added the split producer/consumer AsyncAPI fixture for merged evidence analysis.
- `.github/workflows/yanote-ci.yml` — runs the live Kafka proof stack inside `build-and-test`.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — locks proof-step placement and required job dependency topology.
- `.gsd/REQUIREMENTS.md` — promoted R042–R046 from active to validated based on completed proof.
- `.gsd/DECISIONS.md` — recorded the single-service-proof authority boundary.
- `.gsd/milestones/M004/M004-ROADMAP.md` — marked S03 complete.
- `.gsd/STATE.md` — advanced the repo handoff beyond M004 execution toward M005 planning.
- `.gsd/PROJECT.md` — refreshed project state to reflect completed M004 capability.

## Forward Intelligence

### What the next slice should know
- The best starting point for future async acceptance work is `scripts/ci/verify-m004-s03-live-kafka-proof.sh`; it already composes truthful single-service and two-service runtime proof and exposes retained artifacts when something breaks.
- The authoritative single-service verifier is now `scripts/ci/verify-m004-s02-metadata-propagation.sh`; future work should not duplicate or fork that surface.
- The merged analyzer input is intentionally a plain concatenation of per-service files. Do not add timestamp re-sorting unless you also solve same-millisecond stability and byte-determinism explicitly.

### What's fragile
- `example.kafka.enabled` compatibility fan-out — it is intentional for now, but future config cleanup must preserve current defaults and proof commands.
- Two-context startup precedence — the proof relies on command-line overrides rather than `SpringApplicationBuilder.properties(...)` defaults, because defaults lost to `application.properties` and caused port collisions.

### Authoritative diagnostics
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` — quickest trustworthy way to inspect raw producer/consumer ownership, merge order, and structured async gate failure in one retained temp directory.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — authoritative executable proof of the split producer→consumer handoff.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — authoritative guardrail for keeping the live Kafka proof inside the required CI topology.

### What assumptions changed
- “Two-service proof needs a second demo module” — false; one role-scoped example app was sufficient and kept the milestone smaller and more deterministic.
- “SpringApplicationBuilder.properties(...) will override application.properties strongly enough for dual-context tests” — false; command-line overrides were required to avoid port conflicts and preserve deterministic role ownership.
