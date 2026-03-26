---
estimated_steps: 3
estimated_files: 8
skills_used:
  - debug-like-expert
  - asyncapi-design
  - vitest
---

# T01: Harden AsyncAPI extraction for header-backed semantics

**Slice:** S02 — Header-backed correlation and reply truth
**Milestone:** M014

## Description

Harden the existing AsyncAPI extraction seam for header-backed semantics by preserving the supported declared `correlationId` / `reply.address` subset, adding optional resolved reply-channel address metadata, and turning malformed declaration shells into explicit invalid diagnostics without regressing the canonical Kafka operation identity established in S01.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| AsyncAPI parser normalization in `yanote-js/src/spec/asyncapi.ts` | Emit explicit invalid diagnostics and keep canonical keys unchanged instead of silently dropping declarations. | Stop at extractor-level tests and treat the task as blocked rather than guessing declaration semantics. | Classify malformed `correlationId` / `reply` shells as spec-invalid while preserving supported-shape unsupported locations for later runtime handling. |

## Load Profile

- **Shared resources**: AsyncAPI parser output, normalized `operationContractsByKey`, and fixture-driven spec tests.
- **Per-operation cost**: Parse and normalize each declared message/operation once, then sort diagnostics and retained declarations deterministically.
- **10x breakpoint**: Diagnostic fan-out and fixture brittleness appear before raw CPU cost matters; deterministic ordering tests catch regressions early.

## Negative Tests

- **Malformed inputs**: Blank `location`, missing `address.location`, and non-object declaration shells must emit invalid diagnostics instead of disappearing.
- **Error paths**: Unsupported runtime-expression locations such as non-header expressions must stay retained for later fail-closed runtime evaluation, not collapse into success.
- **Boundary conditions**: Inline and trait-applied v3 fixtures must normalize identically, and adding reply-channel address metadata must not change `serializeOperationKey()` output.

## Steps

1. Extend `yanote-js/src/model/operationKey.ts` and `yanote-js/src/spec/asyncapi.ts` to preserve additive declared correlation/reply metadata, including an optional resolved reply-channel address, while keeping `serializeOperationKey()` fixed at `kafka <action> <channel>`.
2. Add dedicated AsyncAPI v3 fixtures for supported inline-vs-trait parity plus malformed declaration-shell and supported-shape unsupported-location cases under `yanote-js/test/fixtures/asyncapi/`.
3. Expand `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` to assert unchanged keys, retained declared metadata, explicit invalid diagnostics for malformed shells, and no silent drop of unsupported runtime-expression locations.

## Must-Haves

- [ ] Supported declared correlation/reply metadata survives normalization beside canonical keys.
- [ ] Malformed declaration objects surface invalid diagnostics instead of vanishing.
- [ ] Supported-shape unsupported locations stay visible for later runtime fail-closed evaluation, and inline-vs-trait fixtures normalize identically.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- Parser-normalized contracts show identical inline/trait declared fields, unchanged serialized keys, and explicit invalid diagnostics for malformed declaration shells.

## Observability Impact

- Signals added/changed: `operationContractsByKey` retains declared correlation/reply metadata and resolved reply-channel address, and invalid extraction diagnostics stop disappearing silently.
- How a future agent inspects this: rerun `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` and inspect the exact retained contract snapshots/diagnostics.
- Failure state exposed: key drift, missing declared fields, or silently dropped malformed declarations fail focused spec/parity assertions on the offending operation.

## Inputs

- `yanote-js/src/model/operationKey.ts` — current Kafka contract types that already retain declared semantics but do not yet carry resolved reply-channel address metadata.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI extraction seam that still silently drops malformed declaration shells.
- `yanote-js/src/spec/asyncapi.test.ts` — extractor assertions to extend with fail-closed declaration coverage.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity guard to reuse for inline-vs-trait declaration normalization.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml` — existing supported declaration fixture from S01.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml` — existing trait parity fixture from S01.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — updated Kafka contract types with optional resolved reply-channel address metadata.
- `yanote-js/src/spec/asyncapi.ts` — fail-closed extraction logic for malformed declaration shells plus retained supported/unsupported declaration locations.
- `yanote-js/src/spec/asyncapi.test.ts` — direct assertions for declared metadata, invalid shells, and unsupported locations.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — inline-vs-trait parity assertions for the supported header-backed declaration subset.
- `yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml` — supported inline declaration fixture for runtime header truth.
- `yanote-js/test/fixtures/asyncapi/header-runtime-trait-v3.yaml` — trait-applied declaration fixture that must normalize identically to the inline case.
- `yanote-js/test/fixtures/asyncapi/header-runtime-malformed-v3.yaml` — malformed declaration-shell fixture that must fail closed.
- `yanote-js/test/fixtures/asyncapi/header-runtime-unsupported-v3.yaml` — supported-shape but unsupported-location fixture that must stay visible for later runtime failure handling.
