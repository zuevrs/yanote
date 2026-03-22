---
estimated_steps: 4
estimated_files: 5
---

# T02: Fail async gates and CLI summaries on typed schema truth

**Slice:** S03 — Async Report And Gate Schema Truth
**Milestone:** M007

## Description

Load the `vitest` skill and wire the widened public async diagnostics into fail-closed gate and CLI behavior. This task must translate each public routing/schema diagnostic kind into stable typed `ASYNC_SEMANTIC_*` failures, surface those failures consistently in `YANOTE_ASYNC_ERROR*` and `YANOTE_ASYNC_SUMMARY`, and apply D004 so header-unverifiable contracts fail as explicit capability-gap semantics instead of silently passing.

## Steps

1. Update `yanote-js/src/gates/asyncEvaluator.ts` so public routing/schema diagnostics map to stable typed semantic failures with deterministic precedence and fail-closed behavior.
2. Update `yanote-js/src/cli.ts` so `collectAsyncIssues()`, `formatAsyncSummaryOutput()`, and async stderr formatting surface the widened report diagnostics and the same redacted primary failure in human and machine output.
3. Expand `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.async-report.test.ts`, and `yanote-js/src/cli.async-report.contract.test.ts` across invalid-payload, missing-payload, unsupported content/schema material, and header-unverifiable fixtures.
4. Keep zero-diagnostic local flows and no-report/input fallbacks stable while the widened semantic codes change the async failure path.

## Must-Haves

- [ ] Every public async routing/schema diagnostic kind maps to one stable typed semantic failure path with deterministic primary/secondary ordering.
- [ ] `YANOTE_ASYNC_ERROR*`, `YANOTE_ASYNC_SUMMARY`, and `Top Issues` expose the same redacted primary failure and never claim schema-conformant success when public diagnostics exist.

## Verification

- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `test -f yanote-js/src/cli.ts && test -f yanote-js/src/gates/asyncEvaluator.ts`

## Observability Impact

- Signals added/changed: typed `ASYNC_SEMANTIC_*` failures for async schema-depth truth, widened `Top Issues`, and updated `YANOTE_ASYNC_SUMMARY` primary/class-count behavior.
- How a future agent inspects this: run the async gate/CLI Vitest suite and inspect stdout/stderr expectations in `yanote-js/src/cli.async-report*.test.ts`.
- Failure state exposed: semantic code, failure reason/hint, primary vs secondary ordering, and report path become visible for routing drift, payload/schema drift, and header capability gaps.

## Inputs

- `yanote-js/src/coverage/asyncCoverage.ts` — widened public diagnostic union produced by T01.
- `yanote-js/src/report/asyncReport.ts` — widened async report/status/count contract produced by T01.
- `yanote-js/src/gates/asyncEvaluator.ts` — current async gate evaluator that only knows `unmatched` / `mismatched`.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — current semantic gate expectations to rewrite around typed schema-depth failures.
- `yanote-js/src/cli.ts` — current async summary/error formatting that omits public report diagnostics.
- `yanote-js/src/cli.async-report.test.ts` — current async CLI behavior tests that still treat schema-invalid fixtures as happy path.
- `yanote-js/src/cli.async-report.contract.test.ts` — contract tests for section order, one machine line, and deterministic error ordering.
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl` — invalid payload fixture for typed semantic failures.
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl` — missing-payload fixture for fail-closed observation-gap semantics.
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` — unsupported schema/content + header-unverifiable fixture for typed capability failures.

## Expected Output

- `yanote-js/src/gates/asyncEvaluator.ts` — async semantic failure mapping widened for public routing/schema diagnostics.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — gate tests pinning typed schema-depth failure codes and ordering.
- `yanote-js/src/cli.ts` — async summary/error output updated for widened public diagnostics.
- `yanote-js/src/cli.async-report.test.ts` — CLI behavior tests for fail-closed schema-depth async failures.
- `yanote-js/src/cli.async-report.contract.test.ts` — contract tests pinning deterministic async machine/error output after the schema-truth widening.
