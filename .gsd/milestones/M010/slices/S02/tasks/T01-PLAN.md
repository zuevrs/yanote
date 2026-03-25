---
estimated_steps: 4
estimated_files: 6
skills_used:
  - openapi-specification-v3.2
  - vitest
  - test
  - debug-like-expert
---

# T01: Extract supported HTTP contracts and shared operation evidence

**Slice:** S02 — HTTP Core Contract Completeness In Report And Gates
**Milestone:** M010

## Description

Lay the structural foundation for S02. Before new semantics can be trusted, `yanote-js` needs one shared declared-contract model for supported parameters and response headers plus one shared operation-evidence resolver that consumes the richer S01 JSONL shape without changing the legacy coverage baseline.

## Steps

1. Extend `yanote-js/src/coverage/dimensions.ts` and `yanote-js/src/spec/openapi.ts` so supported path/query/header parameter schemas and response-header contracts are extracted explicitly from OpenAPI while keeping the supported subset narrow.
2. Add `yanote-js/src/coverage/httpOperationEvidence.ts` to resolve HTTP operations once and aggregate observed statuses, suites, path params, query params, request headers, and response headers from the S01 event shape.
3. Migrate `yanote-js/src/coverage/coverage.ts` to the shared evidence helper so the existing operation/status/presence coverage logic stays aligned with the future conformance analyzers.
4. Pin the new contract and shared evidence behavior in focused Vitest coverage before any higher-level analyzer/report work begins.

## Must-Haves

- [ ] `ParameterDefinition` carries the supported schema metadata S02 needs instead of only name/location/requiredness.
- [ ] `HttpOperationContract` exposes response-header contracts keyed by declared response status alongside the existing payload contracts.
- [ ] One shared HTTP operation-evidence helper aggregates S01 value-bearing evidence so later analyzers do not fork the route-matching logic again.

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpOperationEvidence.test.ts src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts`
- `npm -C yanote-js test -- src/coverage/coverage.parity.test.ts`

## Inputs

- `yanote-js/src/coverage/dimensions.ts` — current parameter/status type surface that lacks schema-bearing parameter contracts.
- `yanote-js/src/spec/openapi.ts` — current OpenAPI extractor that omits parameter schema details and response headers.
- `yanote-js/src/coverage/coverage.ts` — current coverage pipeline with duplicated HTTP route/evidence matching.
- `yanote-js/src/model/httpEvent.ts` — S01 event shape carrying retained path/query/request-header/response-header evidence.
- `yanote-js/src/events/readJsonl.ts` — normalization path that already exposes the richer HTTP evidence maps.

## Expected Output

- `yanote-js/src/coverage/dimensions.ts` — supported parameter contract types extended for schema-aware validation.
- `yanote-js/src/spec/openapi.ts` — supported parameter schema and response-header extraction added.
- `yanote-js/src/spec/openapi.test.ts` — assertions for supported parameter/header contract extraction.
- `yanote-js/src/coverage/httpOperationEvidence.ts` — shared live HTTP evidence resolver for downstream analyzers.
- `yanote-js/src/coverage/httpOperationEvidence.test.ts` — focused tests for route resolution and retained evidence aggregation.
- `yanote-js/src/coverage/coverage.ts` — legacy coverage path switched to the shared helper without changing existing semantics.

## Observability Impact

- Runtime signals: shared HTTP operation evidence now preserves per-operation observed statuses, suites, and additive path/query/request-header/response-header evidence in one deterministic resolver, while OpenAPI contracts expose supported parameter schemas and response-header declarations for downstream analyzers.
- Inspection surfaces: `yanote-js/src/coverage/httpOperationEvidence.test.ts`, `yanote-js/src/spec/openapi.test.ts`, and the existing coverage tests show whether route resolution, additive evidence aggregation, and baseline operation/status/parameter coverage stayed aligned.
- Failure visibility: if extraction or matching regresses, tests should identify the affected `operationKey`, route-match outcome, observed suites/statuses, and retained evidence map keys so a future agent can localize drift quickly.
