# S02 Research — HTTP core contract completeness in report and gates

## Requirement Focus

- **Owns:** `R031` observed-but-undeclared HTTP statuses surface as first-class drift; `R032` supported HTTP path/query/header parameter values are validated from retained evidence; `R033` supported HTTP response headers participate in HTTP contract conformance.
- **Supports:** `R001` (preserve the current truthful HTTP route/status/payload baseline), `R002` (new surfaces must fail closed), and `R003` (all new truth has to land in the existing CLI/report/CI surfaces instead of staying in internal helpers only).

## Summary

S02 is no longer a recorder slice. S01 already delivered the additive evidence seam end to end:

- canonical JVM event shape now carries `pathParams`, `queryParams`, `requestHeaders`, and `responseHeaders` with explicit `captured` / `redacted` / `omitted` state
- the Spring MVC recorder captures and redacts those values
- the Node reader already normalizes the additive evidence and derives compatibility `queryKeys` / `headerKeys`
- the example app already contains a focused `/evidence/users/{id}` route and a dedicated live proof test for undeclared status + richer evidence

The missing work is almost entirely inside `yanote-js` and the proof scripts around it.

Current analyzer/report/gate behavior is still too shallow for the slice requirements:

- `statusCoverage.ts` only measures declared-status coverage; it has no way to surface **observed undeclared statuses**.
- `parameterCoverage.ts` still validates **key presence only**. Path params are treated as covered whenever the operation was observed, query params use `queryKeys`, and headers use `headerKeys`; none of the retained values or capture states participate.
- `spec/openapi.ts` extracts declared statuses, request/response payloads, and parameter names/locations, but it does **not** retain parameter schemas for validation and does **not** extract response-header contracts.
- `coverage.ts` still aggregates only `statuses`, `queryKeys`, and `headerKeys`; it ignores the richer value-bearing evidence maps that S01 added.
- `report.ts` / `schema.ts` / `cli.ts` currently have no first-class surface for undeclared-status drift, parameter-value drift, or response-header drift.

The strongest implementation pattern already exists in-repo:

- HTTP payload drift uses a dedicated conformance engine (`httpPayloadConformance.ts`), a typed semantic gate mapper (`httpPayloadSemantics.ts`), stable report sections (`report.ts`), and deterministic CLI fail-closed behavior (`cli.ts`).
- Async Kafka header drift already uses the same typed-diagnostic pipeline (`asyncSchemaConformance.ts` → `asyncEvaluator.ts` → `asyncReport.ts`).

That is the right model for S02: **typed diagnostics + deterministic report sections + typed fail-closed gate errors**, not ad hoc booleans buried inside old coverage percentages.

## Recommendation

### 1. Extend the HTTP contract model first

Start with `yanote-js/src/spec/openapi.ts` and the core coverage types.

Natural changes:

- extend `ParameterDefinition` beyond `{ name, in, required }` so S02 can carry the supported schema subset it actually validates
- extend `HttpOperationContract` with **response-header contract data**, keyed by declared response status in the same way payload contracts are already keyed
- keep the supported scope narrow and explicit, per the `openapi-specification-v3.2` guidance:
  - stay on the normal `schema` path for `path` / `query` / `header` parameters
  - treat response headers as a Response Object / Header Object surface, separate from body payloads
  - do **not** widen into cookie params, style/explode matrices, `content`-based parameters, or broader OpenAPI constructs in this slice

This is the cleanest first task because every later analyzer/report decision depends on the extracted contract shape.

### 2. Add additive analyzer surfaces instead of redefining existing percentages

Preserve the existing operation/status/payload truth that `R001` already validates.

Recommended analyzer split:

- **Undeclared status drift**: add an additive output to status analysis, e.g. `undeclaredObservedStatuses`, while keeping declared-status coverage numerator/denominator unchanged.
  - This matches the milestone requirement: undeclared statuses should become explicit drift, not silently distort declared coverage.
