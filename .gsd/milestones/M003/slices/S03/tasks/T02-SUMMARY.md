---
id: T02
parent: S03
milestone: M003
provides:
  - A real async report builder, dedicated async schema/normalization helpers, and fail-closed async gate evaluation over the S02 coverage result.
key_files:
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S03/S03-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Keep `buildAsyncReport()` on direct coverage/spec order and leave deterministic normalization plus schema validation as explicit async report boundary helpers.
patterns_established:
  - Short-circuit async gate evaluation on unmatched/mismatched diagnostics as semantic fail-closed errors before threshold or regression checks, while using raw async operation coverage for threshold evaluation.
observability_surfaces:
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/gates/asyncEvaluator.ts
duration: 15m
verification_result: passed
completed_at: 2026-03-13 19:51:37 MSK
blocker_discovered: false
---

# T02: Implement async report building, normalization, and gate evaluation

**Implemented the real async report artifact and fail-closed async gate path over S02 coverage without changing the HTTP report behavior.**

## What Happened

I split the async report seam into three explicit pieces.

`yanote-js/src/report/asyncReport.ts` now builds the real async artifact from `AsyncCoverageResult`. It preserves the S02 truth surface directly: channel, operation, and message sections stay separate; unmatched and mismatched diagnostics remain first-class; generated timestamps stay deterministic; and the report status resolves from async coverage plus diagnostics instead of borrowing HTTP aggregate semantics.

Then I moved deterministic boundary helpers into dedicated files. `yanote-js/src/report/asyncSchema.ts` owns the async report schema/version/phase contract and validation. `yanote-js/src/report/asyncNormalize.ts` owns deterministic percent rounding and ordering for channels, operations, messages, suites, and diagnostics. `asyncReport.ts` re-exports those helpers so the T01 contract imports stay stable.

On the gate side, `yanote-js/src/gates/asyncEvaluator.ts` now evaluates three distinct async cases over the async coverage model rather than the HTTP one:

- semantic fail-closed errors for mismatched and unmatched async drift;
- threshold checks against raw async operation coverage decimals, plus hard-fail critical async operations;
- regression checks for covered-operation loss and dimension regressions with deterministic ordering.

I also recorded the new builder-vs-write boundary in `.gsd/DECISIONS.md`, marked T02 complete in the slice plan, and advanced `.gsd/STATE.md` to T03.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts` — passed.
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts && npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts` — passed twice back-to-back, confirming deterministic async report and gate surfaces across repeated runs.
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts` — passed for the currently present slice verifier stack, including HTTP report and coverage non-regression surfaces.
- `git diff --check` — passed.

Must-have readback confirmed:

- the async report serializes S02 async coverage truthfully and deterministically;
- async gate failures are explicit and fail closed on unmatched/mismatched drift;
- the HTTP report builder behavior stayed green.

## Diagnostics

Primary future-agent inspection path:

- run `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
- inspect `yanote-js/src/report/asyncReport.ts` for artifact assembly and async report status resolution
- inspect `yanote-js/src/report/asyncSchema.ts` when the async artifact starts failing validation
- inspect `yanote-js/src/report/asyncNormalize.ts` when ordering or rounded percentages drift
- inspect `yanote-js/src/gates/asyncEvaluator.ts` when fail-closed, threshold, or regression diagnostics drift

Failure state exposed now:

- `buildAsyncReport()` throws `Invalid async report schema: ...` if the async artifact shape drifts out of contract
- async gate failures expose explicit `ASYNC_SEMANTIC_*` and `ASYNC_GATE_*` codes with stable severity/ordering
- repeated targeted test runs are the quickest determinism check

## Deviations

- Split the async schema and normalization helpers into dedicated `asyncSchema.ts` and `asyncNormalize.ts` modules instead of keeping them inside `asyncReport.ts`; this matches the task output list and preserves a cleaner write boundary for T03.

## Known Issues

- The dedicated async CLI/report entry path is still absent; that remains T03 work.
- The slice is not complete until T03 wires the async CLI surface and adds/proves the dedicated CLI tests.

## Files Created/Modified

- `yanote-js/src/report/asyncReport.ts` — implemented the real async artifact builder, report status resolution, and stable helper re-exports.
- `yanote-js/src/report/asyncSchema.ts` — added the dedicated async report schema/version/phase contract and validator.
- `yanote-js/src/report/asyncNormalize.ts` — added deterministic async report normalization and percent rounding.
- `yanote-js/src/gates/asyncEvaluator.ts` — implemented async semantic fail-closed, threshold, and regression evaluation.
- `.gsd/DECISIONS.md` — recorded the async report build-vs-write boundary for downstream CLI work.
- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action to T03.
- `.gsd/milestones/M003/slices/S03/tasks/T02-SUMMARY.md` — recorded the implementation, verification, and handoff notes.
