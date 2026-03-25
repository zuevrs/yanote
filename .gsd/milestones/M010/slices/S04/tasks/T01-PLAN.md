---
estimated_steps: 4
estimated_files: 6
skills_used:
  - openapi-specification-v3.2
  - vitest
  - test
---

# T01: Add HTTP core semantic gate codes and precedence

**Slice:** S04 — Final Boundary Assembly And Docs Hardening
**Milestone:** M010

## Description

Turn the already-landed additive HTTP core analyzer output into real governance behavior. This task introduces a dedicated semantic-mapping layer for undeclared statuses and supported parameter/header drift, then wires it into gate evaluation and precedence ordering so later CLI/proof work can depend on stable `SEMANTIC_HTTP_*` outcomes.

## Steps

1. Create `yanote-js/src/gates/httpCoreSemantics.ts` to map `httpCoreConformance` diagnostics into stable governance failures, separating fail-closed drift from explicitly skipped or recorder-limited cases.
2. Add focused coverage in `yanote-js/src/gates/httpCoreSemantics.test.ts` for undeclared status, invalid supported value, missing supported value, and recorder-limited diagnostics.
3. Update `yanote-js/src/gates/evaluator.ts` so HTTP core semantics run before threshold-only logic and integrate cleanly with existing payload and async failure handling.
4. Extend `yanote-js/src/gates/failureOrder.ts` plus the focused tests so the new HTTP core codes sort deterministically with existing payload and async semantic failures.

## Must-Haves

- [ ] A dedicated HTTP-core semantic mapper exists instead of burying the new logic inside `evaluator.ts`.
- [ ] Undeclared status and supported invalid/missing parameter or response-header drift now fail closed with stable `SEMANTIC_HTTP_*` codes.
- [ ] Recorder-redacted, recorder-omitted, repeated-value-unsupported, and unsupported-schema paths remain explicit and do not get misreported as green success.
- [ ] Failure precedence is deterministic across HTTP core, payload, async, and threshold failures.

## Verification

- `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts`
- `npm -C yanote-js test -- src/gates/httpPayloadSemantics.test.ts`

## Observability Impact

- Signals added/changed: HTTP core diagnostics now produce stable governance failure codes/hints instead of existing only as additive report data.
- How a future agent inspects this: rerun the focused gate tests above and inspect the generated failure codes/order in `yanote-js/src/gates/httpCoreSemantics.test.ts` and `yanote-js/src/gates/failureOrder.test.ts`.
- Failure state exposed: regressions should show whether the break is semantic mapping, evaluator integration, or precedence ordering.

## Inputs

- `yanote-js/src/coverage/httpCoreConformance.ts` — additive HTTP core analyzer output that currently is not fail-closed in the main gate path.
- `yanote-js/src/gates/evaluator.ts` — current gate evaluator that still short-circuits on payload semantics only.
- `yanote-js/src/gates/failureOrder.ts` — current precedence table that lacks HTTP core semantic codes.
- `yanote-js/src/gates/failureOrder.test.ts` — current precedence coverage that must be extended without regressing payload/async ordering.

## Expected Output

- `yanote-js/src/gates/httpCoreSemantics.ts` — dedicated HTTP core semantic mapper with stable governance codes.
- `yanote-js/src/gates/httpCoreSemantics.test.ts` — focused assertions for fail-closed and skipped HTTP core outcomes.
- `yanote-js/src/gates/evaluator.ts` — evaluator path that consumes HTTP core semantics before threshold-only logic.
- `yanote-js/src/gates/failureOrder.ts` — deterministic precedence entries for the new HTTP core semantic codes.
- `yanote-js/src/gates/failureOrder.test.ts` — updated precedence assertions covering HTTP core alongside payload/async failures.
- `yanote-js/src/gates/evaluator.threshold.test.ts` — regression coverage proving HTTP core semantics integrate with existing gate behavior.
