---
id: T02
parent: S01
milestone: M007
provides:
  - Truthful Spring Kafka payload capture at producer/listener outcome seams, with fail-safe omission for unsupported payload types and raw JSONL proof in both recorder and example-service tests.
key_files:
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
key_decisions:
  - Capture only JSON-safe observed payloads at the Spring Kafka truth seams and warn/omit on unsupported types instead of synthesizing payload via `toString()`.
patterns_established:
  - Keep recorder-side capture helpers narrow and prove them twice: once in module-level seam tests and once in the repo-level raw JSONL proof path.
observability_surfaces:
  - ./gradlew --no-daemon :yanote-recorder-spring-kafka:test :examples:springmvc-service:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'
  - recorder warning log: Omitting yanote kafka payload ...
duration: 1h20m
verification_result: passed
completed_at: 2026-03-20 16:14:10 +0300
blocker_discovered: false
---

# T02: Capture observed Kafka payloads at the Spring Kafka truth seams

**Captured payload-bearing `kafka send` and `kafka receive` facts from the real Spring Kafka outcome seams while keeping explicit message hints intact and degrading safely on unsupported payload types.**

## What Happened

Added `KafkaPayloadCapture` as the one recorder-side conversion helper. It accepts JSON-safe primitives, arrays, iterables, maps with string keys, and existing `JsonNode` values, then returns a `JsonNode` payload for the recorder. Unsupported payloads now produce a warning and omission instead of synthetic payload strings.

Wired that helper into `YanoteKafkaEventRecorder` so producer facts still come from `ProducerListener` outcomes and consumer facts still come from listener `success` / `failure` hooks, but both now carry the observed payload when it is safe to persist. The existing `yanote.message`, `test.run_id`, and `test.suite` behavior stayed unchanged.

Updated the recorder seam tests and the example-service raw JSONL proof so they assert payload content directly. The failure-path tests now also prove that unsupported payload types do not break traffic or recording; they only omit the payload and log a warning.

## Verification

Verified the real Spring Kafka seams and the repo-level proof path together:

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test :examples:springmvc-service:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew --no-daemon :yanote-recorder-spring-kafka:test :examples:springmvc-service:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'` | 0 | passed | 23s |

## Diagnostics

- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` is the authoritative proof that unsupported payloads are omitted with a warning rather than breaking recorder execution.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` is the authoritative seam-level proof for payload-bearing `send` / `receive` facts.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` is the authoritative repo-level raw JSONL proof that the payload survives into the live example path.

## Deviations

- None.

## Known Issues

- This task records observed payloads but still does not evaluate them against AsyncAPI schemas; later slices must turn missing/invalid payload conformance into first-class analyzer truth.

## Files Created/Modified

- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — added the JSON-safe payload conversion helper.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — recorded payload-bearing Kafka facts and omission warnings.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — proved payload capture and unsupported-type omission at the consumer seam.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — proved unsupported payload warnings without recorder failure.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — asserted payload-bearing producer and consumer facts from a real Kafka runtime.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — asserted payload-bearing raw JSONL on the live example path.
