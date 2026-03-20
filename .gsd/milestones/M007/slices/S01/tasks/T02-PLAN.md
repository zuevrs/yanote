---
estimated_steps: 4
estimated_files: 5
---

# T02: Capture observed Kafka payloads at the Spring Kafka truth seams

**Slice:** S01 — Payload-Bearing Async Evidence Contract
**Milestone:** M007

## Description

Relevant skills: `spring-kafka`, `kafka-engineer`, `testcontainers`, `java-junit`.

Carry the new payload contract into the real recorder path by capturing observed producer and consumer values at the existing Spring Kafka outcome seams, preserving explicit message-hint behavior and the recorder’s fail-safe posture when payload capture or JSONL writing cannot succeed safely.

## Steps

1. Add one recorder-side payload capture helper that converts observed Spring Kafka values into JSON-safe evidence without `toString()` heuristics and with explicit omission when the value is opaque or non-serializable.
2. Wire payload capture into `YanoteKafkaEventRecorder` for both producer and consumer recording while keeping `message`, `test.run_id`, and `test.suite` behavior unchanged.
3. Update recorder contract/integration tests to assert payload-bearing `send` / `receive` facts, plus failure-adjacent behavior where capture or writing cannot break user traffic.
4. Update the example single-service raw-JSONL proof to assert the recorded payload field alongside the existing message/test metadata without changing `async-report` semantics yet.

## Must-Haves

- [ ] Recorder-emitted Kafka JSONL includes observed payloads when they can be represented as JSON-safe values.
- [ ] The recorder never falls back to synthetic `toString()` payload inference and never weakens explicit `yanote.message` semantics.
- [ ] Capture or write failure still degrades safely through omission/warn behavior, and the example-service raw JSONL proof exercises the new payload field.

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest'`
- `./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`

## Observability Impact

- Signals added/changed: recorder-written Kafka facts now expose an optional `payload` field in raw JSONL, while recorder warnings remain the failure signal when capture or writing cannot safely persist evidence.
- How a future agent inspects this: run the targeted Testcontainers tests and inspect the raw JSONL assertions in the recorder/example integration suites.
- Failure state exposed: payload capture failures stay localized to recorder warnings/omission and do not masquerade as message-hint or routing drift.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — payload-bearing event contract from T01 that the recorder now needs to emit.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — existing metadata-only recorder seam.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — explicit message/test metadata boundary that must stay unchanged.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — failure-safe metadata/context guard.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — real Spring Kafka truth-seam proof.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — repo-level raw JSONL proof that should now assert payload.

## Expected Output

- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — recorder wired to emit payload-bearing Kafka events.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — helper that converts observed Kafka values into JSON-safe payload evidence or explicit omission.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — contract coverage for payload-safe failure behavior.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — integration proof for payload-bearing send/receive facts.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — raw example-service JSONL proof updated to assert payload.
