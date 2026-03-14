---
id: T01
parent: S03
milestone: M004
provides:
  - Deterministic example-service Kafka role flags plus a stable multi-service JSONL merge contract
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/main/resources/application.properties
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java
  - scripts/ci/merge-async-events-jsonl.mjs
  - scripts/ci/merge-async-events-jsonl.test.mjs
key_decisions:
  - Producer/listener/republish flags are now the authoritative role surface, with `example.kafka.enabled` kept only as a temporary compatibility umbrella in config.
patterns_established:
  - Give each Kafka listener a deterministic listener ID and verify role ownership via Spring context tests plus listener-registry assertions.
  - Derive default per-service evidence paths from service identity/runtime port and merge multi-service JSONL by lexicographic path order without re-sorting in-file lines.
observability_surfaces:
  - `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest'`
  - `node --test scripts/ci/merge-async-events-jsonl.test.mjs`
  - `node scripts/ci/merge-async-events-jsonl.mjs --out <merged> <files...>` stdout exposes `ordered_inputs=...`
duration: 2h
verification_result: passed
completed_at: 2026-03-14T11:24:19+0300
blocker_discovered: false
---

# T01: Split the example service into deterministic Kafka roles and lock merge semantics

**Shipped role-scoped example-service wiring, a focused Spring boot contract for producer-only vs consumer-only roles, and a deterministic JSONL merge helper with an executable ordering contract.**

## What Happened

I replaced the example app’s coarse Kafka bean gating with explicit producer, listener, and republish flags. The app now exposes deterministic role boundaries for:

- producer-only: HTTP ingress plus the `users.created` publisher, with no listener beans or republish path
- consumer-only: the `users.created` listener only, with no publish or republish beans
- single-service republish: the existing HTTP → Kafka → Kafka flow, now driven by the narrower flags

To make role inspection deterministic, both Kafka listeners now have stable listener IDs and the `UserCreatedListener` no longer requires the republish publisher to exist; it republishes only when that role is enabled.

I updated `application.properties` so the config surface is explicit and safer for multi-service use:

- `server.port` resolves from `EXAMPLE_SERVER_PORT`
- `yanote.recorder.service-name` resolves from `EXAMPLE_SERVICE_NAME`
- `spring.kafka.consumer.group-id` defaults from the service name and can be overridden via `EXAMPLE_KAFKA_GROUP_ID`
- `yanote.recorder.events-path` defaults to `/data/yanote/<service>-<port>.events.jsonl`, which prevents accidental producer/consumer file sharing when the two services use distinct ports/service names
- new role flags are environment-driven, with the old `example.kafka.enabled` retained only as a temporary compatibility fan-out during the slice migration

I added `KafkaRoleScopedConfigurationTest.java` using a real Spring context plus listener-registry assertions to prove the role-specific beans, topics, and listener registrations are enabled/disabled correctly for producer-only and consumer-only configurations.

I also added `scripts/ci/merge-async-events-jsonl.mjs`, which merges per-service JSONL files by lexicographic path order while preserving original file contents/line ordering, and `scripts/ci/merge-async-events-jsonl.test.mjs`, which locks both the happy-path merge contract and an actionable missing-input failure.

Per the pre-flight requirement, I also amended `.gsd/milestones/M004/slices/S03/S03-PLAN.md` so the slice verification list now includes an explicit future diagnostics/failure-path verifier for retained temp artifacts and structured stderr.

## Verification

Passed task-level verification:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest'`
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs`

Passed additional implementation safety check:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`

Passed slice-level verification checks that exist after T01:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
  - exits 0 today because the new role-scoped config test and the existing single-service integration test pass; the two-service test class is still a T02 responsibility
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `git diff --check`

Expected pending slice-level failures/gaps outside T01 scope:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` → fails with `No such file or directory` because the composed live verifier is a T02 deliverable
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` → same expected failure because that diagnostic/failure-path verifier depends on the same T02 script surface

## Diagnostics

Future agents can inspect the new role/merge surfaces directly via:

- `KafkaRoleScopedConfigurationTest`, which asserts resolved service-name/events-path/group-id values, stable listener IDs, and bean/topic ownership for producer-only vs consumer-only configs
- `merge-async-events-jsonl.test.mjs`, which proves lexicographic file ordering plus preserved in-file line order
- `merge-async-events-jsonl.mjs` CLI stdout, which emits `ordered_inputs=...` for direct inspection of merge ordering
- merge-helper failure stderr, which now reports a concrete argument error instead of failing opaquely when inputs are missing

## Deviations

- None.

## Known Issues

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` does not exist yet; both the happy-path and diagnostic slice verifier entries remain pending for T02.
- `KafkaRecorderTwoServiceIntegrationTest` is not implemented yet; T02 still owns the real two-service Testcontainers proof.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — replaced coarse Kafka gating with explicit role-scoped beans, stable listener IDs, and optional republish wiring.
- `examples/springmvc-service/src/main/resources/application.properties` — added explicit producer/listener/republish flags plus safer service/port-derived defaults for events path and consumer group.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — moved the existing single-service proof onto the new role flags.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java` — added focused producer-only vs consumer-only Spring context coverage.
- `scripts/ci/merge-async-events-jsonl.mjs` — added deterministic path-ordered JSONL merge helper.
- `scripts/ci/merge-async-events-jsonl.test.mjs` — added executable merge-order and failure-diagnostics contract coverage.
- `.gsd/milestones/M004/slices/S03/S03-PLAN.md` — added the required diagnostic/failure-path verification step and marked T01 complete.
- `.gsd/DECISIONS.md` — recorded the temporary compatibility boundary for `example.kafka.enabled` during the role-flag migration.
