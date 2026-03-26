---
estimated_steps: 6
estimated_files: 6
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T01: Thread deprecated operation metadata into canonical HTTP coverage

**Slice:** S02 — Deprecated Operation Truth Without Numerator Drift
**Milestone:** M013

## Description

Carry OpenAPI `deprecated` truth into the canonical HTTP contract and coverage catalog so every downstream surface can rely on one additive flag without re-deriving policy.

## Steps

1. Update `yanote-js/src/spec/openapi.ts` so `HttpOperationContract` can carry operation-level `deprecated` metadata and `extractHttpContracts()` materializes `operation.deprecated === true` while empty/default contracts stay false-compatible for existing tests.
2. Thread that flag through `yanote-js/src/coverage/coverage.ts` onto `PerOperationCoverage` without changing `coveredOperations`, `uncoveredOperations`, dimension math, gate inputs, or report-status semantics.
3. Add focused loader/coverage tests plus a dedicated deprecated fixture pair where the only uncovered operation is deprecated, then assert the run still reports partial legacy coverage rather than shrinking to a green `2/2` numerator.

## Must-Haves

- [ ] `HttpOperationContract` exposes deprecated metadata without forcing unrelated inline contract fixtures to change shape.
- [ ] `coverage.perOperation` can tell whether an operation is deprecated, but legacy operation/status/parameter/aggregate numerators remain unchanged for the same evidence.
- [ ] The dedicated fixture proves an uncovered deprecated operation still counts inside the default denominator.

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts`
- The deprecated fixture demonstrates default legacy coverage stays partial at `covered=2/3` instead of drifting to `covered=2/2`.

## Inputs

- `yanote-js/src/spec/openapi.ts` — current OpenAPI extraction seam that owns the canonical HTTP operation contract.
- `yanote-js/src/spec/openapi.test.ts` — loader contract coverage that must pin extraction defaults and operation metadata ordering.
- `yanote-js/src/coverage/coverage.ts` — per-operation coverage catalog and denominator math that must remain stable.
- `yanote-js/src/coverage/coverage.test.ts` — focused coverage regression tests that can prove numerator stability.

## Expected Output

- `yanote-js/src/spec/openapi.ts` — OpenAPI loader with additive operation-level deprecated metadata.
- `yanote-js/src/spec/openapi.test.ts` — loader tests covering deprecated extraction and default-false behavior.
- `yanote-js/src/coverage/coverage.ts` — canonical HTTP coverage model carrying per-operation deprecated truth without denominator drift.
- `yanote-js/src/coverage/coverage.test.ts` — regression tests proving covered/uncovered/status/parameter math stays unchanged.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — dedicated OpenAPI fixture where the only uncovered operation is deprecated.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — retained evidence fixture proving the default denominator still counts the deprecated uncovered operation.
