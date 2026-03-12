# T04: 01-specification-semantics-contract 04

**Slice:** S01 — **Milestone:** M001

## Description

Implement deterministic Java event matcher and coverage integration on top of semantic extraction contract.

Purpose: Deliver Java-side SPEC-03 matching behavior and SPEC-02 ambiguity/unmatched diagnostics propagation.
Output: `OperationMatcher`, coverage wiring, and fixture-backed Java tests for exact/fallback/ambiguous semantics.

## Must-Haves

- [ ] "Java core maps HTTP events deterministically with exact-first then same-method template fallback."
- [ ] "Ambiguous and unmatched Java matches emit actionable diagnostics rather than heuristic auto-selection."
- [ ] "Java coverage output retains semantic diagnostics required for fail-closed downstream policy decisions."

## Files

- `yanote-core/src/main/java/dev/yanote/core/openapi/OperationMatcher.java`
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageCalculator.java`
- `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageReport.java`
- `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java`
- `yanote-core/src/test/java/dev/yanote/core/coverage/CoverageCalculatorTest.java`
- `yanote-core/src/test/resources/openapi/semantics/ambiguous-template.yaml`