- **Parameter value conformance**: create a value-aware analyzer that consumes `pathParams`, `queryParams`, and `requestHeaders` from retained evidence, respecting `captured` / `redacted` / `omitted` state.
- **Response-header conformance**: create a response-header analyzer keyed off the **selected response contract** for the observed status, reusing the same exact/range/default response-selection semantics already present in payload conformance.

The important design constraint is to avoid overloading `coverage.parameters.percent` so that it suddenly means “schema-valid values”. The current percentage is still a presence-style coverage number. S02 should add explicit drift/conformance surfaces rather than quietly redefining that meaning.

### 3. Reuse the existing typed-diagnostic gate/report pipeline

Do not invent a one-off HTTP drift format.

Mirror the existing patterns from:

- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`

That means:

- analyzer outputs deterministic diagnostics with operation identity, observed evidence, and typed reasons
- gate mapping turns those diagnostics into stable semantic failures
- `failureOrder.ts` gets explicit precedence entries for the new HTTP semantic codes
- `report.ts` / `schema.ts` / `normalize.ts` serialize the new surfaces deterministically
- `cli.ts` surfaces the new signals in Top Issues and `YANOTE_ERROR` / `YANOTE_SUMMARY`

This is the safest route for `R002` and `R003`, because the async and payload paths already prove the fail-closed/report/summary pattern the repo expects.

### 4. Treat the live green proof path as a separate problem from the red proof path

There is an important verifier mismatch now:

- `examples/openapi/demo-openapi.yaml` already contains the S01 proof route `/evidence/users/{id}`
- that route intentionally returns **202** while the shared OpenAPI path declares only **200**
- `scripts/docs/verify-s02-analysis-path.sh` still assumes the shared demo spec yields **4 operations**, **100% operation coverage**, **100% status coverage**, and an overall green happy path from `DemoServiceE2eTest`

Those assumptions cannot stay true if the analyzer starts treating the S01 evidence route as part of the same green denominator.

Planner implication:

- either keep the green S02 path explicitly excluding `/evidence/*`
- or split the green and red proof specs more aggressively
- but do **not** let the intentionally red evidence route accidentally contaminate the happy-path verifier

This is the highest-risk integration seam for the slice because it can make a correct implementation look broken.

## Don’t Hand-Roll

| Problem | Existing solution | Why use it |
|---|---|---|
| Typed fail-closed HTTP semantics | `yanote-js/src/coverage/httpPayloadConformance.ts` + `yanote-js/src/gates/httpPayloadSemantics.ts` | Already shows the repo’s preferred pattern for per-operation diagnostics, semantic failure codes, and additive report surfaces. |
| Typed header drift mapping | `yanote-js/src/coverage/asyncSchemaConformance.ts` + `yanote-js/src/gates/asyncEvaluator.ts` | Async already proves how header diagnostics should become explicit user-facing semantic failures rather than hidden implementation state. |
| Response selection by observed status | `yanote-js/src/coverage/httpPayloadConformance.ts` (`selectResponseContract`) | Response-header validation should follow the same exact / `2XX` / `default` selection rules as payload conformance. |
| Deterministic report serialization | `yanote-js/src/report/report.ts`, `schema.ts`, `normalize.ts`, `writeReport.ts` | New sections must stay schema-validated and byte-stable; the current report pipeline already enforces that. |
| Strict shell verifier style | `scripts/docs/verify-s02-analysis-path.sh`, `scripts/docs/verify-m010-s01-http-evidence-depth.sh` | The repo already uses `set -euo pipefail`, retained temp artifacts, and explicit Python assertions for proof scripts. |

## Implementation Landscape

### Contract extraction / type layer

Primary files:

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.test.ts`

Current state:

- `HttpOperationContract` carries `declaredStatuses`, `parameters`, `requestBody`, `responseBodies`
- `parameters` currently retain only name/location/requiredness
- response headers are not extracted at all

Likely work:

- extend the parameter contract with supported schema metadata
- add response-header contracts under response status entries
- pin the extraction shape in `openapi.test.ts`

### Analyzer / conformance layer

Primary files:

- `yanote-js/src/coverage/statusCoverage.ts`
- `yanote-js/src/coverage/parameterCoverage.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- likely new HTTP conformance files for parameter values and response headers

Current state:

- `statusCoverage.ts` returns only `declaredStatuses`, `coveredStatuses`, `missingStatuses`
- `parameterCoverage.ts` uses `queryKeys` / `headerKeys` and `operationObserved`; it never reads `pathParams`, `queryParams`, or `requestHeaders`
- `coverage.ts` still aggregates only status sets and key sets
- `httpPayloadConformance.ts` already contains useful shared logic: route resolution, response-contract selection, deterministic diagnostics, and state summarization

Planner implication:

- S02 should either extract shared HTTP route/status helper logic before adding more analyzers, or be extremely careful to keep any copied matcher logic in parity with `coverage.ts` and `httpPayloadConformance.ts`
- adding a third slightly-different HTTP route matcher is a high drift risk

### Report / gate / CLI layer

Primary files:

- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/cli.ts`
- tests under `src/report/*.test.ts`, `src/cli*.test.ts`, `src/gates/*.test.ts`

Current state:

- the HTTP report only knows `coverage`, `httpPayloadConformance`, `diagnostics`, and `governance`
- the CLI summary/top-issues logic only knows the existing HTTP surfaces
- failure ordering already has explicit precedence slots for async header semantics and HTTP payload semantics, but nothing yet for undeclared status / parameter value / response-header drift

Planner implication:

- this is a coherent second task after contract extraction/analyzers are stable
- keep the report additive and deterministic; do not silently rename or repurpose existing top-level sections

### Proof / verifier layer

Primary files:

- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`
- `examples/openapi/demo-openapi.yaml`
- `examples/openapi/demo-openapi-unsupported-schema.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`

Current state:

- `DemoServiceE2eTest` is still the green 4-request flow (`/users`, `/users/{id}`, `POST /users`, `/admin/ping`)
- `HttpEvidenceDepthE2eTest` is the intentionally richer/red proof path for undeclared status and retained evidence
- `verify-s02-analysis-path.sh` still defaults to a 4-operation / fully green assumption against `demo-openapi.yaml`, which now also contains the S01 evidence route
- the script also still contains at least one stale fixture JSONL line using pre-S01 `pathParams: {"id":"123"}` shape rather than `ValueEvidence`

Planner implication:

- verifier updates are real slice work, not cleanup
- the planner should budget a dedicated task for proof maintenance once the analyzer surface is finalized

## Constraints

- Keep the current HTTP operation/status/payload truth stable where already validated; new drift should be additive and explicit.
- Use the retained evidence maps (`pathParams`, `queryParams`, `requestHeaders`, `responseHeaders`) and their capture states; do **not** infer value conformance from `queryKeys` / `headerKeys`.
- Keep the supported parameter/header validation subset narrow and obvious. The `openapi-specification-v3.2` guidance points toward schema-based Parameter/Header handling, but this milestone should not absorb full style/explode/content semantics.
- Header-name matching remains case-insensitive on the evidence side; response/request header maps are already normalized to lowercase.
- Repeated query/header values are preserved as arrays. S02 needs one explicit rule for how repeated values are validated, rather than flattening or guessing.
- Report output must remain deterministic and schema-validated (`normalize.ts` + `writeReport.ts` + `schema.ts`).

## Common Pitfalls

- **Counting undeclared statuses by degrading declared coverage percent.** That hides the distinction the milestone explicitly wants. Keep declared coverage and undeclared drift separate.
- **Using `queryKeys` / `headerKeys` for value conformance.** Those are compatibility arrays now; the real truth lives in the evidence maps and capture states.
- **Validating response headers against every declared response at once.** Response-header checks need the same observed-status contract selection that payload validation already uses.
- **Letting `/evidence/users/{id}` stay inside the green happy-path denominator.** That route is intentionally red/diagnostic; it will break the current happy-path proof unless it is explicitly separated.
- **Adding another independent HTTP route matcher.** `coverage.ts` and `httpPayloadConformance.ts` already duplicate similar normalization/matching logic; a third copy will drift quickly.
- **Assuming S02 still needs recorder work.** The recorder/evidence path already exists; the slice bottleneck is analyzer/report/gate semantics.

## Verification

### Targeted loops that passed in this scout unit

- `npm -C yanote-js test -- src/spec/openapi.test.ts`
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts`
- `npm -C yanote-js test -- src/coverage/statusCoverage.test.ts src/coverage/parameterCoverage.test.ts`
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest" :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`

### Likely slice verification stack

- contract/unit layer:
  - new/updated `yanote-js` tests for spec extraction, status drift, parameter-value drift, response-header drift, report schema, CLI summary, and fail-closed error ordering
- integration layer:
  - `bash scripts/docs/verify-s02-analysis-path.sh`
- retained proof layer:
  - `bash scripts/ci/run-v1-e2e.sh`

Given the current verifier mismatch around `/evidence/users/{id}`, the planner should expect `verify-s02-analysis-path.sh` to need updates as part of the slice rather than treating it as a pure post-check.

## Open Risks

- **Type coercion policy is still an implementation decision.** Retained HTTP parameter/header values arrive as strings. S02 must explicitly choose how far to support integer/number/boolean coercion before validating schema keywords like `minimum`, `maximum`, `enum`, or `pattern`.
- **Repeated-value semantics can sprawl.** Evidence is multi-value-safe, but full OpenAPI serialization semantics are out of scope. Unsupported repeated/complex shapes should fail closed as unsupported/unverifiable rather than being guessed.
- **The green proof script is stale against the shared demo spec.** If that is not fixed deliberately, correct analyzer work can look like a regression.
- **Failure precedence needs a real update.** Without new HTTP semantic codes in `failureOrder.ts`, the CLI may report confusing primaries when several new drift signals appear together.

## Skills Applied

- **`openapi-specification-v3.2`** — used as the scope guard: keep S02 on supported Parameter/Header schema semantics and Response Object headers, not the full style/explode/content matrix.
- **`debug-like-expert`** — verify actual behavior instead of assuming the analyzer already uses the new evidence just because the event shape exists.
- **`bash-scripting`** — verifier changes should stay strict, artifact-driven, and resumable with retained failure outputs.
- **`java-junit` / `vitest` / `test`** — follow the repo’s existing focused test style and extend contract tests before touching broad end-to-end scripts.

## Skills Discovered

| Technology | Skill | Status |
|---|---|---|
| Spring Boot demo / recorder proof path | `teachingai/full-stack-skills@spring-boot` | installed globally during this scout unit |

## Sources

- S01 already delivered additive HTTP evidence capture across the JVM model, recorder, Node model, and live proof (`yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java`, `yanote-js/src/model/httpEvent.ts`, `yanote-js/src/events/readJsonl.ts`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java`).
- HTTP status/parameter/report limits today come from `yanote-js/src/coverage/statusCoverage.ts`, `yanote-js/src/coverage/parameterCoverage.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, and `yanote-js/src/cli.ts`.
- The strongest reusable drift pattern is already implemented in `yanote-js/src/coverage/httpPayloadConformance.ts`, `yanote-js/src/gates/httpPayloadSemantics.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, and `yanote-js/src/report/asyncReport.ts`.
- Live proof boundaries were inspected in `examples/openapi/demo-openapi.yaml`, `examples/openapi/demo-openapi-unsupported-schema.yaml`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`, `scripts/docs/verify-s02-analysis-path.sh`, and `scripts/ci/run-v1-e2e.sh`.
- Scout validation reruns completed successfully for the focused Node and Java compatibility tests listed in the Verification section above.

## Resume Notes

- No code or checklist state was changed in this scout unit; the durable output is this research artifact.
- Highest-value next step for the planner: split work into **(1) contract extraction/types**, **(2) analyzer/report/gate semantics**, **(3) proof-script updates**.
- Expect `verify-s02-analysis-path.sh` to be part of the implementation work, not just the final check, because its happy-path assumptions are stale against the shared demo spec.
