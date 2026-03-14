# S03: Live Multi-Service Kafka Proof Stack

**Goal:** Extend the current Spring Kafka proof surfaces so Yanote proves both the single-service republish path and a role-separated two-service producer→consumer path, merges per-service JSONL deterministically, and runs that live Kafka proof stack inside the existing required CI checks.
**Demo:** Running the slice verifier stack proves the current single-service HTTP → Kafka → Kafka republish scenario still passes, two differently configured instances of `examples/springmvc-service` exchange Kafka events through a real broker while writing separate JSONL files, deterministic merge produces one stable analyzer input, and the existing `build-and-test` required check executes that live proof without introducing a new job name.

## Decomposition Rationale

- S03 owns R045 and R046, and supports R042, R043, R044, and R048, so the plan starts with the operational determinism gap: role separation and merge ordering. Without that boundary, any two-service proof can still self-consume, race, or drift byte-for-byte between runs.
- Put the live two-service proof second because the real milestone risk is no longer recorder shape; it is whether raw per-service evidence, metadata survival, and analyzer handoff stay truthful when two service instances share one broker.
- Wire CI last so the required workflow consumes an already-proven local/runtime stack instead of discovering topology and merge problems for the first time inside GitHub Actions.

## Must-Haves

- `examples/springmvc-service` can run in a deterministic single-service republish mode and in split producer-only / consumer-only Kafka roles without widening the proof into accidental self-consume or shared-file behavior.
- Multi-service evidence stays per-service on disk, and one explicit merge helper produces a stable analyzer input by preserving line order within each file and concatenating files in deterministic path order.
- The repo has a repeatable live proof for both scenarios: the existing single-service republish flow and a real-broker two-service producer→consumer flow with raw evidence assertions before `yanote async-report`.
- The live Kafka proof stack runs under an existing required CI job name and is protected by workflow/contract checks so async proof depth cannot silently fall back to local-only verification.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'` proves the example app supports deterministic role-scoped wiring and both live broker scenarios against Testcontainers Kafka.
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` proves deterministic merge semantics and required-check workflow wiring stay locked.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` composes the current single-service republish proof with the new two-service merge/analyzer handoff end to end.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` proves the verifier exposes an inspectable failure state with retained temp artifacts and structured stderr instead of failing opaquely.
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: per-service JSONL files with stable service attribution, one merged analyzer input file, and retained verifier temp artifacts when the live proof fails.
- Inspection surfaces: focused example-service configuration/integration tests, the merge-helper contract test, `scripts/ci/verify-m004-s03-live-kafka-proof.sh` logs and retained temp directory, and the `build-and-test` workflow logs.
- Failure visibility: wrong role ownership, missing per-service output, merge-order drift, lost `test.*` attribution, or async analyzer rejection stays visible at the raw-file/script boundary instead of only as downstream coverage loss.
- Redaction constraints: keep the proof metadata-only; do not introduce payload dumps, arbitrary header copies, or broker credential leakage into logs or artifacts.

## Integration Closure

- Upstream surfaces consumed: `examples/springmvc-service`, the S02 single-service republish verifier, Spring Kafka recorder/test-metadata contracts from S01/S02, `yanote-js` async fixtures/report path, and the existing `build-and-test` workflow contract.
- New wiring introduced in this slice: role-scoped Kafka example configuration, deterministic JSONL merge helper, a two-service integration/verifier path, and one required-check workflow step that runs the live Kafka proof stack.
- What remains before the milestone is truly usable end-to-end: nothing inside M004; M005 still owns public onboarding/support and the final release-grade async trust surface.

## Tasks

- [x] **T01: Split the example service into deterministic Kafka roles and lock merge semantics** `est:1h`
  - Why: The two-service proof cannot be trustworthy until one app instance can publish without also claiming the consume path, and until multi-service evidence has one explicit deterministic merge rule.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/springmvc-service/src/main/resources/application.properties`, `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java`, `scripts/ci/merge-async-events-jsonl.mjs`, `scripts/ci/merge-async-events-jsonl.test.mjs`
  - Do: Replace the coarse `example.kafka.enabled` gating with narrower producer/listener/republish role switches that still preserve the current single-service default path, add a focused example-service test that proves the producer-only and consumer-only role surfaces boot as intended, and add a merge helper that concatenates per-service JSONL in deterministic path order while preserving each file’s original line order.
  - Verify: `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' && node --test scripts/ci/merge-async-events-jsonl.test.mjs`
  - Done when: the example app can be started in producer-only and consumer-only roles without self-consume drift, and the merge helper emits byte-stable output from multiple service files.
- [x] **T02: Prove the live two-service analyzer handoff and compose the Kafka proof stack** `est:1h30m`
  - Why: R045 closes only when both live scenarios produce truthful raw evidence and the merged two-service file reaches `yanote async-report` without any ad hoc translation layer.
  - Files: `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`, `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`, `scripts/ci/verify-m004-s01-kafka-recorder.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Do: Keep the S02 verifier as the current single-service truth surface, refresh the stale S01 verifier so it no longer encodes the old 3-event assumption, add a two-context Testcontainers integration test that drives one producer-role instance over HTTP and asserts the consumer-role instance receives on Kafka into its own JSONL file with preserved `test.*` attribution, and create a composed S03 verifier that runs the single-service proof plus the two-service merge/analyzer handoff with raw per-service assertions first.
  - Verify: `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest' && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: one repeatable verifier command proves both live Kafka scenarios, producer and consumer evidence stay in the correct per-service files with expected suite/run attribution, and the merged two-service events file passes `yanote async-report`.
- [x] **T03: Run the live Kafka proof stack inside the required CI workflow** `est:45m`
  - Why: R046 is not complete while the live Kafka stack is only locally runnable; the required workflow must execute it without changing the frozen job topology.
  - Files: `.github/workflows/yanote-ci.yml`, `scripts/ci/yanote-ci-workflow.contract.test.mjs`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `.gsd/STATE.md`
  - Do: Add the composed S03 verifier to the existing `build-and-test` job after its JVM and analyzer prerequisites, extend the workflow contract test to pin that required-check placement and reject new job-name drift, and refresh `.gsd/STATE.md` so post-slice execution points at the next milestone boundary instead of a planning placeholder.
  - Verify: `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: `build-and-test` remains the required job name, workflow contracts fail if the live Kafka proof step disappears or moves to a new job, and the slice handoff state no longer points at unplanned S03 work.

## Files Likely Touched

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/springmvc-service/src/main/resources/application.properties`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `scripts/ci/merge-async-events-jsonl.mjs`
- `scripts/ci/merge-async-events-jsonl.test.mjs`
- `scripts/ci/verify-m004-s01-kafka-recorder.sh`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `.github/workflows/yanote-ci.yml`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `.gsd/STATE.md`
