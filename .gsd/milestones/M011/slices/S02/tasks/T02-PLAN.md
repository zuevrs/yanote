---
estimated_steps: 3
estimated_files: 3
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T02: Validate supported repeated query arrays and unsupported request semantics in the analyzer

**Slice:** S02 — Supported Serialization Subset And Cookie Conformance
**Milestone:** M011

## Description

Turn the declared support matrix into honest observed truth. This task teaches the analyzer to validate supported repeated query arrays while keeping ambiguous or unavailable evidence explicit instead of guessed.

## Steps

1. Teach `yanote-js/src/coverage/httpRequestConformance.ts` to validate both supported scalar values and supported repeated query arrays using retained ordered `values[]`, while preserving existing redacted/omitted handling.
2. Emit explicit unsupported diagnostics when observed evidence hits unsupported declared contracts or ambiguous retained shapes, and keep reasons/messages specific enough for gate/CLI reuse.
3. Update focused analyzer/report contract tests so supported repeated query arrays can become captured-valid/captured-invalid while unsupported constructs still stay unsupported without changing aggregate coverage numerators.

## Must-Haves

- [ ] Supported repeated query arrays can pass or fail based on item-schema validation against the retained ordered `values[]`.
- [ ] Unsupported request contracts still produce deterministic unsupported diagnostics with retained values only in `yanote-report.json`.
- [ ] Summary counts remain additive and deterministic across the existing `httpRequestConformance` surface.

## Inputs

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`

## Expected Output

- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`

## Verification

- `npm -C yanote-js test -- src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts`

## Observability Impact

- Signals added/changed: request-conformance diagnostics now separate supported repeated-query validation from unsupported serialization contracts.
- How a future agent inspects this: run the focused Vitest files and inspect `httpRequestConformance.diagnostics` in `yanote-report.json`.
- Failure state exposed: the failing parameter now shows support shape/reason plus ordered retained values in the JSON artifact.
