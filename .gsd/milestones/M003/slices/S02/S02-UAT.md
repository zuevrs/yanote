# S02: Async Coverage And Diagnostics Semantics — UAT

**Milestone:** M003
**Written:** 2026-03-13 19:12:15 MSK

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S02 is an analyzer-semantics slice with no live Kafka runtime requirement yet; the truthful acceptance surface is the deterministic async evidence + coverage + parity verifier stack.

## Preconditions

- Run from the repo root with `yanote-js` dependencies installed.
- Keep `yanote-js/test/fixtures/asyncapi/*` and `yanote-js/test/fixtures/async-events/*` unchanged while running acceptance.
- No Kafka broker, Spring service, or browser session is required.

## Smoke Test

Run:

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`

**Pass means:** async evidence normalization is stable, async coverage semantics are computed separately for channels/operations/messages, unmatched and mismatched drift stay explicit, v2/v3 contracts yield the same async coverage output under shared evidence, and the HTTP baseline still passes.

## Test Cases

### 1. Partial async evidence leaves operation and message-contract gaps explicit

1. Run `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts`.
2. Inspect the case using `test/fixtures/async-events/partial.fixture.jsonl`.
3. **Expected:**
   - `users.signedup` send is covered with suites `suite-a` and `suite-b`.
   - `users.deleted` receive remains uncovered.
   - message-contract coverage is tracked separately and only `UserSignedUp` is covered.

### 2. Async drift stays explicit instead of becoming synthetic coverage

1. Run `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts`.
2. Inspect the drift cases using `drift.fixture.jsonl` and `action-mismatch.fixture.jsonl`.
3. **Expected:**
   - wrong-message evidence on `users.deleted` produces a `mismatched` diagnostic and leaves `UserDeleted` uncovered;
   - unknown-channel evidence produces an `unmatched` diagnostic;
   - known-channel wrong-action evidence marks the channel observed but does not create covered async operations.

### 3. Equivalent AsyncAPI v2 and v3 contracts produce the same async coverage semantics

1. Run `npm -C yanote-js test -- src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts`.
2. **Expected:** the same normalized Kafka evidence yields identical async coverage outputs for equivalent v2 and v3 AsyncAPI fixtures, and the underlying canonical contract parity remains green.

## Edge Cases

### Deterministic async drift diagnostics

1. Run `npm -C yanote-js test -- src/coverage/asyncCoverage.diagnostics.test.ts`.
2. **Expected:** repeated runs over the same drift fixture produce the same ordered diagnostics and the same known-channel action-drift behavior.

### HTTP non-regression after async coverage changes

1. Run `npm -C yanote-js test -- src/coverage/coverage.test.ts`.
2. **Expected:** the existing HTTP coverage semantics remain green after the async coverage engine lands.

## Failure Signals

- `src/events/readAsyncEventsJsonl.test.ts` fails, indicating async JSONL normalization drift or malformed metadata leakage.
- `src/coverage/asyncCoverage.test.ts` collapses channel/operation/message semantics into the same result or loses suite attribution.
- `src/coverage/asyncCoverage.diagnostics.test.ts` stops emitting deterministic `unmatched` / `mismatched` diagnostics.
- `src/coverage/asyncCoverage.parity.test.ts` fails, indicating AsyncAPI v2/v3 async coverage drift.
- `src/coverage/coverage.test.ts` fails, indicating async work regressed the HTTP baseline.

## Requirements Proved By This UAT

- R039 — Async coverage now distinguishes channels, send/receive operations, and message-contract identity.
- R040 — Unmatched and mismatched async drift now surfaces explicitly instead of silently counting best-effort matches.
- R046 — Partial proof: the async capability now has a repeatable integration-level verifier stack covering reader normalization, async coverage semantics, drift diagnostics, parity, and HTTP non-regression.

## Not Proven By This UAT

- Separate async report/gate output surfaces (S03).
- Live Spring Kafka producer/consumer evidence capture or Kafka-header propagation (M004).
- Payload/schema validation against AsyncAPI message schemas.

## Notes for Tester

- Prefer the single smoke-test command first; the narrower commands above are for localization only.
- The async diagnostic model is currently local to the async coverage engine. That is intentional in S02: do not force it back into the HTTP/spec diagnostic vocabulary while triaging failures.
