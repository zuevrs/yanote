# T02: 03-governance-gates 02

**Slice:** S03 — **Milestone:** M001

## Description

Implement deterministic governance gate evaluation, baseline regression contract, and fail-closed evidence integrity behavior.

Purpose: Deliver the core pass/fail policy engine and precedence logic required for CI-trustable governance outcomes.
Output: Versioned baseline v2 support, threshold/regression evaluator, deterministic failure ordering, and fail-closed contract tests.

## Files

- `yanote-js/src/baseline/baseline.ts`
- `yanote-js/src/baseline/baseline.v2.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/gates/evaluator.threshold.test.ts`
- `yanote-js/src/gates/evaluator.regression.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/events/readJsonl.test.ts`
