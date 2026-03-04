---
phase: 01-specification-semantics-contract
plan: 05
subsystem: testing
tags: [parity, fixtures, node, java]
requires:
  - phase: 01-specification-semantics-contract
    provides: Node and Java semantic extraction/matcher implementations from 01-03 and 01-04
provides:
  - Single shared fixture corpus for semantic extraction and matching parity
  - Node parity adapter tests that validate every shared fixture case
  - Java parity adapter tests that validate every shared fixture case
affects: [phase-transition, governance-baselines, cross-runtime-regression-detection]
tech-stack:
  added: []
  patterns:
    - Shared fixture files are consumed directly by both runtimes without runtime-specific forks
    - Ambiguous candidate lists are normalized into deterministic sorted order across runtimes
key-files:
  created:
    - test/fixtures/spec-semantics/operation-cases.json
    - test/fixtures/spec-semantics/matching-cases.json
    - test/fixtures/spec-semantics/README.md
    - yanote-js/src/spec/semantics.parity.test.ts
    - yanote-js/src/coverage/coverage.parity.test.ts
    - yanote-core/src/test/java/dev/yanote/core/openapi/SemanticParityFixtureTest.java
    - yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherParityFixtureTest.java
  modified:
    - yanote-js/src/coverage/coverage.ts
    - yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java
    - yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java
key-decisions:
  - "Shared fixtures encode canonical operations as 'METHOD /route' strings to keep adapters thin and deterministic."
  - "Parity contract requires deterministic sorted ambiguous candidate ordering across runtimes."
patterns-established:
  - "Parity tests assert complete caseId coverage so fixture drift cannot silently skip scenarios."
  - "Java parity adapter enriches empty operation objects with minimal responses for parser-valid synthetic specs."
requirements-completed: [SPEC-01, SPEC-02, SPEC-03]
duration: 6min
completed: 2026-03-04
---

# Phase 1 Plan 05: Cross-runtime parity fixture contract Summary

**A single shared semantic fixture corpus now drives deterministic parity verification across Node and Java extraction/matching runtimes.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-04T09:09:59Z
- **Completed:** 2026-03-04T09:15:38Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created shared parity fixtures for canonical extraction and deterministic matching under `test/fixtures/spec-semantics`.
- Added Node parity adapter tests that consume shared fixtures directly and validate every `caseId`.
- Added Java parity adapter tests that consume the same shared fixtures and validate every `caseId`.
- Standardized ambiguous-candidate ordering deterministically in both runtimes to prevent parity drift from input order differences.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish a single shared parity fixture corpus** - `297d6ab` (feat)
2. **Task 2: Add TypeScript parity adapter tests against shared fixtures** - `48bbdeb` (test), `176bd57` (feat)
3. **Task 3: Add Java parity adapter tests against shared fixtures** - `09f39fb` (test), `d43fa04` (feat)

## Files Created/Modified
- `test/fixtures/spec-semantics/operation-cases.json` - Shared extraction fixture corpus with expected operations/diagnostics.
- `test/fixtures/spec-semantics/matching-cases.json` - Shared matching fixture corpus covering exact/fallback/ambiguous/unmatched cases.
- `test/fixtures/spec-semantics/README.md` - Fixture schema and determinism contract.
- `yanote-js/src/spec/semantics.parity.test.ts` - Node operation parity adapter.
- `yanote-js/src/coverage/coverage.parity.test.ts` - Node matching parity adapter.
- `yanote-core/src/test/java/dev/yanote/core/openapi/SemanticParityFixtureTest.java` - Java operation parity adapter.
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherParityFixtureTest.java` - Java matching parity adapter.
- `yanote-js/src/coverage/coverage.ts` - Deterministic sorting for ambiguous candidate diagnostics.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java` - Deterministic sorted candidate diagnostics in Java matcher.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java` - Parser-message diagnostics filtered to actionable method-scoped entries for parity consistency.

## Decisions Made
- Shared fixture contract uses `METHOD /route` canonical strings so both runtimes can parse without schema translation drift.
- Ambiguous diagnostics require deterministic sorted candidate ordering regardless of input operation ordering.
- Java parity adapter enriches empty fixture operation objects with minimal `responses` when generating temporary parser inputs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 semantic contract is now protected by shared cross-runtime parity gates.
- Downstream phases can depend on stable canonical extraction/matching behavior with deterministic regression detection.

## Self-Check: PASSED
- Verified required summary, shared fixture, and Node/Java parity adapter files exist on disk.
- Verified all Task 1/2/3 commits are present in repository history.

---
*Phase: 01-specification-semantics-contract*
*Completed: 2026-03-04*
