---
estimated_steps: 3
estimated_files: 8
skills_used:
  - asyncapi-design
  - vitest
---

# T01: Normalize trait-applied correlation and reply declarations into Kafka contracts

**Slice:** S01 — Trait-aware declared semantics on async-report
**Milestone:** M014

## Description

Use parser-merged AsyncAPI output as the canonical input for richer declarations. Extend the retained Kafka contract shape so supported `correlationId` and `reply` metadata survive normalization, then pin inline-vs-trait parity on dedicated fixtures without reopening `serializeOperationKey()`.

## Steps

1. Extend `yanote-js/src/model/operationKey.ts` and `yanote-js/src/spec/asyncapi.ts` to retain additive declared-semantic fields for supported message `correlationId` and operation `reply` metadata while treating parser-merged traits as authoritative input.
2. Add dedicated inline-vs-trait AsyncAPI fixtures for v2 and v3 under `yanote-js/test/fixtures/asyncapi/` that exercise the supported richer declarations without changing channel addresses or canonical message identity.
3. Expand `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` to assert identical normalized contracts and unchanged serialized Kafka operation keys across inline and trait-applied forms.

## Must-Haves

- [ ] Supported `correlationId` and `reply` declarations survive AsyncAPI normalization as additive contract metadata instead of parser-only residue.
- [ ] Trait-applied declarations normalize to the same retained fields as inline declarations for the supported fixture cases.
- [ ] `serializeOperationKey()` continues to emit `kafka <action> <channel>` with no semantic-field leakage.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- Inline and trait fixture assertions show identical retained declarations and operation keys.

## Observability Impact

- Signals added/changed: `operationContractsByKey` entries now retain declared `correlationId` / `reply` metadata beside canonical Kafka keys.
- How a future agent inspects this: load the bundle in `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` and inspect the exact retained contract snapshots.
- Failure state exposed: missing trait-applied fields or accidental key drift fails focused spec/parity tests on the offending operation key.

## Inputs

- `yanote-js/src/model/operationKey.ts` — current Kafka contract types that keep routing identity separate from richer semantics.
- `yanote-js/src/spec/asyncapi.ts` — existing AsyncAPI normalization seam that currently ignores richer declared semantics.
- `yanote-js/src/spec/asyncapi.test.ts` — current spec contract assertions to extend with richer declared metadata.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — current v2/v3 parity guard that must stay green after trait-aware widening.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — baseline v2 fixture pattern for simple inline declarations.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — baseline v3 fixture pattern for simple inline declarations.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — updated Kafka contract types with additive declared-semantic fields.
- `yanote-js/src/spec/asyncapi.ts` — trait-aware normalization that retains supported declared semantics without changing canonical keys.
- `yanote-js/src/spec/asyncapi.test.ts` — direct spec assertions for retained `correlationId` / `reply` metadata.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity assertions proving inline-vs-trait equivalence and unchanged operation keys.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v2.yaml` — deterministic v2 inline-declaration fixture.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v2.yaml` — deterministic v2 trait-applied fixture.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml` — deterministic v3 inline-declaration fixture.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml` — deterministic v3 trait-applied fixture.
