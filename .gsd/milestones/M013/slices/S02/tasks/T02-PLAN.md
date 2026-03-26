---
estimated_steps: 6
estimated_files: 6
skills_used:
  - vitest
  - json-schema-validator
---

# T02: Extend the canonical HTTP report contract with additive deprecated truth

**Slice:** S02 — Deprecated Operation Truth Without Numerator Drift
**Milestone:** M013

## Description

Expose deprecated-operation truth on the canonical JSON report surface before touching downstream summaries, and keep the HTTP report writer deterministic.

## Steps

1. Update `yanote-js/src/report/report.ts` so the HTTP summary includes an additive `deprecatedOperations` block and `coverage.perOperation[]` entries emit explicit `deprecated` booleans sourced from the canonical coverage metadata.
2. Extend `yanote-js/src/report/schema.ts` and `yanote-js/src/report/normalize.ts` so the new report fields are schema-valid, deterministically ordered, and do not introduce a new coverage dimension or alter existing summary/gate fields.
3. Add focused report and writer tests that pin the deprecated JSON contract, keep `specSource`-based report consumers intact, and prove the uncovered-deprecated fixture still serializes as partial legacy coverage.

## Must-Haves

- [ ] `yanote-report.json` carries explicit deprecated totals/covered/uncovered percent plus per-operation booleans on the HTTP path.
- [ ] Existing legacy summary and coverage numerators stay unchanged by default.
- [ ] Schema validation, normalization, and writer determinism stay green with the new additive fields.

## Verification

- `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/report.test.ts src/report/writeReport.determinism.test.ts`
- The focused report tests prove deprecated fields are additive and the writer still emits deterministic JSON.

## Inputs

- `yanote-js/src/report/report.ts` — canonical HTTP report builder that shapes summary and per-operation output.
- `yanote-js/src/report/schema.ts` — strict JSON schema that must accept every new deprecated field explicitly.
- `yanote-js/src/report/normalize.ts` — deterministic ordering/rounding layer that must preserve the new output shape.
- `yanote-js/src/coverage/coverage.ts` — upstream per-operation deprecated metadata source from T01.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — retained spec fixture for denominator-stability report assertions.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — retained evidence fixture for the report contract proof.

## Expected Output

- `yanote-js/src/report/report.ts` — HTTP report builder with additive deprecated summary/per-operation truth.
- `yanote-js/src/report/schema.ts` — schema contract updated for deprecated summary and per-operation fields.
- `yanote-js/src/report/normalize.ts` — deterministic normalization covering the new deprecated report surface.
- `yanote-js/src/report/report.contract.test.ts` — schema-focused contract tests pinning the additive deprecated JSON shape.
- `yanote-js/src/report/report.test.ts` — report behavior tests proving deprecated truth does not change legacy coverage semantics.
- `yanote-js/src/report/writeReport.determinism.test.ts` — byte-stability tests covering the expanded report DTO.
