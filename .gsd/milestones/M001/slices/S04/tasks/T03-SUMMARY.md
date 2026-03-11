---
id: T03
parent: S04
milestone: M001
provides:
  - Branch-aware CI topology with PR fast-path required checks and main/release full v1 e2e hardening
  - Explicit Java 21 runtime guard in required checks with actionable mismatch diagnostics
  - Branch-protection configuration contract documenting stable required-check names and merge queue behavior
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 30 min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# T03: 04-java-build-and-ci-delivery-surfaces 03

**# Phase 4 Plan 3: Merge-Blocking CI Hardening Summary**

## What Happened

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
