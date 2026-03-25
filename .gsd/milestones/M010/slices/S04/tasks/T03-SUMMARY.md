---
id: T03
parent: S04
milestone: M010
provides:
  - Partial T03 progress: the HTTP report schema now accepts real HTTP-core recorder capture reasons (`sensitive`, `unavailable`) so `/evidence/users/{id}` red-path reports can be written without a runtime schema failure.
key_files:
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/report.contract.test.ts
key_decisions:
  - Before retargeting the public proof bundle and docs, fix the report-schema/runtime mismatch that blocked any truthful `/evidence/users/{id}` HTTP core retained artifact from being written by `yanote-js/dist/yanote.cjs`.
patterns_established:
  - When a proof script depends on `yanote-js/dist/yanote.cjs`, verify the built bundle output directly; source-level Vitest coverage was ahead of the distributable until I forced a clean rebuild.
observability_surfaces:
  - `yanote-js/dist/yanote.cjs report ...` against `/evidence/users/{id}` fixtures now writes `yanote-report.json` instead of failing with `RUNTIME_UNEXPECTED` from schema validation.
  - `npm -C yanote-js test -- src/report/report.contract.test.ts`
duration: 1h00m
verification_result: partial
completed_at: 2026-03-25T06:01:12Z
blocker_discovered: false
---

# T03: Retarget the live HTTP proof bundle and docs to the HTTP core boundary

**Started retargeting the HTTP proof bundle toward `/evidence/users/{id}` and fixed the report-schema bug that blocked real HTTP core red artifacts, but the script/docs retargeting work itself is still unfinished.**

## What Happened

I began T03 by reading the current proof scripts, docs, and verifier surfaces. That confirmed the planner snapshot: the public retained red path is still payload-era `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, while the real route that now carries supported HTTP core evidence is `/evidence/users/{id}`.

Before rewriting the bundle contract, I probed the built CLI (`node yanote-js/dist/yanote.cjs report ...`) against a focused `/evidence/users/{id}` event. That surfaced a real runtime problem: once HTTP-core diagnostics carried redacted or omitted header/parameter evidence, report writing failed with `RUNTIME_UNEXPECTED` because `yanote-js/src/report/schema.ts` still allowed payload-era capture reasons instead of the actual HTTP evidence reasons (`sensitive`, `unavailable`). In other words, the planner’s intended red-path proof could not yet be exported truthfully from the shipped CLI.

I fixed that local mismatch by updating the HTTP-core report schema enums in `yanote-js/src/report/schema.ts` and by adding a focused contract test in `yanote-js/src/report/report.contract.test.ts` that validates a report containing `RECORDER_REDACTED`/`RECORDER_OMITTED` HTTP-core diagnostics with `captureReason: sensitive` and `captureReason: unavailable`.

After a clean rebuild of `yanote-js/dist/yanote.cjs`, a focused `/evidence/users/{id}` probe stopped failing at report-schema validation and started writing a real retained report with semantic HTTP-core failures and no runtime secondary. That unblocked the remaining T03 work, but I did not finish the actual bundle retargeting, doc rewrites, verifier updates, or task-plan completion before the context-budget wrap-up instruction arrived.

## Verification

I verified the schema fix with the focused report-contract suite, rebuilt the distributable CLI, and re-ran a manual `/evidence/users/{id}` probe against `yanote-js/dist/yanote.cjs` to confirm the previous runtime schema error disappeared and `yanote-report.json` was actually written.

I did **not** complete the planned T03 verifier stack (`node --test scripts/ci/run-v1-e2e.contract.test.mjs`, `bash scripts/docs/verify-s02-analysis-path.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`) because the task is not yet finished and the context-budget warning required immediate wrap-up.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.contract.test.ts` | 0 | ✅ pass | 990ms |
| 2 | `npm -C yanote-js run build` | 0 | ✅ pass | ~10s |
| 3 | Focused manual probe: `node yanote-js/dist/yanote.cjs report --spec <temp /evidence core-red spec> --events <temp focused /evidence event> --out <temp> --profile local` | 5 | ✅ pass | ~1s |

## Diagnostics

The main non-obvious T03 finding is now reproducible and fixed:

- Before the schema change, a focused `/evidence/users/{id}` HTTP-core red-path run produced `YANOTE_ERROR_SECONDARY class=runtime code=RUNTIME_UNEXPECTED` because report validation rejected real HTTP evidence capture reasons.
- After the change, the same style of probe writes `yanote-report.json` successfully and exits only for semantic HTTP-core failures.

To reproduce the validated post-fix behavior quickly, rerun a focused `yanote-js/dist/yanote.cjs report` probe against a single retained `/evidence/users/{id}` event containing:

- status `202`
- `expand=[profile,roles]`
- redacted `token` / `X-Api-Key`
- repeated `X-Trace-Id`
- omitted `Server-Timing`

## Deviations

- I did not reach the planned script/doc/verifier edits for T03. I stopped after fixing the runtime report-schema blocker because the context-budget warning required immediate wrap-up.
- I also discovered that I needed a **clean** rebuild of `yanote-js/dist/yanote.cjs` to align the distributable with the current CLI source before trusting probe results.

## Known Issues

- **T03 remains incomplete.** I did not retarget `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/run-v1-e2e.contract.test.mjs`, `docs/guides/analyzer-coverage.md`, `README.md`, `docs/README.md`, `examples/README.md`, `scripts/docs/verify-s03-landing.sh`, or `scripts/docs/verify-s02-doc-links.sh`.
- The slice plan checkbox for T03 is intentionally **not** marked done, because the task contract has not been completed yet.

## Resume Notes

Resume from T03 with this sequence:

1. Keep the schema/test fix in place (`yanote-js/src/report/schema.ts`, `yanote-js/src/report/report.contract.test.ts`).
2. Create stable HTTP-core red proof inputs for `/evidence/users/{id}`.
   - One focused retained red pass should cover **undeclared status + parameter-value drift**.
   - A second focused retained red pass will likely be needed for **response-header drift**, because response-header validation only runs when the observed status matches a declared/default/2XX response token.
3. Retarget `scripts/ci/run-v1-e2e.sh` to keep the happy-path bundle green while exporting the new HTTP-core red artifacts.
4. Update `scripts/ci/run-v1-e2e.contract.test.mjs` to pin the new artifact names/manifest fields.
5. Rewrite the analyzer/landing/example docs around `HTTP Core Conformance` as the public red-path showcase, while keeping payload validation additive.
6. Update `scripts/docs/verify-s03-landing.sh` and `scripts/docs/verify-s02-doc-links.sh` to enforce the new wording.
7. Only after that, rerun the T03 verifier stack and then decide whether T03 can be marked complete.

## Files Created/Modified

- `yanote-js/src/report/schema.ts` — fixed HTTP-core report-schema enums so retained parameter/header diagnostics accept real HTTP evidence capture reasons (`sensitive`, `unavailable`).
- `yanote-js/src/report/report.contract.test.ts` — added a focused contract test proving `validateReport(...)` accepts HTTP-core diagnostics with redacted and unavailable retained evidence reasons.
