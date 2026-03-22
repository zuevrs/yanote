---
estimated_steps: 7
estimated_files: 8
skills_used:
  - best-practices
---

# T01: Widen HTTP/Kafka event models and Node readers for additive provenance

**Slice:** S01 — Recorder Provenance And Additive Event Truth
**Milestone:** M009

## Description

Add additive payload-capture provenance to the HTTP and Kafka event models, preserve omission by field absence instead of JSON `null`, and normalize the new fields in the Node JSONL readers without breaking older event files.

## Steps

1. Define one stable provenance vocabulary for captured, omitted, malformed, oversized, unsupported, and policy-filtered payload evidence.
2. Extend `HttpEvent` and `KafkaEvent` with additive provenance fields that omit absent values cleanly.
3. Update JSONL round-trip tests to pin field presence/absence and backward compatibility.
4. Normalize the new provenance fields in `readJsonl()` and `readAsyncEventsJsonl()`.
5. Add Node-side tests covering both new events and older events without provenance fields.
6. Verify no explicit JSON `null` regression appears for omitted provenance fields.
7. Capture any naming/compatibility tradeoffs in the slice summary when execution happens.

## Must-Haves

- [ ] One provenance vocabulary is shared across HTTP/Kafka events instead of ad hoc per-recorder strings.
- [ ] Omitted provenance fields stay absent in JSONL rather than serializing as misleading `null` values.
- [ ] Older JSONL events still parse cleanly through the Node readers.

## Verification

- `./gradlew --no-daemon :yanote-core:test`
- `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readAsyncEventsJsonl.test.ts`

## Observability Impact

- Signals added/changed: additive payload-capture state/reason fields in HTTP/Kafka JSONL events.
- How a future agent inspects this: `EventJsonlRoundTripTest`, `KafkaEventJsonlRoundTripTest`, `readJsonl.test.ts`, and `readAsyncEventsJsonl.test.ts`.
- Failure state exposed: missing-vs-omitted payload evidence becomes explicit instead of inferred from absent body fields alone.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current HTTP JSONL contract shape.
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — current Kafka JSONL contract shape.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — existing HTTP round-trip proof.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — existing Kafka round-trip proof.
- `yanote-js/src/events/readJsonl.ts` — current HTTP JSONL normalization seam.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — current async JSONL normalization seam.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — additive HTTP provenance fields.
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — additive Kafka provenance fields.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — round-trip expectations for omitted vs present provenance.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — Kafka round-trip expectations for additive provenance.
- `yanote-js/src/events/readJsonl.ts` — normalized HTTP provenance handling.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — normalized async provenance handling.
- `yanote-js/src/events/readJsonl.test.ts` — HTTP reader proof for old/new event files.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — async reader proof for old/new event files.
