---
estimated_steps: 7
estimated_files: 8
skills_used:
  - kafka-engineer
---

# T01: Retain redaction-safe Kafka header evidence in recorder and JSONL models

**Slice:** S02 — Kafka Header Evidence And AsyncAPI Header Verification
**Milestone:** M009

## Description

Add retained Kafka header evidence to the recorder and JSONL event model, with a clear allowlist/redaction policy so downstream analyzer work can validate headers without leaking raw sensitive values.

## Steps

1. Choose a retained-header representation that preserves key/value truth while supporting redacted and omitted states.
2. Add additive retained-header fields to the Kafka event model.
3. Extend the recorder path to collect allowed headers and redact or drop disallowed ones deterministically.
4. Preserve current suite/run/message-hint behavior without forcing them into a separate incompatible path.
5. Normalize retained headers in `AsyncEvent` and the async JSONL reader.
6. Add tests for retained, redacted, and omitted header cases.
7. Re-run the Kafka metadata propagation proof to confirm no attribution regression.

## Must-Haves

- [ ] Retained Kafka headers have one stable JSONL shape with explicit redaction/omission behavior.
- [ ] Sensitive or disallowed headers never appear raw in events or logs.
- [ ] Existing metadata propagation remains green after retained headers are introduced.

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test`
- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`

## Observability Impact

- Signals added/changed: retained header evidence, redaction markers, and deterministic header omission states.
- How a future agent inspects this: Kafka recorder tests, async JSONL reader tests, and metadata propagation proof artifacts.
- Failure state exposed: missing retained headers, unsafe header leakage, and attribution regressions become easy to localize.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — authoritative Kafka JSONL event model.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — existing header propagation seam.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — point where retained headers can be written into events.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — current metadata propagation proof.
- `yanote-js/src/model/asyncEvent.ts` — async normalized event shape.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — async JSONL reader.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — additive retained-header fields.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — allowlist/redaction support.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — retained-header writing logic.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — retained/redacted header assertions.
- `yanote-js/src/model/asyncEvent.ts` — normalized header evidence shape.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — reader support for retained headers.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — reader proof for retained/redacted/omitted headers.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — live metadata proof updated for retained headers.
