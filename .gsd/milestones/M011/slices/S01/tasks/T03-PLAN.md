---
estimated_steps: 4
estimated_files: 7
skills_used:
  - vitest
  - json-schema-validator
  - test
---

# T03: Publish request evidence and scalar truth in report and CLI surfaces

**Slice:** S01 — Safe Request Evidence And First Scalar Truth
**Milestone:** M011

## Description

Expose the new request-evidence truth on the public analyzer surfaces teams already use. The slice is not done if the conformance logic only exists in memory or in narrow unit tests.

## Steps

1. Add an additive `httpRequestConformance` section to the JSON report with deterministic summary counts, per-operation evidence states, and scalar-truth diagnostics while leaving existing coverage/payload sections intact.
2. Extend report normalization and schema validation so the new section is stable, ordered, and backward-compatible for existing consumers.
3. Update `yanote report` output to print the new request-evidence summary and machine-readable tokens without reclassifying legacy operation/status/parameter percentages.
4. Pin the report/CLI contract with focused tests that assert captured/redacted/omitted evidence visibility and no secret leakage in stdout/report artifacts.

## Must-Haves

- [ ] `yanote-report.json` carries request evidence and scalar truth on a dedicated additive surface.
- [ ] CLI stdout and `YANOTE_SUMMARY` expose the new surface deterministically.
- [ ] Existing coverage numerators and payload conformance output remain stable on pre-S01 fixtures.

## Verification

- Focused report and CLI contract tests prove the new additive request-conformance surface without changing legacy numerators.
- `npm -C yanote-js test -- src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`

## Observability Impact

- Signals added/changed: `yanote-report.json`, CLI stdout, and `YANOTE_SUMMARY` gain deterministic request-conformance counts plus per-parameter evidence/truth visibility.
- How a future agent inspects this: run the focused report/CLI contract tests and inspect the rendered report JSON plus machine summary line.
- Failure state exposed: contract tests identify missing sections, unstable ordering, leaked sensitive values, or mismatched request-conformance counts and tokens.

## Inputs

- `yanote-js/src/model/httpEvent.ts` — widened HTTP event surface carrying retained request evidence.
- `yanote-js/src/events/readJsonl.ts` — normalized event ingestion that must stay backward-compatible on public report paths.
- `yanote-js/src/coverage/httpRequestConformance.ts` — first-scalar request-conformance analyzer output to serialize publicly.
- `yanote-js/src/report/report.ts` — current report builder that needs a new additive section.
- `yanote-js/src/report/schema.ts` — strict report schema that must remain deterministic and additive.
- `yanote-js/src/cli.ts` — current CLI summary surface that needs to expose the new request truth.

## Expected Output

- `yanote-js/src/report/report.ts` — additive report builder support for `httpRequestConformance`.
- `yanote-js/src/report/schema.ts` — schema contract widened for the new request-conformance section.
- `yanote-js/src/report/normalize.ts` — deterministic normalization and ordering for the new surface.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — focused report contract assertions for request evidence and scalar truth.
- `yanote-js/src/cli.ts` — CLI summary output widened for deterministic request-conformance visibility.
- `yanote-js/src/cli.requestEvidence.test.ts` — focused CLI assertions for human-readable request-evidence output.
- `yanote-js/src/cli.summary.contract.test.ts` — machine-summary assertions that the additive tokens remain stable.
