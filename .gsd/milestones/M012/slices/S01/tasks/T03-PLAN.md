---
estimated_steps: 3
estimated_files: 5
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T03: Publish additive httpSecurityConformance report contracts

**Slice:** S01 — Security Semantics Through Report, CLI, And CI
**Milestone:** M012

## Description

Expose the new security truth through stable JSON artifacts without mutating legacy coverage. This task adds a dedicated report section, schema contract, and normalization rules for security conformance.

## Steps

1. Extend `yanote-js/src/report/report.ts` to serialize a dedicated `httpSecurityConformance` section with summary, per-operation, and diagnostics data derived from effective security requirements, conformance results, and governance context.
2. Update `yanote-js/src/report/schema.ts` and `yanote-js/src/report/normalize.ts` so the new section is schema-valid, deterministically sorted, additive to the existing request/payload surfaces, and still reports schema version `1.0.0`.
3. Add focused report contract and determinism tests proving `coverage.*` numerators stay unchanged while security truth surfaces on green, optional/cleared, missing, unavailable, and unsupported fixtures.

## Must-Haves

- [ ] `httpSecurityConformance` is a separate additive section with summary, per-operation, and diagnostics surfaces instead of a mutation of `coverage`.
- [ ] Deterministic ordering is pinned across operations, requirement branches, schemes, and diagnostics.
- [ ] Raw secret values never appear in the new report section, and existing request/payload sections keep their current contract.

## Verification

- Focused report contract tests prove additive security serialization and deterministic normalization.
- `npm -C yanote-js test -- src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts`

## Inputs

- `yanote-js/src/coverage/httpSecurityConformance.ts` — security conformance source data.
- `yanote-js/src/gates/httpSecuritySemantics.ts` — typed governance diagnostics to surface through the report.
- `yanote-js/src/report/report.ts` — current additive HTTP report serializer.
- `yanote-js/src/report/schema.ts` — strict report schema contract.
- `yanote-js/src/report/normalize.ts` — deterministic ordering and rounding rules.

## Expected Output

- `yanote-js/src/report/report.ts` — additive `httpSecurityConformance` section serialized.
- `yanote-js/src/report/schema.ts` — schema updated for the new security section.
- `yanote-js/src/report/normalize.ts` — deterministic sorting added for security data.
- `yanote-js/src/report/report.security.contract.test.ts` — focused report contract coverage.
- `yanote-js/src/report/writeReport.determinism.test.ts` — determinism coverage extended for security output.
