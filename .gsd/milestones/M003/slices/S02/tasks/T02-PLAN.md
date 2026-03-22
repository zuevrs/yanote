---
estimated_steps: 5
estimated_files: 4
---

# T02: Implement async coverage computation and fail-closed diagnostics

**Slice:** S02 — Async Coverage And Diagnostics Semantics
**Milestone:** M003

## Description

Implement the real async coverage engine that consumes the S01 semantics bundle and normalized Kafka evidence, computes separate channel/operation/message-contract results, and surfaces unmatched or mismatched evidence deterministically.

## Steps

1. Build an async coverage result model that keeps channel, operation, and message-contract coverage separate instead of flattening everything into one percentage.
2. Match normalized async evidence to canonical Kafka operations by action + channel first, then classify message-contract identity as covered or mismatched without mutating the base operation identity.
3. Emit explicit deterministic diagnostics for unmatched evidence and mismatched message-contract evidence, with enough async context to localize the failure.
4. Preserve suite attribution and deterministic ordering throughout the coverage result so S03 can serialize it without ad hoc sorting patches.
5. Re-run the targeted async coverage proof until the result model and failure signals match the fixture contract from T01.

## Must-Haves

- [ ] Channel, operation, and message-contract coverage are represented separately in the result model.
- [ ] Unmatched async evidence and message-contract mismatches become first-class diagnostics rather than silent misses.
- [ ] The result ordering is deterministic across repeated runs with the same evidence.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts`
- Repeated runs produce identical async coverage ordering and diagnostics.

## Observability Impact

- Signals added/changed: explicit async coverage result model, ordered unmatched/mismatched diagnostics, and suite attribution on matched async operations.
- How a future agent inspects this: run the targeted async coverage tests and inspect the returned async coverage object plus its diagnostics.
- Failure state exposed: unmatched operation drift, message-contract mismatch drift, or deterministic ordering regressions.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — canonical async semantics bundle from S01.
- `yanote-js/src/model/asyncEvent.ts` — normalized async evidence contract from T01.
- `yanote-js/src/coverage/coverage.ts` — existing HTTP coverage engine pattern for deterministic ordering and diagnostics.
- `.gsd/milestones/M003/slices/S02/tasks/T01-PLAN.md` — pinned evidence and fixture contract.

## Expected Output

- `yanote-js/src/coverage/asyncCoverage.ts` — deterministic async coverage engine.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — passing async coverage semantics proof.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — deterministic unmatched/mismatched diagnostic proof.
- `yanote-js/src/spec/diagnostics.ts` — any shared async diagnostic-context extension needed by the async coverage engine.
