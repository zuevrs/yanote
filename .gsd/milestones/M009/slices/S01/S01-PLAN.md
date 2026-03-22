# S01: Recorder Provenance And Additive Event Truth

**Goal:** Make the recorder boundary itself more truthful by retaining additive payload-capture provenance across HTTP and Kafka event models and by capturing common Java POJO/record Kafka payloads instead of dropping them into the generic unsupported path.
**Demo:** Running the recorder seam tests, JSONL round-trip tests, and JSONL reader suites shows explicit capture-state evidence for captured, malformed, oversized, unsupported, and policy-omitted payloads, while a focused Spring Kafka proof demonstrates that ordinary POJO payloads now survive into `events.jsonl` without regressing suite/run attribution.

## Must-Haves

- `HttpEvent` and `KafkaEvent` grow additive, omission-friendly provenance fields that survive JSONL round-trip without serializing misleading `null` placeholders.
- `KafkaPayloadCapture` retains common POJO/record payloads through a Jackson-style object-to-tree fallback while preserving explicit failure reasons for unsupported, oversized, or unsafe payload shapes.
- `readJsonl()` and `readAsyncEventsJsonl()` normalize the new provenance fields without breaking existing analyzer behavior when older JSONL files do not contain them.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
- `./gradlew --no-daemon :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.KafkaEventJsonlRoundTripTest`
- `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readJsonl.parameters.test.ts src/events/readAsyncEventsJsonl.test.ts`
- `bash scripts/docs/verify-s01-recorder-path.sh`
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`

## Observability / Diagnostics

- Runtime signals: additive payload-capture state/reason fields in HTTP/Kafka JSONL events plus recorder warnings that still explain when payloads are intentionally omitted.
- Inspection surfaces: `EventJsonlRoundTripTest`, `KafkaEventJsonlRoundTripTest`, recorder seam tests, `readJsonl*.test.ts`, and live `events.jsonl` artifacts from the retained HTTP/Kafka verifier scripts.
- Failure visibility: unsupported POJO payloads, parse failures, oversized payload omission, and backward-compatibility parse regressions become inspectable as explicit event state instead of silent absence.
- Redaction constraints: provenance must explain omission without echoing raw unsupported payload bytes or sensitive content into logs.

## Integration Closure

- Upstream surfaces consumed: `yanote-core` event records, Spring MVC/Kafka payload capture helpers, existing recorder seam tests, and Node JSONL reader normalization.
- New wiring introduced in this slice: additive provenance fields cross the JVM recorder → JSONL → Node reader boundary, and Kafka payload capture widens to common Java object shapes.
- What remains before the milestone is truly usable end-to-end: S02 still needs retained header evidence, S03 still needs multi-message async resolution, and S04 still needs provenance-aware HTTP analyzer semantics.

## Tasks

- [x] **T01: Widen HTTP/Kafka event models and Node readers for additive provenance** `est:1h10m`
  - Why: the rest of the milestone depends on one stable way to tell “missing in traffic” from “dropped by recorder,” and that truth has to survive JSONL round-trip before analyzer work can trust it.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`, `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`, `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`, `yanote-js/src/events/readJsonl.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/events/readJsonl.test.ts`, `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
  - Do: Add additive capture-state fields for HTTP request/response and Kafka payload evidence, keep omitted fields absent instead of serialized as JSON `null`, and teach the Node readers to normalize the new fields while preserving compatibility with older JSONL events.
  - Verify: `./gradlew --no-daemon :yanote-core:test && npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readAsyncEventsJsonl.test.ts`
  - Done when: round-trip and reader tests prove the new fields survive when present, older events still parse cleanly, and omitted evidence is distinguishable from explicit JSON `null`.
- [ ] **T02: Capture Spring MVC/Kafka provenance and common Kafka POJO payloads** `est:1h35m`
  - Why: additive model fields are only valuable if the real recorders emit them truthfully; Kafka POJO omission is the most obvious current recorder gap inside the shipped scope.
  - Files: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`, `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java`, `scripts/docs/verify-s01-recorder-path.sh`, `scripts/ci/verify-m004-s01-kafka-recorder.sh`
  - Do: Emit the new capture-state reasons from the HTTP and Kafka payload helpers, add Jackson fallback for safe POJO/record capture in Kafka, keep explicit warnings for oversized/unsupported cases, and pin the live proof scripts to the richer evidence boundary.
  - Verify: `./gradlew --no-daemon :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test && bash scripts/docs/verify-s01-recorder-path.sh && bash scripts/ci/verify-m004-s01-kafka-recorder.sh`
  - Done when: recorder seam tests and live proof scripts show explicit provenance on omission cases and at least one POJO Kafka payload survives into JSONL unchanged enough for downstream schema validation.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readJsonl.test.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/ci/verify-m004-s01-kafka-recorder.sh`
