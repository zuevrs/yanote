---
estimated_steps: 4
estimated_files: 7
skills_used:
  - json-schema-validator
  - vitest
---

# T01: Enforce the supported payload-format policy in the analyzer

**Slice:** S03 — Format Policy And Media Specificity Truth
**Milestone:** M011

## Description

Lock the product payload-format boundary before changing governance. This task adds the explicit supported-format allowlist and the shared fixture bundle that later tasks will reuse for report, CLI, and retained-proof coverage.

## Steps

1. Add `ajv-formats` as a direct dependency in `yanote-js/package.json` and register it in `yanote-js/src/coverage/httpPayloadConformance.ts` without tightening unrelated Ajv strictness.
2. Introduce a schema walker in `yanote-js/src/coverage/httpPayloadConformance.ts` that detects declared OpenAPI payload formats on the matched schema, allows only the published subset (`email` first), and emits a dedicated `UNSUPPORTED_SCHEMA_FORMAT` diagnostic when a declared/custom format falls outside Yanote support instead of silently degrading to plain `type` validation.
3. Add shared S03 fixtures in `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` plus focused JSONL fixtures for valid email, invalid email, and unsupported/custom format scenarios.
4. Expand `yanote-js/src/coverage/httpPayloadConformance.test.ts` so supported valid email stays green, invalid email becomes `INVALID_BODY`, and declared unsupported/custom formats fail closed with the new diagnostic code.

## Must-Haves

- [ ] Yanote validates `format: email` explicitly instead of silently ignoring it.
- [ ] Declared unsupported/custom formats emit `UNSUPPORTED_SCHEMA_FORMAT` rather than passing as generic `type` checks.
- [ ] Shared S03 fixtures exist for valid email, invalid email, and unsupported format scenarios and are reusable by later tasks.

## Verification

- Focused analyzer tests prove supported-format success, invalid email failure, and unsupported-format fail-closed behavior.
- `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts`

## Observability Impact

- Signals added/changed: payload diagnostics now distinguish unsupported declared formats from generic schema compilation failures.
- How a future agent inspects this: run the focused Vitest file and inspect `httpPayloadConformance.diagnostics` for the shared S03 fixture scenarios.
- Failure state exposed: the failing schema path, format name, and diagnostic code show whether drift came from format validation or allowlist policy.

## Inputs

- `yanote-js/package.json` — current dependency manifest that does not yet declare `ajv-formats` directly.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — current payload evaluator that ignores declared OpenAPI formats.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — existing analyzer regression suite for payload conformance.

## Expected Output

- `yanote-js/package.json` — direct `ajv-formats` dependency for HTTP payload validation.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — explicit format allowlist evaluation and unsupported-format diagnostics.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — regression coverage for valid email, invalid email, and unsupported/custom formats.
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — shared S03 OpenAPI fixture bundle.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — green supported-format evidence fixture.
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl` — invalid email evidence fixture.
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl` — declared unsupported/custom format evidence fixture.
