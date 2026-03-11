---
id: S04
parent: M001
milestone: M001
provides:
  - Stable `yanoteReport` and `yanoteCheck` plugin task contract with opt-in check wiring
  - Deterministic multi-module discovery, exclusion, and aggregate orchestration
  - Report/check wrapper task types that preserve CLI option semantics and profile precedence
  - GitHub Actions workflow with stable `build-and-test` and `yanote-validation` required-check job names
  - Concise deterministic GitHub summary rendering with CLI-parity metrics, fail reason, and top-5 issue ordering
  - Failure-path artifact retention flow with deterministic file naming and bounded explicit override inputs
  - Branch-aware CI topology with PR fast-path required checks and main/release full v1 e2e hardening
  - Explicit Java 21 runtime guard in required checks with actionable mismatch diagnostics
  - Branch-protection configuration contract documenting stable required-check names and merge queue behavior
  - GitHub `yanote-validation` now delegates execution to a rooted Gradle `yanoteCheck` helper path.
  - Workflow contract tests now fail if direct CLI-only validation returns or Gradle parity wiring disappears.
  - Existing always-on summary/artifact triage flow remains intact with deterministic exit/log capture.
requires: []
affects: []
key_files: []
key_decisions:
  - "Treat `yanoteReport`/`yanoteCheck` names and extension fields as a locked v1 compatibility surface."
  - "Use root aggregate tasks plus per-module tasks, with deterministic path-sorted dependencies and module excludes."
  - "Implement wrappers as thin CLI transport with precedence override > policy file > defaults, and keep strictness split (`report` non-blocking, `check` fail-closed)."
  - "Freeze required-check job names (`build-and-test`, `yanote-validation`) and include `merge_group` to keep merge-queue reporting deterministic."
  - "Render GitHub summary from report artifacts with deterministic issue ranking and a strict top-5 cap to preserve single-screen readability."
  - "Capture validation exit code explicitly, always collect/upload deterministic artifacts, and enforce final job outcome from the captured exit."
  - "Kept branch-protection required checks locked to `build-and-test` and `yanote-validation` while adding `v1-e2e` only for push main/release flows."
  - "Used explicit `scripts/ci/assert-java21.sh` enforcement after `actions/setup-java` so runtime mismatches fail early with concrete remediation."
  - "Reset compose volumes and switched report installation to `npm ci` to eliminate stale-marker races across repeated e2e runs."
  - "Use a dedicated helper script to run `distNodeAnalyzer` plus rooted `yanoteCheck` and preserve existing log/exit artifact contract files."
  - "Keep `yanote-validation` triage sequence unchanged (`collect`, `render`, `upload`, `enforce` under `always()`) while only swapping the validation execution path."
patterns_established:
  - "Plugin task contracts validated through Gradle TestKit functional tests."
  - "Wrapper task command construction uses deterministic option ordering mapped to existing CLI flags only."
  - "Use RED/GREEN contract tests for CI workflow and helper transport scripts before implementation."
  - "Always-on artifact retention (`if: always()`) paired with stable artifact names for failure-path triage."
  - "Use RED/GREEN contract tests for workflow topology and CI helper scripts before implementation."
  - "Treat CI transport nondeterminism as a fixable bug and harden scripts/compose defaults for repeatability."
  - "CI workflow contract tests explicitly assert both positive parity wiring and negative direct-CLI bypass constraints."
  - "Rooted Gradle parity execution is isolated in reusable scripts/ci helpers for future CI evolution."
observability_surfaces: []
drill_down_paths: []
duration: 3 min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# S04: Java Build And Ci Delivery Surfaces

**# Phase 4 Plan 1: Gradle Delivery Surface Summary**

## What Happened

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

# Phase 4 Plan 2: GitHub CI Delivery Surface Summary

