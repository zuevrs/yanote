---
id: T01
parent: S07
milestone: M016
provides: []
requires: []
affects: []
key_files: ["test/fixtures/recorder-spring-smoke/settings.gradle.kts", "scripts/docs/verify-s01-recorder-path.sh", "scripts/docs/verify-s01-recorder-path.contract.test.mjs", ".gsd/milestones/M016/slices/S07/tasks/T01-SUMMARY.md"]
key_decisions: ["Pinned the smoke fixture's Spring plugins to module coordinates from mavenLocal/mavenCentral and removed verifier-side `--refresh-dependencies` forcing.", "Recorder smoke verification now fails closed with explicit bootstrap phase context and bounded publish retry before any proof request is sent."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Focused verification passed with node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs and bash scripts/docs/verify-s01-recorder-path.sh. Slice-level verification also ran: node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs passed, and the composed public-surface rerun stack reached S05-07 before failing on a missing yanote-analyzer.zip outside this task's scope."
completed_at: 2026-03-29T07:41:07.365Z
blocker_discovered: false
---

# T01: Pinned recorder smoke plugin resolution to module-backed repositories, removed forced bootRun refresh, and restored retry-aware bootstrap diagnostics.

> Pinned recorder smoke plugin resolution to module-backed repositories, removed forced bootRun refresh, and restored retry-aware bootstrap diagnostics.

## What Happened
---
id: T01
parent: S07
milestone: M016
key_files:
  - test/fixtures/recorder-spring-smoke/settings.gradle.kts
  - scripts/docs/verify-s01-recorder-path.sh
  - scripts/docs/verify-s01-recorder-path.contract.test.mjs
  - .gsd/milestones/M016/slices/S07/tasks/T01-SUMMARY.md
key_decisions:
  - Pinned the smoke fixture's Spring plugins to module coordinates from mavenLocal/mavenCentral and removed verifier-side `--refresh-dependencies` forcing.
  - Recorder smoke verification now fails closed with explicit bootstrap phase context and bounded publish retry before any proof request is sent.
duration: ""
verification_result: mixed
completed_at: 2026-03-29T07:41:07.366Z
blocker_discovered: false
---

# T01: Pinned recorder smoke plugin resolution to module-backed repositories, removed forced bootRun refresh, and restored retry-aware bootstrap diagnostics.

**Pinned recorder smoke plugin resolution to module-backed repositories, removed forced bootRun refresh, and restored retry-aware bootstrap diagnostics.**

## What Happened

Reproduced the recorder smoke verifier failure, confirmed the smoke fixture still allowed Gradle Plugin Portal fallback, and replaced that bootstrap with fixture-local pluginManagement that resolves Spring plugins through explicit module coordinates from mavenLocal() and mavenCentral() only. Updated the recorder verifier to stop forcing --refresh-dependencies during bootRun, restored bounded publish retry semantics, and added phase-aware retained diagnostics so publish/bootstrap/readiness failures remain attributable through publish.log, fixture.log, temp_dir, gradle_home, events_file, and response_file. Rewrote the focused contract suite so bootstrap drift now fails closed when Plugin Portal fallback, refresh forcing, or retry/diagnostic behavior regresses.

## Verification

Focused verification passed with node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs and bash scripts/docs/verify-s01-recorder-path.sh. Slice-level verification also ran: node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs passed, and the composed public-surface rerun stack reached S05-07 before failing on a missing yanote-analyzer.zip outside this task's scope.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs` | 0 | ✅ pass | 2892ms |
| 2 | `bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 32312ms |
| 3 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | 0 | ✅ pass | 2929ms |
| 4 | `bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh` | 1 | ❌ fail | 36006ms |


## Deviations

None.

## Known Issues

The full slice-level rerun command still stops at S05-07 because build/distributions/yanote-analyzer.zip is missing; that is outside the recorder bootstrap scope fixed in this task.

## Files Created/Modified

- `test/fixtures/recorder-spring-smoke/settings.gradle.kts`
- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs`
- `.gsd/milestones/M016/slices/S07/tasks/T01-SUMMARY.md`


## Deviations
None.

## Known Issues
The full slice-level rerun command still stops at S05-07 because build/distributions/yanote-analyzer.zip is missing; that is outside the recorder bootstrap scope fixed in this task.
