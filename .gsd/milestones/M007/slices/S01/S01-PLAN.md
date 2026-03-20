# S01: Payload-Bearing Async Evidence Contract

**Goal:** Extend Yanote’s Kafka evidence and AsyncAPI semantics boundaries so JSON-safe observed payloads survive Spring Kafka recorder -> JSONL -> Node ingestion, while AsyncAPI bundles retain payload-bearing message-contract metadata without changing async report/gate semantics yet.
**Demo:** Running the slice verifier stack proves one stable Kafka payload contract round-trips through Java and Node, Spring Kafka recorder tests emit payload-bearing JSONL without breaking fail-safe behavior or explicit message-hint rules, and AsyncAPI v2/v3 fixtures retain payload schema material beside canonical `kafka <action> <channel>` keys.

## Decomposition Rationale

- Start with the shared Java/Node event contract because recorder capture and analyzer ingestion are only trustworthy if both sides agree on one JSON-safe payload shape before Spring wiring or spec retention changes land.
- Put recorder capture second because R049 depends on observed Kafka payloads, not only fixture-side payload examples, and the producer/listener truth seams are still the highest-risk place to accidentally record synthetic data.
- Finish on AsyncAPI contract retention so S02 inherits payload-bearing message metadata beside the existing operation key, while `asyncCoverage.ts`, report writing, and CLI/gate semantics stay intentionally unchanged in this slice.

## Must-Haves

- Java `KafkaEvent` and Node `AsyncEvent` can carry optional JSON-safe `payload` evidence through mixed HTTP+Kafka JSONL without inferring `message` or widening the canonical `kind:"kafka"` boundary.
- Spring Kafka recorder tests prove observed producer/consumer payloads are captured at truthful outcome seams, and non-serializable capture paths still fail safe through omission/warn behavior instead of breaking user traffic.
- AsyncAPI v2/v3 normalization retains payload-bearing message-contract metadata beside the existing `kafka <action> <channel>` identity, with deterministic fixture/tests covering object, scalar, missing, and malformed payload-bearing evidence.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'` proves the shared Java JSONL boundary carries payload-bearing Kafka facts without regressing mixed HTTP+Kafka reading.
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest'` proves recorder capture and failure handling stay truthful on the Spring Kafka seam.
- `npm -C yanote-js ci && npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` proves the Node reader and AsyncAPI semantics bundle retain the new payload-bearing contract deterministically.
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` proves the existing live single-service proof still reaches `async-report` unchanged while S01 strengthens only the contract depth.
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: payload-bearing `kind:"kafka"` JSONL lines from Java round-trip tests and Spring Kafka recorder tests, plus existing recorder warning logs and reader `invalidLineNumbers` when input is malformed.
- Inspection surfaces: `yanote-core` round-trip tests, `yanote-recorder-spring-kafka` Testcontainers tests, `yanote-js/src/events/readAsyncEventsJsonl.test.ts`, and `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`.
- Failure visibility: malformed JSONL stays inspectable by line number, recorder capture/write failures stay visible through warnings and omission instead of silent traffic breakage, and message-hint drift remains separate from the new payload-bearing contract.
- Redaction constraints: raw payloads may exist only in JSONL/test fixtures and must not spill into summary stderr/markdown surfaces; never infer payload via `toString()` or serialize broker credentials/internal Yanote headers as evidence.

## Integration Closure

- Upstream surfaces consumed: `yanote-core` event JSONL boundary, `yanote-recorder-spring-kafka` producer/listener truth seams, `yanote-js` async event reader and AsyncAPI loader, and the existing `examples/springmvc-service` single-service proof path.
- New wiring introduced in this slice: optional payload capture in `KafkaEvent`, payload normalization in `readAsyncEventsJsonl`, and payload-bearing message metadata retained in `KafkaMessageContract` / AsyncAPI semantics bundles.
- What remains before the milestone is truly usable end-to-end: S02 still needs actual payload/schema/reference/header validation semantics and typed drift diagnostics, S03 still needs report/gate/CLI schema-truth surfaces, and S04 still needs live Kafka proof refresh plus public boundary docs.

## Tasks

- [ ] **T01: Lock the payload-bearing JSONL contract across Java and Node** `est:1h15m`
  - Why: The recorder and analyzer cannot agree on payload truth until both runtimes share one explicit JSON-safe event contract and fixture corpus.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`, `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`, `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/events/readAsyncEventsJsonl.test.ts`, `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl`
  - Do: Add optional JSON-safe `payload` support to the shared Java/Node async event model, keep `message` explicit-only, teach `readAsyncEventsJsonl` to accept supported payload shapes while dropping malformed nested structures, and add one deterministic fixture corpus covering object, scalar, missing, mixed HTTP+Kafka, and malformed nested payload-bearing cases without widening generic header capture in S01.
  - Verify: `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest' && npm -C yanote-js ci && npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts`
  - Done when: Java round-trip tests and the Node reader test prove the same payload-bearing `kind:"kafka"` shape survives both boundaries and malformed nested inputs do not leak arbitrary structures.
- [x] **T02: Capture observed Kafka payloads at the Spring Kafka truth seams** `est:1h30m`
  - Why: R049 is only advanced when real producer and consumer observations carry payload facts from the recorder, not just synthetic JSONL fixtures.
  - Files: `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java`, `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`
  - Do: Add one recorder-side payload capture helper that converts observed Spring Kafka values into JSON-safe evidence without `toString()` heuristics, wire it into producer/listener recording while keeping explicit message hints and fail-safe omission/warn behavior intact, and update recorder/example proof tests to assert payload-bearing raw JSONL for both success and failure-adjacent flows.
  - Verify: `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' && ./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`
  - Done when: Recorder tests show payload-bearing `send` / `receive` facts from real Spring Kafka seams, unsafe capture still degrades through omission instead of traffic breakage, and the example-service raw JSONL proof now includes payload alongside the existing message/test metadata.
- [ ] **T03: Retain AsyncAPI payload schema metadata beside canonical Kafka keys** `est:1h15m`
  - Why: S02 needs the spec side of the contract to carry payload-bearing message metadata without reopening operation identity or prematurely changing report/gate semantics.
  - Files: `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/test/fixtures/asyncapi/v2.yaml`, `yanote-js/test/fixtures/asyncapi/v3.yaml`
  - Do: Extend `KafkaMessageContract` so message metadata retains raw payload-schema material plus stable string metadata such as `contentType` / `schemaFormat` when the parser exposes them deterministically, keep `serializeOperationKey()` unchanged, and update AsyncAPI parity/contract tests to prove v2 and v3 carry equivalent payload-bearing contract data without changing `asyncCoverage.ts`, async reports, or CLI behavior yet.
  - Verify: `npm -C yanote-js ci && npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts && bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
  - Done when: AsyncAPI semantics bundles expose payload-bearing message metadata beside stable operation keys, parity stays green across v2/v3 fixtures, and the existing live single-service proof still reaches `async-report` without any S01-specific translation layer.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`
- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/test/fixtures/asyncapi/v2.yaml`
- `yanote-js/test/fixtures/asyncapi/v3.yaml`
