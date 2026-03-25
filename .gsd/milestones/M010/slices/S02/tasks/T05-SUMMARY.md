---
id: T05
parent: S02
milestone: M010
provides:
  - Durable resume notes for the proof-script refresh, including the confirmed live HTTP core CLI/gate wiring gap that must land before the verifier can be updated truthfully.
key_files:
  - scripts/docs/verify-s02-analysis-path.sh
  - scripts/ci/run-v1-e2e.sh
  - yanote-js/src/cli.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/coverage/httpCoreConformance.ts
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java
  - examples/openapi/demo-openapi.yaml
key_decisions:
  - Do not retarget the retained proof scripts until the live CLI/report path actually computes and fail-closes on HTTP core conformance, otherwise the verifier would only fossilize payload-era assertions.
patterns_established:
  - For this slice, verify live proof scripts against shipped analyzer surfaces first: analyzer computation -> gate/evaluator wiring -> CLI summary output -> retained docs/CI verifiers.
observability_surfaces:
  - scripts/docs/verify-s02-analysis-path.sh
  - scripts/ci/run-v1-e2e.sh
  - yanote-js/src/cli.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/coverage/httpCoreConformance.ts
duration: 0h30m
verification_result: partial
completed_at: 2026-03-25T05:50:00+03:00
blocker_discovered: false
---

# T05: Refresh live proof scripts for green and red HTTP core paths

**Recorded a clean T05 handoff after confirming that the retained proof scripts are still payload-era and that the live HTTP core CLI/gate wiring they need to verify is not yet landed.**

## What Happened

I used this unit to read the active execution contract and the live proof/runtime surfaces that T05 must update:
- `.gsd/STATE.md`
- `.gsd/milestones/M010/slices/S02/S02-PLAN.md`
- `.gsd/milestones/M010/slices/S02/tasks/T05-PLAN.md`
- `.gsd/milestones/M010/slices/S02/tasks/T04-SUMMARY.md`
- the task-summary template
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`
- `examples/openapi/demo-openapi.yaml`
- `examples/openapi/demo-openapi-unsupported-schema.yaml`
- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/coverage/httpCoreConformance.ts`
- `yanote-js/src/coverage/httpParameterValueConformance.ts`
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/evaluator.threshold.test.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`

From that inspection, I confirmed these concrete facts:
1. `scripts/docs/verify-s02-analysis-path.sh` is still asserting HTTP payload conformance fixtures and the old `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` red path instead of the S02 HTTP core red path.
2. `scripts/ci/run-v1-e2e.sh` still re-runs the retained semantic red pass against `examples/openapi/demo-openapi-unsupported-schema.yaml`, which is also payload-era, not the `/evidence/users/{id}` HTTP core proof path.
3. The green and red Java traffic sources are already separated at the test level: `DemoServiceE2eTest.java` exercises the green `/users` and `/admin/ping` path, while `HttpEvidenceDepthE2eTest.java` exercises the intentionally red `/evidence/users/{id}` path with S01-style captured/redacted/omitted evidence.
4. The shared demo spec already declares the intentionally red `/evidence/users/{id}` route and its supported parameters/headers, so the spec itself is not the current blocker.
5. The live CLI path in `yanote-js/src/cli.ts` still computes only legacy coverage plus `computeHttpPayloadConformance(...)`; it does not compute `computeHttpCoreConformance(...)` or pass `httpCoreConformance` into `buildReport(...)`.
6. `yanote-js/src/gates/evaluator.ts` still accepts only `httpPayloadDiagnostics` for semantic fail-closed behavior; it has no HTTP core diagnostic input.
7. `yanote-js/src/gates/failureOrder.ts` still ranks only payload semantic codes (`SEMANTIC_HTTP_INVALID_BODY`, `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, etc.); there are no HTTP core semantic ranks for undeclared status, parameter-value drift, or response-header drift.
8. The dedicated T04/T05 HTTP core test surfaces are still missing locally (for example there is no `yanote-js/src/gates/httpCoreSemantics.ts` or `yanote-js/src/coverage/httpCoreConformance.test.ts` on disk), which matches the T04 handoff note that the runtime wiring never landed.

