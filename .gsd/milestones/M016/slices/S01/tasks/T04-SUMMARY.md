---
id: T04
parent: S01
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/ci/verify-m016-s01-standalone-analyzer.sh", "scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M016/slices/S01/tasks/T04-SUMMARY.md"]
key_decisions: []
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified `bash -n scripts/ci/verify-m016-s01-standalone-analyzer.sh`, the exact task-plan verifier command `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh`, and a sequential compatibility rerun of `bash scripts/ci/run-yanote-gradle-check.sh`. Also inspected `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt` and `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-source-paths.txt` to confirm the retained observability surfaces localize archive-vs-extraction-vs-launcher-vs-report drift."
completed_at: 2026-03-28T22:57:11.851Z
blocker_discovered: false
---

# T04: Added a staged-bundle verifier that proves the standalone `yanote-analyzer.zip` install/run path works end to end.

> Added a staged-bundle verifier that proves the standalone `yanote-analyzer.zip` install/run path works end to end.

## What Happened
---
id: T04
parent: S01
milestone: M016
key_files:
  - scripts/ci/verify-m016-s01-standalone-analyzer.sh
  - scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M016/slices/S01/tasks/T04-SUMMARY.md
key_decisions:
  - (none)
duration: ""
verification_result: passed
completed_at: 2026-03-28T22:57:11.852Z
blocker_discovered: false
---

# T04: Added a staged-bundle verifier that proves the standalone `yanote-analyzer.zip` install/run path works end to end.

**Added a staged-bundle verifier that proves the standalone `yanote-analyzer.zip` install/run path works end to end.**

## What Happened

Added `scripts/ci/verify-m016-s01-standalone-analyzer.sh`, a rerunnable proof that builds `build/distributions/yanote-analyzer.zip`, validates the archive shape, extracts it into a stable retained proof directory, runs the extracted `bin/yanote --version` from outside the build tree, and executes `report` against the existing simple OpenAPI/events fixtures without any `npm -C yanote-js ...` or `node yanote-js/dist/yanote.cjs` user command. Added `scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs` to pin the archive name, extracted launcher/report command shape, retained proof artifact names, and fail-closed diagnostics. Also recorded a repo knowledge note that parallel `distStandaloneAnalyzer` consumers can race on `dist/standalone-analyzer/node_modules`; a parallel-only helper failure reproduced that race once and then passed sequentially, so it is a verification gotcha rather than a blocker in the standalone contract itself.

## Verification

Verified `bash -n scripts/ci/verify-m016-s01-standalone-analyzer.sh`, the exact task-plan verifier command `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh`, and a sequential compatibility rerun of `bash scripts/ci/run-yanote-gradle-check.sh`. Also inspected `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt` and `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-source-paths.txt` to confirm the retained observability surfaces localize archive-vs-extraction-vs-launcher-vs-report drift.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/ci/verify-m016-s01-standalone-analyzer.sh` | 0 | ✅ pass | 3ms |
| 2 | `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh` | 0 | ✅ pass | 7523ms |
| 3 | `bash scripts/ci/run-yanote-gradle-check.sh` | 0 | ✅ pass | 4058ms |


## Deviations

Added one `.gsd/KNOWLEDGE.md` entry because a parallel-only verification run exposed a non-obvious `distStandaloneAnalyzer` packaging race. This did not change the task contract or the shipped standalone verifier surface.

## Known Issues

Parallel `distStandaloneAnalyzer` consumers can race on `dist/standalone-analyzer/node_modules` and produce a false `packageStandaloneAnalyzer` read failure. Sequential reruns pass; the rule is documented in `.gsd/KNOWLEDGE.md` and does not invalidate the slice plan.

## Files Created/Modified

- `scripts/ci/verify-m016-s01-standalone-analyzer.sh`
- `scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M016/slices/S01/tasks/T04-SUMMARY.md`


## Deviations
Added one `.gsd/KNOWLEDGE.md` entry because a parallel-only verification run exposed a non-obvious `distStandaloneAnalyzer` packaging race. This did not change the task contract or the shipped standalone verifier surface.

## Known Issues
Parallel `distStandaloneAnalyzer` consumers can race on `dist/standalone-analyzer/node_modules` and produce a false `packageStandaloneAnalyzer` read failure. Sequential reruns pass; the rule is documented in `.gsd/KNOWLEDGE.md` and does not invalidate the slice plan.
