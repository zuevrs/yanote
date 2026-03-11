# S01: Specification Semantics Contract

**Goal:** Implement the TypeScript semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.
**Demo:** Implement the TypeScript semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.

## Must-Haves


## Tasks

- [x] **T01: 01-specification-semantics-contract 01** `est:2min`
  - Implement the TypeScript semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.

Purpose: Deliver the SPEC-01 and SPEC-02 extraction/diagnostics baseline before route-matching and CLI wiring.
Output: Deterministic canonical operation extraction, first-class invalid diagnostics, and focused Node tests.
- [x] **T02: 01-specification-semantics-contract 02** `est:4min`
  - Implement the Java semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.

Purpose: Deliver the SPEC-01 and SPEC-02 extraction/diagnostics baseline in `yanote-core` before matcher and coverage wiring.
Output: Java semantic bundle model classes, deterministic canonical extraction flow, and focused diagnostics tests.
- [x] **T03: 01-specification-semantics-contract 03** `est:4min`
  - Implement deterministic Node event-to-operation matching and fail-closed CLI semantics on top of the extraction contract.

Purpose: Deliver Node-side SPEC-03 matching behavior and SPEC-02 ambiguity/unmatched enforcement for standalone CLI users.
Output: Two-stage deterministic matcher integration, semantic diagnostics propagation, and CLI failure-policy tests.
- [x] **T04: 01-specification-semantics-contract 04** `est:2min`
  - Implement deterministic Java event matcher and coverage integration on top of semantic extraction contract.

Purpose: Deliver Java-side SPEC-03 matching behavior and SPEC-02 ambiguity/unmatched diagnostics propagation.
Output: `OperationMatcher`, coverage wiring, and fixture-backed Java tests for exact/fallback/ambiguous semantics.
- [x] **T05: 01-specification-semantics-contract 05** `est:6min`
  - Create and enforce a cross-runtime parity fixture contract for Phase 1 semantic behavior.

Purpose: Prevent Java/Node semantic drift and lock deterministic SPEC-01/02/03 behavior before downstream coverage and governance phases depend on it.
Output: Shared parity fixture corpus plus runtime adapter tests that assert equivalent canonical keys and diagnostics.

## Files Likely Touched

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/diagnostics.ts`
- `yanote-js/src/spec/semantics.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/spec/semantics.diagnostics.test.ts`
- `yanote-js/test/fixtures/openapi/simple.yaml`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiSemantics.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/SemanticDiagnostic.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiOperationsTest.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java`
- `yanote-core/src/test/resources/openapi/semantics/invalid-openapi.yaml`
- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/src/coverage/coverage.matching.test.ts`
- `yanote-js/src/cli.test.ts`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java`
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageCalculator.java`
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageReport.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java`
- `yanote-core/src/test/java/dev/yanote/core/coverage/CoverageCalculatorTest.java`
- `yanote-core/src/test/resources/openapi/semantics/ambiguous-template.yaml`
- `test/fixtures/spec-semantics/operation-cases.json`
- `test/fixtures/spec-semantics/matching-cases.json`
- `test/fixtures/spec-semantics/README.md`
- `yanote-js/src/spec/semantics.parity.test.ts`
- `yanote-js/src/coverage/coverage.parity.test.ts`
- `yanote-core/src/test/java/dev/yanote/core/openapi/SemanticParityFixtureTest.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherParityFixtureTest.java`
