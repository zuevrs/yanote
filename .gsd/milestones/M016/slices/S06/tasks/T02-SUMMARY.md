---
id: T02
parent: S06
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/maintainers/public-surface-proof.md", "scripts/docs/verify-m016-s05-public-surface.contract.test.mjs", ".gsd/milestones/M016/slices/S06/tasks/T02-SUMMARY.md"]
key_decisions: []
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`, confirmed the isolated `publishToMavenLocal` step succeeds with the same temp Gradle-home shape after the transient daemon crash, reran `bash scripts/docs/verify-s01-recorder-path.sh` successfully, and then ran `bash ./scripts/docs/verify-m016-s05-public-surface.sh` twice in succession with both full S05 proofs green."
completed_at: 2026-03-29T04:28:40.867Z
blocker_discovered: false
---

# T02: Locked the maintainer rerun leaf to the recorder port-probe diagnostics and proved the full S05 public-surface verifier passes cold and on immediate rerun.

> Locked the maintainer rerun leaf to the recorder port-probe diagnostics and proved the full S05 public-surface verifier passes cold and on immediate rerun.

## What Happened
---
id: T02
parent: S06
milestone: M016
key_files:
  - docs/maintainers/public-surface-proof.md
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
  - .gsd/milestones/M016/slices/S06/tasks/T02-SUMMARY.md
key_decisions:
  - (none)
duration: ""
verification_result: passed
completed_at: 2026-03-29T04:28:40.868Z
blocker_discovered: false
---

# T02: Locked the maintainer rerun leaf to the recorder port-probe diagnostics and proved the full S05 public-surface verifier passes cold and on immediate rerun.

**Locked the maintainer rerun leaf to the recorder port-probe diagnostics and proved the full S05 public-surface verifier passes cold and on immediate rerun.**

## What Happened

Updated `docs/maintainers/public-surface-proof.md` so the S05-06 recorder stage now describes the same runtime contract the verifier actually implements: a deterministic localhost port-open readiness probe instead of the old started-log grep, plus the exact retained failure-artifact labels future maintainers should inspect (`readiness_port`, `temp_dir`, `publish_log`, `app_log`, `events_file`, `response_file`). Extended `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` so maintainer-surface drift fails closed if that readiness wording or those diagnostics disappear.

During runtime verification, the first focused recorder run hit a transient Gradle single-use daemon crash during `publishToMavenLocal`. I treated that as a hypothesis test instead of changing the verifier: I reproduced the exact publish step with the same temp-Gradle-home shape, observed a clean pass, then reran the unchanged recorder verifier successfully. After that, the composed `scripts/docs/verify-m016-s05-public-surface.sh` proof passed end to end from a cold run and then passed again immediately from the same checkout, confirming the slice goal and the maintainer rerun contract.

## Verification

Passed `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`, confirmed the isolated `publishToMavenLocal` step succeeds with the same temp Gradle-home shape after the transient daemon crash, reran `bash scripts/docs/verify-s01-recorder-path.sh` successfully, and then ran `bash ./scripts/docs/verify-m016-s05-public-surface.sh` twice in succession with both full S05 proofs green.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | 0 | ✅ pass | 2325ms |
| 2 | `publishToMavenLocal with temp gradle home` | 0 | ✅ pass | 50423ms |
| 3 | `bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 74660ms |
| 4 | `bash ./scripts/docs/verify-m016-s05-public-surface.sh` | 0 | ✅ pass | 84458ms |
| 5 | `bash ./scripts/docs/verify-m016-s05-public-surface.sh` | 0 | ✅ pass | 82570ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/maintainers/public-surface-proof.md`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `.gsd/milestones/M016/slices/S06/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
