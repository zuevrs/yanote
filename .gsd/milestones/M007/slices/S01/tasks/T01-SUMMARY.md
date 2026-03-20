---
id: T01
parent: S01
milestone: M007
provides:
  - A shared payload-bearing Kafka JSONL contract across Java and Node, plus deterministic fixtures that prove mixed HTTP+Kafka compatibility and malformed-field handling.
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java
  - yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java
  - yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-js/src/events/readAsyncEventsJsonl.test.ts
  - yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl
key_decisions:
  - Carry Kafka payload evidence only as JSON-safe trees/values (`JsonNode` in Java, recursive JSON values in Node) and keep `message` explicit-only.
patterns_established:
  - Lock recorder/analyzer boundary changes first with exact JSONL round-trip tests and reader-level malformed-field assertions before touching live runtime capture.
observability_surfaces:
  - ./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts
duration: 1h05m
verification_result: passed
completed_at: 2026-03-20 16:14:10 +0300
blocker_discovered: false
---

# T01: Lock the payload-bearing JSONL contract across Java and Node

**Added one JSON-safe payload-bearing Kafka evidence contract across Java and Node, with fixture-backed proof that mixed HTTP+Kafka JSONL still reads cleanly and malformed nested fields do not leak through.**

## What Happened

Extended `KafkaEvent` to carry an optional payload as a Jackson `JsonNode` while keeping channel normalization, null omission, and explicit-only `message` behavior intact. The Java round-trip tests now prove both payload-bearing Kafka serialization and mixed HTTP+Kafka JSONL compatibility.

Mirrored that boundary on the Node side with a recursive JSON value type in `asyncEvent.ts`, then taught `readAsyncEventsJsonl.ts` to normalize payloads deterministically instead of passing arbitrary nested data through. The new fixture corpus in `test/fixtures/async-events/payload-bearing.fixture.jsonl` covers object, scalar, array, missing, malformed, and mixed HTTP+Kafka lines so later slices can rely on one stable reader seam.

This retired the metadata-only evidence gap at the shared model boundary without changing any report or gate semantics yet.

## Verification

Verified both sides of the contract directly:

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts`
- `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts` | 0 | passed | 565ms |
| 2 | `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'` | 0 | passed | 3m28s |

## Diagnostics

- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` is the authoritative Java contract proof for serialized payload-bearing Kafka JSONL.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` is the authoritative Node-side proof for malformed-line accounting and payload normalization.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` is the fixture corpus future slices should extend instead of inventing new ad hoc evidence shapes.

## Deviations

- None.

## Known Issues

- This task does not validate payloads against AsyncAPI schemas yet; it only makes the payload-bearing evidence contract real and deterministic.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — added optional JSON-safe Kafka payload support.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — pinned payload-bearing Kafka JSONL serialization and round-trip behavior.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — kept mixed HTTP+Kafka JSONL compatibility green with payload-bearing Kafka facts.
- `yanote-js/src/model/asyncEvent.ts` — introduced a typed recursive JSON payload boundary for async events.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — normalized payload-bearing Kafka evidence deterministically.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — proved object/scalar/array/malformed payload behavior.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` — added the deterministic payload-bearing fixture corpus.
