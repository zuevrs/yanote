---
phase: 04-java-build-and-ci-delivery-surfaces
plan: 01
subsystem: infra
tags: [gradle, java, plugin, ci, yanote]

requires:
  - phase: 03-governance-gates
    provides: deterministic CLI governance and report semantics consumed by Gradle wrappers
provides:
  - Stable `yanoteReport` and `yanoteCheck` plugin task contract with opt-in check wiring
  - Deterministic multi-module discovery, exclusion, and aggregate orchestration
  - Report/check wrapper task types that preserve CLI option semantics and profile precedence
affects: [04-02, 04-03, DELV-03]

tech-stack:
  added: [java-gradle-plugin, gradle-testkit]
  patterns:
    - "Thin wrapper tasks delegate to Node analyzer contract instead of reimplementing governance logic"
    - "Aggregate wiring sorted by project path for deterministic multi-module behavior"

key-files:
  created:
    - yanote-gradle-plugin/build.gradle.kts
    - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt
    - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt
    - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt
    - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt
    - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteTaskExecutionContractTest.kt
  modified:
    - settings.gradle.kts
    - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanoteExtension.kt
    - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt

key-decisions:
  - "Treat `yanoteReport`/`yanoteCheck` names and extension fields as a locked v1 compatibility surface."
  - "Use root aggregate tasks plus per-module tasks, with deterministic path-sorted dependencies and module excludes."
  - "Implement wrappers as thin CLI transport with precedence override > policy file > defaults, and keep strictness split (`report` non-blocking, `check` fail-closed)."

patterns-established:
  - "Plugin task contracts validated through Gradle TestKit functional tests."
  - "Wrapper task command construction uses deterministic option ordering mapped to existing CLI flags only."

requirements-completed: [DELV-02]
duration: 19 min
completed: 2026-03-04
---

# Phase 4 Plan 1: Gradle Delivery Surface Summary

**Delivered a dedicated Gradle plugin module with stable `yanoteReport`/`yanoteCheck` contracts, deterministic multi-module orchestration, and wrapper task types that preserve existing CLI governance semantics.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-04T16:22:22Z
- **Completed:** 2026-03-04T16:41:48Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created `yanote-gradle-plugin` and registered a stable plugin ID (`dev.yanote.gradle`) with a constrained extension DSL surface.
- Implemented deterministic Java subproject discovery, module exclusion filtering, and aggregate root-task orchestration for report/check flows.
- Added report/check wrapper task types that construct deterministic analyzer arguments with precedence `override > policy file > defaults`.
- Enforced strictness split: `yanoteReport` remains non-blocking with diagnostics stubs for missing optional inputs, while `yanoteCheck` fails closed on missing required inputs.
- Locked behavior with contract tests for plugin API, multi-module wiring, and wrapper execution semantics.

## Task Commits

Each task was committed atomically via RED/GREEN TDD commits:

1. **Task 1: Scaffold plugin module and lock contract surface**
   - `2d7f38a` (`test`): failing plugin contract tests + module scaffold
   - `5b7163c` (`feat`): stable task registration, extension surface, opt-in check wiring
2. **Task 2: Multi-module discovery/exclude/aggregate orchestration**
   - `f256ce3` (`test`): failing multi-module wiring contract tests
   - `1f6fa4d` (`feat`): deterministic discovery + aggregate dependency wiring
3. **Task 3: Wrapper execution semantics and defaults split**
   - `7ac2453` (`test`): failing report/check execution contract tests
   - `c86afb9` (`feat`): wrapper task implementations + typed plugin task wiring

## Files Created/Modified

- `settings.gradle.kts` - includes new `yanote-gradle-plugin` module.
- `yanote-gradle-plugin/build.gradle.kts` - plugin module tooling and TestKit/JUnit setup.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanoteExtension.kt` - locked DSL override surface.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` - task registration and aggregate orchestration.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt` - non-blocking local/report-first wrapper behavior.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt` - fail-closed ci/check wrapper behavior.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt` - stable API/contract tests.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt` - discovery/exclusion/aggregate tests.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteTaskExecutionContractTest.kt` - wrapper semantics tests.

## Decisions Made

- Kept Gradle wrappers thin and delegated semantics to existing Node analyzer options rather than re-implementing gate logic in Kotlin.
- Kept lifecycle wiring opt-in (`hookIntoCheck`) to preserve low-friction default adoption.
- Standardized output contracts around aggregate and per-module `build/yanote/...` directories for CI artifact predictability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Deterministic order assertion failed after wrapper-task wiring refactor**
- **Found during:** Task 3 verification (`:yanote-gradle-plugin:test`)
- **Issue:** The multi-module deterministic-order test read `dependsOn` entries as only `Task`/`TaskProvider`, but aggregate wiring now stores dependency collections, causing empty extracted output.
- **Fix:** Updated dependency extraction test helper to recursively flatten iterable/array `dependsOn` entries while preserving order.
- **Files modified:** `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt`
- **Verification:** `./gradlew :yanote-gradle-plugin:test --tests "*YanoteMultiModuleWiringTest"` passes.
- **Committed in:** `c86afb9`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** No scope creep; fix preserved the original deterministic-order contract under updated wiring internals.

## Authentication Gates

None.

## Issues Encountered

- `./gradlew tasks --all` at repo root does not list `yanoteReport`/`yanoteCheck` because this repository currently hosts the plugin as a module but does not auto-apply it to the root build. The delivery-surface contract is verified via plugin functional tests and typed task implementations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DELV-02 delivery surfaces are implemented and covered with deterministic contract tests.
- Ready for `04-02-PLAN.md` (GitHub CI delivery surfaces), with wrapper tasks and output contracts available for workflow integration.

## Self-Check: PASSED

- Verified key created files exist on disk.
- Verified all Task 1/2/3 commit hashes resolve in git history.

---
*Phase: 04-java-build-and-ci-delivery-surfaces*
*Completed: 2026-03-04*
