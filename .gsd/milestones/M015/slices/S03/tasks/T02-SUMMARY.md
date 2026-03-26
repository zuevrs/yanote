---
id: T02
parent: S03
milestone: M015
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/cli.ts", "yanote-js/src/cli.combined-report.test.ts", "yanote-js/src/cli.combined-report.contract.test.ts", ".gsd/milestones/M015/slices/S03/tasks/T02-SUMMARY.md"]
key_decisions: []
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified the new surface with `npm -C yanote-js test -- src/cli.combined-report.test.ts src/cli.combined-report.contract.test.ts`, which passed with 7 tests covering the new command behavior and output contract. Reran the inherited combined report regression suite plus build with `npm -C yanote-js test -- ./src/report/combinedReport.test.ts ./src/report/combinedReport.contract.test.ts ./src/report/writeCombinedReport.determinism.test.ts && npm -C yanote-js run build`, which also passed. Ran the downstream T03 proof verifier command as an intermediate-task boundary check; it still fails because the T03 proof contract/script files do not exist yet."
completed_at: 2026-03-26T19:39:54.693Z
blocker_discovered: false
---

# T02: Added the `combined-report` CLI with canonical child-report loading, attributed summary output, and fail-closed typed errors.

> Added the `combined-report` CLI with canonical child-report loading, attributed summary output, and fail-closed typed errors.

## What Happened
---
id: T02
parent: S03
milestone: M015
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.combined-report.test.ts
  - yanote-js/src/cli.combined-report.contract.test.ts
  - .gsd/milestones/M015/slices/S03/tasks/T02-SUMMARY.md
key_decisions:
  - (none)
duration: ""
verification_result: mixed
completed_at: 2026-03-26T19:39:54.695Z
blocker_discovered: false
---

# T02: Added the `combined-report` CLI with canonical child-report loading, attributed summary output, and fail-closed typed errors.

**Added the `combined-report` CLI with canonical child-report loading, attributed summary output, and fail-closed typed errors.**

## What Happened

Implemented `combined-report` in `yanote-js/src/cli.ts` with `--report`, `--async-report`, `--out`, and `--verbose`. The command now loads canonical HTTP and async child JSON reports directly from disk, validates each child against the correct schema and expected phase, builds the combined DTO, writes `yanote-combined-report.json`/`.html`, and prints a deterministic human summary plus one final `YANOTE_COMBINED_SUMMARY` line. It fails closed on missing files, invalid JSON, schema drift, swapped child file types, and wrong child phases, and stderr now emits `YANOTE_COMBINED_ERROR` / `YANOTE_COMBINED_ERROR_SECONDARY` lines with explicit `child=`, `path=`, and `report=` context. On write failures the CLI reports `report=none` and cleans up partial combined artifacts. Added dedicated Vitest behavior and contract coverage for green composition, partial-child attribution, missing-child input failure, unwritable output failure, preserved child paths, fixed section ordering, and deterministic primary/secondary error output.

## Verification

Verified the new surface with `npm -C yanote-js test -- src/cli.combined-report.test.ts src/cli.combined-report.contract.test.ts`, which passed with 7 tests covering the new command behavior and output contract. Reran the inherited combined report regression suite plus build with `npm -C yanote-js test -- ./src/report/combinedReport.test.ts ./src/report/combinedReport.contract.test.ts ./src/report/writeCombinedReport.determinism.test.ts && npm -C yanote-js run build`, which also passed. Ran the downstream T03 proof verifier command as an intermediate-task boundary check; it still fails because the T03 proof contract/script files do not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.combined-report.test.ts src/cli.combined-report.contract.test.ts` | 0 | ✅ pass | 1379ms |
| 2 | `npm -C yanote-js test -- ./src/report/combinedReport.test.ts ./src/report/combinedReport.contract.test.ts ./src/report/writeCombinedReport.determinism.test.ts && npm -C yanote-js run build` | 0 | ✅ pass | 1440ms |
| 3 | `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs && npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh` | 1 | ❌ fail | 78ms |


## Deviations

Adjusted the verifier command path forms to match the real worktree-local Vitest runner instead of the planner snapshot: the new CLI tests matched `src/...`, while the inherited report-layer regression suite required `./src/report/...` to resolve correctly under `npm -C yanote-js test -- ...`.

## Known Issues

The downstream T03 proof verifier still fails because `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `scripts/ci/verify-m015-s03-combined-report.sh` do not exist yet. That is planned follow-up work for T03, not a blocker in T02.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.combined-report.test.ts`
- `yanote-js/src/cli.combined-report.contract.test.ts`
- `.gsd/milestones/M015/slices/S03/tasks/T02-SUMMARY.md`


## Deviations
Adjusted the verifier command path forms to match the real worktree-local Vitest runner instead of the planner snapshot: the new CLI tests matched `src/...`, while the inherited report-layer regression suite required `./src/report/...` to resolve correctly under `npm -C yanote-js test -- ...`.

## Known Issues
The downstream T03 proof verifier still fails because `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `scripts/ci/verify-m015-s03-combined-report.sh` do not exist yet. That is planned follow-up work for T03, not a blocker in T02.
