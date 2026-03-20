---
estimated_steps: 4
estimated_files: 7
---

# T01: Lock the payload-bearing JSONL contract across Java and Node

**Slice:** S01 — Payload-Bearing Async Evidence Contract
**Milestone:** M007

## Description

Relevant skills: `kafka-engineer`, `java-junit`, `vitest`.

Extend the shared Java/Node async event boundary so one explicit JSON-safe `payload` shape round-trips through mixed HTTP+Kafka JSONL, keeps `message` explicit-only, and gives later recorder/spec work a deterministic payload-bearing fixture corpus instead of today’s metadata-only seam.

## Steps

1. Add optional JSON-safe `payload` support to `KafkaEvent` and the Java round-trip tests, preserving null omission, mixed HTTP+Kafka compatibility, and the sealed `YanoteEvent` wire format.
2. Mirror the same payload contract in `yanote-js/src/model/asyncEvent.ts` and teach `readAsyncEventsJsonl.ts` to normalize supported payload shapes while rejecting malformed nested values.
3. Add a deterministic async-events fixture that covers object payload, scalar/string payload, missing payload, malformed nested payload-bearing data, and mixed HTTP+Kafka lines in one reader-facing corpus.
4. Update Java and Vitest proofs so contract drift shows up immediately in round-trip assertions or `invalidLineNumbers`, not later inside recorder or report logic.

## Must-Haves

- [ ] `KafkaEvent` and `AsyncEvent` carry the same optional JSON-safe `payload` shape through JSONL.
- [ ] `message` remains explicit-only; no payload-derived message inference or generic header capture is introduced in this task.
- [ ] Mixed HTTP+Kafka JSONL stays readable, and malformed nested payload-bearing input is either dropped or counted as invalid instead of leaking arbitrary structures.

## Verification

- `./gradlew --no-daemon :yanote-core:test --tests 'dev.yanote.core.events.KafkaEventJsonlRoundTripTest' --tests 'dev.yanote.core.events.EventJsonlRoundTripTest'`
- `npm -C yanote-js ci && npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts`

## Observability Impact

- Signals added/changed: raw JSONL now has an explicit optional `payload` field on Kafka facts, and reader diagnostics still report malformed input through `invalidLines` / `invalidLineNumbers`.
- How a future agent inspects this: run the targeted Gradle and Vitest commands, then inspect the fixture-driven assertions in the updated round-trip tests.
- Failure state exposed: payload shape drift becomes visible as a Java round-trip mismatch or Node reader invalid-line / dropped-field failure instead of a later analyzer surprise.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — current metadata-only Java Kafka evidence contract.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — existing JSONL contract proof that will pin the new payload field.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — mixed HTTP+Kafka JSONL compatibility guard.
- `yanote-js/src/model/asyncEvent.ts` — current metadata-only Node async event shape.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — JSONL normalization seam that currently drops arbitrary nested structures.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — existing Vitest coverage for malformed-line handling.
- `yanote-js/test/fixtures/async-events/events.fixture.jsonl` — current metadata-only async fixture corpus.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — Java Kafka event contract with optional JSON-safe payload support.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — updated round-trip proof for payload-bearing Kafka JSONL.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — mixed-event guard covering payload-bearing Kafka lines.
- `yanote-js/src/model/asyncEvent.ts` — Node async event contract mirroring the payload-bearing shape.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — reader normalization that accepts supported payload values and rejects malformed nested ones.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — fixture-backed reader proof for object/scalar/missing/malformed payload-bearing evidence.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` — deterministic payload-bearing async JSONL fixture corpus.
