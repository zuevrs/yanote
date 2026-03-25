---
estimated_steps: 4
estimated_files: 8
skills_used:
  - vitest
  - test
  - debug-like-expert
---

# T04: Wire fail-closed gate semantics and CLI output for HTTP core drift

**Slice:** S02 — HTTP Core Contract Completeness In Report And Gates
**Milestone:** M010

## Description

Make the new HTTP core truth actionable in real CLI and CI flows. This task maps the analyzer/report diagnostics to stable semantic failures, updates precedence ordering, and teaches the CLI to summarize and emit deterministic machine-readable output for the new drift surfaces.

## Steps

1. Add `yanote-js/src/gates/httpCoreSemantics.ts` to classify HTTP core diagnostics into stable fail-closed semantic codes, reasons, and hints.
2. Update `yanote-js/src/gates/evaluator.ts` and `yanote-js/src/gates/failureOrder.ts` so HTTP core semantic failures outrank threshold gates appropriately and sort deterministically with existing payload semantics.
3. Update `yanote-js/src/cli.ts` so stdout and stderr include the new HTTP core section, top issues, and `YANOTE_SUMMARY` / `YANOTE_ERROR` machine fields.
4. Cover primary/secondary precedence, fail-closed exit behavior, and summary rendering in focused gate and CLI tests.

## Must-Haves

- [ ] HTTP core diagnostics map to stable semantic failure codes for undeclared status, parameter-value drift, and response-header drift.
- [ ] Gate evaluation fails closed on those semantic errors before threshold gates when they are present.
- [ ] CLI output surfaces the new drift truth in both human-readable and machine-readable summaries without regressing existing payload semantics.

## Verification

- `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
- `npm -C yanote-js test -- src/cli.test.ts`

## Observability Impact

- Signals added/changed: stable semantic failure codes and machine-summary fields for HTTP core drift in CLI stdout/stderr.
- How a future agent inspects this: rerun `yanote report` and inspect `YANOTE_ERROR`, `YANOTE_ERROR_SECONDARY`, and `YANOTE_SUMMARY` lines plus the associated report JSON.
- Failure state exposed: primary/secondary ordering, operation-level drift context, and fail-closed exit reasons become explicit in CLI/CI logs.

## Inputs

- `yanote-js/src/coverage/httpCoreConformance.ts` — analyzer diagnostics from T02.
- `yanote-js/src/report/report.ts` — additive `httpCoreConformance` report section from T03.
- `yanote-js/src/gates/evaluator.ts` — current gate entrypoint that only understands legacy threshold/regression plus HTTP payload semantics.
- `yanote-js/src/gates/failureOrder.ts` — current semantic precedence list.
- `yanote-js/src/cli.ts` — current CLI summary/top-issues output surface.

## Expected Output

- `yanote-js/src/gates/httpCoreSemantics.ts` — semantic classifier for HTTP core drift diagnostics.
- `yanote-js/src/gates/httpCoreSemantics.test.ts` — tests for semantic code mapping and fail-closed classification.
- `yanote-js/src/gates/evaluator.ts` — gate evaluation updated to fail closed on HTTP core semantic drift.
- `yanote-js/src/gates/failureOrder.ts` — precedence rules updated for the new HTTP semantic codes.
- `yanote-js/src/gates/failureOrder.test.ts` — tests for deterministic primary/secondary ordering.
- `yanote-js/src/cli.ts` — CLI summary, top-issues, and machine lines updated for HTTP core conformance.
- `yanote-js/src/cli.report.test.ts` — summary/report rendering coverage for the new section.
- `yanote-js/src/cli.failclosed.contract.test.ts` — fail-closed CLI contract coverage for the new semantic errors.
