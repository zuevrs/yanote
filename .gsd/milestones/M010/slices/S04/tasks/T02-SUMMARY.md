---
id: T02
parent: S04
milestone: M010
provides:
  - Real `yanote report` HTTP core computation, additive CLI summary/machine-summary output, and focused CLI contract coverage for HTTP core report/fail-closed behavior.
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/coverage/httpParameterValueConformance.ts
  - yanote-js/src/cli.httpCore.report.test.ts
  - yanote-js/src/cli.httpCore.failclosed.test.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.report.test.ts
key_decisions:
  - The CLI now feeds live `httpCoreConformance` into both governance evaluation and report building, and the human/machine summaries surface HTTP core counts additively alongside payload data instead of replacing it.
  - Path-parameter HTTP core evidence may be inferred from the observed concrete route when explicit retained `pathParams` are absent, keeping supported path-value conformance truthful for existing retained HTTP evidence fixtures.
patterns_established:
  - Additive report surfaces must be wired in three places together: analyzer computation, governance fail-closed evaluation, and both human/machine summary formatting, with focused contract tests added before broad verifier updates.
observability_surfaces:
  - `yanote report` stdout `HTTP Core Conformance` section
  - `YANOTE_SUMMARY` fields `http_core_operations` and `http_core_diagnostics`
  - Focused CLI tests in `src/cli.httpCore.report.test.ts` and `src/cli.httpCore.failclosed.test.ts`
duration: 1h20m
verification_result: passed
completed_at: 2026-03-25T08:47:12+03:00
blocker_discovered: false
---

# T02: Surface HTTP core results in CLI summaries and focused contract tests

**Wired live HTTP core conformance into `yanote report`, surfaced additive HTTP core summary/machine fields, and pinned the behavior with focused CLI contract tests.**

## What Happened

I updated `yanote-js/src/cli.ts` so the real report path now computes `computeHttpCoreConformance(...)`, passes the result into `evaluateGateFailures(...)`, and serializes it through `buildReport(...)` instead of leaving the HTTP core report surface on fallback data.

I then extended the report summary formatter so CLI stdout now includes an additive `HTTP Core Conformance` section between coverage dimensions and the existing payload section. The machine summary line now exposes deterministic HTTP core fields through `http_core_operations=` and `http_core_diagnostics=` while keeping payload counts and existing summary tokens intact.

To keep fail-closed behavior truthful for retained HTTP fixtures, I updated `yanote-js/src/report/report.ts` so report status/governance aggregation now considers HTTP core semantic failures in the same additive way as payload semantics. I also patched `yanote-js/src/coverage/httpParameterValueConformance.ts` so supported path-parameter values can be inferred from the observed route when fixtures do not carry explicit `pathParams`, which restored the intended payload-era green and red fixtures while still surfacing the new HTTP core truth.

Finally, I added focused CLI tests in `yanote-js/src/cli.httpCore.report.test.ts` and `yanote-js/src/cli.httpCore.failclosed.test.ts`, and refreshed existing summary/report contract coverage so the new section order and machine-summary fields are asserted from the live CLI path.

## Verification

I ran the focused T02 verifier stack from the task plan and confirmed the new HTTP core CLI/report surfaces pass. I also ran the first slice-level verification command that now spans T01 and T02 so this task handoff can truthfully record one passing slice verifier while leaving later async/docs verifiers for T03-T05.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1.02s |
| 2 | `npm -C yanote-js test -- src/report/report.test.ts -t "httpCoreConformance"` | 0 | ✅ pass | 382ms |
| 3 | `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 772ms |

## Diagnostics

Future agents can inspect the shipped T02 behavior by rerunning:

- `npm -C yanote-js test -- src/cli.httpCore.report.test.ts`
- `npm -C yanote-js test -- src/cli.httpCore.failclosed.test.ts`
- `npm -C yanote-js test -- src/cli.summary.contract.test.ts`
- `npm -C yanote-js test -- src/report/report.test.ts -t "httpCoreConformance"`

The primary runtime surfaces changed by this task are:

- stdout `HTTP Core Conformance` section in `yanote report`
- `YANOTE_SUMMARY http_core_operations=...`
- `YANOTE_SUMMARY http_core_diagnostics=...`
- fail-closed primary semantic codes now reflecting HTTP core drift from the live report path

## Deviations

- I made one small execution-time adaptation not called out explicitly in the written plan: path-parameter HTTP core fixtures now infer captured values from the concrete observed route when retained `pathParams` are absent. This was necessary to keep the existing retained payload fixtures truthful while enabling the newly wired HTTP core path.

## Known Issues

- The remaining slice-level verifiers owned by T03-T05 were not run here: `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/docs/verify-m010-s04-final-boundary.sh`.

## Files Created/Modified

- `yanote-js/src/cli.ts` — computed `httpCoreConformance` in the report path, passed it into governance/report building, added the additive HTTP core stdout section, and added machine-summary HTTP core fields.
- `yanote-js/src/report/report.ts` — treated HTTP core semantics as additive governance/report-status inputs instead of payload-only semantics.
- `yanote-js/src/coverage/httpParameterValueConformance.ts` — inferred path-parameter values from the observed route when explicit retained path captures are absent.
- `yanote-js/src/cli.httpCore.report.test.ts` — added focused green/red CLI report coverage for additive HTTP core output.
- `yanote-js/src/cli.httpCore.failclosed.test.ts` — added focused fail-closed coverage for HTTP core semantic primary selection.
- `yanote-js/src/cli.summary.contract.test.ts` — updated summary section-order and machine-summary assertions for the new HTTP core fields.
- `yanote-js/src/cli.report.test.ts` — aligned existing CLI report coverage with additive HTTP core output.