**Shipped a deterministic GitHub Checks delivery channel with stable job names, concise top-5 summary rendering, and failure-path artifact retention aligned to existing CLI/report semantics.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-04T16:48:35Z
- **Completed:** 2026-03-04T16:58:24Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `.github/workflows/yanote-ci.yml` with stable required-check job names (`build-and-test`, `yanote-validation`) and Java 21 pinning.
- Added `merge_group` support and bounded `workflow_dispatch` overrides (policy path, threshold knobs, critical operations, exclusions) aligned to existing Gradle/CLI controls.
- Implemented `scripts/ci/render-yanote-summary.mjs` to render concise GitHub summary content with deterministic fail reason and top-5 issue ordering.
- Implemented `scripts/ci/collect-yanote-artifacts.sh` to retain deterministic report/diagnostic bundles even when validation fails.
- Added contract tests for workflow and helper scripts to keep summary and artifact surfaces stable over future changes.

## Task Commits

Each task was committed atomically via RED/GREEN TDD commits:

1. **Task 1: Add GitHub workflow with two stable required-check job surfaces**
   - `969dff1` (`test`): failing workflow contract tests for job names, triggers, and Java 21 pinning
   - `380bfca` (`feat`): initial `yanote-ci` workflow with stable job names and Gradle check contract invocation
2. **Task 2: Implement concise GitHub summary renderer with deterministic top-5 issue ordering**
   - `72e1b1a` (`test`): failing summary renderer contract tests
   - `c4eead9` (`feat`): deterministic summary renderer implementation with actionable failure handling
3. **Task 3: Add deterministic artifact bundle publication with failure-path retention**
   - `0bfbb30` (`test`): failing artifact collector contract tests
   - `8b0a10f` (`feat`): artifact collection helper + workflow hardening for always-on upload and bounded overrides

## Files Created/Modified

