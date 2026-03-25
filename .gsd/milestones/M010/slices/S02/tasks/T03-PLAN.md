---
estimated_steps: 4
estimated_files: 6
skills_used:
  - vitest
  - test
  - json-schema-validator
---

# T03: Serialize HTTP core conformance into the report contract

**Slice:** S02 — HTTP Core Contract Completeness In Report And Gates
**Milestone:** M010

## Description

Expose the new HTTP core truth through the stable report contract. This task adds deterministic JSON report surfaces for undeclared statuses, parameter-value drift, and response-header drift without renaming or redefining the legacy coverage section that existing consumers already trust.

## Steps

1. Extend `yanote-js/src/report/report.ts` so it accepts the aggregated HTTP core analyzer result and emits an additive `httpCoreConformance` section with summary, per-operation state, and typed diagnostics.
2. Update `yanote-js/src/report/schema.ts` so the new report section is schema-validated and compatible with deterministic normalization.
3. Update `yanote-js/src/report/normalize.ts` so the new section sorts per-operation entries and diagnostics deterministically.
4. Pin the new contract in report tests, report contract tests, and byte-stability tests before gate/CLI work consumes it.

## Must-Haves

- [ ] `yanote-report.json` exposes undeclared status, parameter-value, and response-header drift as an additive supported section instead of overloading legacy coverage fields.
- [ ] The new report section is schema-validated and normalized deterministically.
- [ ] Existing coverage and HTTP payload report surfaces remain intact while the new section lands beside them.

## Verification

- `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts`
- `npm -C yanote-js test -- src/report/report.contract.test.ts -t "httpCoreConformance"`

## Inputs

- `yanote-js/src/coverage/httpCoreConformance.ts` — aggregated analyzer output from T02.
- `yanote-js/src/report/report.ts` — current report builder that only knows legacy coverage and HTTP payload conformance.
- `yanote-js/src/report/schema.ts` — current JSON schema contract for `yanote-report.json`.
- `yanote-js/src/report/normalize.ts` — deterministic ordering logic for report serialization.

## Expected Output

- `yanote-js/src/report/report.ts` — additive `httpCoreConformance` section wired into report generation.
- `yanote-js/src/report/schema.ts` — schema entries for the new HTTP core report surface.
- `yanote-js/src/report/normalize.ts` — deterministic sort/normalization for HTTP core summaries and diagnostics.
- `yanote-js/src/report/report.test.ts` — focused report-builder coverage for the new section.
- `yanote-js/src/report/report.contract.test.ts` — contract tests proving the new report shape is serialized consistently.
- `yanote-js/src/report/writeReport.determinism.test.ts` — byte-stability coverage that includes the new section.

## Observability Impact

- Runtime signals: `yanote-report.json` gains an additive `httpCoreConformance` section with deterministic summaries, per-operation verdicts, and typed diagnostics for undeclared statuses, parameter-value drift, and response-header drift.
- Inspection surfaces: `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/report.contract.test.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`, and any retained report fixture emitted during the focused verification commands.
- Failure visibility: report serialization failures should make the missing or malformed `httpCoreConformance` field obvious at the schema-validation layer, and deterministic-order regressions should surface as stable snapshot/byte-diff failures rather than ambiguous object-order churn.
