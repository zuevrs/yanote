---
id: T03
parent: S01
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/ci/run-yanote-gradle-check.sh", "scripts/ci/yanote-ci-workflow.contract.test.mjs", "yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt", "yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/AnalyzerCommandSupport.kt", "yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt", "yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt", "yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt", "yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt", "yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteStandaloneBundleContractTest.kt", ".gsd/DECISIONS.md", ".gsd/KNOWLEDGE.md"]
key_decisions: ["D018: Default Gradle and CI analyzer execution to the standalone launcher contract.", "Persist analyzer_path and analyzer_contract inside yanote-*-command.args so launcher-vs-override drift is inspectable from retained artifacts."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed the task-plan verifier stack with ./gradlew :yanote-gradle-plugin:test, bash scripts/ci/run-yanote-gradle-check.sh, node --test scripts/ci/yanote-ci-workflow.contract.test.mjs, and the exact combined command from the plan. Also verified failure modes by confirming a raw-cjs helper override exits 2 with a malformed-override error, a missing default launcher exits 2 with standalone bundle guidance in .yanote-ci/t03-missing-launcher/yanote-validation.stderr.log, and the retained command surfaces now point to distStandaloneAnalyzer plus the standalone launcher path."
completed_at: 2026-03-28T22:47:40.082Z
blocker_discovered: false
---

# T03: Routed Gradle and CI analyzer validation through the standalone launcher contract and removed the raw yanote.cjs seam from the default path.

> Routed Gradle and CI analyzer validation through the standalone launcher contract and removed the raw yanote.cjs seam from the default path.

## What Happened
---
id: T03
parent: S01
milestone: M016
key_files:
  - scripts/ci/run-yanote-gradle-check.sh
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/AnalyzerCommandSupport.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteStandaloneBundleContractTest.kt
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - D018: Default Gradle and CI analyzer execution to the standalone launcher contract.
  - Persist analyzer_path and analyzer_contract inside yanote-*-command.args so launcher-vs-override drift is inspectable from retained artifacts.
duration: ""
verification_result: passed
completed_at: 2026-03-28T22:47:40.083Z
blocker_discovered: false
---

# T03: Routed Gradle and CI analyzer validation through the standalone launcher contract and removed the raw yanote.cjs seam from the default path.

**Routed Gradle and CI analyzer validation through the standalone launcher contract and removed the raw yanote.cjs seam from the default path.**

## What Happened

Switched the Gradle plugin defaults and the CI helper from dist/node-analyzer/bin/yanote.cjs to the standalone launcher at dist/standalone-analyzer/bin/yanote. Added shared launcher-aware analyzer path resolution so Gradle tasks execute launchers directly, keep non-legacy JS overrides working for focused tests/shims, and reject directory or raw yanote.cjs overrides as malformed. Updated check/report diagnostics plus command-args surfaces so missing-launcher guidance points at ./gradlew distStandaloneAnalyzer and retained args now publish analyzer_path and analyzer_contract. Extended plugin and CI contract tests to cover the new default path, override behavior, remote-spec flows, and malformed helper overrides.

## Verification

Passed the task-plan verifier stack with ./gradlew :yanote-gradle-plugin:test, bash scripts/ci/run-yanote-gradle-check.sh, node --test scripts/ci/yanote-ci-workflow.contract.test.mjs, and the exact combined command from the plan. Also verified failure modes by confirming a raw-cjs helper override exits 2 with a malformed-override error, a missing default launcher exits 2 with standalone bundle guidance in .yanote-ci/t03-missing-launcher/yanote-validation.stderr.log, and the retained command surfaces now point to distStandaloneAnalyzer plus the standalone launcher path.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-gradle-plugin:test` | 0 | ✅ pass | 5427ms |
| 2 | `bash scripts/ci/run-yanote-gradle-check.sh` | 0 | ✅ pass | 6637ms |
| 3 | `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 166ms |
| 4 | `./gradlew :yanote-gradle-plugin:test && bash scripts/ci/run-yanote-gradle-check.sh && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 4824ms |
| 5 | `YANOTE_ANALYZER_PATH=yanote-js/dist/yanote.cjs bash scripts/ci/run-yanote-gradle-check.sh` | 2 | ✅ pass | 13ms |
| 6 | `YANOTE_CI_DIR=.yanote-ci/t03-missing-launcher YANOTE_SKIP_DIST_STANDALONE_ANALYZER=true bash scripts/ci/run-yanote-gradle-check.sh` | 2 | ✅ pass | 23ms |
| 7 | `rg -n 'YANOTE_ANALYZER_PATH=|distStandaloneAnalyzer|analyzer_contract=standalone-launcher|analyzer_path=.*/dist/standalone-analyzer/bin/yanote' .yanote-ci/yanote-command.txt build/yanote/aggregate/check/yanote-check-command.args` | 0 | ✅ pass | 33ms |


## Deviations

Added a small shared Kotlin helper (AnalyzerCommandSupport.kt) to centralize launcher-aware execution and override validation, and kept non-legacy JS overrides executable via node for focused tests/custom shims while rejecting the legacy raw yanote.cjs seam.

## Known Issues

None in the T03 surface. Slice-level verification remains intentionally incomplete until T04/T05 land their planned verifiers.

## Files Created/Modified

- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/AnalyzerCommandSupport.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteStandaloneBundleContractTest.kt`
- `.gsd/DECISIONS.md`
- `.gsd/KNOWLEDGE.md`


## Deviations
Added a small shared Kotlin helper (AnalyzerCommandSupport.kt) to centralize launcher-aware execution and override validation, and kept non-legacy JS overrides executable via node for focused tests/custom shims while rejecting the legacy raw yanote.cjs seam.

## Known Issues
None in the T03 surface. Slice-level verification remains intentionally incomplete until T04/T05 land their planned verifiers.
