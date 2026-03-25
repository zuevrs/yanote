---
estimated_steps: 5
estimated_files: 8
skills_used:
  - openapi-specification-v3.2
  - vitest
  - test
  - debug-like-expert
---

# T02: Build typed HTTP core conformance analyzers

**Slice:** S02 — HTTP Core Contract Completeness In Report And Gates
**Milestone:** M010

## Description

Turn the richer S01 evidence into explicit HTTP drift truth. This task adds deterministic analyzer semantics for observed-but-undeclared statuses, supported parameter-value drift, and supported response-header drift while preserving the old coverage percentages as compatibility metrics.

## Steps

1. Extend `yanote-js/src/coverage/statusCoverage.ts` so it still reports declared-status coverage but also surfaces observed undeclared statuses as additive drift output.
2. Add `yanote-js/src/coverage/httpParameterValueConformance.ts` to validate supported path/query/request-header values from retained evidence, including one explicit coercion and repeated-value policy for the supported subset.
3. Add `yanote-js/src/coverage/httpResponseHeaderConformance.ts` to validate response headers against the selected response contract using the same exact / `2XX` / `default` response-selection rules as payload conformance.
4. Add `yanote-js/src/coverage/httpCoreConformance.ts` to aggregate the three HTTP core surfaces into deterministic per-operation summaries and typed diagnostics.
5. Cover happy-path, redacted/omitted, unsupported, repeated-value, and undeclared-status cases with focused Vitest suites before report/gate wiring starts.

## Must-Haves

- [ ] Declared-status coverage math stays intact while observed undeclared statuses become first-class drift output for `R031`.
- [ ] Supported path/query/header value validation consumes retained evidence maps plus capture states instead of falling back to `queryKeys` / `headerKeys`.
- [ ] Response-header validation uses selected response contracts and fails closed as unsupported or unverifiable when evidence or schema semantics fall outside the supported subset.

## Verification

- `npm -C yanote-js test -- src/coverage/statusCoverage.test.ts src/coverage/httpParameterValueConformance.test.ts src/coverage/httpResponseHeaderConformance.test.ts src/coverage/httpCoreConformance.test.ts`
- `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts`

## Observability Impact

- Signals added/changed: typed HTTP core diagnostics for undeclared statuses, parameter-value drift, and response-header drift.
- How a future agent inspects this: read `httpCoreConformance` test fixtures and per-operation analyzer output in the new coverage tests.
- Failure state exposed: unsupported schema/value shapes, redacted or omitted evidence, undeclared statuses, and header-selection mismatches become explicit codes instead of hidden percentage shifts.

## Inputs

- `yanote-js/src/coverage/dimensions.ts` — extended contract types from T01.
- `yanote-js/src/spec/openapi.ts` — supported parameter and response-header contract extraction from T01.
- `yanote-js/src/coverage/httpOperationEvidence.ts` — shared live evidence resolver from T01.
- `yanote-js/src/coverage/statusCoverage.ts` — current declared-status-only implementation.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — existing typed HTTP analyzer pattern to mirror for response selection and diagnostics.

## Expected Output

- `yanote-js/src/coverage/statusCoverage.ts` — additive undeclared-status drift output without breaking declared coverage behavior.
- `yanote-js/src/coverage/statusCoverage.test.ts` — tests for declared plus undeclared status semantics.
- `yanote-js/src/coverage/httpParameterValueConformance.ts` — supported parameter-value analyzer over retained evidence.
- `yanote-js/src/coverage/httpParameterValueConformance.test.ts` — tests for supported values, redaction, omission, unsupported repetition, and coercion boundaries.
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts` — response-header analyzer keyed by selected response contract.
- `yanote-js/src/coverage/httpResponseHeaderConformance.test.ts` — tests for exact/range/default response-header validation and omission cases.
- `yanote-js/src/coverage/httpCoreConformance.ts` — aggregated HTTP core conformance result with deterministic diagnostics.
- `yanote-js/src/coverage/httpCoreConformance.test.ts` — integrated analyzer tests covering R031-R033 behavior end to end.
