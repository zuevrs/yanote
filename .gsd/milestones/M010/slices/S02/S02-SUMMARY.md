---
id: S02
parent: M010
milestone: M010
provides:
  - Shared HTTP operation-evidence resolution and supported OpenAPI extraction for parameter schemas plus response-header contracts.
  - Typed but not yet user-wired HTTP core conformance analysis/report data structures in `yanote-js`.
  - Updated baseline tests proving the current shared coverage/status semantics after the T01/T02 refactor.
requires:
  - slice: S01
    provides: Additive HTTP evidence shape with retained path/query/request-header/response-header value capture and explicit captured/redacted/omitted states.
affects:
  - M010/S04
key_files:
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpOperationEvidence.ts
  - yanote-js/src/coverage/httpParameterValueConformance.ts
  - yanote-js/src/coverage/httpResponseHeaderConformance.ts
  - yanote-js/src/coverage/httpCoreConformance.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/coverage/coverage.test.ts
  - yanote-js/src/coverage/statusCoverage.test.ts
  - scripts/docs/verify-s02-analysis-path.sh
  - scripts/ci/run-v1-e2e.sh
key_decisions:
  - Keep HTTP core drift additive to legacy observation coverage instead of redefining operation/status/parameter percentages.
  - Allow the report contract to carry a required `httpCoreConformance` section with neutral defaults before all CLI/gate callers are updated.
patterns_established:
  - Shared route/evidence resolution belongs in one helper (`httpOperationEvidence`) so status, parameter, header, and legacy coverage paths do not fork S01 event interpretation.
  - Additive report sections can land schema-first, then be wired into CLI/gates later, but closeout must verify the runtime actually consumes them before calling the slice done.
observability_surfaces:
  - `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
  - `bash scripts/docs/verify-s02-analysis-path.sh`
  - `bash scripts/ci/run-v1-e2e.sh`
duration: closeout verification + artifact compression
verification_result: mixed
completed_at: 2026-03-25T06:10:00+03:00
---

# S02: HTTP Core Contract Completeness In Report And Gates

**Closeout finding:** S02 advanced the internal HTTP core model, but the assembled slice does **not** yet deliver the full slice goal end to end. The typed HTTP core analyzer/report seam exists in code, the verifier stack is green, and stale baseline tests were reconciled, but the live CLI/gate/proof path is still effectively payload-era rather than HTTP-core-era.

## What this slice actually delivered

### 1. Shared HTTP contract + evidence foundation landed
T01’s intended foundation is present and usable:
- `yanote-js/src/spec/openapi.ts` now extracts the supported parameter-schema subset plus response-header contracts.
- `yanote-js/src/coverage/httpOperationEvidence.ts` centralizes HTTP route matching and retained evidence aggregation from the richer S01 JSONL shape.
- Legacy coverage now consumes that shared resolver instead of keeping a separate matcher/evidence path.

This is the most durable S02 output and is the main thing downstream slices can safely build on.

### 2. Typed HTTP core analyzer shapes exist
The repo now contains analyzer modules for:
- undeclared observed statuses,
- parameter-value conformance,
- response-header conformance,
- aggregate `httpCoreConformance` results.

The report contract also contains a first-class `httpCoreConformance` section with normalization and schema coverage. This means the data model and deterministic serialization seam are in place.

### 3. Baseline tests were brought back to current semantics
During closeout, the slice-level JS verification exposed two stale expectations left behind by the shared-evidence/status changes:
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/src/coverage/statusCoverage.test.ts`

Those tests were updated to match the current post-refactor semantics, and the JS verification stack now passes.

## What the closeout verification proved

The required slice verification commands were rerun from this worktree:

