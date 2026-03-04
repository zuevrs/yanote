---
phase: 01-specification-semantics-contract
plan: 02
subsystem: api
tags: [java, openapi, semantics, diagnostics]
requires:
  - phase: 01-specification-semantics-contract
    provides: canonical semantic contract decisions from phase context
provides:
  - Java semantic bundle contract with canonical operations and diagnostics
  - Deterministic Java canonical route normalization for equivalent template dedupe
  - Loader flow that publishes parser and semantic diagnostics together
affects: [java-matcher, java-coverage, cross-runtime-parity]
tech-stack:
  added: []
  patterns:
    - Java extraction uses OpenApiSemantics to transport operations and diagnostics together
    - Template parameter names normalize to {param} for canonical identity stability
key-files:
  created:
    - yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiSemantics.java
    - yanote-core/src/main/java/dev/yanote/core/openapi/SemanticDiagnostic.java
    - yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java
    - yanote-core/src/test/resources/openapi/semantics/invalid-openapi.yaml
  modified:
    - yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java
    - yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java
    - yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiOperationsTest.java
key-decisions:
  - "OpenApiLoader.loadSemantics now merges diagnostics from raw source inspection and parser messages."
  - "Java canonical templated routes normalize parameter names to {param} before dedupe."
patterns-established:
  - "Extraction contracts in Java are represented as immutable records with deterministic ordering."
  - "Fixture-backed semantic diagnostics tests verify deterministic behavior across repeated loads."
requirements-completed: [SPEC-01, SPEC-02]
duration: 4min
completed: 2026-03-04
---

# Phase 1 Plan 02: Java semantic extraction and diagnostics Summary

**Java OpenAPI extraction now emits deterministic canonical semantic bundles with explicit invalid diagnostics and fail-closed semantics.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T08:54:04Z
- **Completed:** 2026-03-04T08:58:01Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added Java semantic model records (`OpenApiSemantics`, `SemanticDiagnostic`) to unify canonical operations with diagnostics.
- Implemented `OpenApiLoader.loadSemantics` to preserve parser options and publish combined semantic/parser diagnostics.
- Refactored Java extraction onto `extractSemantics` with deterministic canonical route normalization and dedupe.
- Locked behavior using fixture-backed diagnostics tests and semantic extraction contract tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define Java semantic diagnostics and semantic bundle contracts** - `dfa7663` (test), `a82be92` (feat)
2. **Task 2: Refactor Java OpenAPI extraction flow onto semantic bundle contract** - `bb2ba2b` (test), `789b999` (feat)

## Files Created/Modified
- `yanote-core/src/main/java/dev/yanote/core/openapi/SemanticDiagnostic.java` - Java semantic diagnostic record.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiSemantics.java` - Semantic bundle record with invalid-state check.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java` - Semantic loading flow, parser options, and diagnostics aggregation.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java` - Canonical extraction with `{param}` normalization and semantic bundle output.
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java` - Invalid diagnostics and determinism tests.
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiOperationsTest.java` - Semantic-bundle extraction + dedupe behavior tests.
- `yanote-core/src/test/resources/openapi/semantics/invalid-openapi.yaml` - Invalid semantic fixture.

## Decisions Made
- Semantic diagnostics are emitted from both raw spec-shape validation and parser messages to keep path/method context actionable.
- Canonical Java extraction now uses normalized templated routes (`{param}`) so equivalent templates dedupe deterministically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed Java runtime for Gradle verification**
- **Found during:** Task 1 (RED test execution)
- **Issue:** Environment had no Java runtime, so Gradle tests could not run.
- **Fix:** Installed `openjdk@21` via Homebrew and exported `JAVA_HOME`/`PATH` for execution.
- **Files modified:** None (environment/tooling setup only)
- **Verification:** `java -version` returned OpenJDK 21; Gradle task execution resumed successfully.
- **Committed in:** N/A (environment fix)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to unblock deterministic Java verification; no scope creep in product code.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Java semantic bundle contract is ready for matcher/coverage integration in `01-04`.
- Node and Java extraction contracts now align on deterministic canonical identity for parity work in `01-05`.

## Self-Check: PASSED
- Verified required summary and semantic contract files exist on disk.
- Verified all Task 1/2 commits are present in repository history.

---
*Phase: 01-specification-semantics-contract*
*Completed: 2026-03-04*
