---
estimated_steps: 4
estimated_files: 6
---

# T03: Add parity and failure-path proof for canonical async identity

**Slice:** S01 — AsyncAPI Contract Ingestion And Canonical Identity
**Milestone:** M003

## Description

Lock the new async semantics into repeatable proof: equivalent v2/v3 contracts normalize identically, failure paths stay explicit, and the existing HTTP semantic baseline still passes after the async identity changes.

## Steps

1. Add a fixture-driven parity test that compares equivalent v2 and v3 AsyncAPI contracts and asserts identical canonical key ordering.
2. Add failure-path tests for unsupported protocol/version boundaries and unresolved or malformed contract references.
3. Re-run the relevant HTTP semantic tests to ensure the generalized diagnostic and operation-key changes did not regress the existing OpenAPI path.
4. Tighten the proof command so future agents can validate S01 with one targeted test invocation instead of reconstructing the slice intent from many files.

## Must-Haves

- [ ] Equivalent v2 and v3 fixtures normalize to identical canonical Kafka operation identities in deterministic order.
- [ ] Failure-path tests cover unsupported or malformed AsyncAPI inputs explicitly.
- [ ] The proof command keeps the HTTP semantic baseline green after the async contract changes.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
- The proof command fails loudly when canonical ordering, diagnostics, or HTTP compatibility drift.

## Observability Impact

- Signals added/changed: one repeatable spec-proof command that localizes async normalization drift and compatibility regressions.
- How a future agent inspects this: run the proof command and inspect the failing parity or diagnostics assertions to see whether the breakage is in version normalization, unsupported-input handling, or HTTP compatibility.
- Failure state exposed: canonical-key ordering drift, parity mismatch between v2/v3, unsupported-input leakage, or accidental HTTP semantic regression.

## Inputs

- `yanote-js/src/spec/asyncapi.test.ts` — canonical async loader expectations from T02.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` — existing deterministic-diagnostics proof surface to extend rather than replace.
- `yanote-js/src/spec/openapi.test.ts` — HTTP semantic baseline that must stay green.

## Expected Output

- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity proof for v2/v3 canonical identity normalization.
- `yanote-js/src/spec/asyncapi.test.ts` — expanded failure-path expectations for unsupported/malformed inputs.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` — generalized diagnostics coverage that remains deterministic.
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` verification command remains truthful and complete.
