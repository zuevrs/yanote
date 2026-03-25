# S02 UAT — HTTP core contract completeness in report and gates

**Milestone:** M010  
**Slice:** S02  
**Reality check from closeout:** this UAT is written against what the repo actually contains at slice closeout. It includes both the currently proven behavior and the intended-but-still-missing HTTP core behavior so the next unit can verify the gap explicitly.

## Preconditions

1. Work from the M010 worktree root.
2. Node/npm, Java/Gradle, Docker, and docker compose are available.
3. `yanote-js` dependencies can be installed and the analyzer can be built.
4. The example Spring MVC service and RestAssured tests build successfully.

## Test Case 1 — Shared HTTP evidence foundation is still deterministic

**Goal:** Confirm the S01→S02 shared evidence resolver and OpenAPI extraction survive closeout.

### Steps
1. Run:
   - `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts`
2. Inspect the result.

### Expected
1. The command exits `0`.
2. `openapi.test.ts` proves supported parameter-schema and response-header extraction still work.
3. `httpOperationEvidence.test.ts` proves canonical route matching and retained evidence aggregation still work.
4. `coverage.test.ts` and `statusCoverage.test.ts` match the current post-refactor semantics.

## Test Case 2 — Report contract still carries additive `httpCoreConformance`

**Goal:** Confirm the report JSON contract includes the additive HTTP core section deterministically.

### Steps
1. Run:
   - `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts`
2. Inspect the normalized report expectations in the passing tests if needed.

### Expected
1. The command exits `0`.
2. `yanote-js` report tests prove `httpCoreConformance` is present as a top-level additive section.
3. Serialization order is deterministic.
4. Legacy `coverage` and `httpPayloadConformance` surfaces remain unchanged by the additive report section.

## Test Case 3 — Current live proof path still proves the old happy path

**Goal:** Confirm the existing live docs verifier remains green and inspect what it actually proves.

### Steps
1. Run:
   - `bash scripts/docs/verify-s02-analysis-path.sh`
2. Read the final success summary line.
3. Inspect generated stdout/stderr/report artifacts if needed.

### Expected
1. The script exits `0`.
2. The final summary mentions:
   - `operations=4/4`
   - `status_percent=100.00`
   - `parameters_percent=100.00`
   - payload matrix validation
3. The verifier still describes `HTTP Payload Conformance` and an unsupported-schema red path.
4. No explicit live proof of undeclared status, parameter-value drift, or response-header drift is surfaced by this script yet.

## Test Case 4 — Current CI bundle still exports payload-era semantic red artifacts

**Goal:** Confirm the retained CI bundle is green, then verify that its red path is still payload-era.

### Steps
1. Run:
   - `bash scripts/ci/run-v1-e2e.sh`
2. Inspect:
   - `.yanote-ci/v1-e2e/out/yanote-report.json`
   - `.yanote-ci/v1-e2e/semantic-red.stdout`
   - `.yanote-ci/v1-e2e/semantic-red.stderr`
   - `.yanote-ci/v1-e2e/semantic-red-yanote-report.json`

### Expected
1. The script exits `0`.
2. The happy-path report shows 100% operation/status/parameter/aggregate coverage for the green denominator path.
3. The semantic-red artifacts are present.
4. The semantic-red primary is still `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, not an HTTP-core-specific drift code.
5. This proves the proof bundle is still payload-era rather than S02 HTTP-core-era.

## Test Case 5 — Gap check: CLI/report do not yet expose live HTTP core truth

**Goal:** Verify the exact missing user-facing wiring that blocks truthful S02 closure.

### Steps
1. Open `yanote-js/src/cli.ts`.
2. Search for `computeHttpCoreConformance`.
3. Search for a human-readable `HTTP Core Conformance` summary block in CLI output generation.
4. Open `yanote-js/src/gates/evaluator.ts` and inspect which semantic diagnostics are fail-closed.
5. Open `yanote-js/src/gates/failureOrder.ts` and inspect semantic precedence entries.

### Expected
1. `cli.ts` does **not** compute live `computeHttpCoreConformance(...)` yet.
2. CLI summary formatting still explicitly renders only `HTTP Payload Conformance`.
3. `evaluateGateFailures(...)` fail-closes on payload semantics only.
4. Failure precedence includes `SEMANTIC_HTTP_*` payload codes but not HTTP core drift codes for undeclared status / parameter-value / response-header conformance.

## Test Case 6 — Gap check: focused HTTP core gate tests named in the plan are still absent

**Goal:** Prove the plan/runtime mismatch directly.

### Steps
1. Check whether the following files exist:
   - `yanote-js/src/gates/httpCoreSemantics.ts`
   - `yanote-js/src/gates/httpCoreSemantics.test.ts`
   - `yanote-js/src/coverage/httpParameterValueConformance.test.ts`
   - `yanote-js/src/coverage/httpResponseHeaderConformance.test.ts`
   - `yanote-js/src/coverage/httpCoreConformance.test.ts`
2. Compare the result with the slice plan’s verification list.

### Expected
1. One or more of those plan-named focused files are missing.
2. This confirms the slice plan claims a more complete test/wiring surface than the current assembled repo actually contains.

## Edge Case 1 — Ensure closeout doesn’t regress the shared baseline

### Steps
1. Re-run the full JS closeout command:
   - `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
2. Confirm the command stays green after any future HTTP core wiring work.

### Expected
1. Existing shared-evidence and report-contract behavior stays green.
2. Any future S02 completion work must preserve these currently passing baselines.

## Edge Case 2 — Truthfulness check before calling S02 done

### Steps
1. Ask: does the live CLI/report/gate/proof path now expose all three of these end to end?
   - undeclared observed HTTP statuses,
   - supported parameter-value drift,
   - response-header drift.
2. Require evidence from:
   - CLI output,
   - report JSON,
   - fail-closed stderr / semantic precedence,
   - live proof artifacts.

### Expected
1. If any one of those surfaces is still missing, S02 must remain not-done.
2. Do **not** treat green payload-era verifiers alone as proof of S02 completion.

## Failure Signals

- `HTTP Core Conformance` is still absent from CLI stdout.
- `computeHttpCoreConformance(...)` is still not wired through `cli.ts`.
- `evaluateGateFailures(...)` still fail-closes only on payload semantics.
- Docs/CI red-path artifacts still point at `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` instead of HTTP core drift.
- Required focused HTTP core test files referenced by the slice plan are still missing.

## Notes for the next tester / agent

The most important closeout lesson is that S02 currently has **green verification commands but incomplete milestone semantics**. Re-verify the proof surfaces, not just the command exit codes, before promoting the slice to done.
