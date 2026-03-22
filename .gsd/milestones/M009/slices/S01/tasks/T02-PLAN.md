---
estimated_steps: 8
estimated_files: 7
skills_used:
  - kafka-engineer
---

# T02: Capture Spring MVC/Kafka provenance and common Kafka POJO payloads

**Slice:** S01 — Recorder Provenance And Additive Event Truth
**Milestone:** M009

## Description

Teach the Spring MVC and Spring Kafka recorders to emit the new provenance fields truthfully and widen Kafka payload capture so common Java POJO/record payloads survive into JSONL instead of falling into the unsupported omission path.

## Steps

1. Map current HTTP omission cases in `HttpPayloadCapture` to the shared provenance vocabulary.
2. Add safe POJO/record fallback capture to `KafkaPayloadCapture` using the existing Jackson-based runtime dependencies.
3. Preserve explicit unsupported/oversized warnings instead of silently widening capture to unsafe payload types.
4. Update Spring MVC recorder tests to expect provenance fields on omitted payload cases.
5. Update Kafka recorder tests to expect POJO retention and explicit omission reasons on remaining unsupported cases.
6. Re-run the retained HTTP recorder proof and Kafka recorder proof scripts.
7. Confirm suite/run attribution still survives on the upgraded Kafka path.
8. Leave any remaining unsupported payload classes visible through deterministic warnings.

## Must-Haves

- [ ] Spring MVC omission cases emit explicit provenance instead of plain body absence.
- [ ] At least one ordinary Java POJO/record Kafka payload survives into JSONL as structured JSON.
- [ ] Unsupported or unsafe Kafka payload shapes still fail visibly instead of being swallowed.

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
- `bash scripts/docs/verify-s01-recorder-path.sh`
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`

## Observability Impact

- Signals added/changed: recorder-emitted provenance fields and clearer omission warnings for HTTP/Kafka payload capture.
- How a future agent inspects this: Spring MVC/Kafka recorder seam tests plus retained `events.jsonl` output from the proof scripts.
- Failure state exposed: unsupported POJO payloads, oversized payload omission, malformed body capture, and attribution regressions stay inspectable.

## Inputs

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — current HTTP payload omission logic.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — live JSONL proof for the Spring MVC recorder.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — current Kafka payload capture boundary.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — contract proof for Kafka JSONL contents and attribution.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — explicit omission/failure visibility proof.
- `scripts/docs/verify-s01-recorder-path.sh` — retained live Spring MVC recorder proof.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — retained live Kafka recorder proof.

## Expected Output

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — provenance-aware HTTP capture logic.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — provenance-aware HTTP recorder expectations.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — safe POJO/record JSON capture plus explicit omission reasons.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — POJO capture proof and retained attribution.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — deterministic omission/failure-path proof.
- `scripts/docs/verify-s01-recorder-path.sh` — live proof expectations for HTTP provenance.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — live proof expectations for Kafka POJO capture/provenance.
