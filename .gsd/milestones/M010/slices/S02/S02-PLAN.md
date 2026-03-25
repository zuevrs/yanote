# S02: HTTP Core Contract Completeness In Report And Gates

**Goal:** Upgrade the `yanote-js` HTTP analysis path so reports, gates, and retained proof scripts can surface undeclared statuses, supported parameter-value drift, and response-header drift from S01 evidence without regressing the already-proven operation/status/payload baseline.
**Demo:** Running `yanote report` on the live Spring MVC proof path plus the retained red fixtures produces deterministic HTTP core conformance diagnostics, fails closed on the new semantic drift codes, and keeps the happy-path verifier green by separating the intentionally red `/evidence/users/{id}` proof from the green denominator.
**Active requirements:** Owns `R031`, `R032`, `R033`; supports `R001`, `R002`, `R003`.

## Must-Haves

- `yanote-js` extracts the supported OpenAPI parameter schema subset plus response-header contracts, and all HTTP analyzers consume one shared operation-evidence resolver built on the richer S01 JSONL shape.
- Observed-but-undeclared statuses, supported path/query/header parameter values, and supported response headers become explicit typed HTTP core diagnostics instead of being hidden inside the legacy coverage percentages.
- Report JSON, fail-closed gate evaluation, CLI summaries, and `YANOTE_ERROR` / `YANOTE_SUMMARY` output surface the new HTTP core truth deterministically while preserving the existing operation/status/payload baseline.
- The retained proof stack keeps a truthful green path for `DemoServiceE2eTest` and a separate red path for `/evidence/users/{id}`, with verifier artifacts that make denominator contamination and semantic drift easy to diagnose.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts`
- `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
- `bash scripts/docs/verify-s02-analysis-path.sh`
- `bash scripts/ci/run-v1-e2e.sh`

## Observability / Diagnostics

- Runtime signals: `yanote-report.json` gains deterministic HTTP core conformance summaries and diagnostics; CLI stderr gains stable semantic failure codes for undeclared status, parameter-value drift, and response-header drift.
- Inspection surfaces: `yanote-js` contract/unit tests, `yanote report` stdout/stderr, retained verifier temp directories from `scripts/docs/verify-s02-analysis-path.sh`, and the CI bundle emitted by `scripts/ci/run-v1-e2e.sh`.
- Failure visibility: each new drift surface should expose `operationKey`, target, observed status/header/value context, capture state/reason, and suite so a future agent can localize the failing contract quickly.
- Redaction constraints: request/header evidence must continue honoring S01 captured/redacted/omitted states; verifier artifacts must not reintroduce sensitive values while proving drift.

## Integration Closure

- Upstream surfaces consumed: S01 additive HTTP evidence through `yanote-js/src/model/httpEvent.ts` and `yanote-js/src/events/readJsonl.ts`, current OpenAPI extraction, existing HTTP coverage/payload pipelines, and the Spring MVC example/verifier stack.
- New wiring introduced in this slice: shared HTTP operation evidence resolution, additive `httpCoreConformance` analysis/report surfaces, semantic gate mapping for the new HTTP drift codes, and green-vs-red proof handling in the retained verifier path.
- What remains before the milestone is truly usable end-to-end: S04 still needs to harden docs and final public boundary wording; the HTTP analyzer/report/gate path itself should be complete after this slice.

## Tasks

- [x] **T01: Extract supported HTTP contracts and shared operation evidence** `est:1h20m`
  - Why: S02 needs one truthful declared-contract shape and one shared live-evidence resolver before adding new semantics, otherwise status/parameter/header analyzers will drift from each other.
  - Files: `yanote-js/src/coverage/dimensions.ts`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/src/coverage/httpOperationEvidence.ts`, `yanote-js/src/coverage/httpOperationEvidence.test.ts`, `yanote-js/src/coverage/coverage.ts`
  - Do: extend `ParameterDefinition` with the supported schema subset, add response-header contract extraction on `HttpOperationContract`, create a shared HTTP operation-evidence helper that resolves routes once and aggregates statuses plus path/query/request-header/response-header evidence from S01 JSONL, then migrate legacy coverage to that helper without changing current percentage semantics.
  - Verify: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts`
  - Done when: downstream analyzers can read supported parameter/header contracts and shared live evidence from one place, and the existing coverage tests still prove the old baseline.
