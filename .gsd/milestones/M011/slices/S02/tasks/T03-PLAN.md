---
estimated_steps: 3
estimated_files: 5
skills_used:
  - vitest
---

# T03: Fail closed on request-semantic drift in the governance layer

**Slice:** S02 — Supported Serialization Subset And Cookie Conformance
**Milestone:** M011

## Description

Close R002 for request semantics before CLI polish. This task maps request-conformance drift onto the existing semantic-failure path so unsupported, invalid, or unavailable request evidence cannot slip past threshold math as a false green.

## Steps

1. Add a dedicated request-semantic gate mapper alongside payload semantics that translates request-conformance truths into typed semantic failures with targeted hints.
2. Wire the new mapper into `yanote-js/src/gates/evaluator.ts` and `yanote-js/src/gates/failureOrder.ts` so request semantic failures outrank threshold/regression math and sort predictably relative to existing payload semantics.
3. Cover invalid, unavailable, unsupported, and mixed payload+request scenarios in focused gate/failure-order tests.

## Must-Haves

- [ ] Request semantic drift fails closed with typed semantic codes instead of medium-only diagnostics.
- [ ] Request semantic failures preserve deterministic precedence relative to payload semantics and gate thresholds.
- [ ] Fully valid request semantics keep the governance layer green.

## Inputs

- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`

## Expected Output

- `yanote-js/src/gates/httpRequestSemantics.ts`
- `yanote-js/src/gates/httpRequestSemantics.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`

## Verification

- `npm -C yanote-js test -- src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts`

## Observability Impact

- Signals added/changed: governance diagnostics gain typed request-semantic failure codes and deterministic precedence ahead of threshold/regression failures.
- How a future agent inspects this: run the focused gate tests or inspect `governance.diagnostics` in `yanote-report.json`.
- Failure state exposed: invalid, unavailable, and unsupported request semantics become distinct semantic failures with operation-scoped reasons and hints.
