---
estimated_steps: 4
estimated_files: 8
---

# T03: Preserve public async coverage/report/gate compatibility while schema semantics stay internal

**Slice:** S02 — AsyncAPI Schema Validation And Drift Semantics
**Milestone:** M007

## Description

Load the `vitest` skill and close the slice without pulling S03 forward. This task composes the existing public async coverage path from the new internal schema-conformance seam, keeps `unmatched` / `mismatched` as the only public async diagnostic kinds for now, and proves that report/gate/CLI contracts remain unchanged while richer schema truth stays internal.

## Steps

1. Update `yanote-js/src/coverage/asyncCoverage.ts` to consume the new internal schema-conformance result while preserving the current public coverage summaries and diagnostic union.
2. Extend the `yanote-js/src/coverage/asyncCoverage*.test.ts` suites to prove routing coverage remains truthful and that schema-depth failures do not leak into the public `AsyncCoverageDiagnostic` contract in S02.
3. Re-run and, only if needed, adjust `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.async-report.test.ts`, and `yanote-js/src/cli.async-report.contract.test.ts` as explicit non-regression guards.
4. Finish with `git diff --check` so the slice leaves only the intended plan-defined surface changes.

## Must-Haves

- [ ] Public async coverage/report/gate/CLI behavior stays backward-compatible, with only `unmatched` and `mismatched` exposed outside the new internal analyzer seam.
- [ ] Regression tests prove the richer internal schema diagnostics from T02 did not accidentally widen the report schema, gate semantics, or CLI contract in this slice.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `git diff --check`

## Observability Impact

- Signals added/changed: compatibility tests make any leakage of schema-depth diagnostics into public async report/gate/CLI surfaces fail immediately.
- How a future agent inspects this: run the async coverage/report/gate/CLI verifier command and compare failures with the internal schema-conformance suites from T02.
- Failure state exposed: boundary regressions show up as changed diagnostic kinds, report-schema mismatches, gate failure rewrites, or CLI contract diffs.

## Inputs

- `yanote-js/src/coverage/asyncSchemaConformance.ts` — internal schema-conformance seam created in T02.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — schema-depth contract expectations to preserve internally.
- `yanote-js/src/coverage/asyncCoverage.ts` — public async coverage surface that must stay backward-compatible.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — current public coverage contract assertions.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — current public unmatched/mismatched diagnostic assertions.
- `yanote-js/src/report/asyncReport.ts` — current async report builder that still assumes two diagnostic kinds.
- `yanote-js/src/gates/asyncEvaluator.ts` — current async gate evaluator that still assumes two diagnostic kinds.
- `yanote-js/src/cli.async-report.test.ts` — CLI contract tests that must keep the current public boundary intact.

## Expected Output

- `yanote-js/src/coverage/asyncCoverage.ts` — public async coverage surface composed from the internal schema seam without widening exported diagnostics.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — regression coverage assertions for the unchanged public surface.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — regression assertions that public diagnostics remain `unmatched` / `mismatched` only.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — parity assertions that public coverage remains stable after internal schema-depth wiring.
- `yanote-js/src/report/asyncReport.test.ts` — non-regression test coverage for unchanged async report behavior.
- `yanote-js/src/report/asyncReport.contract.test.ts` — non-regression schema contract coverage for `yanote-async-report.json`.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — non-regression gate behavior for the unchanged public diagnostic union.
- `yanote-js/src/cli.async-report.test.ts` — non-regression CLI behavior for the unchanged public async surface.
- `yanote-js/src/cli.async-report.contract.test.ts` — CLI contract proof that S02 did not pull S03 forward.