- [x] **T02: Build typed HTTP core conformance analyzers** `est:1h45m`
  - Why: R031-R033 require explicit drift semantics for undeclared statuses, supported parameter values, and response headers; the old key-presence analyzers cannot provide that truth.
  - Files: `yanote-js/src/coverage/statusCoverage.ts`, `yanote-js/src/coverage/statusCoverage.test.ts`, `yanote-js/src/coverage/httpParameterValueConformance.ts`, `yanote-js/src/coverage/httpParameterValueConformance.test.ts`, `yanote-js/src/coverage/httpResponseHeaderConformance.ts`, `yanote-js/src/coverage/httpResponseHeaderConformance.test.ts`, `yanote-js/src/coverage/httpCoreConformance.ts`, `yanote-js/src/coverage/httpCoreConformance.test.ts`
  - Do: keep declared-status coverage math intact but add undeclared observed statuses as additive output; validate supported path/query/request-header values from retained evidence and capture states with one explicit coercion/repeated-value policy; validate response headers against exact/`2XX`/`default` response selection; and aggregate the per-operation diagnostics into a typed `httpCoreConformance` result.
  - Verify: `npm -C yanote-js test -- src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts`
  - Done when: the analyzer emits deterministic per-operation HTTP core diagnostics for undeclared statuses, parameter-value drift, and response-header drift without redefining the legacy coverage numerators.
- [x] **T03: Serialize HTTP core conformance into the report contract** `est:1h15m`
  - Why: new analyzer truth is not user-facing until the JSON report schema, normalized output, and determinism tests carry it as an additive supported surface.
  - Files: `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/report.contract.test.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`
  - Do: add a deterministic `httpCoreConformance` report section with summary counts, per-operation state, and typed diagnostics for undeclared statuses, parameter values, and response headers; keep serialization order stable; and pin the schema/contract/determinism behavior in report tests.
  - Verify: `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts`
  - Done when: `yanote-report.json` exposes the new HTTP core truth in a schema-validated, normalized, byte-stable form.
- [x] **T04: Wire fail-closed gate semantics and CLI output for HTTP core drift** `est:1h30m`
  - Why: the milestone requires the new drift surfaces to stop bad contracts in real CLI/CI flows, not just appear in report JSON.
  - Files: `yanote-js/src/gates/httpCoreSemantics.ts`, `yanote-js/src/gates/httpCoreSemantics.test.ts`, `yanote-js/src/gates/evaluator.ts`, `yanote-js/src/gates/failureOrder.ts`, `yanote-js/src/gates/failureOrder.test.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`
  - Do: map HTTP core diagnostics to stable semantic failure codes/hints, extend precedence ordering so the new HTTP drift codes sort deterministically with existing payload semantics, fail closed before threshold gates when new semantic drift exists, and surface the new section/top-issues/machine-summary fields in CLI stdout and stderr.
  - Verify: `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/failureOrder.test.ts src/gates/evaluator.threshold.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
  - Done when: `yanote report` emits stable primary/secondary failures for the new HTTP core drift cases and existing fail-closed CLI contracts remain green.
- [x] **T05: Refresh live proof scripts for green and red HTTP core paths** `est:1h20m`
  - Why: S02 is only complete if the live proof path stays truthful — the happy path must remain green while the intentionally red evidence route proves the new fail-closed semantics end to end.
  - Files: `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`, `examples/openapi/demo-openapi.yaml`
  - Do: keep the `DemoServiceE2eTest` denominator green by explicitly excluding or splitting the intentionally red `/evidence/users/{id}` route from the happy-path analyzer expectations; update stale fixture/event assertions to the S01 value-evidence shape; add explicit red-path assertions for undeclared status, parameter-value drift, and response-header drift in report/CLI artifacts; and preserve retained failure artifacts that distinguish denominator problems from semantic drift.
  - Verify: `bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/ci/run-v1-e2e.sh`
  - Done when: the live green proof stays green, the red proof fails closed on the new HTTP core semantics, and the retained artifacts make both paths diagnosable.

## Files Likely Touched

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/httpOperationEvidence.ts`
- `yanote-js/src/coverage/httpOperationEvidence.test.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/statusCoverage.ts`
- `yanote-js/src/coverage/statusCoverage.test.ts`
- `yanote-js/src/coverage/httpParameterValueConformance.ts`
- `yanote-js/src/coverage/httpParameterValueConformance.test.ts`
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts`
- `yanote-js/src/coverage/httpResponseHeaderConformance.test.ts`
- `yanote-js/src/coverage/httpCoreConformance.ts`
- `yanote-js/src/coverage/httpCoreConformance.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/gates/httpCoreSemantics.ts`
- `yanote-js/src/gates/httpCoreSemantics.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`
- `examples/openapi/demo-openapi.yaml`
