---
depends_on: [M009]
---

# M010: Core Contract Coverage Completeness For HTTP And Kafka

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

Yanote already has strong contract-coverage foundations on both supported runtime paths: HTTP/OpenAPI can prove operation, declared-status, required-parameter, and JSON-first payload truth, while Kafka/AsyncAPI can prove channel, send/receive operation, message, payload, and typed routing/header diagnostics on the proven Kafka path. The remaining user-facing gap is not “invent a full OpenAPI/AsyncAPI compliance engine”; it is closing the highest-value core-contract blind spots that still make a real team ask whether the product is checking the main things or only the surface.

Today those blind spots are concrete:

- HTTP status coverage does not yet surface observed-but-undeclared statuses as a first-class drift signal.
- HTTP parameter coverage is still mostly key-presence truth rather than value/schema conformance for retained path/query/header inputs.
- HTTP response headers are not yet treated as a first-class conformance surface.
- AsyncAPI Kafka header diagnostics already exist in code and report schemas, but the public proof/docs boundary still understates that support and does not yet frame it as a stable user-facing core surface.

M010 focuses on those core surfaces and explicitly does **not** try to claim “all of OpenAPI” or “all of AsyncAPI.”

## Why This Milestone

The product is now strong enough that the next useful step is to answer the question real teams actually ask: “If I point this at a real service, will it tell me whether the main declared contract surfaces were exercised and whether the observed values still conform?”

For HTTP that question means more than method+route hits and JSON payloads; it also includes undeclared statuses, parameter values, and response headers. For Kafka/AsyncAPI it means more than channel/send/receive/message coverage; it also includes whether retained headers participate in the user-visible conformance truth rather than sitting in an implementation seam with conservative docs.

