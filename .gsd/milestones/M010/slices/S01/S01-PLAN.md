# S01: HTTP Evidence Depth For Undeclared Statuses, Parameter Values, And Response Headers

**Goal:** Extend the canonical HTTP event plus Spring MVC recorder path so live evidence retains redaction-safe path/query/request-header/response-header facts, along with observed undeclared statuses, without breaking existing coverage consumers that still rely on `queryKeys` and `headerKeys`.
**Demo:** A focused live Spring MVC proof emits JSONL where one recorded event shows an undeclared observed status, preserved path/query/header/header-value evidence, explicit redaction or omission markers for sensitive request inputs, and `yanote-js` parser compatibility for both legacy and additive HTTP event shapes.
**Active requirements:** `R031`, `R032`, `R033` (with fail-closed implications for validated `R002` in S02).

## Must-Haves

- The canonical `HttpEvent` / JSONL / `yanote-js` parser contract carries additive value-bearing HTTP evidence for path params, query params, request headers, and response headers while preserving compatibility `queryKeys` / `headerKeys`.
- The Spring MVC recorder captures those facts on real traffic, lowercases header names, preserves multi-value inputs, and marks sensitive or unavailable request/header evidence with explicit capture/redaction/omission state instead of silent nulls.
- The example service, demo OpenAPI fixture, focused RestAssured path, and slice verifier prove one live undeclared status plus safe parameter/header/response-header evidence end to end without regressing the existing analyzer proof path.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"`
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest" --info`
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`
- `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`
- `bash scripts/docs/verify-s02-analysis-path.sh`

## Observability / Diagnostics

- Runtime signals: recorded HTTP JSONL lines include legacy key arrays plus additive parameter/header evidence with per-key state/reason.
- Inspection surfaces: focused `events.jsonl` artifacts from the new verifier, `RecorderWritesJsonlTest`, `EventJsonlRoundTripTest`, and `readJsonl.httpEvidence.test.ts`.
- Failure visibility: schema drift, lost multi-values, wrong header normalization, or secret leakage fail through explicit field assertions instead of only aggregate report percentages.
- Redaction constraints: sensitive request headers/query names must never persist raw values; response headers should retain only safe text values or explicit omission reasons.

## Integration Closure

- Upstream surfaces consumed: `yanote-core` HTTP event schema, Spring MVC recorder filter/payload helpers, `yanote-js` HTTP model/parser, example Spring MVC service, demo OpenAPI spec, and existing `verify-s02-analysis-path.sh`.
- New wiring introduced in this slice: additive HTTP evidence contract, recorder-side capture/redaction helpers, and a focused live verifier for the richer JSONL surface.
- What remains before the milestone is truly usable end-to-end: S02 still must turn the new evidence into report/gate semantics for undeclared statuses, parameter-value drift, and response-header drift.

## Tasks

- [x] **T01: Extend the HTTP event contract and Node parser for additive evidence** `est:1h15m`
  - Why: S01 needs one canonical cross-runtime shape before live recorder work or S02 semantics can depend on it.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`, `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`, `yanote-js/src/model/httpEvent.ts`, `yanote-js/src/events/readJsonl.ts`, `yanote-js/src/events/readJsonl.httpEvidence.test.ts`
  - Do: Add additive HTTP evidence types on `HttpEvent` for path values, query values, request headers, and response headers; keep compatibility `queryKeys`/`headerKeys`; mirror the explicit capture-state pattern already used on the Kafka side; and teach `yanote-js` to normalize both legacy and new event shapes deterministically.
  - Verify: `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest" && npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`
  - Done when: additive HTTP evidence round-trips through JSONL, legacy HTTP events still parse, and `yanote-js` exposes stable key arrays plus richer evidence for later analyzers.
- [x] **T02: Capture redaction-safe parameter and header evidence in the Spring MVC recorder** `est:1h30m`
  - Why: the schema is only useful if the live recorder populates it with safe defaults instead of leaking or dropping value-bearing evidence.
  - Files: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`, `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
  - Do: Add recorder-side capture helpers for URI template variables, repeated query params, request headers, and response headers; normalize header names to lowercase; preserve repeated values as arrays; and apply a minimal sensitive-name policy so request secrets become explicit redacted/omitted evidence instead of raw JSONL values.
  - Verify: `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`
  - Done when: Spring MVC recording emits additive evidence fields with explicit states/reasons, repeated query/header values survive intact, and sensitive request inputs never appear raw in JSONL.
- [x] **T03: Prove live undeclared-status and header/value evidence on the example service** `est:1h15m`
  - Why: this slice is only complete once a real example path produces the richer evidence shape and leaves S02 concrete live inputs for undeclared-status and response-header checks.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/openapi/demo-openapi.yaml`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`, `scripts/docs/verify-m010-s01-http-evidence-depth.sh`
  - Do: Add a dedicated example endpoint that exercises path/query/request-header capture, returns an intentionally undeclared status, and emits safe response headers; declare the supported parameter/header/response-header contract in `demo-openapi.yaml` while deliberately leaving that observed status undeclared; then add a focused RestAssured proof and verifier script that inspect recorded JSONL directly before re-running the existing analyzer-path regression verifier.
  - Verify: `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh && bash scripts/docs/verify-s02-analysis-path.sh`
  - Done when: the live example emits richer evidence on real traffic, the undeclared status is present for S02 to consume, and the existing analyzer proof path still passes.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/events/readJsonl.httpEvidence.test.ts`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/demo-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`
- `scripts/docs/verify-m010-s01-http-evidence-depth.sh`
