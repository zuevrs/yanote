---
id: S01
parent: M001
milestone: M001
provides:
  - Deterministic Node HTTP semantic extraction with canonical templated-route identity
  - First-class invalid diagnostics surfaced from semantic bundle assembly
  - OpenAPI loader refactored to fail closed on invalid semantic states
  - Java semantic bundle contract with canonical operations and diagnostics
  - Deterministic Java canonical route normalization for equivalent template dedupe
  - Loader flow that publishes parser and semantic diagnostics together
  - Deterministic exact-first then template-fallback Node event matching
  - Explicit ambiguous/unmatched diagnostics in Node coverage computation
  - CLI fail-closed policy for invalid/ambiguous semantic diagnostics
  - Deterministic Java exact-first/template-fallback operation matcher
  - Coverage calculation delegated to matcher semantics instead of heuristic exact-only matching
  - CoverageReport propagation of ambiguous/unmatched diagnostics for downstream fail-closed policy
  - Single shared fixture corpus for semantic extraction and matching parity
  - Node parity adapter tests that validate every shared fixture case
  - Java parity adapter tests that validate every shared fixture case
requires: []
affects: []
key_files: []
key_decisions:
  - "Use METHOD + normalized templated route ({param}) as canonical Node operation identity."
  - "Fail closed in loadOpenApiOperations when semantic bundle includes invalid diagnostics."
  - "OpenApiLoader.loadSemantics now merges diagnostics from raw source inspection and parser messages."
  - "Java canonical templated routes normalize parameter names to {param} before dedupe."
  - "Template fallback candidate ordering follows deterministic operation insertion order."
  - "CLI report treats invalid/ambiguous diagnostics as blocking with explicit non-zero exit."
  - "OperationMatcher emits ambiguous/unmatched diagnostics and never auto-selects among multiple fallback candidates."
  - "CoverageReport now carries semantic diagnostics for downstream fail-closed policy layers."
  - "Shared fixtures encode canonical operations as 'METHOD /route' strings to keep adapters thin and deterministic."
  - "Parity contract requires deterministic sorted ambiguous candidate ordering across runtimes."
patterns_established:
  - "Semantic bundle contract returns operations + diagnostics in deterministic insertion order."
  - "Targeted RED/GREEN commits lock deterministic behavior before extraction refactors."
  - "Extraction contracts in Java are represented as immutable records with deterministic ordering."
  - "Fixture-backed semantic diagnostics tests verify deterministic behavior across repeated loads."
  - "Coverage diagnostics are first-class outputs consumed by CLI fail-closed policy."
  - "Matcher behavior is locked by dedicated fallback/ambiguity regression tests."
  - "Matcher contract returns either a single operation or diagnostics, never both."
  - "Coverage processing records suites only for matcher-approved operations."
  - "Parity tests assert complete caseId coverage so fixture drift cannot silently skip scenarios."
  - "Java parity adapter enriches empty operation objects with minimal responses for parser-valid synthetic specs."
observability_surfaces: []
drill_down_paths: []
duration: 6min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# S01: Specification Semantics Contract

**# Phase 1 Plan 01: TypeScript semantic extraction and diagnostics Summary**

## What Happened

# Phase 1 Plan 01: TypeScript semantic extraction and diagnostics Summary

**Deterministic Node OpenAPI semantic extraction now emits canonical keys and explicit invalid diagnostics through a fail-closed bundle contract.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T08:41:40Z
- **Completed:** 2026-03-04T08:43:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added a semantic diagnostics contract with invalid/ambiguous/unmatched kinds for extraction and matching flows.
- Implemented `buildHttpSemantics` to normalize templated routes, dedupe deterministically, and emit contextual invalid diagnostics.
- Refactored OpenAPI extraction to consume semantic bundles and throw on invalid semantics.
- Locked behavior with deterministic diagnostics + canonical extraction tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define Node semantic diagnostics contract and bundle assembly** - `16f0c11` (test), `0c22382` (feat)
2. **Task 2: Refactor OpenAPI extraction entry point onto semantic bundle contract** - `169a59e` (test), `19a6084` (feat)

## Files Created/Modified
- `yanote-js/src/spec/diagnostics.ts` - Semantic diagnostic model for invalid/ambiguous/unmatched states.
- `yanote-js/src/spec/semantics.ts` - Deterministic canonical operation extraction and diagnostics bundle assembly.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` - Regression coverage for invalid diagnostics and deterministic ordering.
- `yanote-js/src/spec/openapi.ts` - OpenAPI loader now delegates to semantic bundle and fails closed on invalid states.
- `yanote-js/src/spec/openapi.test.ts` - Canonical extraction determinism and dedupe assertions.
- `yanote-js/test/fixtures/openapi/simple.yaml` - Added equivalent templated route fixture for dedupe behavior.

## Decisions Made
- Canonical templated route identity in Node normalizes all path parameter names to `{param}`.
- Invalid semantic diagnostics are treated as blocking contract failures in `loadOpenApiOperations`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Node extraction/diagnostics contract is ready for deterministic matcher + CLI fail-closed integration in `01-03`.
- Java-side semantic parity implementation (`01-02`) can proceed in parallel without contract ambiguity.

## Self-Check: PASSED
- Verified required summary and semantic files exist on disk.
- Verified all Task 1/2 commits are present in repository history.

---
*Phase: 01-specification-semantics-contract*
*Completed: 2026-03-04*

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

# Phase 1 Plan 03: TypeScript matcher and CLI fail-closed semantics Summary

**Node coverage now performs deterministic exact-first/template-fallback matching and blocks CLI report success when semantic diagnostics are invalid or ambiguous.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T09:00:05Z
- **Completed:** 2026-03-04T09:03:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added deterministic matcher coverage tests for exact/fallback/ambiguous/unmatched scenarios.
- Implemented two-stage matching in `computeCoverage` with explicit ambiguity and unmatched diagnostics.
- Added `path-to-regexp` for robust template fallback matching.
- Enforced CLI fail-closed behavior for invalid/ambiguous semantic diagnostics with non-zero exit and detailed context.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement deterministic exact-first plus template-fallback coverage matching** - `1d644e1` (test), `40c95de` (feat)
2. **Task 2: Enforce fail-closed semantic behavior in Node CLI report command** - `1e93d73` (test), `588ace3` (feat)

## Files Created/Modified
- `yanote-js/src/coverage/coverage.matching.test.ts` - Deterministic matcher regression tests.
- `yanote-js/src/coverage/coverage.ts` - Exact-first/fallback matcher with ambiguous/unmatched diagnostics.
- `yanote-js/src/cli.ts` - Fail-closed diagnostics gate before successful report write.
- `yanote-js/src/cli.test.ts` - CLI regression coverage for invalid/ambiguous fail-closed behavior.
- `yanote-js/package.json` / `yanote-js/package-lock.json` - Added `path-to-regexp`.

## Decisions Made
- Fallback candidate ordering uses canonical operation insertion order for deterministic ambiguity reporting.
- CLI report command exits with a semantic diagnostics error when `invalid` or `ambiguous` diagnostics are present.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Node matcher and CLI semantics are ready for cross-runtime parity fixture validation in `01-05`.
- Java matcher/coverage work in `01-04` now has a concrete Node parity target for ambiguity/unmatched handling.

## Self-Check: PASSED
- Verified required summary and matcher/CLI files exist on disk.
- Verified all Task 1/2 commits are present in repository history.

---
*Phase: 01-specification-semantics-contract*
*Completed: 2026-03-04*

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