- `.github/workflows/yanote-ci.yml` - stable two-check workflow, bounded overrides, summary rendering, always-on artifact upload, and explicit exit enforcement.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` - workflow contract tests for required job names, merge-group trigger, and Java 21 pinning.
- `scripts/ci/render-yanote-summary.test.mjs` - summary renderer contract tests for top-5 ordering, concise output, and actionable failure mode.
- `scripts/ci/render-yanote-summary.mjs` - GitHub summary renderer implementation used by workflow.
- `scripts/ci/collect-yanote-artifacts.test.mjs` - artifact collector contract tests for deterministic naming and no-snapshot manifests.
- `scripts/ci/collect-yanote-artifacts.sh` - deterministic artifact bundle collector script used on success and failure paths.

## Decisions Made

- Kept GitHub PR feedback contract centered on Checks status, concise `GITHUB_STEP_SUMMARY`, and retained artifacts (without PR comment surfaces).
- Defaulted workflow validation execution to strict CI profile and only exposed an explicit bounded override set.
- Chose deterministic artifact naming inside a single uploaded bundle to preserve machine and human triage parity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added explicit contract tests for workflow and artifact collector transport surfaces**
- **Found during:** Task 1 and Task 3 RED phases
- **Issue:** Plan tasks were marked `tdd="true"` but did not provide explicit test files for workflow/artifact transport contracts; without tests, required-check and artifact naming guarantees could regress silently.
- **Fix:** Added dedicated Node contract tests for workflow check-surface stability and artifact collector deterministic output.
- **Files modified:** `scripts/ci/yanote-ci-workflow.contract.test.mjs`, `scripts/ci/collect-yanote-artifacts.test.mjs`
- **Verification:** `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` and `node --test scripts/ci/collect-yanote-artifacts.test.mjs` pass.
- **Committed in:** `969dff1`, `0bfbb30`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** No scope creep; additions were required to uphold deterministic CI contract guarantees under the plan's TDD requirement.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DELV-03 and QUAL-03 delivery surfaces are now available in repository CI configuration and script contracts.
- Ready for `04-03-PLAN.md` hardening work on broader merge-blocking topology and full main/release validation flows.

## Self-Check: PASSED

- Verified all declared key files exist on disk.
- Verified all Task 1/2/3 RED/GREEN commit hashes resolve in git history.

---
*Phase: 04-java-build-and-ci-delivery-surfaces*
*Completed: 2026-03-04*

# Phase 4 Plan 3: Merge-Blocking CI Hardening Summary

**Shipped branch-aware merge-blocking CI with stable required checks, explicit Java 21 runtime enforcement, and deterministic full v1 e2e execution for main/release flows.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-03-04T17:02:58Z
- **Completed:** 2026-03-04T17:33:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Extended `.github/workflows/yanote-ci.yml` so PR and merge queue runs stay on the fast required-check path while pushes to `main`/`release/**` run additional full `v1-e2e` validation.
- Added `scripts/ci/run-v1-e2e.sh` for deterministic compose execution, artifact capture, stale-state cleanup, and report-container exit propagation.
- Added `scripts/ci/assert-java21.sh` and wired it into both required jobs to fail fast with actionable `actions/setup-java` remediation guidance.
- Published `.github/BRANCH_PROTECTION.md` with exact required-check names, trigger mapping, and merge queue configuration notes.

## Task Commits

Each task was committed atomically via TDD where required:

1. **Task 1: Extend workflow to enforce PR fast path and main/release full e2e path**
   - `747235b` (`test`): failing workflow + e2e wrapper contracts
   - `5367954` (`feat`): branch-aware workflow topology and initial e2e wrapper implementation
   - `e0c8b65` (`fix`): deterministic rerun hardening for compose e2e flow
2. **Task 2: Enforce Java 21 baseline in all required jobs with explicit mismatch diagnostics**
   - `8e4fc2f` (`test`): failing Java baseline workflow/script contracts
   - `1ccac17` (`feat`): assert-java21 script and required-job enforcement wiring
3. **Task 3: Publish branch-protection required-check contract for merge blocking**
   - `09c2451` (`docs`): required-check and merge queue contract documentation

## Files Created/Modified

- `.github/workflows/yanote-ci.yml` - branch-aware trigger split, required-job Java assertions, and main/release e2e gating.
- `scripts/ci/run-v1-e2e.sh` - compose orchestration wrapper with deterministic command shape, artifact capture, and stale-volume reset.
- `scripts/ci/assert-java21.sh` - runtime major-version guard with actionable setup-java diagnostics.
- `.github/BRANCH_PROTECTION.md` - branch protection required-check contract and merge queue notes.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` - expanded workflow contract coverage for push topology and Java assertion wiring.
- `scripts/ci/run-v1-e2e.contract.test.mjs` - contract tests for deterministic compose execution wrapper behavior.
- `scripts/ci/assert-java21.contract.test.mjs` - contract tests for Java baseline assertion script behavior.
- `examples/docker-compose.yml` - extended marker wait controls and `npm ci` use for deterministic e2e container reruns.

## Decisions Made

- Kept required check names immutable (`build-and-test`, `yanote-validation`) and introduced `v1-e2e` as a non-required PR check that only runs on main/release pushes.
- Enforced Java runtime baseline via explicit script invocation rather than relying only on setup-java configuration intent.
- Hardened compose reruns by combining explicit wait controls, stale-volume cleanup, and deterministic dependency install mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed non-deterministic compose e2e verification failures**
- **Found during:** Plan verification after Task 3
- **Issue:** Initial e2e run failed under cold-start timing (marker timeout), and subsequent reruns could fail with stale marker files causing premature `tests` completion and non-report exit codes.
- **Fix:** Increased marker wait controls in compose, switched report dependency install to `npm ci`, and reset compose volumes at wrapper start/end while preserving copied artifacts.
- **Files modified:** `examples/docker-compose.yml`, `scripts/ci/run-v1-e2e.sh`
- **Verification:** `bash scripts/ci/run-v1-e2e.sh` passes in repeated executions.
- **Committed in:** `e0c8b65`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was required to satisfy deterministic full e2e verification criteria; no scope creep beyond reliability hardening.

## Authentication Gates

None.

## Issues Encountered

- Cold-start and stale-marker compose behavior initially produced non-deterministic e2e outcomes; resolved via the auto-fixed bug hardening above.

## User Setup Required

Manual GitHub configuration is required:
- Configure protected branches to require `build-and-test` and `yanote-validation`.
- If merge queue is enabled, verify `merge_group` runs report both required checks.
- Follow `.github/BRANCH_PROTECTION.md` for exact setup details.

## Next Phase Readiness

- Phase 04 plan execution is complete and branch-protection CI contracts are now explicit and merge-blocking ready.
- Ready to transition into Phase 05 planning/execution with hardened delivery-surface guarantees in place.

## Self-Check: PASSED

- Verified all declared key files exist on disk.
- Verified all Task 1/2/3 and deviation commit hashes resolve in git history.

---
*Phase: 04-java-build-and-ci-delivery-surfaces*
*Completed: 2026-03-04*

# Phase 4 Plan 4: Gradle CI Parity Rewire Summary

**Rewired `yanote-validation` to execute a rooted Gradle `yanoteCheck` path via helper script while preserving deterministic always-on failure triage outputs.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T17:57:12Z
- **Completed:** 2026-03-04T18:00:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added parity-focused contract assertions that fail when `yanote-validation` stops delegating to Gradle `yanoteCheck` execution.
- Added `scripts/ci/run-yanote-gradle-check.sh` to run `distNodeAnalyzer` and rooted `yanoteCheck`, then emit deterministic command/log/exit artifacts.
- Rewired `.github/workflows/yanote-ci.yml` so validation execution is helper-driven while `collect`, `render`, `upload`, and `enforce` remain always-on triage steps.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock the gap as failing CI contract tests before workflow rewiring** - `898c0d2` (test)
2. **Task 2: Rewire `yanote-validation` to execute rooted aggregate Gradle `yanoteCheck` while preserving always-on triage** - `eac7cec` (feat)

## Files Created/Modified

- `scripts/ci/run-yanote-gradle-check.sh` - CI helper that executes rooted Gradle parity path and records deterministic validation artifacts.
- `.github/workflows/yanote-ci.yml` - validation job now delegates to helper script instead of direct CLI invocation.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` - contract guards for helper delegation, explicit Gradle `yanoteCheck` execution, direct-CLI bypass prevention, and triage retention.

## Decisions Made

- Executed parity validation through a dedicated helper script so workflow YAML remains concise while command/log/exit recording stays deterministic.
- Kept the existing failure-triage pipeline untouched and swapped only the validation execution path to minimize CI behavior drift.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored missing optional Rollup binary dependency for Node verification**
- **Found during:** Plan-level verification
- **Issue:** `npm -C yanote-js test` failed with missing optional dependency `@rollup/rollup-darwin-arm64`, blocking completion of required verification checks.
- **Fix:** Ran `npm -C yanote-js ci` to restore complete dependency graph and retried verification.
- **Files modified:** none (dependency installation only; no tracked file changes)
- **Verification:** Re-ran full verification suite (`workflow contracts`, `collector contracts`, `./gradlew test`, `npm -C yanote-js test`) successfully.
- **Committed in:** N/A (no repository file changes)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocking fix was required to complete mandated verification and did not introduce scope creep.

## Authentication Gates

None.

## Issues Encountered

- Initial full verification failed due a missing optional Rollup binary dependency in local `yanote-js` installation; resolved with `npm -C yanote-js ci`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 parity blocker is now closed in code contracts: workflow validation delegates to rooted Gradle `yanoteCheck` path and rejects direct CLI-only bypass.
- Always-on summary/artifact triage behavior remains stable, so branch-protection required checks retain deterministic failure diagnostics.
- Ready for Phase 5 planning/execution.

## Self-Check: PASSED

- Verified `.planning/phases/04-java-build-and-ci-delivery-surfaces/04-04-SUMMARY.md` exists on disk.
- Verified task commit hashes `898c0d2` and `eac7cec` resolve in git history.

---
*Phase: 04-java-build-and-ci-delivery-surfaces*
*Completed: 2026-03-04*
