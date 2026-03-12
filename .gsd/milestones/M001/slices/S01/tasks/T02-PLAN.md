# T02: 01-specification-semantics-contract 02

**Slice:** S01 — **Milestone:** M001

## Description

Implement the Java semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.

Purpose: Deliver the SPEC-01 and SPEC-02 extraction/diagnostics baseline in `yanote-core` before matcher and coverage wiring.
Output: Java semantic bundle model classes, deterministic canonical extraction flow, and focused diagnostics tests.

## Must-Haves

- [ ] "Java core extracts canonical OpenAPI HTTP operation keys deterministically from identical specs."
- [ ] "Java core emits actionable `invalid` diagnostics for malformed or unsupported spec structures."
- [ ] "Canonical operation dedupe preserves deterministic insertion order after normalization."

## Files

- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiSemantics.java`
- `yanote-core/src/main/java/dev/yanote/core/openapi/SemanticDiagnostic.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiOperationsTest.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java`
- `yanote-core/src/test/resources/openapi/semantics/invalid-openapi.yaml`
