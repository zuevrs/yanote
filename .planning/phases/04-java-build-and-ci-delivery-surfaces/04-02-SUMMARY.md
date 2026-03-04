---
phase: 04-java-build-and-ci-delivery-surfaces
plan: 02
subsystem: infra
tags: [github-actions, ci, gradle, node, artifacts]

requires:
  - phase: 04-01
    provides: Stable Gradle `yanoteReport`/`yanoteCheck` wrapper contracts and deterministic check semantics
provides:
  - GitHub Actions workflow with stable `build-and-test` and `yanote-validation` required-check job names
  - Concise deterministic GitHub summary rendering with CLI-parity metrics, fail reason, and top-5 issue ordering
  - Failure-path artifact retention flow with deterministic file naming and bounded explicit override inputs
affects: [04-03, DELV-03, QUAL-03]

tech-stack:
  added: [GitHub Actions workflow, Node.js built-in test runner, Bash artifact collector]
  patterns:
    - "Checks-first PR contract with deterministic summary + artifact surfaces"
    - "Thin transport scripts preserve existing CLI/report semantics without introducing new governance logic"

key-files:
  created:
    - scripts/ci/yanote-ci-workflow.contract.test.mjs
    - scripts/ci/render-yanote-summary.test.mjs
    - scripts/ci/render-yanote-summary.mjs
    - scripts/ci/collect-yanote-artifacts.test.mjs
    - scripts/ci/collect-yanote-artifacts.sh
  modified:
    - .github/workflows/yanote-ci.yml

key-decisions:
  - "Freeze required-check job names (`build-and-test`, `yanote-validation`) and include `merge_group` to keep merge-queue reporting deterministic."
  - "Render GitHub summary from report artifacts with deterministic issue ranking and a strict top-5 cap to preserve single-screen readability."
  - "Capture validation exit code explicitly, always collect/upload deterministic artifacts, and enforce final job outcome from the captured exit."

patterns-established:
  - "Use RED/GREEN contract tests for CI workflow and helper transport scripts before implementation."
  - "Always-on artifact retention (`if: always()`) paired with stable artifact names for failure-path triage."

requirements-completed: [DELV-03, QUAL-03]
duration: 9 min
completed: 2026-03-04
---

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

