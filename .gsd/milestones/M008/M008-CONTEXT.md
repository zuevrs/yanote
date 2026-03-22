---
depends_on: [M007]
---

# M008: OpenAPI Payload Conformance And Contract Depth — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

## Project Description

Yanote already proves HTTP/OpenAPI coverage beyond raw endpoint hits: it matches canonical operations, tracks declared status-code coverage, tracks required parameter coverage, and fails closed on invalid or ambiguous semantics. This milestone deepens the HTTP path into stronger contract conformance by adding request/response payload validation, media-type-aware drift surfaces, and report/gate semantics that distinguish “operation observed” from “payload actually conformed to the OpenAPI contract.”

## Why This Milestone

The current HTTP analyzer is stronger than a method+route counter, but it still stops short of full payload conformance. Investigation showed that the product can currently tell a user that an operation was observed, which statuses were seen, and which required parameters were exercised — but it cannot yet prove that request or response bodies matched the declared OpenAPI schemas.

That gap is also not analyzer-only. The current `HttpEvent` / `HttpEventRecordingFilter` path records method, route, status, header keys, query keys, and test attribution, but not request/response bodies or content/media metadata. So M008 will have to coordinate recorder, event-model, JSONL reader, analyzer, report, and gate changes the same way M007 does for async.

M008 explicitly depends on M007 because both milestones deepen shared contract/report ideas, and M007 is the clearer first gap with fewer pre-existing HTTP semantics to preserve while those stronger conformance patterns settle.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run the HTTP analyzer and see whether request and response bodies actually conformed to the declared OpenAPI contract
- distinguish observed operation/status/parameter coverage from payload/media-type conformance in CLI output, JSON reports, and gate failures
- trust that HTTP contract depth is proven through the real recorder path rather than inferred from fixture-only payload samples

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, `yanote-report.json`, Spring MVC recorder path, example service/tests, and existing demo verifier surfaces
- Environment: local development, CI, fixture/unit proof, and runnable Spring MVC recorder/demo path
- Live dependencies involved: OpenAPI documents, HTTP `events.jsonl`, `yanote-recorder-spring-mvc`, example Spring service/tests, CLI/report/gate surfaces

## Completion Class

- Contract complete means: supported OpenAPI contracts can validate observed request and response payloads, not just operation/status/parameter surfaces
- Integration complete means: the Spring MVC recorder, event model, JSONL ingestion, HTTP coverage/report/gate surfaces, and demo/verifier stack share one truthful payload-conformance boundary
- Operational complete means: the stronger HTTP contract is exercised through the public demo/runtime path and leaves inspectable diagnostics when conformance fails

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the HTTP analyzer can reject request/response payloads that violate declared OpenAPI requestBody or response content schemas while still preserving today’s operation/status/parameter truth
- HTTP report/gate surfaces make it obvious whether a route was merely exercised or whether its payloads actually conformed
- the runnable HTTP demo path and user-facing docs reflect the deeper contract truth without regressing the current deterministic CLI/report model

## Risks and Unknowns

- The current HTTP evidence model does not yet carry request/response payloads or content-type metadata, so recorder and JSONL boundaries must deepen before analyzer logic can be truthful.
- OpenAPI payload validation introduces content negotiation, request-vs-response asymmetry, and potentially large/binary body surfaces that may not fit the current recorder design directly.
- Report/gate semantics can become confusing if payload-conformance failures are mixed into the same language as status/parameter coverage instead of being separated clearly.
- Deeper HTTP validation may need to balance fidelity, artifact size, and safety/redaction in a user-facing recorder path.

## Existing Codebase / Prior Art

- `yanote-js/src/spec/openapi.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/coverage/statusCoverage.ts`, `yanote-js/src/coverage/parameterCoverage.ts` — current HTTP contract-depth baseline
- `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/gates/`, `yanote-js/src/cli.ts` — current deterministic HTTP report/gate/CLI surfaces
- `yanote-js/src/model/httpEvent.ts` and `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current metadata-only HTTP event boundary for coverage
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — current recorder seam that will need stronger payload/media capture
- `examples/springmvc-service`, `examples/tests-restassured`, and `scripts/ci/run-v1-e2e.sh` — current runnable HTTP proof path that must stay truthful while deepening
- `docs/guides/analyzer-coverage.md` and `docs/release-and-support.md` — current public explanation of what the HTTP analyzer does and does not yet prove

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R066 — request and response payloads are validated against OpenAPI contract depth
- R067 — HTTP report and gate surfaces separate observation from conformance
- R001 / R005 / R006 — existing canonical OpenAPI identity and status/parameter coverage baseline that must remain intact
- R012 / R025 / R057 / R058 — fail-closed behavior and runnable proof-path expectations that raise the quality bar for this hardening

## Scope

### In Scope

- payload-bearing HTTP evidence contract for request/response conformance
- Spring MVC recorder changes needed to capture payload/media facts safely
- OpenAPI requestBody/response-content schema validation
- HTTP report/gate/CLI updates that separate observation from payload/media conformance
- demo/runtime proof updates and public boundary refresh for the stronger HTTP contract

### Out of Scope / Non-Goals

- unified HTTP + async reporting
- non-HTTP protocol expansion
- GraphQL or gRPC contract work
- speculative Schema Registry or async-only follow-on concerns
- re-planning M007 scope inside this milestone

## Technical Constraints

- Preserve current canonical HTTP operation identity and existing status/parameter coverage semantics while deepening conformance.
- Keep the recorder safe and operationally boring; payload capture must not become a new source of request failure.
- Be explicit about content/media-type handling, redaction boundaries, and what payload surfaces are intentionally unsupported.
- Avoid turning `yanote-report.json` into an ambiguous mixed signal where “covered” can hide a payload-conformance failure.

## Integration Points

- `yanote-core` HTTP event model and JSONL round-trip layer
- `yanote-recorder-spring-mvc` filter/route-resolution recorder seam
- `yanote-js` HTTP JSONL readers, coverage/report/gate surfaces, and CLI
- example Spring MVC service and RestAssured/demo runtime path
- public HTTP analyzer docs and support boundary surfaces

## Open Questions

- What is the smallest request/response evidence shape that makes OpenAPI payload validation truthful without making the recorder unsafe or bloated? — Current leaning: record contract-relevant payload/media facts deliberately, not arbitrary full traffic dumps by default.
- How should HTTP payload failures appear relative to existing status and parameter dimensions? — Current leaning: separate conformance truth from observation truth rather than folding it into the existing percentages blindly.
- Which content types should be first-class in the initial hardening pass? — Current leaning: start with the formats the runnable demo path can prove deterministically and make unsupported media types explicit.
- How much of the public analyzer guide can be strengthened in place versus split into a new deeper-contract section once this work lands? — Current leaning: keep one canonical HTTP guide, but revise its interpretation model once the runtime truth exists.
