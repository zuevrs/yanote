---
id: T03
parent: S03
milestone: M003
provides:
  - A real `yanote async-report` CLI path that loads AsyncAPI specs and normalized async evidence, writes `yanote-async-report.json`, evaluates async gates, and proves HTTP non-regression in the same verifier stack.
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/report/writeAsyncReport.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - .gsd/milestones/M003/slices/S03/S03-PLAN.md
  - .gsd/milestones/M003/M003-ROADMAP.md
  - .gsd/REQUIREMENTS.md
  - .gsd/PROJECT.md
  - .gsd/STATE.md
key_decisions:
  - Keep async analysis behind the dedicated `async-report` command and `YANOTE_ASYNC_*` output surface instead of merging it into the existing HTTP `report` command.
patterns_established:
  - Reuse the shared policy and failure-order machinery for async thresholds and precedence, but keep async artifact writing, summary formatting, and fail-closed diagnostics on a separate CLI/report surface.
observability_surfaces:
  - `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
  - `YANOTE_ASYNC_SUMMARY`
  - `YANOTE_ASYNC_ERROR`
  - `YANOTE_ASYNC_ERROR_SECONDARY`
  - `yanote-async-report.json`
duration: ~30m
verification_result: passed
completed_at: 2026-03-13 20:06:28 +0300
blocker_discovered: false
---

# T03: Wire the async CLI/report path and prove HTTP non-regression

**Exposed the separate async CLI/report surface through `yanote async-report`, proved its fail-closed behavior, and closed M003 against the combined async-plus-HTTP verifier stack.**

## What Happened

`yanote-js/src/cli.ts` now exposes a dedicated `async-report` command that is obviously separate from the existing HTTP `report` path. The command loads AsyncAPI specs through the async semantics bundle, reads normalized async JSONL evidence, computes async coverage, evaluates async gate failures, builds the dedicated async artifact, and writes `yanote-async-report.json` through `writeAsyncYanoteReport()`.

The async CLI path keeps the governance contract legible instead of inventing a second policy system. It reuses the existing policy-resolution and failure-order machinery for thresholds and precedence, but emits separate async-facing output surfaces: `YANOTE_ASYNC_SUMMARY` on stdout plus `YANOTE_ASYNC_ERROR` / `YANOTE_ASYNC_ERROR_SECONDARY` on stderr. Semantic drift remains fail-closed, threshold failures still write the async artifact before exiting, and invalid input/invalid AsyncAPI cases stay typed and deterministic.

`yanote-js/src/cli.async-report.test.ts` proves the main runtime behavior: a green local-profile run writes a separate async artifact, threshold failures exit 3 while still writing the artifact, and async drift exits 5 with semantic failures ordered ahead of secondary diagnostics. `yanote-js/src/cli.async-report.contract.test.ts` pins the stdout/stderr contract: fixed section order, one final machine summary line, typed input/semantic errors, and deterministic primary/secondary error ordering.

On resume, the runtime/tests were already green in the branch but the GSD closure layer was missing. I verified the full S03 proof stack, then closed the stale tracker surfaces by marking T03 and S03 complete, validating R041 in `.gsd/REQUIREMENTS.md`, refreshing `.gsd/PROJECT.md` to reflect the shipped async CLI/report surface, and advancing `.gsd/STATE.md` to the M004 planning boundary.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts` — passed (8 files, 22 tests), proving async artifact output, async gate behavior, async CLI wiring, and HTTP report/coverage non-regression together.
- `git diff --check` — passed.

Must-have readback confirmed:

- the async report/gate path is reachable through a real CLI entry point;
- async and HTTP report paths remain separate and truthful;
- the final verifier proves async artifact output, async gate behavior, and HTTP non-regression together.

## Diagnostics

Future-agent inspection path:

- run `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
- inspect `yanote-js/src/cli.ts` for async CLI wiring, summary formatting, and fail-closed exit mapping
- inspect `yanote-js/src/cli.async-report.test.ts` for success / threshold / drift runtime expectations
- inspect `yanote-js/src/cli.async-report.contract.test.ts` for stdout/stderr contract and error-ordering expectations
- inspect `yanote-js/src/report/writeAsyncReport.ts` when the async artifact path or schema-validation write boundary drifts

Failure state exposed now:

- `YANOTE_ASYNC_SUMMARY ... primary=<code>` on stdout for machine-readable outcome inspection
- `YANOTE_ASYNC_ERROR` and `YANOTE_ASYNC_ERROR_SECONDARY` on stderr with deterministic class/code/reason/hint fields
- `yanote-async-report.json` written on successful and gate-failing runs, unless input/semantic failure prevents report construction

## Deviations

None.

## Known Issues

None within T03. Live Kafka evidence capture, metadata propagation, and end-to-end runtime proof remain planned M004/M005 work rather than unfinished T03 work.

## Files Created/Modified

- `yanote-js/src/cli.ts` — added the dedicated `async-report` CLI path, async summary/error formatting, and fail-closed exit behavior.
- `yanote-js/src/report/writeAsyncReport.ts` — added the deterministic async report write boundary for `yanote-async-report.json`.
- `yanote-js/src/cli.async-report.test.ts` — proved green, threshold-failing, and semantic-drift async CLI behavior.
- `yanote-js/src/cli.async-report.contract.test.ts` — pinned the async CLI stdout/stderr contract and deterministic error ordering.
- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — marked T03 complete.
- `.gsd/milestones/M003/M003-ROADMAP.md` — marked S03 complete to close M003’s last slice.
- `.gsd/REQUIREMENTS.md` — moved R041 to validated and updated the coverage summary counts.
- `.gsd/PROJECT.md` — refreshed the living project snapshot to include the shipped separate async CLI/report surface.
- `.gsd/STATE.md` — advanced the tracker to M004 ready-for-planning state.
- `.gsd/milestones/M003/slices/S03/tasks/T03-SUMMARY.md` — recorded the shipped async CLI/report path, verifier outcome, and handoff notes.
