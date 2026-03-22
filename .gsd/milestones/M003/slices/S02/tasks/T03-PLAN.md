---
estimated_steps: 4
estimated_files: 4
---

# T03: Add parity and non-regression proof for async coverage semantics

**Slice:** S02 — Async Coverage And Diagnostics Semantics
**Milestone:** M003

## Description

Close S02 with one repeatable proof command that shows equivalent AsyncAPI v2/v3 contracts produce the same async coverage semantics under shared evidence, explicit drift diagnostics stay deterministic, and the existing HTTP coverage path does not regress.

## Steps

1. Add a parity test that feeds the same normalized async evidence through equivalent v2 and v3 AsyncAPI semantics bundles and asserts identical channel/operation/message coverage outputs.
2. Tighten the diagnostics proof so unmatched and mismatched async evidence ordering is asserted directly instead of inferred from one green run.
3. Re-run the existing HTTP coverage tests to prove the new async engine did not disturb the current HTTP baseline.
4. Collapse the slice verifier into one targeted command and refresh `STATE.md` so the next slice starts from a truthful closed-S02 picture.

## Must-Haves

- [ ] Equivalent AsyncAPI v2 and v3 contracts yield identical async coverage results for the same evidence.
- [ ] Async drift diagnostics are deterministic and explicitly asserted.
- [ ] HTTP coverage semantics remain green after the async coverage work lands.

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`
- `git diff --check`

## Observability Impact

- Signals added/changed: one repeatable async coverage proof command that localizes parity drift, evidence-drift diagnostics, and HTTP fallout.
- How a future agent inspects this: run the slice verifier and inspect whether the failure is in async evidence normalization, coverage parity, diagnostics ordering, or the HTTP baseline.
- Failure state exposed: v2/v3 async coverage drift, unstable unmatched/mismatched diagnostics, or HTTP coverage regression.

## Inputs

- `yanote-js/src/coverage/asyncCoverage.ts` — async coverage result surface from T02.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — canonical-contract parity proof already established by S01.
- `yanote-js/src/coverage/coverage.test.ts` — HTTP baseline that must remain green.

## Expected Output

- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — v2/v3 async coverage parity proof.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — explicit deterministic drift-diagnostic assertions.
- `.gsd/milestones/M003/slices/S02/S02-PLAN.md` — truthful slice verifier command once the work is complete.
- `.gsd/STATE.md` — updated to reflect post-S02 reality.