Because that runtime wiring is still absent, updating the retained proof scripts in this unit would have meant hard-coding expectations for behavior the shipped CLI does not yet produce. The context-budget warning arrived before I could implement the missing runtime path, so I stopped and wrote this handoff instead of starting half-finished code changes.

## Verification

I verified the current state in two ways:
- I queried the codebase for live HTTP core wiring and semantic codes to confirm that the analyzer exists but the CLI/evaluator/failure-order path still does not consume it.
- I ran the currently present gate/CLI test subset to confirm local reality: the existing tests are green, but they are still payload-era and therefore do not prove the S02 HTTP core end-to-end path yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `rg -n "computeHttpCoreConformance|httpCoreDiagnostics|SEMANTIC_HTTP_(UNDECLARED_STATUS|PARAMETER|RESPONSE_HEADER|INVALID_PARAMETER|INVALID_HEADER|HEADER)" yanote-js/src -S` | 0 | ✅ pass | <1s |
| 2 | `npm -C yanote-js test -- src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | ~1s |
| 3 | Slice-level verifier commands from the T05 plan were not rerun in this unit because the inspected runtime path still lacks HTTP core CLI/gate wiring. | n/a | ❌ fail | n/a |

## Diagnostics

Resume from these exact points, in this order:
- `yanote-js/src/cli.ts` — compute `computeHttpCoreConformance(...)`, pass `httpCoreConformance` into `buildReport(...)`, add an `HTTP Core Conformance` summary section, extend `YANOTE_SUMMARY`, and dedupe Top Issues against HTTP core semantic failures.
- `yanote-js/src/gates/evaluator.ts` — accept live HTTP core diagnostics and fail closed on them before threshold/regression gates, just like the payload path does today.
- `yanote-js/src/gates/failureOrder.ts` — add deterministic precedence ranks for the HTTP core semantic codes that T05 needs the proof scripts to assert.
- After that runtime wiring exists, retarget `scripts/docs/verify-s02-analysis-path.sh` away from the payload fixture matrix and toward two live paths: the green `DemoServiceE2eTest` denominator and the red `/evidence/users/{id}` semantic proof.
- Then retarget `scripts/ci/run-v1-e2e.sh` to preserve the same split in CI artifacts and manifest metadata.
- Only adjust `DemoServiceE2eTest.java`, `HttpEvidenceDepthE2eTest.java`, or `examples/openapi/demo-openapi.yaml` if the live end-to-end rerun shows a real mismatch after the CLI/gate wiring is present.

## Deviations

- I did not edit the verifier scripts, Java tests, or demo OpenAPI files in this unit.
- This deviation was caused by the context-budget warning arriving after I had confirmed that the prerequisite HTTP core runtime wiring is still missing locally; updating the proof scripts before that wiring lands would have been misleading.

## Known Issues

- `scripts/docs/verify-s02-analysis-path.sh` still verifies payload-era semantic fixtures instead of the S02 HTTP core red path.
- `scripts/ci/run-v1-e2e.sh` still asserts `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` from the payload-era unsupported-schema proof.
- `yanote-js/src/cli.ts` does not yet compute or serialize live `httpCoreConformance` from `computeHttpCoreConformance(...)`.
- `yanote-js/src/gates/evaluator.ts` and `yanote-js/src/gates/failureOrder.ts` still have no HTTP core semantic wiring.
- The dedicated local HTTP core gate/test files referenced by the slice plan are still absent.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S02/tasks/T05-SUMMARY.md` — recorded the verified proof-stack mismatch and the precise resume path.
- `.gsd/milestones/M010/slices/S02/S02-PLAN.md` — marked T05 as `[x]` per the required handoff flow.
- `.gsd/STATE.md` — refreshed the next-action note so the next unit starts from the confirmed HTTP core wiring gap.
