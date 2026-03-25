---
estimated_steps: 4
estimated_files: 7
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T01: Extract effective security requirements and prove apiKey conformance on fixtures

**Slice:** S01 — Security Semantics Through Report, CLI, And CI
**Milestone:** M012

## Description

Give the analyzer one honest security contract before touching user-visible surfaces. This task adds a security fixture corpus, extracts effective per-operation requirements from OpenAPI, and evaluates the truthful apiKey-only subset against retained request evidence without changing canonical HTTP operation keys or legacy coverage math.

## Steps

1. Add security-focused fixture inputs in `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` and `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` that cover root inheritance, operation override, `security: []` clear, `{}` optional, OR/AND combinations, redacted/unavailable evidence, and unsupported scheme types or locations.
2. Extend `yanote-js/src/spec/openapi.ts` and `yanote-js/src/spec/semantics.ts` to dereference `components.securitySchemes`, resolve effective per-operation security requirements, and reject invalid or missing security references without changing the existing `http METHOD ROUTE` identity or request/payload contracts.
3. Implement `yanote-js/src/coverage/httpSecurityConformance.ts` so only `apiKey` schemes in `query`, `header`, and `cookie` are evaluated from retained presence/provenance evidence, while unsupported subtypes and unavailable evidence stay explicit.
4. Add focused Vitest coverage that pins extraction, conformance truth, and secret-safe diagnostics for the supported fixture matrix.

## Must-Haves

- [ ] Effective security resolution is deterministic for inheritance, override, clear, optional, OR, and AND cases.
- [ ] The evaluator supports only truthful `apiKey` presence/provenance checks for `query`, `header`, and `cookie`; `http`, `oauth2`, `openIdConnect`, and unsupported locations remain explicit unsupported truth.
- [ ] Canonical operation keys and `coverage.operations/status/parameters/aggregate` math do not change.

## Verification

- Focused extractor and conformance tests pass on the new fixture corpus.
- `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts`

## Observability Impact

- Signals added/changed: fixture-backed security truth for satisfied, missing, unavailable, optional, clear, and unsupported requirement branches.
- How a future agent inspects this: run the focused Vitest files and inspect the fixture-derived conformance output.
- Failure state exposed: the failing operation, requirement branch, and scheme show presence/provenance truth without raw secret values.

## Inputs

- `yanote-js/src/spec/openapi.ts` — existing OpenAPI extraction and coverage model entrypoint.
- `yanote-js/src/spec/semantics.ts` — current HTTP semantic normalization over `paths`.
- `yanote-js/src/model/httpEvent.ts` — retained request-evidence provenance model.
- `yanote-js/src/events/readJsonl.ts` — JSONL ingestion for retained request evidence.

## Expected Output

- `yanote-js/src/spec/openapi.ts` — effective security extraction added to the coverage model.
- `yanote-js/src/spec/semantics.ts` — deterministic security reference/inheritance validation.
- `yanote-js/src/coverage/httpSecurityConformance.ts` — new conformance evaluator for truthful apiKey security checks.
- `yanote-js/src/spec/openapi.security.test.ts` — focused extractor contract coverage.
- `yanote-js/src/coverage/httpSecurityConformance.test.ts` — focused conformance and secret-safety coverage.
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` — security fixture corpus.
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` — retained evidence exercising supported and fail-closed cases.
