# T05: 01-specification-semantics-contract 05

**Slice:** S01 — **Milestone:** M001

## Description

Create and enforce a cross-runtime parity fixture contract for Phase 1 semantic behavior.

Purpose: Prevent Java/Node semantic drift and lock deterministic SPEC-01/02/03 behavior before downstream coverage and governance phases depend on it.
Output: Shared parity fixture corpus plus runtime adapter tests that assert equivalent canonical keys and diagnostics.

## Must-Haves

- [ ] "A single parity fixture corpus exists for semantic extraction and matching edge cases."
- [ ] "Node and Java produce equivalent canonical keys and diagnostics for the same parity fixtures."
- [ ] "Parity checks fail deterministically when either runtime drifts from the contract."

## Files

- `test/fixtures/spec-semantics/operation-cases.json`
- `test/fixtures/spec-semantics/matching-cases.json`
- `test/fixtures/spec-semantics/README.md`
- `yanote-js/src/spec/semantics.parity.test.ts`
- `yanote-js/src/coverage/coverage.parity.test.ts`
- `yanote-core/src/test/java/dev/yanote/core/openapi/SemanticParityFixtureTest.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherParityFixtureTest.java`
