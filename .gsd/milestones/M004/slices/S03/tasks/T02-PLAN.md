---
estimated_steps: 4
estimated_files: 5
---

# T02: Prove the live two-service analyzer handoff and compose the Kafka proof stack

**Slice:** S03 — Live Multi-Service Kafka Proof Stack
**Milestone:** M004

## Description

Turn the role-scoped example app into the slice’s live two-service proof so one producer-role instance and one consumer-role instance share a real Kafka broker, keep evidence in separate JSONL files, and feed a deterministically merged file into `yanote async-report` alongside the existing single-service republish proof.

## Steps

1. Keep `scripts/ci/verify-m004-s02-metadata-propagation.sh` as the authoritative single-service proof leg, and refresh `scripts/ci/verify-m004-s01-kafka-recorder.sh` so it no longer encodes the stale pre-republish 3-event expectation.
2. Add `KafkaRecorderTwoServiceIntegrationTest.java` that starts two differently configured `ExampleServiceApplication` contexts against one `KafkaContainer`, drives the producer-role instance over HTTP, and asserts producer vs consumer evidence in separate per-service files.
3. Add `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` plus a composed `scripts/ci/verify-m004-s03-live-kafka-proof.sh` that runs the current single-service proof, runs the two-service proof, merges the two-service JSONL files with the T01 helper, and executes `yanote async-report` on the merged output.
4. Keep raw evidence assertions ahead of report generation so service attribution, metadata survival, and merge input ownership fail at the JSONL boundary instead of only as downstream coverage drift.

## Must-Haves

- [ ] The two-service proof uses separate service names and separate events files, and raw assertions prove each service only records its own truthful evidence with preserved `test.*` attribution.
- [ ] The single-service republish proof remains part of the final verifier stack rather than being replaced by the new two-service path.
- [ ] The merged two-service file reaches `yanote async-report` unchanged apart from deterministic concatenation and produces the expected async coverage with no hidden translation layer.

## Verification

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals added/changed: the example proof surface now emits one producer-service JSONL file, one consumer-service JSONL file, and one merged analyzer input for the two-service scenario.
- How a future agent inspects this: run the two-service integration test or the composed verifier, then inspect the retained per-service files before looking at the merged async report.
- Failure state exposed: wrong service attribution, missing consumer evidence, stale single-service assumptions, or analyzer rejection becomes visible as separate raw-file or verifier failures instead of a single opaque report diff.

## Inputs

- `.gsd/milestones/M004/slices/S03/tasks/T01-PLAN.md` — role-scoped example configuration and deterministic merge helper the live proof depends on.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — current real-broker single-service proof that must remain valid.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — current authoritative single-service verifier to compose into the final stack.

## Expected Output

- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — still-truthful single-service proof aligned to the final stack.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — live two-service producer→consumer proof with separate events files.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — AsyncAPI fixture aligned to the two-service proof topology.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — refreshed single-service verifier without stale 3-event assumptions.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — milestone-level verifier that composes the single-service and two-service live proofs.
