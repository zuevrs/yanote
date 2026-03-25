# S01 Research — HTTP evidence depth for undeclared statuses, parameter values, and response headers

## Summary
- **Primary slice requirements:** `R031`, `R032`, `R033` with fail-closed support implications for `R002`.
- **Already true today:** live HTTP events already retain `method`, canonical `route`, `status`, payload bodies/content-types, and suite/run metadata. Undeclared-status analysis in **S02** will not need new recorder schema for status itself.
- **Not true today:** the canonical JVM event model does **not** retain value-bearing HTTP parameter/header evidence or response-header evidence. The Node model/parser only understands `queryKeys`/`headerKeys`, which is presence-only and fixture-fed today.
- **Biggest planning insight:** treat S01 as an **additive evidence-shape slice**, not an analyzer slice. The safest seam is: **event model + recorder capture + JSONL reader + live proof fixtures**, while preserving existing `queryKeys`/`headerKeys` behavior for current coverage/report tests.

## Skills applied
- **`openapi-specification-v3.2`**: response headers are a Response Object surface separate from body content; parameter/header semantics should stay on the supported core path, not drift into full style/explode coverage.
- **`debug-like-expert`**: verify actual evidence shape end to end; do not assume the live recorder path already emits what fixtures imply.
- **`java-junit` / `vitest` / `test`**: extend existing focused module tests first, then add proof-verifier coverage.
- **`bash-scripting`**: verifier updates should stay strict (`set -euo pipefail`) and artifact-driven.

## Skills discovered
- Installed globally for later units: **`spring-web`** via `npx skills add claude-dev-suite/claude-dev-suite@spring-web -g -y`.
- It is **not yet available in the current prompt’s installed-skill list**, so this unit could not invoke it directly. Future units should have it available after prompt refresh.

## What exists now

### 1. Canonical JVM event shape is still too shallow for value conformance
**Files:**
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`

**Current reality:**
- `HttpEvent` contains `ts`, `method`, `route`, `test.run_id`, `test.suite`, `status`, payload fields, `service`, `instance`, `error`.
- It does **not** contain `queryKeys`, `headerKeys`, path-param values, query values, request-header values, or response-header values.
- `HttpEventRecordingFilter` currently records only route/method/status + payload snapshots.

**Planner implication:**
- Any live Spring MVC proof for `R032`/`R033` needs additive fields in the canonical `yanote-core` record first.
- Because Jackson serializes the record directly, changing `HttpEvent` is the main schema boundary for recorder → JSONL → Node analyzer.

### 2. Recorder currently has payload omission semantics worth reusing as a pattern
**File:** `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`

**Current reality:**
- Payload capture already distinguishes captured vs omitted and attaches reasons like policy filtering / malformed / oversized.
- This is exactly the kind of explicit evidence vocabulary the roadmap says S01 must preserve for parameter/header capture.

**Planner implication:**
- Do **not** introduce bare `null`/missing semantics for new evidence if omission intent matters.
- Reuse or parallel the existing capture-state pattern for parameter/header/header-value evidence so S02 can distinguish:
  - captured
  - unavailable
  - intentionally omitted / redacted

### 3. Node-side HTTP model/parser still reflects old key-presence-only world
**Files:**
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/parameterCoverage.ts`

**Current reality:**
- TS `HttpEvent` requires `queryKeys: string[]` and `headerKeys: string[]`.
- `readJsonl.ts` normalizes only those arrays.
- `coverage.ts` aggregates only status set + `queryKeys` + `headerKeys`.
- `parameterCoverage.ts` is key-presence-only; path coverage is inferred from operation hit.

**Planner implication:**
- S01 should extend the TS model/parser **additively** without forcing S02 semantics immediately.
- Existing `queryKeys`/`headerKeys` must remain populated/derived so all current coverage/report tests stay green.
- Natural pattern: add richer value-bearing maps/collections while preserving legacy key arrays as compatibility fields.

### 4. Status drift is analyzer work later; S01 only needs live proof inputs
**Files:**
- `yanote-js/src/coverage/statusCoverage.ts`
- `yanote-js/src/coverage/statusCoverage.test.ts`