Trying to plan every remaining OpenAPI/AsyncAPI construct here would create an unfinishable milestone. The right next move is to harden the **supported core contract surfaces** on the current HTTP/OpenAPI and Kafka/AsyncAPI paths, then decide later whether broader constructs such as cookies, security schemes, callbacks, bindings, traits, correlation IDs, or non-Kafka transports deserve their own milestones.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run `yanote report` on a real HTTP service and see explicit truth for undeclared statuses, supported parameter-value drift, response-header drift, and JSON request/response payload conformance in one deterministic report surface
- run `yanote async-report` on real Kafka evidence and treat header diagnostics alongside channel/action/message/payload truth as part of the supported Kafka-only contract surface
- read the HTTP and Kafka guides without having to guess whether core headers/statuses/parameters are really checked or only partially implied

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, `node yanote-js/dist/yanote.cjs async-report`, `yanote-report.json`, `yanote-async-report.json`, `bash scripts/docs/verify-s02-analysis-path.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- Environment: local development, CI, retained proof bundles, Spring MVC demo/runtime path, and Spring Kafka demo/runtime path
- Live dependencies involved: OpenAPI specs, AsyncAPI specs, Spring MVC recorder path, Spring Kafka recorder path, Kafka broker, example services/tests, Node analyzer/report surfaces, JSONL evidence artifacts

## Completion Class

- Contract complete means: the supported HTTP and Kafka core contract surfaces have explicit deterministic report/gate truth for the main drift conditions instead of only indirect coverage hints.
- Integration complete means: recorder → `events.jsonl` → analyzer → report/gate works on the live Spring MVC and Spring Kafka proof paths with the richer HTTP and async evidence surfaces.
- Operational complete means: the public proof scripts, retained artifacts, and docs/verifiers describe the stronger core completeness boundary honestly and rerunnably.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the live Spring MVC proof path can keep current operation/status/payload truth while also surfacing undeclared observed statuses, supported parameter-value drift, and response-header drift through `yanote-report.json` and CLI/gate diagnostics
- the live Spring Kafka proof path can keep current channel/operation/message/payload truth while also surfacing missing/invalid/unavailable/unverifiable header diagnostics as a supported Kafka-only report/gate surface
- the public guides and verifier stack explicitly describe the new supported core surfaces and explicitly defer broader spec constructs instead of quietly implying full OpenAPI/AsyncAPI coverage

## Risks and Unknowns

- HTTP recorder/event evidence currently does not retain enough value-bearing query/header/response-header detail to make value-level conformance truthful. — Without that additive shape, any “parameter/header validation” would be guessed rather than proven.
- Capturing parameter values and response-header values can leak secrets or create noisy/high-cardinality artifacts. — Retention/redaction rules have to be designed before analyzer semantics can safely depend on them.
- Async Kafka header diagnostics already exist in code/report schemas while public docs still say the boundary is more limited. — If proof/docs and implementation drift apart, the product becomes dishonest in either direction.
- OpenAPI/AsyncAPI breadth is effectively unbounded. — If this milestone absorbs cookies, security, callbacks, bindings, traits, correlation IDs, and non-Kafka transports, it will sprawl and fail to close.

## Existing Codebase / Prior Art

- `yanote-js/src/model/httpEvent.ts` and `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current HTTP evidence shape; still oriented around route/status/payload plus query/header keys rather than full parameter/header conformance inputs
- `yanote-js/src/coverage/statusCoverage.ts`, `yanote-js/src/coverage/parameterCoverage.ts`, and `yanote-js/src/coverage/httpPayloadConformance.ts` — current HTTP coverage/conformance boundary that M010 needs to deepen without regressing
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` and related capture code — existing Spring MVC recorder seam that must carry any richer HTTP evidence truth
- `yanote-js/src/coverage/asyncCoverage.ts` and `yanote-js/src/coverage/asyncSchemaConformance.ts` — current Kafka/AsyncAPI routing, payload, and header diagnostic surfaces
- `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/report.ts`, and `yanote-js/src/cli.ts` — current deterministic report/CLI surfaces that need new drift signals without losing stable output behavior
- `docs/guides/analyzer-coverage.md` and `docs/guides/asyncapi-kafka.md` — current public explanation of what the HTTP and Kafka analyzers do and do not yet prove
- `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — retained proof entrypoints this milestone should strengthen rather than replace

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R031` — observed HTTP statuses that are not declared in OpenAPI surface as first-class drift
- `R032` — supported HTTP path/query/header parameter values are validated from retained evidence
- `R033` — supported HTTP response headers are checked as part of contract conformance
- `R034` — Kafka-first AsyncAPI header diagnostics are a supported public surface
- `R001` — the milestone deepens supported HTTP contract coverage from operation/status/key presence plus payload truth into a fuller core HTTP contract surface
- `R002` — new status/parameter/header checks must remain explicit and fail closed rather than silently hiding drift
- `R003` — the richer completeness story must stay usable through the CLI/report/CI delivery surfaces that already exist
- `R005` — the Kafka/AsyncAPI path must stay narrow, truthful, and separate while making header diagnostics more explicit on the proven Kafka surface

## Scope

### In Scope

- explicit HTTP drift truth for observed-but-undeclared statuses
- additive HTTP evidence needed for supported path/query/header parameter-value checks and response-header checks
- HTTP report/gate/CLI updates for supported parameter/header/status conformance
- async report/proof/docs hardening so retained Kafka header diagnostics become a supported user-facing surface on the proven Kafka path
- docs/verifier updates that pin the richer core completeness boundary without widening the transport/report contract

### Out of Scope / Non-Goals

- cookie parameters, security schemes, links, callbacks, webhooks, and example-driven coverage as first-class HTTP surfaces
- a claim of full OpenAPI keyword/serialization/media-type coverage across every construct
- AsyncAPI bindings, traits, correlation IDs, reply semantics, schema-registry work, or non-Kafka broker support
- a mandatory combined HTTP+async report/gate surface
- expanding beyond the current Java-first recorder → JSONL → analyzer product boundary

## Technical Constraints

- Keep HTTP and async public report surfaces separate, per the current `yanote-report.json` vs `yanote-async-report.json` boundary.
- Preserve the recorder → `events.jsonl` → analyzer architecture rather than introducing runtime-only inspection paths.
- Evidence-shape changes must be additive and redaction-safe; never retain raw secrets just to make validation easier.
- Preserve current operation/status/payload semantics where already proven; new conformance layers should be additive and explicit rather than muddying existing numerators.
- Do not market or document this milestone as “full OpenAPI/AsyncAPI support”; it is about supported **core surfaces** only.

## Integration Points

- `yanote-core` event models — canonical JSONL shape between JVM recorders and Node analyzer
- `yanote-recorder-spring-mvc` — source of richer HTTP evidence truth
- `yanote-recorder-spring-kafka` — source of Kafka header evidence already feeding async diagnostics
- `yanote-js` HTTP and async spec/coverage/report/gate/CLI paths — place where the richer core completeness surfaces must stay deterministic
- example Spring MVC and Spring Kafka proof stacks — live acceptance boundary for the milestone
- docs and release/support surfaces — the public statement of what is actually supported after the milestone lands

## Open Questions

- Which HTTP query/header/response-header values are safe to retain by default, and which should only appear as redacted/unavailable evidence? — Current leaning: narrow allowlist plus typed unavailable diagnostics instead of broad raw capture.
- How far should supported HTTP parameter/header validation go inside this milestone? — Current leaning: core scalar/enum/range/pattern semantics for retained values, not the entire OpenAPI style/explode matrix.
- Should the async docs promote header validation immediately to supported public truth or only after an additional live-proof expansion? — Current leaning: promote only the exact diagnostics/proof that the current Kafka path can already rerun.
- How should undeclared HTTP statuses appear relative to current declared-status coverage? — Current leaning: separate drift surface rather than silently distorting the declared-status numerator.
