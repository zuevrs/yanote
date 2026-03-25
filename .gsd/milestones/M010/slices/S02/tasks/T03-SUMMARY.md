---
id: T03
parent: S02
milestone: M010
provides:
  - Additive, schema-validated, deterministic `httpCoreConformance` serialization in `yanote-report.json`, plus report-focused contract coverage for the new section.
key_files:
  - .gsd/milestones/M010/slices/S02/tasks/T03-PLAN.md
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/report/report.test.ts
  - yanote-js/src/report/report.contract.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - .gsd/STATE.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Kept `httpCoreConformance` as a required additive report section with a neutral fallback so the contract can land before T04 updates all callers to pass the live analyzer result.
patterns_established:
  - New additive report sections can ship as schema-valid neutral defaults first, then be populated by later tasks without breaking writer determinism or existing callers.
observability_surfaces:
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/report/report.test.ts
  - yanote-js/src/report/report.contract.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts
  - npm -C yanote-js test -- src/report/report.contract.test.ts -t "httpCoreConformance"
duration: 1h20m
verification_result: partial
completed_at: 2026-03-25T05:38:33+03:00
blocker_discovered: false
---

# T03: Serialize HTTP core conformance into the report contract

**Added additive `httpCoreConformance` report serialization with schema, normalization, and determinism coverage.**

## What Happened

I first repaired the task contract by adding the missing `## Observability Impact` section to `.gsd/milestones/M010/slices/S02/tasks/T03-PLAN.md`, then wired the new HTTP core surface into the `yanote-js` report path.

The runtime/reporting work was:
- extended `yanote-js/src/report/report.ts` with a required additive `httpCoreConformance` section that carries summary counts, per-operation state, and typed diagnostics for undeclared status, parameter drift, and response-header drift;
- kept legacy `coverage` and `httpPayloadConformance` surfaces intact, while adding a neutral fallback `httpCoreConformance` payload so existing callers remain schema-valid until T04 passes the live analyzer result everywhere;
- updated `yanote-js/src/report/schema.ts` so the new section is validated as a strict JSON contract, including per-target diagnostic unions;
- updated `yanote-js/src/report/normalize.ts` so the new section sorts per-operation entries, status arrays, declared parameter/header metadata, and typed diagnostics deterministically;
- pinned the new section in `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/report.contract.test.ts`, and `yanote-js/src/report/writeReport.determinism.test.ts`, including a dedicated `httpCoreConformance` contract test for the task verifier filter.

I also recorded D007 in `.gsd/DECISIONS.md`, added a reuse note to `.gsd/KNOWLEDGE.md`, marked T03 complete in the slice plan, and advanced `.gsd/STATE.md` to T04.

## Verification

I ran the focused T03 verification commands and both passed:
- the report/unit/contract/determinism suite is green;
- the dedicated `httpCoreConformance` contract filter is green.

I then ran the slice-level verification sweep as required for an intermediate task:
- the upstream coverage/analyzer suite still fails on the carried T01/T02 baseline mismatches in `src/coverage/statusCoverage.test.ts` and `src/coverage/coverage.test.ts`;
- the slice report/gate/CLI suite passes with the new report contract in place;
- `bash scripts/docs/verify-s02-analysis-path.sh` timed out while running the retained Spring MVC proof path;
- I stopped before `bash scripts/ci/run-v1-e2e.sh` because the soft time-budget warning fired after the long verifier timeout.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts` | 0 | ✅ pass | 0.46s |
| 2 | `npm -C yanote-js test -- src/report/report.contract.test.ts -t "httpCoreConformance"` | 0 | ✅ pass | 0.36s |
| 3 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts` | 1 | ❌ fail | 0.69s |
| 4 | `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1.16s |
| 5 | `bash scripts/docs/verify-s02-analysis-path.sh` | timeout | ❌ fail | 240.00s |

## Diagnostics

Future agents should inspect these surfaces first:
- `yanote-js/src/report/report.ts` — additive `httpCoreConformance` DTO shape, typed diagnostic flattening, and neutral fallback behavior.
- `yanote-js/src/report/schema.ts` — strict JSON Schema definitions for the new section, especially the per-target `oneOf` diagnostic contract.
- `yanote-js/src/report/normalize.ts` — deterministic ordering rules for HTTP core per-operation state and typed diagnostics.
- `yanote-js/src/report/report.test.ts` — report-builder expectations showing the final additive section beside unchanged legacy coverage fields.
- `yanote-js/src/report/report.contract.test.ts` — schema-valid normalization proof for `httpCoreConformance`; this is the test hit by `-t "httpCoreConformance"`.
- `yanote-js/src/report/writeReport.determinism.test.ts` — byte-stability proof that reversing `httpCoreConformance` arrays still serializes identically.
- D007 in `.gsd/DECISIONS.md` — explains why the section is required-but-neutral until T04 wires live analyzer calls in all report entrypoints.

## Deviations

- I updated `.gsd/milestones/M010/slices/S02/tasks/T03-PLAN.md` to add the required `## Observability Impact` section before proceeding.
- I landed a neutral fallback `httpCoreConformance` section in `buildReport` as a local adaptation so the schema/normalization/writer contract could land in T03 before T04 updates all callers.
- I stopped the slice verification sweep after `scripts/docs/verify-s02-analysis-path.sh` timed out and the soft time-budget warning fired, so `scripts/ci/run-v1-e2e.sh` was not rerun in this task.

## Known Issues

- The slice-level upstream suite still has the carried failures from earlier tasks:
  - `yanote-js/src/coverage/statusCoverage.test.ts` expects `computeStatusCoverage` to stay `PARTIAL` when `2XX` covers `404/500`, but the current implementation returns `COVERED` plus `undeclaredObservedStatuses`.
  - `yanote-js/src/coverage/coverage.test.ts` still expects 100% operation coverage on the payload-contract baseline fixture, but the current result is `PARTIAL` / `33.33`.
- `bash scripts/docs/verify-s02-analysis-path.sh` did not finish within the 240s task budget window.
- `bash scripts/ci/run-v1-e2e.sh` was not rerun in this task after the soft time-budget warning.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S02/tasks/T03-PLAN.md` — added the missing observability contract required by the execution pre-flight.
- `yanote-js/src/report/report.ts` — added the additive `httpCoreConformance` report section, typed diagnostic flattening, and neutral fallback behavior.
- `yanote-js/src/report/schema.ts` — added strict schema validation for the new HTTP core report surface.
- `yanote-js/src/report/normalize.ts` — added deterministic normalization for HTTP core per-operation data and typed diagnostics.
- `yanote-js/src/report/report.test.ts` — pinned report-builder serialization of the new additive section without regressing legacy coverage fields.
- `yanote-js/src/report/report.contract.test.ts` — added schema/normalization coverage for `httpCoreConformance` and the dedicated verifier-filtered test.
- `yanote-js/src/report/writeReport.determinism.test.ts` — extended byte-stability coverage to the new report section.
- `.gsd/DECISIONS.md` — recorded D007 about the required neutral fallback contract behavior before T04 wiring.
- `.gsd/KNOWLEDGE.md` — added the report-contract rollout pattern for future additive sections.
- `.gsd/milestones/M010/slices/S02/S02-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — advanced the next action to T04.
