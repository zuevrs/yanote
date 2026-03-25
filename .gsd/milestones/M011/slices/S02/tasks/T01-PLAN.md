---
estimated_steps: 4
estimated_files: 8
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T01: Publish the supported request serialization matrix in OpenAPI and report contracts

**Slice:** S02 — Supported Serialization Subset And Cookie Conformance
**Milestone:** M011

## Description

Lock the public request-serialization boundary before changing fail-closed behavior. This task makes the supported subset explicit in the OpenAPI/request-contract model and publishes it on the report surface so later tasks can validate and gate against one honest boundary.

## Steps

1. Replace the scalar-only request-parameter contract in `yanote-js/src/coverage/dimensions.ts` and `yanote-js/src/spec/openapi.ts` with shape-aware support metadata that distinguishes supported scalar parameters, supported repeated query arrays (`query` + `form` + `explode=true` + scalar items), and unsupported contracts with explicit reasons such as `content`, `style`, `explode`, or `schema`.
2. Keep the old coverage numerator contract stable: `coverage.parameters`, route normalization, and recorder-derived key lists stay unchanged while `requestParameters` widens additively.
3. Update the request report builder/schema/normalizer so `yanote-report.json` publishes the declared support shape/reason deterministically for each request parameter without leaking new semantics into CLI or gates yet.
4. Expand parser/report contract tests to cover supported query arrays, unsupported path/header/cookie arrays, unsupported `content`, and deterministic serialization of the new support fields.

## Must-Haves

- [ ] Query arrays are marked supported only when retained evidence can prove multiplicity honestly (`form` + `explode=true` + scalar items).
- [ ] Path arrays, header/cookie delimited arrays, `content`, unsupported styles, and nested/object schemas are explicitly marked unsupported with stable reasons instead of falling through as generic schema failures.
- [ ] `yanote-report.json` exposes the widened declared-support metadata without changing legacy `coverage.parameters` math or route normalization.

## Inputs

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`

## Expected Output

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts`
