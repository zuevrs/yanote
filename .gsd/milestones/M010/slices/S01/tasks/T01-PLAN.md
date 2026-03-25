---
estimated_steps: 4
estimated_files: 5
skills_used:
  - java-junit
  - vitest
  - debug-like-expert
---

# T01: Extend the HTTP event contract and Node parser for additive evidence

**Slice:** S01 — HTTP Evidence Depth For Undeclared Statuses, Parameter Values, And Response Headers
**Milestone:** M010

## Description

Define the additive HTTP evidence contract that S01 and S02 will share: the JVM recorder must be able to serialize richer value-bearing evidence, and `yanote-js` must read both legacy and new JSONL without losing the compatibility `queryKeys` / `headerKeys` surfaces current coverage code still expects.

## Steps

1. Extend `HttpEvent` with additive evidence fields and reusable nested evidence types so value-bearing query/request-header/response-header facts can carry explicit capture/redaction/omission state while remaining multi-value safe.
2. Keep compatibility `queryKeys` / `headerKeys` available in the canonical event shape instead of forcing downstream code to infer them ad hoc.
3. Update JSONL round-trip coverage in `yanote-core` so the serialized shape, legacy compatibility, and omission-state behavior are pinned mechanically.
4. Update `yanote-js` model/parser normalization and add focused Vitest coverage for additive plus legacy HTTP event files.

## Must-Haves

- [ ] `HttpEvent` carries additive path/query/request-header/response-header evidence without replacing compatibility `queryKeys` / `headerKeys`.
- [ ] The additive evidence container is explicit about capture state/reason and preserves repeated values as arrays.
- [ ] `yanote-js` can parse both legacy and additive HTTP JSONL deterministically.

## Verification

- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"`
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`

## Observability Impact

- Signals added/changed: HTTP JSONL structure gains additive evidence fields and explicit omission/redaction markers.
- How a future agent inspects this: read serialized lines via `EventJsonlRoundTripTest` and `readJsonl.httpEvidence.test.ts` expectations.
- Failure state exposed: contract drift between JVM serialization and Node parsing becomes visible before recorder/runtime work starts.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current canonical HTTP event record that lacks value-bearing evidence.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — current JSONL round-trip contract coverage.
- `yanote-js/src/model/httpEvent.ts` — current Node-side HTTP event model.
- `yanote-js/src/events/readJsonl.ts` — current JSONL parser and normalization path.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — additive HTTP evidence contract with compatibility fields preserved.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — round-trip assertions for the richer HTTP evidence shape.
- `yanote-js/src/model/httpEvent.ts` — Node model updated for additive evidence.
- `yanote-js/src/events/readJsonl.ts` — parser normalization for legacy plus additive events.
- `yanote-js/src/events/readJsonl.httpEvidence.test.ts` — focused Vitest coverage for the new parser contract.
