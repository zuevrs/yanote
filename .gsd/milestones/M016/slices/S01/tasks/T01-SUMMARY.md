---
id: T01
parent: S01
milestone: M016
provides: []
requires: []
affects: []
key_files: ["build.gradle.kts", "yanote-js/bin/yanote", "yanote-js/package.json", "yanote-js/package-lock.json", "yanote-js/src/version.ts", "yanote-js/src/cli.ts", "yanote-js/src/cli.test.ts", "scripts/release/analyzer-standalone.contract.test.mjs", ".gsd/milestones/M016/slices/S01/tasks/T01-SUMMARY.md"]
key_decisions: ["D016: standalone bundle version truth comes from a staged VERSION file that the launcher exports as YANOTE_TOOL_VERSION before invoking the bundled runtime."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-level verification passed with `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts`. Slice-level verification also showed that `npm -C yanote-js test -- src/cli.test.ts && node --test scripts/release/analyzer-standalone.contract.test.mjs scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` and `./gradlew :yanote-gradle-plugin:test && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` now pass. Remaining slice verification is still partial because `scripts/ci/verify-m016-s01-standalone-analyzer.sh` is not present yet and the docs verifier stack is still red before later slice tasks."
completed_at: 2026-03-28T22:13:35.864Z
blocker_discovered: false
---

# T01: Added a versioned standalone analyzer bundle with a stable bin/yanote launcher.

> Added a versioned standalone analyzer bundle with a stable bin/yanote launcher.

## What Happened
---
id: T01
parent: S01
milestone: M016
key_files:
  - build.gradle.kts
  - yanote-js/bin/yanote
  - yanote-js/package.json
  - yanote-js/package-lock.json
  - yanote-js/src/version.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.test.ts
  - scripts/release/analyzer-standalone.contract.test.mjs
  - .gsd/milestones/M016/slices/S01/tasks/T01-SUMMARY.md
key_decisions:
  - D016: standalone bundle version truth comes from a staged VERSION file that the launcher exports as YANOTE_TOOL_VERSION before invoking the bundled runtime.
duration: ""
verification_result: mixed
completed_at: 2026-03-28T22:13:35.865Z
blocker_discovered: false
---

# T01: Added a versioned standalone analyzer bundle with a stable bin/yanote launcher.

**Added a versioned standalone analyzer bundle with a stable bin/yanote launcher.**

## What Happened

Added a tracked shell launcher at `yanote-js/bin/yanote`, introduced `distStandaloneAnalyzer` plus shared `installYanoteJsDependencies` / `buildYanoteJsAnalyzer` Gradle tasks, and staged a standalone bundle at `dist/standalone-analyzer/` with `bin/yanote`, `lib/yanote.cjs`, `VERSION`, and patched package metadata. Switched analyzer version resolution from a frozen import-time constant to a lazy runtime resolver so launcher-injected `YANOTE_TOOL_VERSION` reaches both `--version` output and generated report `toolVersion` fields. Added focused contract coverage for staged bundle layout, launcher resolution, injected version behavior, and fail-closed negative cases.

## Verification

Task-level verification passed with `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts`. Slice-level verification also showed that `npm -C yanote-js test -- src/cli.test.ts && node --test scripts/release/analyzer-standalone.contract.test.mjs scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` and `./gradlew :yanote-gradle-plugin:test && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` now pass. Remaining slice verification is still partial because `scripts/ci/verify-m016-s01-standalone-analyzer.sh` is not present yet and the docs verifier stack is still red before later slice tasks.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts` | 0 | ✅ pass | 12851ms |
| 2 | `npm -C yanote-js test -- src/cli.test.ts && node --test scripts/release/analyzer-standalone.contract.test.mjs scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` | 0 | ✅ pass | 8773ms |
| 3 | `./gradlew :yanote-gradle-plugin:test && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 16956ms |
| 4 | `bash scripts/ci/verify-m016-s01-standalone-analyzer.sh` | 127 | ❌ fail | 6ms |
| 5 | `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 1 | ❌ fail | 179189ms |


## Deviations

Kept `distNodeAnalyzer` / `distAll` intact for downstream slices and added the standalone bundle contract alongside the legacy internal seam instead of rewiring all consumers in T01. Reused shared Gradle install/build tasks to avoid repeated `yanote-js` reinstalls on the new staging path.

## Known Issues

`scripts/ci/verify-m016-s01-standalone-analyzer.sh` is still missing and belongs to T04. The docs verifier stack remains red before the later docs task; a focused rerun of `bash scripts/docs/verify-s02-analysis-path.sh` failed with `Expected exactly 4 recorded events, got 8`, which is outside T01’s standalone bundle changes.

## Files Created/Modified

- `build.gradle.kts`
- `yanote-js/bin/yanote`
- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/version.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.test.ts`
- `scripts/release/analyzer-standalone.contract.test.mjs`
- `.gsd/milestones/M016/slices/S01/tasks/T01-SUMMARY.md`


## Deviations
Kept `distNodeAnalyzer` / `distAll` intact for downstream slices and added the standalone bundle contract alongside the legacy internal seam instead of rewiring all consumers in T01. Reused shared Gradle install/build tasks to avoid repeated `yanote-js` reinstalls on the new staging path.

## Known Issues
`scripts/ci/verify-m016-s01-standalone-analyzer.sh` is still missing and belongs to T04. The docs verifier stack remains red before the later docs task; a focused rerun of `bash scripts/docs/verify-s02-analysis-path.sh` failed with `Expected exactly 4 recorded events, got 8`, which is outside T01’s standalone bundle changes.
