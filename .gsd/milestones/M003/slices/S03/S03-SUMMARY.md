---
id: S03
parent: M003
milestone: M003
provides:
  - A separate async report schema, deterministic async artifact writer, fail-closed async gate evaluator, and dedicated `yanote async-report` CLI path that stays distinct from the HTTP report surface.
requires:
  - slice: S01
    provides: canonical Kafka AsyncAPI identities, deterministic AsyncAPI diagnostics, and v2/v3 normalization.
  - slice: S02
    provides: deterministic async coverage semantics plus unmatched/mismatched async drift diagnostics.
affects:
  - M004/S01
  - M005/S01
  - M005/S02
key_files:
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/writeAsyncReport.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - .gsd/REQUIREMENTS.md
  - .gsd/PROJECT.md
  - .gsd/milestones/M003/slices/S03/S03-PLAN.md
key_decisions:
  - Keep the first async artifact and gate path separate from the HTTP report surface, preserve channel/operation/message semantics directly, and reuse shared policy ordering only where thresholds and precedence genuinely overlap.
patterns_established:
  - Land async product surfaces in contract-first order: pin schema and gate behavior with fixture tests, implement the report/evaluator seams directly over `asyncCoverage.ts`, then expose one dedicated CLI path while keeping HTTP non-regression in the same verifier stack.
observability_surfaces:
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts
  - YANOTE_ASYNC_SUMMARY
  - YANOTE_ASYNC_ERROR
  - YANOTE_ASYNC_ERROR_SECONDARY
  - yanote-async-report.json
drill_down_paths:
  - .gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S03/tasks/T03-SUMMARY.md
duration: 1h 05m
verification_result: passed
completed_at: 2026-03-13 20:06:28 +0300
---

# S03: Separate Async Report And Gate Surface

**Yanote now emits a separate deterministic async artifact and fail-closed async gate result through `yanote async-report`, while keeping the existing HTTP report path intact and green.**

## What Happened

S03 started by locking the async output contract before wiring any new command surface. T01 defined a dedicated async report model and contract tests that preserved the S02 truth surface directly: separate channel, operation, and message coverage sections, explicit unmatched/mismatched diagnostic counts, deterministic normalization, and a hard boundary that rejects HTTP-era report fields leaking into the async artifact. In parallel, the async gate contract was pinned in tests so semantic drift, threshold failures, regression checks, and critical-operation failures were all specified before implementation.

T02 then implemented the real async artifact and evaluator. `asyncReport.ts` now builds the artifact from `AsyncCoverageResult` instead of translating it through the HTTP report vocabulary. `asyncSchema.ts` and `asyncNormalize.ts` own schema validation, ordering, and percent rounding at the write boundary, while `asyncEvaluator.ts` evaluates async failures in the same fail-closed posture as the HTTP path: unmatched and mismatched async drift are semantic failures, threshold checks use raw async operation coverage, and regression ordering stays deterministic.

T03 finished the slice by exposing one real delivery path: `yanote async-report`. The CLI loads AsyncAPI contracts through the S01 semantics bundle, reads normalized Kafka evidence from the S02 reader, computes async coverage, evaluates async gate failures, builds the async artifact, and writes `yanote-async-report.json`. It emits dedicated machine-readable outcome lines (`YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR`, `YANOTE_ASYNC_ERROR_SECONDARY`) instead of reusing the HTTP output contract. The final verifier kept HTTP report and HTTP coverage tests in the same stack, so the async product surface was proven without blurring or regressing the existing HTTP path.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts` — passed.
- `git diff --check` — passed.

The passing verifier proves:

- the async artifact is deterministic, schema-checked, and separate from the HTTP report surface;
- unmatched and mismatched async drift participate in fail-closed async gates instead of being silently tolerated;
- `yanote async-report` writes `yanote-async-report.json`, emits typed async summary/error lines, and preserves deterministic error ordering;
- the existing HTTP report and HTTP coverage baseline remain green after the async report/gate path lands.

## Requirements Advanced

- R046 — Advanced the async quality bar by closing the first async milestone on a verifier stack that composes async artifact shape, async gate semantics, dedicated CLI wiring, and HTTP non-regression.

## Requirements Validated

- R041 — Validated by the dedicated `async-report` CLI wiring, deterministic `yanote-async-report.json` output, fail-closed async gate behavior, and HTTP report/coverage non-regression under the final S03 verifier stack.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- The slice implementation and task summaries were already present, but `S03-SUMMARY.md` had not been written. The slice was closed from task evidence plus a fresh passing verifier run rather than assuming the missing summary meant the product surface was incomplete.

## Known Limitations

- S03 still consumes metadata-only async evidence; live Spring Kafka capture and Kafka-header metadata propagation remain M004 work.
- HTTP and async remain intentionally separate report/gate surfaces in this first async release; a unified combined surface is still deferred.
- Payload validation against AsyncAPI message schemas remains deferred.

## Follow-ups

- Plan M004/S01 against the now-stable async seams: canonical Kafka identities, metadata-only async evidence shape, and the dedicated async report/gate surface.
- Keep future async CI/end-to-end proof layered on top of the S03 verifier stack instead of inventing a parallel acceptance path.

## Files Created/Modified

- `yanote-js/src/report/asyncReport.ts` — implemented the real async artifact builder over `AsyncCoverageResult`.
- `yanote-js/src/report/asyncSchema.ts` — added the dedicated async schema/version/phase validator.
- `yanote-js/src/report/asyncNormalize.ts` — added deterministic async ordering and percent rounding helpers.
- `yanote-js/src/report/writeAsyncReport.ts` — added the deterministic async report write boundary for `yanote-async-report.json`.
- `yanote-js/src/gates/asyncEvaluator.ts` — implemented semantic fail-closed, threshold, critical-operation, and regression evaluation for async coverage.
- `yanote-js/src/cli.ts` — added the dedicated `async-report` CLI path and async summary/error output contract.
- `yanote-js/src/cli.async-report.test.ts` — proved green, threshold-failing, and semantic-drift async CLI behavior.
- `yanote-js/src/cli.async-report.contract.test.ts` — pinned async stdout/stderr section ordering and deterministic machine-readable lines.
- `.gsd/REQUIREMENTS.md` — recorded R041 as validated and preserved truthful milestone-level proof mapping.
- `.gsd/PROJECT.md` — refreshed the living project snapshot to include the shipped async CLI/report surface.
- `.gsd/milestones/M003/slices/S03/S03-SUMMARY.md` — recorded the slice-level closure, proof surface, and downstream handoff.

## Forward Intelligence

### What the next slice should know
- `asyncCoverage.ts` remains the semantic handoff seam. M004 should emit normalized Kafka evidence into that model, not teach the report/CLI layer new matching rules.

### What's fragile
- If too many of the slow AsyncAPI/async report files are smashed into one oversized Vitest invocation, individual tests can hit the default 5s timeout even when the slice proof commands pass — use the slice verifier stack as the authoritative signal.

### Authoritative diagnostics
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts` — this is the fastest truthful proof of the shipped async product surface because it exercises artifact shape, gate behavior, CLI wiring, and HTTP non-regression together.

### What assumptions changed
- The async report/gate surface did not need a new governance system — reusing the shared policy precedence and failure-order machinery was enough once the async artifact, diagnostics, and CLI output stayed clearly separate from HTTP.
