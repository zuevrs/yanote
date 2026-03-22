# T01: 01-specification-semantics-contract 01

**Slice:** S01 — **Milestone:** M001

## Description

Implement the TypeScript semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.

Purpose: Deliver the SPEC-01 and SPEC-02 extraction/diagnostics baseline before route-matching and CLI wiring.
Output: Deterministic canonical operation extraction, first-class invalid diagnostics, and focused Node tests.

## Must-Haves

- [ ] "Node analyzer emits stable canonical HTTP operation keys for identical OpenAPI input."
- [ ] "Malformed or unsupported OpenAPI operations emit explicit `invalid` diagnostics with path/method context."
- [ ] "Duplicate canonical operation keys are deduplicated deterministically in insertion order."

## Files

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/diagnostics.ts`
- `yanote-js/src/spec/semantics.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/spec/semantics.diagnostics.test.ts`
- `yanote-js/test/fixtures/openapi/simple.yaml`
