---
phase: 04-java-build-and-ci-delivery-surfaces
plan: 04
subsystem: infra
tags: [github-actions, ci, gradle, workflow-contracts, artifact-triage]

requires:
  - phase: 04-01
    provides: Stable Gradle `yanoteCheck` task contract and aggregate output path conventions.
  - phase: 04-02
    provides: Deterministic GitHub summary/artifact triage pipeline in `yanote-validation`.
  - phase: 04-03
    provides: Stable required-check topology and Java 21 required-job enforcement.
provides:
  - GitHub `yanote-validation` now delegates execution to a rooted Gradle `yanoteCheck` helper path.
  - Workflow contract tests now fail if direct CLI-only validation returns or Gradle parity wiring disappears.
  - Existing always-on summary/artifact triage flow remains intact with deterministic exit/log capture.
affects: [DELV-02, DELV-03, QUAL-02, QUAL-03, 05-01]

tech-stack:
  added: [Bash CI helper bootstrap for composite Gradle plugin execution]
  patterns:
    - "Contract-test guardrails first (RED) before workflow rewiring (GREEN)"
    - "Validation execution delegated to helper script while keeping summary/artifact/enforce steps always-on"

key-files:
  created:
    - scripts/ci/run-yanote-gradle-check.sh
  modified:
    - .github/workflows/yanote-ci.yml
    - scripts/ci/yanote-ci-workflow.contract.test.mjs

key-decisions:
  - "Use a dedicated helper script to run `distNodeAnalyzer` plus rooted `yanoteCheck` and preserve existing log/exit artifact contract files."
  - "Keep `yanote-validation` triage sequence unchanged (`collect`, `render`, `upload`, `enforce` under `always()`) while only swapping the validation execution path."

patterns-established:
  - "CI workflow contract tests explicitly assert both positive parity wiring and negative direct-CLI bypass constraints."
  - "Rooted Gradle parity execution is isolated in reusable scripts/ci helpers for future CI evolution."

requirements-completed: [DELV-02, DELV-03, QUAL-02, QUAL-03]
duration: 3 min
completed: 2026-03-04
---

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
