---
id: S01
parent: M007
milestone: M007
provides:
  - A stable payload-bearing Kafka evidence contract across recorder, JSONL, and analyzer boundaries, plus AsyncAPI semantics bundles that now retain payload schema metadata beside canonical Kafka keys.
requires: []
affects:
  - M007/S02
  - M007/S03
  - M007/S04
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - .gsd/milestones/M007/slices/S01/S01-SUMMARY.md
key_decisions:
  - Carry observed Kafka payloads only as JSON-safe evidence and warn/omit unsupported types instead of synthesizing payload strings.
  - Keep AsyncAPI payload schema metadata beside the canonical `kafka <action> <channel>` key rather than widening routing identity.
patterns_established:
  - Close contract-depth slices in boundary order: shared event model first, truthful runtime capture second, spec retention third, with live proof left unchanged as the non-regression guard.
  - Use the existing live Kafka metadata proof as the regression boundary while contract-depth work is still upstream of report/gate semantics.
observability_surfaces:
  - ./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'
  - ./gradlew --no-daemon :yanote-recorder-spring-kafka:test :examples:springmvc-service:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts
  - bash scripts/ci/verify-m004-s02-metadata-propagation.sh
drill_down_paths:
  - .gsd/milestones/M007/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M007/slices/S01/tasks/T03-SUMMARY.md
duration: 3h20m
verification_result: passed
completed_at: 2026-03-20 16:14:10 +0300
---

# S01: Payload-Bearing Async Evidence Contract

**Shipped the payload-bearing contract layer for M007: observed Kafka payloads now survive Spring Kafka capture, mixed JSONL, and Node ingestion, and AsyncAPI semantics bundles retain payload schema metadata without changing async report/gate truth yet.**

## What Happened

S01 retired the milestone’s highest-risk gap by turning the metadata-only async path into a payload-bearing contract boundary.

T01 locked the shared evidence model first. `KafkaEvent` now carries an optional JSON-safe payload in Java, `AsyncEvent` mirrors that shape in Node, and the reader/fixture corpus proves object, scalar, array, malformed, and mixed HTTP+Kafka cases deterministically. That gave the milestone one stable JSONL contract to build on instead of synthetic schema work over metadata-only evidence.

T02 carried that boundary into the truthful Spring Kafka seams. `YanoteKafkaEventRecorder` now records observed producer and consumer payloads from the existing `ProducerListener` and listener `success` / `failure` hooks. `KafkaPayloadCapture` keeps that capture honest by accepting only JSON-safe values and warning/omitting unsupported types instead of falling back to `toString()`. The recorder tests and the example-service raw JSONL proof both now assert payload-bearing facts directly.

T03 completed the contract from the spec side. `KafkaMessageContract` now retains payload schema metadata alongside `name`, and `asyncapi.ts` keeps that metadata in the semantics bundle for both AsyncAPI v2 and v3. The canonical operation key stayed unchanged, and the existing live metadata proof still passed untouched, which confirms that S01 strengthened the upstream contract without prematurely changing report/gate semantics.

## Verification

The completed slice passed the planned verification stack:

- `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'`
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test :examples:springmvc-service:test --tests 'dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`
- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `git diff --check`

Observed proof signals:

- payload-bearing Kafka JSONL round-trips cleanly through Java and Node;
- unsupported recorder payloads degrade through omission plus warning rather than runtime failure;
- AsyncAPI v2 and v3 now normalize to the same payload-bearing message-contract metadata;
- the live single-service proof still reaches `async-report` unchanged after the stronger contract lands.

## Requirements Advanced

- R049 — Advanced by replacing the metadata-only Kafka evidence boundary with a payload-bearing recorder/JSONL/analyzer contract and by retaining AsyncAPI payload schema metadata for later validation work.
- R065 — Advanced by keeping payload-schema material separate from routing identity so later slices can report schema drift distinctly from channel/action drift.

## Requirements Validated

- none

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- None.

## Known Limitations

- `async-report` still does not validate observed payloads against AsyncAPI schemas; S01 only makes that validation truthful and possible.
- Async schema/reference/header drift still does not surface as a first-class diagnostic category; that is S02/S03 work.
- Human-facing async summaries and gates still operate on the existing routing/message truth surface and intentionally do not expose raw payloads.

## Follow-ups

- S02 should compile and run schema-validation logic against the retained `payloadSchema` metadata and the recorded `payload` evidence, then introduce typed schema/reference/header diagnostics without collapsing them into unmatched/mismatched routing drift.
- S03 should extend the separate async report/gate/CLI surfaces to serialize and enforce the new schema-level truth while preserving the no-payload-leak summary boundary.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — added payload-bearing Kafka event support.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — pinned payload-bearing Kafka JSONL round-trip behavior.
- `yanote-js/src/model/asyncEvent.ts` — added the typed payload-bearing async event boundary.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — normalized payload-bearing Kafka evidence deterministically.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` — added the deterministic payload-bearing fixture corpus.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — added truthful JSON-safe Spring Kafka payload capture.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — recorded payload-bearing Kafka facts and omission warnings.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — asserted payload-bearing raw JSONL on the live proof path.
- `yanote-js/src/model/operationKey.ts` — retained payload schema metadata in `KafkaMessageContract`.
- `yanote-js/src/spec/asyncapi.ts` — preserved AsyncAPI payload-schema metadata beside canonical Kafka keys.
- `.gsd/milestones/M007/slices/S01/S01-SUMMARY.md` — captured the slice handoff and downstream guidance.

## Forward Intelligence

### What the next slice should know
- `@asyncapi/parser` already resolves usable payload objects into `document.json()` for the current fixtures, including stable `x-parser-schema-id` markers; S02 should consume that retained structure rather than reparsing raw YAML by hand.
- The recorder path now gives you real payload evidence at the truthful Spring Kafka seams, so schema validation no longer needs synthetic fixture-only evidence.

### What's fragile
- `KafkaPayloadCapture` intentionally omits unsupported runtime types with a warning — future work must treat missing payload as an observation gap, not as silent schema conformance.
- The live proof still asserts analyzer compatibility rather than schema failure behavior; if S02 changes async diagnostics, recheck `verify-m004-s02-metadata-propagation.sh` for assumptions about counts and summary lines.

### Authoritative diagnostics
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — trustworthy first stop for recorder-side payload omission/warning behavior.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — trustworthy first stop for payload-schema retention drift across AsyncAPI versions.
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` — trustworthy non-regression proof that the stronger contract still feeds the current live analyzer path.

### What assumptions changed
- “Observed Kafka payloads are unavailable on the current truth seams” — false; the existing producer/listener outcome seams can carry payloads cleanly once capture is kept JSON-safe.
- “AsyncAPI payload schemas are effectively lost during normalization” — false; the parser already resolves enough payload material for S02 to validate against without changing canonical operation identity.
