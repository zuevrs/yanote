---
estimated_steps: 8
estimated_files: 11
skills_used:
  - asyncapi-design
---

# T02: Flow multi-message selection and ambiguity into async coverage, reports, and gates

**Slice:** S03 — AsyncAPI Multi-Message Contract Resolution
**Milestone:** M009

## Description

Carry selected-message metadata and ambiguity failures through async coverage, schema conformance, reports, and gates so users can see which message contract matched or why Yanote refused to choose one.

## Steps

1. Thread selected-message metadata through async coverage and schema-conformance inputs.
2. Decide how ambiguity should affect message coverage, schema validation, and gate status.
3. Add typed diagnostics and failure-order expectations for ambiguity.
4. Reflect the result in async report and CLI surfaces.
5. Add fixture-backed tests for resolvable vs ambiguous multi-message cases.
6. Re-run current async coverage/conformance/report and gate suites.
7. Confirm single-message and header-validation behavior from earlier slices does not regress.
8. Keep counts and deterministic ordering stable for retained artifacts.

## Must-Haves

- [ ] Async coverage/conformance use selected-message metadata when available.
- [ ] Ambiguity is fail-closed and typed across report and gate surfaces.
- [ ] Existing single-message async behavior remains green.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`

## Observability Impact

- Signals added/changed: typed ambiguity diagnostics, selected-message report fields, and async semantic failure ordering.
- How a future agent inspects this: async coverage/conformance/report and gate tests and the async boundary verifier.
- Failure state exposed: message-selection ambiguity becomes visible at the same level as other async semantic failures.

## Inputs

- `yanote-js/src/coverage/asyncCoverage.ts` — current async coverage dimension logic.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — current payload/header conformance evaluator.
- `yanote-js/src/gates/asyncEvaluator.ts` — current async gate logic.
- `yanote-js/src/report/asyncReport.ts` — current async report surface.
- `yanote-js/src/cli.async-report.test.ts` — current CLI expectations for async results.

## Expected Output

- `yanote-js/src/coverage/asyncCoverage.ts` — multi-message-aware coverage logic.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — coverage proof for resolvable vs ambiguous contracts.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — selected-message and ambiguity semantics.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — conformance proof for multi-message contracts.
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts` — typed ambiguity diagnostics.
- `yanote-js/src/gates/asyncEvaluator.ts` — fail-closed ambiguity behavior.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — gate proof for ambiguity.
- `yanote-js/src/gates/failureOrder.test.ts` — precedence/order proof for ambiguity failures.
- `yanote-js/src/report/asyncReport.ts` — report support for selected-message or ambiguity truth.
- `yanote-js/src/report/asyncReport.test.ts` — report expectations for multi-message outcomes.
- `yanote-js/src/cli.async-report.test.ts` — CLI expectations for ambiguity outcomes.
