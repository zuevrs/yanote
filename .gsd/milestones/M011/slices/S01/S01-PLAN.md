# S01: Safe Request Evidence And First Scalar Truth

**Goal:** Carry safe path/query/header/cookie request evidence through the Spring MVC recorder → JSONL → analyzer path and expose first scalar truth in `yanote report` on a focused proof route without changing canonical routes or legacy coverage numerators.
**Demo:** After this slice, a focused Spring MVC route can be exercised end to end and `yanote report` shows captured/redacted/omitted path/query/header/cookie evidence plus first supported scalar parameter/cookie truth on retained artifacts.
**Active requirements:** Supports active requirement `R022`; preserves validated requirement `R001`.

## Must-Haves

- The JVM recorder writes additive multi-value-safe `pathParams`, `queryParams`, `requestHeaders`, and `cookies` evidence with captured/redacted/omitted provenance; canonical `route` stays templated, and Yanote metadata headers stay outside semantic evidence.
- The Node analyzer reads old and new HTTP events, derives legacy `queryKeys` / `headerKeys` from captured evidence when needed, and evaluates the first supported scalar path/query/header/cookie semantics without redefining the existing coverage percentages.
- `yanote report` exposes a separate request-conformance surface that shows captured/redacted/omitted evidence plus per-parameter scalar truth on retained artifacts.
- A focused Spring MVC proof route and verifier demonstrate the same request end to end through raw `events.jsonl` and `yanote-report.json`, supporting active requirement `R022` while preserving the validated `R001` recorder → JSONL → analyzer → report contract.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`
- `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`
- `bash scripts/ci/verify-m011-s01-request-evidence.sh`

## Observability / Diagnostics

- Runtime signals: raw HTTP JSONL carries additive `pathParams`, `queryParams`, `requestHeaders`, and `cookies` evidence with captured/redacted/omitted provenance, and the analyzer/report layer emits deterministic `httpRequestConformance` summaries plus per-parameter scalar diagnostics.
- Inspection surfaces: focused Java tests, focused `yanote-js` request-conformance/report tests, the retained `events.jsonl` artifact, `yanote-report.json`, and `bash scripts/ci/verify-m011-s01-request-evidence.sh`.
- Failure visibility: retained artifacts identify the failing `operationKey`, request location/name, observed values or redaction/omission reason, suite, and whether the drift happened in capture, JSONL normalization, or report rendering.
- Redaction constraints: sensitive headers/cookies and Yanote test-metadata headers must never leak raw values into recorder artifacts, report JSON, or CLI output.

## Integration Closure

- Upstream surfaces consumed: `HttpServletRequest` / Spring MVC handler mapping, the `yanote-core` HTTP event JSONL contract, the `yanote-js` OpenAPI extraction + report pipeline, and the example Spring MVC service/test harness.
- New wiring introduced in this slice: request-evidence capture from the Spring MVC filter into additive JSONL fields, Node-side first-scalar request conformance, and report/CLI publication of the new request-conformance surface.
- What remains before the milestone is truly usable end-to-end: S02 must broaden supported serialization/cookie semantics beyond the first scalar subset; S03 must add format/media truth; S04 must close docs/CI/public-boundary wording.

## Tasks

- [x] **T01: Capture additive HTTP request evidence in the recorder and JSONL contract** `est:1h30m`
  - Why: Safe request evidence is the slice’s main risk retiree; without additive path/query/header/cookie retention, later scalar truth would be guesswork.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`, `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
  - Do: extend the HTTP event contract and Spring MVC filter with multi-value-safe request evidence, exclude Yanote metadata headers, redact sensitive header/cookie inputs, and pin the raw JSONL shape in focused Java tests.
  - Verify: `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`
  - Done when: recorder JSONL includes additive request evidence maps with captured/redacted/omitted provenance and focused Java tests prove the expected capture/redaction/omission behavior.
- [x] **T02: Normalize request evidence and compute first scalar request conformance** `est:1h40m`
  - Why: Recorded evidence is only useful if Node can ingest it backward-compatibly and turn it into honest scalar truth instead of new hidden assumptions.
  - Files: `yanote-js/src/model/httpEvent.ts`, `yanote-js/src/events/readJsonl.ts`, `yanote-js/src/coverage/dimensions.ts`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/coverage/httpRequestConformance.ts`
  - Do: normalize the new request-evidence maps, derive legacy key arrays when needed, extend the OpenAPI parameter contract just far enough for S01 cookies/scalars, and add a dedicated request-conformance analyzer that distinguishes captured, redacted, omitted, and unsupported paths without redefining `coverage.parameters`.
  - Verify: `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts`
  - Done when: old and new HTTP fixtures both load cleanly, cookie parameters are no longer ignored, and focused Vitest fixtures prove first scalar truth for retained path/query/header/cookie evidence.
- [x] **T03: Publish request evidence and scalar truth in report and CLI surfaces** `est:1h20m`
  - Why: The slice is not user-visible until `yanote-report.json`, CLI stdout, and `YANOTE_SUMMARY` publish the new request-conformance surface teams already inspect.
  - Files: `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/report/report.requestEvidence.contract.test.ts`, `yanote-js/src/cli.requestEvidence.test.ts`
  - Do: add an additive `httpRequestConformance` report section, stabilize schema/normalization ordering, and surface deterministic request-evidence summary tokens in the CLI without changing legacy coverage or payload numerators.
  - Verify: `npm -C yanote-js test -- src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`
  - Done when: focused report/CLI contract tests pass, the new surface is schema-valid and deterministic, and redacted/omitted request values never leak into report or CLI output.
- [x] **T04: Prove request evidence end to end on a focused Spring MVC route** `est:1h20m`
  - Why: S01 has to prove the real recorder → JSONL → analyzer path on a live route, not just unit-level wiring, while keeping the existing happy-path bundle untouched.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/openapi/request-evidence-openapi.yaml`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`, `scripts/ci/verify-m011-s01-request-evidence.sh`
  - Do: add a focused example route plus matching spec, drive it with a RestAssured proof that inspects raw `events.jsonl`, and add a verifier script that asserts retained request evidence and first scalar truth in `yanote-report.json`.
  - Verify: `bash scripts/ci/verify-m011-s01-request-evidence.sh`
  - Done when: the focused verifier passes from the repo root and retains enough artifacts to show whether any drift came from recorder capture, JSONL normalization, or report rendering.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-core/src/test/java/dev/yanote/core/events/HttpEventRequestEvidenceJsonlRoundTripTest.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCaptureTest.java`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s01-request-evidence.sh`