- ✅ `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
- ✅ `bash scripts/docs/verify-s02-analysis-path.sh`
- ✅ `bash scripts/ci/run-v1-e2e.sh`

## Why the slice is still not truly closed

The green verifier stack does **not** currently prove the S02 goal. Closeout inspection showed a mismatch between the slice plan and the assembled runtime surface:

- `yanote-js/src/cli.ts` still computes/report-wires HTTP payload conformance, not live `httpCoreConformance`.
- `yanote-js/src/gates/evaluator.ts` still fail-closes on payload semantics only.
- `yanote-js/src/gates/failureOrder.ts` still ranks payload semantic codes, not HTTP core semantic codes.
- `scripts/docs/verify-s02-analysis-path.sh` still asserts payload-era behavior (`HTTP Payload Conformance`, unsupported-schema red path).
- `scripts/ci/run-v1-e2e.sh` still exports payload-era semantic-red artifacts (`SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`) rather than an HTTP core red path proving undeclared status / parameter-value / response-header drift.
- Several plan-named focused test files are still absent (`httpCoreSemantics.ts`, `httpCoreSemantics.test.ts`, dedicated conformance tests on disk), even though the broad Vitest command passes.

So the slice’s **foundations** are real, but the milestone-facing promise — “`yanote report` can fail closed on undeclared statuses, supported parameter-value drift, and response-header drift through the live proof path” — is not yet verified as delivered.

## Requirement status

No requirement statuses were changed during closeout.

- `R031`, `R032`, and `R033` remain **active**.
- The current evidence is sufficient to say the repo has partial implementation toward them, but not sufficient to promote them to validated.

## Deviations from the slice plan

The main deviation is substantive, not procedural:
- the slice plan says report/gate/CLI/proof wiring should be complete after S02;
- the assembled repo currently stops earlier, at shared-evidence extraction plus additive report-contract groundwork.

The green docs/CI verifiers are therefore weaker than the slice plan claims.

## Known limitations / blockers left for the next unit

1. **CLI wiring gap**
   - `yanote-js/src/cli.ts` must compute `computeHttpCoreConformance(...)`, pass it to `buildReport(...)`, surface an `HTTP Core Conformance` section, and include HTTP-core top-issue / machine-summary data.

2. **Fail-closed semantic gate gap**
   - `yanote-js/src/gates/evaluator.ts` and precedence logic in `yanote-js/src/gates/failureOrder.ts` still need HTTP core semantic failure mapping.

3. **Proof-script mismatch**
   - `scripts/docs/verify-s02-analysis-path.sh` and `scripts/ci/run-v1-e2e.sh` still verify payload-era red paths. They must be retargeted to:
     - a green denominator path (`DemoServiceE2eTest`), and
     - a red `/evidence/users/{id}` path proving HTTP core drift.

4. **Plan/file drift**
   - The slice plan references focused HTTP core gate/conformance tests that are not currently present on disk. Next work should either add them or realign the plan.

## Files changed during closeout

- `yanote-js/src/coverage/coverage.test.ts` — updated stale operation/status expectation after the shared-evidence refactor.
- `yanote-js/src/coverage/statusCoverage.test.ts` — updated wildcard-status expectation to match current additive undeclared-status semantics.
- `.gsd/milestones/M010/slices/S02/S02-SUMMARY.md` — this closeout summary.
- `.gsd/milestones/M010/slices/S02/S02-UAT.md` — concrete UAT script reflecting the real delivered-vs-missing boundary.
- `.gsd/STATE.md` — updated to leave truthful resume notes.
- `.gsd/PROJECT.md` — refreshed current project state with the closeout finding.

## Forward intelligence

### What the next slice / reassessment should know
- S02 should be treated as **partially assembled but not milestone-complete**.
- The reliable base to reuse is the shared OpenAPI extraction + HTTP evidence resolver + typed analyzer/report DTOs.
- Do **not** assume the current green verifier stack proves HTTP core drift semantics. It currently proves the older payload surface plus the unchanged happy-path denominator.

### Fastest truthful resume path
1. Wire `computeHttpCoreConformance(...)` through CLI + report + top issues.
2. Add HTTP core semantic classification and precedence.
3. Replace payload-era red-path assertions in docs/CI proof scripts with `/evidence/users/{id}` HTTP core assertions.
4. Re-run the same slice-level verification commands.

### Most important gotcha
- A green slice-level verifier stack is currently **not equivalent** to S02 being done. The verifiers are stale relative to the slice goal.
