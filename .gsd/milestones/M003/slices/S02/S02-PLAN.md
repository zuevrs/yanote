# S02: Async Coverage And Diagnostics Semantics

**Goal:** Compute deterministic async coverage from the canonical Kafka contract bundle and normalized async evidence so Yanote can distinguish channel coverage, send/receive operation coverage, and message-contract identity while surfacing unmatched and mismatched evidence explicitly.
**Demo:** Running the slice proof tests shows that the same normalized async evidence produces identical channel/operation/message coverage against equivalent AsyncAPI v2/v3 contracts, unmatched and mismatched async evidence surfaces as first-class deterministic diagnostics, and the existing HTTP coverage baseline stays green.

## Must-Haves

- Async coverage must distinguish channel coverage, send/receive operation coverage, and message-contract identity coverage explicitly instead of collapsing into a topic-hit counter.
- Normalized Kafka async evidence must match fail-closed against the canonical async contract surface, with explicit unmatched and mismatched diagnostics when the evidence drifts.
- The slice must leave an inspectable async coverage result model and fixture corpus that S03 report/gate work and M004 runtime evidence capture can consume without redefining the async contract.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: deterministic async coverage results with explicit per-channel, per-operation, and per-message-contract states plus ordered unmatched/mismatched diagnostics.
- Inspection surfaces: `yanote-js/src/events/readAsyncEventsJsonl.test.ts`, `yanote-js/src/coverage/asyncCoverage*.test.ts`, `yanote-js/test/fixtures/async-events/*`, and the async coverage result returned by the new coverage engine.
- Failure visibility: targeted test failures localize drift in async evidence normalization, channel/action matching, message-contract mismatch handling, coverage ordering, or HTTP non-regression without requiring a live Kafka runtime.
- Redaction constraints: async fixtures and diagnostics must stay metadata-only; no payload dumps, secrets, broker credentials, or arbitrary Kafka headers in proof surfaces.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/events/readJsonl.ts`, and `yanote-js/test/fixtures/asyncapi/*`.
- New wiring introduced in this slice: normalized async evidence fixtures and reader, deterministic async coverage result model, and explicit unmatched/mismatched async diagnostic classification on top of the S01 semantics bundle.
- What remains before the milestone is truly usable end-to-end: S03 still needs to serialize and gate this async coverage result through a separate async report/CLI path.

## Tasks

- [x] **T01: Define the normalized async evidence model and fixture contract** `est:45m`
  - Why: S02 cannot prove async coverage honestly until the analyzer has one stable runtime-facing evidence shape that matches the canonical Kafka contract S01 established and that M004 can later emit directly.
  - Files: `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/events/readAsyncEventsJsonl.test.ts`, `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/test/fixtures/async-events/*`
  - Do: Define a normalized Kafka async evidence shape carrying action, channel, message-contract identity, and suite/run metadata; add fixture JSONL covering covered, uncovered, unmatched, mismatched, and multi-suite cases; tighten tests so the expected async coverage surface is pinned before the engine lands.
  - Verify: `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts`
  - Done when: The async evidence contract is pinned in code and fixtures, and the remaining red tests point directly at the missing async coverage semantics instead of ambiguous input assumptions.
- [x] **T02: Implement async coverage computation and fail-closed diagnostics** `est:1h`
  - Why: T01 only defines the evidence and result contract; the slice still needs a real engine that computes channel/operation/message coverage and classifies evidence drift explicitly.
  - Files: `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/spec/diagnostics.ts`
  - Do: Build async coverage on top of `loadAsyncApiSemanticsBundle()` so normalized Kafka evidence matches canonical operations deterministically, channel/operation/message coverage remain separate, suite attribution survives, and unmatched versus mismatched evidence produces explicit ordered diagnostics instead of silent best-effort matches.
  - Verify: `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts`
  - Done when: The async coverage tests pass with deterministic per-dimension results and actionable unmatched/mismatched diagnostics for drifted evidence.
- [x] **T03: Add parity and non-regression proof for async coverage semantics** `est:45m`
  - Why: The slice is only complete when equivalent v2/v3 contracts yield the same async coverage semantics under shared evidence and the existing HTTP coverage path still stays green.
  - Files: `yanote-js/src/coverage/asyncCoverage.parity.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/src/coverage/coverage.test.ts`, `.gsd/STATE.md`
  - Do: Reuse the equivalent S01 AsyncAPI fixtures with shared async evidence to prove coverage parity, tighten deterministic diagnostic ordering checks, rerun the HTTP coverage baseline, and refresh the living state so the next slice starts from a truthful closed-S02 picture.
  - Verify: `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`
  - Done when: The single slice proof command passes with explicit async coverage parity, drift diagnostics, and HTTP non-regression coverage, and the GSD state no longer presents S02 as planning work.

## Files Likely Touched

- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts`
- `yanote-js/src/spec/diagnostics.ts`
- `yanote-js/test/fixtures/async-events/*`
- `.gsd/STATE.md`
