---
id: T02
parent: S07
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/maintainers/public-surface-proof.md", "scripts/docs/verify-m016-s05-public-surface.contract.test.mjs", ".gsd/milestones/M016/slices/S07/tasks/T02-SUMMARY.md"]
key_decisions: ["The maintainer-only S05 rerun leaf must describe the live recorder bootstrap truth explicitly: module-backed Spring plugin resolution via mavenLocal/mavenCentral, no forced --refresh-dependencies, bounded publish retry, and retained bootstrap diagnostics."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified the updated maintainer wording and contract coverage with node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, confirmed the live recorder bootstrap proof still passed with bash scripts/docs/verify-s01-recorder-path.sh, rebuilt the documented standalone analyzer archive with ./gradlew distStandaloneAnalyzer --stacktrace, and then reran the exact slice verification command from the task plan. The final gate completed successfully, including both consecutive bash scripts/docs/verify-m016-s05-public-surface.sh runs."
completed_at: 2026-03-29T07:54:48.108Z
blocker_discovered: false
---

# T02: Pinned the maintainer rerun leaf to the hardened recorder bootstrap contract and proved the full S05 gate passes on an immediate rerun.

> Pinned the maintainer rerun leaf to the hardened recorder bootstrap contract and proved the full S05 gate passes on an immediate rerun.

## What Happened
---
id: T02
parent: S07
milestone: M016
key_files:
  - docs/maintainers/public-surface-proof.md
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
  - .gsd/milestones/M016/slices/S07/tasks/T02-SUMMARY.md
key_decisions:
  - The maintainer-only S05 rerun leaf must describe the live recorder bootstrap truth explicitly: module-backed Spring plugin resolution via mavenLocal/mavenCentral, no forced --refresh-dependencies, bounded publish retry, and retained bootstrap diagnostics.
duration: ""
verification_result: passed
completed_at: 2026-03-29T07:54:48.109Z
blocker_discovered: false
---

# T02: Pinned the maintainer rerun leaf to the hardened recorder bootstrap contract and proved the full S05 gate passes on an immediate rerun.

**Pinned the maintainer rerun leaf to the hardened recorder bootstrap contract and proved the full S05 gate passes on an immediate rerun.**

## What Happened

Updated the maintainer-only public-surface proof leaf so S05-06 now documents the same recorder bootstrap contract implemented by the live verifier: Spring plugin resolution through mavenLocal() and mavenCentral(), no fallback dependency on the Gradle Plugin Portal, no forced --refresh-dependencies, bounded publish retry before bootRun, and the retained bootstrap diagnostics maintainers should inspect when the stage fails. Tightened scripts/docs/verify-m016-s05-public-surface.contract.test.mjs so wording drift around those recorder guarantees now fails closed while the leaf remains discoverable only from maintainer surfaces. During verification, the first full S05 run exposed a fresh-worktree precondition at S05-07 because build/distributions/yanote-analyzer.zip was missing; I regenerated the documented standalone analyzer archive with ./gradlew distStandaloneAnalyzer --stacktrace, reran the exact slice verification command, and then confirmed the full public-surface proof passed twice in the same checkout.

## Verification

Verified the updated maintainer wording and contract coverage with node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, confirmed the live recorder bootstrap proof still passed with bash scripts/docs/verify-s01-recorder-path.sh, rebuilt the documented standalone analyzer archive with ./gradlew distStandaloneAnalyzer --stacktrace, and then reran the exact slice verification command from the task plan. The final gate completed successfully, including both consecutive bash scripts/docs/verify-m016-s05-public-surface.sh runs.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | 0 | ✅ pass | 2657ms |
| 2 | `bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 42737ms |
| 3 | `./gradlew distStandaloneAnalyzer --stacktrace` | 0 | ✅ pass | 42301ms |
| 4 | `bash scripts/docs/verify-s01-recorder-path.sh && node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && bash scripts/docs/verify-m016-s05-public-surface.sh && bash scripts/docs/verify-m016-s05-public-surface.sh` | 0 | ✅ pass | 157609ms |


## Deviations

A fresh worktree did not contain build/distributions/yanote-analyzer.zip, so I regenerated the documented standalone analyzer archive locally with ./gradlew distStandaloneAnalyzer --stacktrace before rerunning the exact slice verification command.

## Known Issues

None.

## Files Created/Modified

- `docs/maintainers/public-surface-proof.md`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `.gsd/milestones/M016/slices/S07/tasks/T02-SUMMARY.md`


## Deviations
A fresh worktree did not contain build/distributions/yanote-analyzer.zip, so I regenerated the documented standalone analyzer archive locally with ./gradlew distStandaloneAnalyzer --stacktrace before rerunning the exact slice verification command.

## Known Issues
None.
