---
id: T04
parent: S02
milestone: M015
provides: []
requires: []
affects: []
key_files: ["scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh", "scripts/ci/export-async-proof-artifacts.sh", "scripts/ci/export-async-proof-artifacts.test.mjs", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Drive proof-specific async artifact absences through the shared exporter via `YANOTE_ASYNC_OPTIONAL_ARTIFACTS` instead of hardcoding RabbitMQ-only branching into the export script.", "Target the single happy-path RabbitMQ two-service test method in the live proof script so later negative-test cleanup does not erase the retained producer/consumer JSONL bundle."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the exporter contract suite, the new live RabbitMQ proof command, and the full slice verifier stack. The retained `.yanote-ci/live-rabbitmq-proof/` bundle now shows `report_spec_source_ref=yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`, `report_channels=1/1`, `report_operations=2/2`, `report_messages=2/2`, `report_supported_bindings=0/0`, `report_runtime_satisfied_semantics=0/0`, and explicit `none` markers for `single-service-proof.log`, `runtime-selected-*`, and `schema-failure-*`. The exported `async-report.stdout` also retains the final `YANOTE_ASYNC_SUMMARY ... protocols=amqp ...` line."
completed_at: 2026-03-26T18:24:10.694Z
blocker_discovered: false
---

# T04: Added the live RabbitMQ proof script and taught async bundle export to record Kafka-only companions as explicit absences.

> Added the live RabbitMQ proof script and taught async bundle export to record Kafka-only companions as explicit absences.

## What Happened
---
id: T04
parent: S02
milestone: M015
key_files:
  - scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Drive proof-specific async artifact absences through the shared exporter via `YANOTE_ASYNC_OPTIONAL_ARTIFACTS` instead of hardcoding RabbitMQ-only branching into the export script.
  - Target the single happy-path RabbitMQ two-service test method in the live proof script so later negative-test cleanup does not erase the retained producer/consumer JSONL bundle.
duration: ""
verification_result: passed
completed_at: 2026-03-26T18:24:10.695Z
blocker_discovered: false
---

# T04: Added the live RabbitMQ proof script and taught async bundle export to record Kafka-only companions as explicit absences.

**Added the live RabbitMQ proof script and taught async bundle export to record Kafka-only companions as explicit absences.**

## What Happened

Added `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` as the new one-command live RabbitMQ proof. The script runs the authoritative two-service Spring RabbitMQ happy-path test, validates the retained producer/consumer JSONL ownership contract, merges both files deterministically, invokes the built `async-report` CLI against `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`, and proves the resulting report stays on the AMQP truth surface with `protocols=amqp`, full send/receive coverage, zero Kafka binding support, declared reply/correlation semantics, and zero runtime-semantics rows. It also exports a deterministic `.yanote-ci/live-rabbitmq-proof/` bundle and verifies the retained manifest/source-path notes before succeeding.

To support that honest AMQP bundle, I widened `scripts/ci/export-async-proof-artifacts.sh` so successful exports can mark proof-specific absent artifacts explicitly instead of failing or fabricating files. The new `YANOTE_ASYNC_OPTIONAL_ARTIFACTS` override keeps the shared exporter reusable for Kafka and RabbitMQ flows: Kafka still requires its single-service/runtime-selected/schema-failure companions by default, while the RabbitMQ proof passes those names as optional and the bundle records them as `none` in `artifact-source-paths.txt` plus `missing_artifacts` in `artifact-manifest.txt`. I extended `scripts/ci/export-async-proof-artifacts.test.mjs` with a deterministic AMQP success case covering that absence contract.

During implementation I hit one local-reality drift: running the whole `RabbitMqRecorderTwoServiceIntegrationTest` class caused later negative tests to delete the consumer JSONL path after the happy-path evidence had already been produced, making the exported bundle nondeterministic. I verified that behavior from the retained logs, narrowed the proof runner to the single happy-path method, reran the script, and confirmed the final bundle now exports the intended live AMQP evidence without losing the retained files.

## Verification

Ran the exporter contract suite, the new live RabbitMQ proof command, and the full slice verifier stack. The retained `.yanote-ci/live-rabbitmq-proof/` bundle now shows `report_spec_source_ref=yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`, `report_channels=1/1`, `report_operations=2/2`, `report_messages=2/2`, `report_supported_bindings=0/0`, `report_runtime_satisfied_semantics=0/0`, and explicit `none` markers for `single-service-proof.log`, `runtime-selected-*`, and `schema-failure-*`. The exported `async-report.stdout` also retains the final `YANOTE_ASYNC_SUMMARY ... protocols=amqp ...` line.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest` | 0 | ✅ pass | 689ms |
| 2 | `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest` | 0 | ✅ pass | 6687ms |
| 3 | `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest` | 0 | ✅ pass | 104965ms |
| 4 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs` | 0 | ✅ pass | 349ms |
| 5 | `npm -C yanote-js run build && bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` | 0 | ✅ pass | 36470ms |


## Deviations

The proof runner executes `RabbitMqRecorderTwoServiceIntegrationTest.shouldWriteSeparateProducerAndConsumerEvidenceForLiveRabbitMqHandoff` instead of the whole test class because the sibling negative tests intentionally delete the retained JSONL files after their assertions, which would otherwise make the exported happy-path bundle nondeterministic.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `.gsd/KNOWLEDGE.md`


## Deviations
The proof runner executes `RabbitMqRecorderTwoServiceIntegrationTest.shouldWriteSeparateProducerAndConsumerEvidenceForLiveRabbitMqHandoff` instead of the whole test class because the sibling negative tests intentionally delete the retained JSONL files after their assertions, which would otherwise make the exported happy-path bundle nondeterministic.

## Known Issues
None.