**Current reality:**
- Status evidence already exists through `event.status`.
- `computeStatusCoverage` already handles explicit codes, `2XX`, and `default`; it does **not** surface undeclared observed statuses yet.

**Planner implication:**
- S01 does **not** need recorder status schema work.
- It **does** need a live proof path that emits an observed status not declared in the example OpenAPI, so S02 has real evidence to consume.

### 5. OpenAPI extraction does not yet know about response headers
**File:** `yanote-js/src/spec/openapi.ts`

**Current reality:**
- Current HTTP contract extraction only loads:
  - declared statuses
  - path/query/header parameter definitions
  - request body content
  - response body content
- No response-header contract extraction exists today.

**Planner implication:**
- Keep S01 limited to **evidence retention** for response headers.
- Response-header OpenAPI extraction belongs naturally in S02 when report/gate semantics are added.

### 6. Live proof surfaces are still payload-focused
**Files:**
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/demo-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`

**Current reality:**
- Example service exercises:
  - `/users`
  - `/users/{id}`
  - `/admin/ping`
  - payload-bearing `POST /users`
- Example OpenAPI has path param + payload contracts, but **no query/header parameter declarations and no response-header declarations**.
- `verify-s02-analysis-path.sh` is already heavy and report-oriented; it proves payload/report semantics, not recorder depth.
- `run-v1-e2e.sh` is broader retained acceptance and should be touched carefully.

**Planner implication:**
- Do not use the heavy retained report verifier as the first integration step for S01.
- Safer order:
  1. module-level recorder tests
  2. narrow live recorder proof (new or recorder-focused verifier)
  3. only then widen retained proof surfaces if needed

## Natural seams / likely task split

### Seam A — Canonical evidence-shape extension
**Files likely touched:**
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- matching core tests / any serializer expectations
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- parser tests under `yanote-js/src/events/*.test.ts`

**Goal:** add additive fields for value-bearing evidence and keep old key arrays compatible.

**Strong recommendation:**
- Preserve `queryKeys` and `headerKeys` for backward compatibility.
- Add new structures for:
  - path parameter values
  - query parameter values
  - request header values
  - response header values
- Prefer **multi-value-safe** representation (`string[]` per key), not comma-joined strings.

### Seam B — Spring MVC recorder capture + redaction/omission policy
**Files likely touched:**
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- likely new helper class(es) near `HttpPayloadCapture.java`
- `YanoteRecorderProperties.java` / auto-config only if new config knobs are introduced
- recorder tests in `yanote-recorder-spring-mvc/src/test/java/...`

**Goal:** capture values from live requests/responses safely.

**Most likely capture sources:**
- path values: request attributes / URI template variables
- query values: servlet request parameter map
- request headers: servlet header enumeration
- response headers: `ContentCachingResponseWrapper` / response header names after filter chain

**Important constraint:**
- Header names should probably stay case-insensitive and normalize to lowercase, matching current `headerKeys` behavior.
- Query parameter names should probably preserve exact names for later contract matching.

### Seam C — Live proof surface for S01 only
**Files likely touched:**
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/demo-openapi.yaml` or a new dedicated OpenAPI fixture
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- possibly a new focused verifier script under `scripts/docs/`

**Goal:** prove real recorder output now contains:
- an undeclared observed status
- retained parameter values
- retained response-header values
- explicit omission/redaction markers where policy blocks capture

**Recommendation:**
- Prefer a **dedicated recorder-depth endpoint/test path** over mutating the existing 4-operation happy path immediately.
- This reduces churn in current payload/report expectations while S01 is still only about evidence shape.

## Evidence-shape decisions the planner should force early

### 1. Additive schema, not replacement
Keep legacy fields alive while adding richer evidence. Current JS/report tests assume `queryKeys`/`headerKeys` exist.

### 2. Multi-value collections, not flattened strings
Needed for truthful repeated query params and repeated headers.

### 3. Explicit omission/redaction vocabulary
The roadmap explicitly wants analyzer-visible distinction between captured, unavailable, intentionally omitted. Reuse the payload-capture pattern or add sibling enums/types.

### 4. Redaction policy before analyzer dependency
This slice is blocked on choosing at least a minimal safe default for sensitive names.

**Minimum denylist worth planning for immediately:**
- request headers: `authorization`, `proxy-authorization`, `cookie`, `set-cookie`
- query/header names containing `token`, `secret`, `password`, `session`, `apikey`, `api-key`, `key` probably need omission/redaction handling

### 5. Response headers are lower-risk than request auth headers
Good initial live-proof candidates:
- `x-trace-id`
- `etag`
- `location`
- custom demo header like `x-demo-version`

## What to prove first
1. **Unit/module proof first:** recorder test that writes one JSONL line containing new additive evidence fields and omission markers.
2. **Parser proof second:** Node `readJsonl` accepts the new fields, normalizes them deterministically, and still derives `queryKeys`/`headerKeys`.
3. **Live service proof third:** example Spring MVC service + RestAssured path emits the new evidence on real traffic.
4. **Only after that:** broader retained scripts (`verify-s02-analysis-path.sh`, `run-v1-e2e.sh`) if they truly need widening in S01.

This follows the `debug-like-expert` rule: **verify, don’t assume**. The riskiest point is the recorder/event-model seam, not the final report.

## Verification stack

### Java / recorder module
- Targeted recorder tests under `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/`
- Existing anchor test: `RecorderWritesJsonlTest.java`

**What new tests should assert:**
- JSONL includes added value-bearing fields
- legacy `queryKeys`/`headerKeys` remain present if still serialized
- sensitive headers/params are omitted or redacted with explicit reason/state
- response headers are captured after controller execution

### Node / parser compatibility
- `yanote-js/src/events/readJsonl*.test.ts`
- likely new fixture-focused tests for additive fields

**What to assert:**
- deterministic normalization
- lowercased header-name normalization
- repeated query/header values preserved in arrays
- compatibility fallback for old events that lack new fields

### Live proof
- Example service / RestAssured integration
- Prefer a focused script rather than immediately widening the retained payload verifier

**Likely commands:**
- `./gradlew :yanote-recorder-spring-mvc:test`
- `npm -C yanote-js test -- --runInBand` or project-equivalent Vitest command already used in repo
- focused docs verifier script for the new recorder-depth path

### Safety regression checks
- Existing payload/report proof should still pass after additive changes:
  - `bash scripts/docs/verify-s02-analysis-path.sh`
  - `bash scripts/ci/run-v1-e2e.sh`

Run these **after** the focused proof is stable, not as the first feedback loop.

## Risks / watch-outs
- **Canonical schema drift:** `yanote-core` and `yanote-js` must move together; otherwise live events serialize fields Node ignores or Node requires fields live events never emit.
- **Fixture illusion risk:** JS fixtures already include `queryKeys`/`headerKeys`, but live recorder output currently cannot emit them because `HttpEvent.java` lacks those fields.
- **Proof churn risk:** touching the main example/report path too early will create noisy expectation changes unrelated to recorder depth.
- **Secret leakage risk:** request header/query capture without a denylist or omission model is unsafe.
- **Over-scope risk:** S01 should not implement full OpenAPI parameter/header validation; it should only deliver truthful evidence inputs for S02.

## Recommended execution order for planner
1. Extend canonical HTTP event schema additively in `yanote-core` and `yanote-js` model/parser.
2. Implement Spring MVC capture helpers for path/query/request-header/response-header evidence with omission policy.
3. Add focused recorder tests proving serialized JSONL shape and omission semantics.
4. Add or adjust example service/test route(s) to emit live undeclared status + safe parameter/header/header-value evidence.
5. Add a focused verifier for live recorder depth.
6. Only then decide whether existing heavy retained verifiers need widening in S01 or can wait for S02.

## Resume notes
- No code was changed in this scout unit.
- `spring-web` was installed globally but could not be invoked in this context because the current prompt’s installed-skill registry had not refreshed yet.
- Next unit should start from this file and decompose tasks around the three seams above: **schema → recorder capture → live proof**.
