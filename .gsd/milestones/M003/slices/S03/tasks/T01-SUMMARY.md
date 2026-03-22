---
id: T01
parent: S03
milestone: M003
provides:
  - A separate async report schema/normalization contract plus red builder/gate tests that localize the remaining S03 implementation work to `buildAsyncReport()` and `asyncEvaluator`.
key_files:
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S03/S03-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Keep the async artifact separate from the HTTP report surface, serialize channels/operations/messages directly, and treat unmatched/mismatched async drift as fail-closed gate input rather than flattening it into HTTP-era fields.
patterns_established:
  - Use real AsyncAPI + async-event fixtures to pin the async report/gate contract, but keep the unimplemented builder/evaluator behind explicit placeholder exports so failing tests point at the intended runtime seams.
observability_surfaces:
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
duration: 20m
verification_result: partial
completed_at: 2026-03-13 19:42:20 MSK
blocker_discovered: false
---

# T01: Define the separate async report and gate contract

**Pinned a separate async report contract and async gate expectations in code/tests, with the remaining red surface localized to the missing async builder and evaluator exports.**

## What Happened

I added `yanote-js/src/report/asyncReport.ts` as the contract owner for the first async artifact. It now defines a dedicated async schema version and phase marker, a top-level summary over channels/operations/messages, coverage sections that preserve the S02 split directly, explicit unmatched/mismatched diagnostics counts, and deterministic normalization/validation helpers. I left `buildAsyncReport()` as an explicit placeholder so the runtime seam stays visible for T02 instead of being improvised inside tests or later CLI code.

Then I wrote `yanote-js/src/report/asyncReport.contract.test.ts` to lock the async surface independently from HTTP. That test proves the async artifact validates against its own schema, is rejected by the existing HTTP report validator, rejects unknown HTTP-era fields like `governance`, and normalizes ordering/rounding deterministically.

For the runtime-facing contract, `yanote-js/src/report/asyncReport.test.ts` now drives the real S02 fixtures through `asyncCoverage.ts` and pins the intended async artifact output for both partial evidence and drifted evidence. The expected shape keeps channel, operation, and message coverage separate and preserves mismatched/unmatched diagnostics explicitly instead of collapsing them into the HTTP diagnostic vocabulary.

On the gate side, I added `yanote-js/src/gates/asyncEvaluator.test.ts` and a minimal `yanote-js/src/gates/asyncEvaluator.ts` placeholder. The tests pin three behaviors before implementation: semantic fail-closed handling for mismatched/unmatched async drift even when operation coverage is otherwise high, threshold evaluation against raw async operation coverage with hard-fail critical operations, and deterministic regression/threshold ordering through the existing failure precedence pattern.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts` — partial by design:
  - `src/report/asyncReport.contract.test.ts` passed.
  - `src/report/asyncReport.test.ts` failed only at `buildAsyncReport is not implemented yet.`
  - `src/gates/asyncEvaluator.test.ts` failed only at the `evaluateAsync*` placeholders being unimplemented.
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts` — partial as expected for an intermediate slice task:
  - async contract tests passed where implemented;
  - HTTP report and HTTP/async coverage baselines stayed green;
  - remaining failures were only `buildAsyncReport()` and `evaluateAsync*()` not implemented.
- `git diff --check` — passed.

Must-have readback confirmed:

- the async report shape is deterministic and separate from the HTTP report surface;
- the async gate contract is pinned in tests before CLI wiring starts;
- async diagnostics remain explicit as unmatched/mismatched drift instead of being flattened into HTTP-era fields.

## Diagnostics

Primary future-agent inspection path:

- run `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
- inspect `yanote-js/src/report/asyncReport.contract.test.ts` first if schema/normalization behavior drifts
- inspect `yanote-js/src/report/asyncReport.test.ts` next for the intended async artifact shape over partial and drift fixtures
- inspect `yanote-js/src/gates/asyncEvaluator.test.ts` for fail-closed, threshold, or regression contract drift
- if the broader slice stack regresses, rerun the full S03 verifier and confirm the HTTP report/coverage files are still green before touching the async contracts

## Deviations

- Added `yanote-js/src/gates/asyncEvaluator.ts` as a placeholder contract seam earlier than the task output list explicitly named, so the new gate tests fail on the intended implementation boundary instead of a missing-module import.
- `yanote-js/src/report/asyncReport.ts` already contains the async schema/normalization helpers that T02 may later split into `asyncSchema.ts` and `asyncNormalize.ts`; this kept the T01 contract self-contained while preserving the later refactor seam.

## Known Issues

- `buildAsyncReport()` is still a placeholder and must be implemented in T02.
- `evaluateAsyncThresholdGate()`, `evaluateAsyncRegressionGate()`, and `evaluateAsyncGateFailures()` are still placeholders and must be implemented in T02.
- The dedicated async CLI/report path is still absent; that remains T03 work.

## Files Created/Modified

- `yanote-js/src/report/asyncReport.ts` — added the separate async report types, schema version/phase markers, validation helpers, normalization helpers, and the explicit `buildAsyncReport()` seam.
- `yanote-js/src/report/asyncReport.contract.test.ts` — locked the async schema, HTTP-surface separation, and deterministic normalization contract.
- `yanote-js/src/report/asyncReport.test.ts` — pinned the intended async artifact output over real partial and drift fixtures.
- `yanote-js/src/gates/asyncEvaluator.ts` — added placeholder async gate exports so contract tests fail on the real evaluator seam.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — pinned async fail-closed, threshold, and regression expectations against the S02 coverage model.
- `.gsd/DECISIONS.md` — recorded the async report/gate contract boundary for downstream slice work.
- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — marked T01 complete.
- `.gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md` — recorded the contract surface, verifier outcome, and remaining implementation seams.
- `.gsd/STATE.md` — advanced the next action to T02.
