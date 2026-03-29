---
id: T01
parent: S06
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/docs/verify-s01-recorder-path.sh", "scripts/docs/verify-s01-recorder-path.contract.test.mjs", ".gsd/milestones/M016/slices/S06/tasks/T01-SUMMARY.md"]
key_decisions: ["D046: Use a localhost port-open probe with process-alive checks and retained artifact diagnostics instead of the Spring started-log line for recorder verifier readiness."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed the focused contract suite (`node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs`), proved the real Gradle/Spring verifier still passes, proved the old grep sabotage no longer affects readiness by running `PATH="$PWD/.tmp/repro-bin:$PATH" bash scripts/docs/verify-s01-recorder-path.sh`, and reran the exact task verification command `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh` to a clean pass."
completed_at: 2026-03-29T04:17:09.304Z
blocker_discovered: false
---

# T01: Replaced recorder verifier log-scrape readiness with a deterministic port probe and contract tests.

> Replaced recorder verifier log-scrape readiness with a deterministic port probe and contract tests.

## What Happened
---
id: T01
parent: S06
milestone: M016
key_files:
  - scripts/docs/verify-s01-recorder-path.sh
  - scripts/docs/verify-s01-recorder-path.contract.test.mjs
  - .gsd/milestones/M016/slices/S06/tasks/T01-SUMMARY.md
key_decisions:
  - D046: Use a localhost port-open probe with process-alive checks and retained artifact diagnostics instead of the Spring started-log line for recorder verifier readiness.
duration: ""
verification_result: passed
completed_at: 2026-03-29T04:17:09.307Z
blocker_discovered: false
---

# T01: Replaced recorder verifier log-scrape readiness with a deterministic port probe and contract tests.

**Replaced recorder verifier log-scrape readiness with a deterministic port probe and contract tests.**

## What Happened

Reproduced the existing flake by shadowing the started-log grep, confirmed the smoke fixture could already be listening while the verifier still timed out, and then replaced the verifier's readiness gate with a deterministic localhost port probe guarded by process-alive checks. Preserved the real proof request and JSONL contract assertions, expanded failure diagnostics to print the probed port plus retained artifact paths, and added focused contract coverage that locks the no-log-line happy path along with timeout and early-exit negative cases.

## Verification

Passed the focused contract suite (`node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs`), proved the real Gradle/Spring verifier still passes, proved the old grep sabotage no longer affects readiness by running `PATH="$PWD/.tmp/repro-bin:$PATH" bash scripts/docs/verify-s01-recorder-path.sh`, and reran the exact task verification command `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh` to a clean pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs` | 0 | ✅ pass | 2761ms |
| 2 | `PATH="$PWD/.tmp/repro-bin:$PATH" bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 106973ms |
| 3 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs && bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 114665ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`
- `.gsd/milestones/M016/slices/S06/tasks/T01-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
