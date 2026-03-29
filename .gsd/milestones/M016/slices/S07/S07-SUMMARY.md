---
id: S07
parent: M016
milestone: M016
provides:
  - A stable recorder bootstrap contract for the final S05 public-surface proof: module-backed plugin resolution, no forced refresh, bounded publish retry, deterministic readiness, and aligned maintainer rerun docs.
requires:
  - slice: S06
    provides: The deterministic port-open readiness-based recorder proof baseline inside `S05-06`, including bounded publish retry and stage-local failure localization.
affects:
  []
key_files:
  - test/fixtures/recorder-spring-smoke/settings.gradle.kts
  - scripts/docs/verify-s01-recorder-path.sh
  - scripts/docs/verify-s01-recorder-path.contract.test.mjs
  - docs/maintainers/public-surface-proof.md
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
key_decisions:
  - Pin the recorder smoke fixture's Spring plugins to module coordinates from `mavenLocal()`/`mavenCentral()` and remove verifier-side `--refresh-dependencies` forcing.
  - Keep recorder proof failure handling fail-closed with bounded publish retry, deterministic localhost port-open readiness, and retained bootstrap diagnostics.
  - Pin the maintainer-only S05 rerun leaf to the exact live recorder bootstrap contract so documentation drift fails closed.
patterns_established:
  - For Gradle-backed smoke fixtures in public proof paths, prefer fixture-local `pluginManagement` module mappings to Maven repositories over default Plugin Portal fallback.
  - Pair live verifier hardening with focused contract tests that assert both the success path and the retained failure breadcrumbs.
  - Keep the final public-surface orchestrator thin: stable `S05-0N` stage labels delegate to owner verifiers, while maintainer-only docs describe rerun and diagnostics without leaking into public onboarding surfaces.
observability_surfaces:
  - `scripts/docs/verify-s01-recorder-path.sh` phase-scoped failure output: `ERROR [publish|bootRun|readiness|request|validation]` plus `readiness_port`, `temp_dir`, `gradle_home`, `publish_log`, `app_log`, `events_file`, and `response_file`.
  - `scripts/docs/verify-m016-s05-public-surface.sh` stable `S05-0N` stage labels and exact delegated command lines for first-failure localization.
  - `.yanote-ci/m016-s02-release-pipeline-proof/` retained release-proof bundle, especially `phase-status.txt`, `artifact-manifest.txt`, `tag-context.txt`, and the stage stdout/stderr logs.
drill_down_paths:
  - .gsd/milestones/M016/slices/S07/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S07/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T08:10:23.736Z
blocker_discovered: false
---

# S07: Recorder bootstrap hardening for final public-surface proof

**Recorder smoke proof now boots from module-backed plugin resolution without forced refresh, and the full S05 public-surface gate passes on both a cold run and an immediate rerun.**

## What Happened

S07 closed the last fragile seam in the final public-surface proof: the recorder smoke fixture no longer relies on Gradle Plugin Portal refresh behavior during bootstrap. T01 pinned the smoke fixture's Spring plugins through fixture-local `pluginManagement` resolution from `mavenLocal()` and `mavenCentral()`, removed verifier-side `--refresh-dependencies` forcing, and kept the recorder proof fail-closed with bounded publish retry, deterministic localhost port-open readiness, and retained phase-aware diagnostics (`publish_log`, `app_log`, `events_file`, `response_file`, `readiness_port`, `temp_dir`, `gradle_home`). The focused contract suite now proves both the happy path and the failure surfaces for retry exhaustion, readiness timeout, and early fixture exit.

T02 then aligned the maintainer-only S05 rerun leaf and the S05 contract suite with that exact live bootstrap truth. `docs/maintainers/public-surface-proof.md` now describes the same bootstrap contract the live script implements, while `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` fails closed if maintainer wording drifts or leaks into public onboarding docs. Final slice verification proved the whole public product story still fits together: the focused recorder proof passed, the focused contract suites passed, and `bash scripts/docs/verify-m016-s05-public-surface.sh` passed twice in the same checkout, so the final public boundary, short docs, recorder/analyzer runtime paths, maintainer rerun navigation, and retained release diagnostics are coherent together.

During task execution a fresh-worktree precondition surfaced at S05-07 because `build/distributions/yanote-analyzer.zip` was missing. The task regenerated the documented archive with `./gradlew distStandaloneAnalyzer --stacktrace`, and the final slice closeout verified the exact slice command successfully from the current worktree, including both consecutive S05 runs.

## Verification

Ran the exact slice verifier from the plan and it passed end to end:

- `bash scripts/docs/verify-s01-recorder-path.sh`
- `node --test scripts/docs/verify-s01-recorder-path.contract.test.mjs scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `bash scripts/docs/verify-m016-s05-public-surface.sh`
- `bash scripts/docs/verify-m016-s05-public-surface.sh`

Results:
- Focused recorder proof passed and printed `Recorder proof passed: method=GET route=/orders/{orderId} status=200 ...`.
- The two contract suites passed all 10 tests, including the failure-path assertions for publish retry exhaustion, readiness timeout, and early exit.
- The composed S05 verifier passed twice, reaching `M016 S05 public-surface proof passed...` on both runs.
- `S05-12` retained release-pipeline diagnostics under `.yanote-ci/m016-s02-release-pipeline-proof/`.
- Confirmed the documented analyzer archive exists at `build/distributions/yanote-analyzer.zip` during closeout.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The slice plan's final verification assumed the standalone analyzer archive was already present. During T02 a fresh worktree did not contain `build/distributions/yanote-analyzer.zip`, so the archive had to be regenerated locally with `./gradlew distStandaloneAnalyzer --stacktrace` before rerunning the exact slice verifier.

## Known Limitations

`bash scripts/docs/verify-m016-s05-public-surface.sh` still depends on `build/distributions/yanote-analyzer.zip` already existing when it reaches `S05-07`; the verifier does not self-build or preflight that archive. Also, successful recorder reruns can still emit noisy `rm: Directory not empty` cleanup messages from the temp Gradle-home symlink setup even though the proof itself passes.

## Follow-ups

If a future milestone wants a truly fresh-checkout one-command S05 proof, teach the analyzer runtime stage or its preflight to build or assert `build/distributions/yanote-analyzer.zip` explicitly before `S05-07`. Also consider quieting the temp Gradle-home cleanup path so successful recorder reruns do not print misleading `rm: Directory not empty` noise.

## Files Created/Modified

- `test/fixtures/recorder-spring-smoke/settings.gradle.kts` — Added fixture-local `pluginManagement` repositories and Spring plugin module mappings so smoke bootstrap resolves through `mavenLocal()`/`mavenCentral()` instead of the default Plugin Portal path.
- `scripts/docs/verify-s01-recorder-path.sh` — Removed forced `--refresh-dependencies`, preserved bounded publish retry, kept deterministic port-open readiness, and retained phase-aware bootstrap diagnostics.
- `scripts/docs/verify-s01-recorder-path.contract.test.mjs` — Added fail-closed contract coverage for pinned plugin resolution, retry recovery, retry exhaustion, readiness timeout, and early fixture exit.
- `docs/maintainers/public-surface-proof.md` — Updated the maintainer-only S05 rerun leaf to describe the live recorder bootstrap contract and the retained diagnostics to inspect after cold-run or rerun failures.
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` — Pinned maintainer rerun wording and public-doc silence so recorder-stage doc drift fails closed.
