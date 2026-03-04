---
phase: 01-specification-semantics-contract
plan: 04
subsystem: api
tags: [java, coverage, matcher, diagnostics]
requires:
  - phase: 01-specification-semantics-contract
    provides: Java semantic extraction contract from 01-02
provides:
  - Deterministic Java exact-first/template-fallback operation matcher
  - Coverage calculation delegated to matcher semantics instead of heuristic exact-only matching
  - CoverageReport propagation of ambiguous/unmatched diagnostics for downstream fail-closed policy
affects: [parity-fixtures, governance-gates, cli-reporting]
tech-stack:
  added: []
  patterns:
    - Java matching decisions produce first-class semantic diagnostics
    - Coverage mapping consumes matcher outcomes instead of re-implementing route logic
key-files:
  created:
    - yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java
    - yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java
    - yanote-core/src/test/resources/openapi/semantics/ambiguous-template.yaml
  modified:
    - yanote-core/src/main/java/dev/yanote/core/coverage/CoverageCalculator.java
    - yanote-core/src/main/java/dev/yanote/core/coverage/CoverageReport.java
    - yanote-core/src/test/java/dev/yanote/core/coverage/CoverageCalculatorTest.java
key-decisions:
  - "OperationMatcher emits ambiguous/unmatched diagnostics and never auto-selects among multiple fallback candidates."
  - "CoverageReport now carries semantic diagnostics for downstream fail-closed policy layers."
patterns-established:
  - "Matcher contract returns either a single operation or diagnostics, never both."
  - "Coverage processing records suites only for matcher-approved operations."
requirements-completed: [SPEC-02, SPEC-03]
duration: 2min
completed: 2026-03-04
---

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
