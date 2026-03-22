---
id: T04
parent: S01
milestone: M001
provides:
  - Deterministic Java exact-first/template-fallback operation matcher
  - Coverage calculation delegated to matcher semantics instead of heuristic exact-only matching
  - CoverageReport propagation of ambiguous/unmatched diagnostics for downstream fail-closed policy
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# T04: 01-specification-semantics-contract 04

**# Phase 1 Plan 04: Java matcher and coverage diagnostics integration Summary**

## What Happened

# Phase 1 Plan 04: Java matcher and coverage diagnostics integration Summary

**Java coverage now uses a deterministic `OperationMatcher` and propagates ambiguity/unmatched diagnostics through `CoverageReport`.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T09:05:27Z
- **Completed:** 2026-03-04T09:07:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `OperationMatcher` with exact-first then template-fallback matching semantics.
- Locked matcher behavior with fixture-backed tests covering exact, fallback, ambiguous, and unmatched cases.
- Refactored `CoverageCalculator` to delegate matching to `OperationMatcher`.
- Extended `CoverageReport` to expose semantic diagnostics required for fail-closed policy decisions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement deterministic Java exact-first plus template-fallback matcher** - `c74ba37` (test), `9417375` (feat)
2. **Task 2: Wire Java coverage flow to deterministic matcher and diagnostics** - `5684a30` (test), `bd43f2f` (feat)

## Files Created/Modified
- `yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java` - Deterministic Java matcher with diagnostic outcomes.
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java` - Regression tests for exact/fallback/ambiguous/unmatched.
- `yanote-core/src/test/resources/openapi/semantics/ambiguous-template.yaml` - Ambiguity fixture used by matcher tests.
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageCalculator.java` - Coverage now delegates matching and records diagnostics.
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageReport.java` - Added semantic diagnostics field/accessor.
- `yanote-core/src/test/java/dev/yanote/core/coverage/CoverageCalculatorTest.java` - Coverage diagnostics propagation and fallback tests.

## Decisions Made
- Java matcher does not auto-pick fallback winners when multiple template candidates match.
- Coverage report contract now includes semantic diagnostics for explicit downstream policy handling.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Java matcher/coverage behavior now mirrors Node semantics needed for shared parity fixtures in `01-05`.
- Both runtimes can now be validated from a single fixture corpus for canonical keys and match diagnostics.

## Self-Check: PASSED
- Verified required summary and matcher/coverage files exist on disk.
- Verified all Task 1/2 commits are present in repository history.

---
*Phase: 01-specification-semantics-contract*
*Completed: 2026-03-04*
