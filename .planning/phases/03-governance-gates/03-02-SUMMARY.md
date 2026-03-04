---
phase: 03-governance-gates
plan: 02
subsystem: governance
tags: [baseline, evaluator, precedence, fail-closed]
requires:
  - phase: 03-governance-gates
    provides: deterministic policy + exclusion foundation from 03-01
provides:
  - Versioned baseline v2 snapshot contract with explicit update-only workflow
  - Threshold/regression evaluator modules with deterministic precedence hooks
  - Fail-closed evidence integrity in CLI with typed primary/secondary error rendering
affects: [regression-gating, ci-governance, failure-contract]
key-files:
  created:
    - yanote-js/src/baseline/baseline.v2.test.ts
    - yanote-js/src/gates/evaluator.ts
    - yanote-js/src/gates/evaluator.threshold.test.ts
    - yanote-js/src/gates/failureOrder.ts
    - yanote-js/src/gates/failureOrder.test.ts
    - yanote-js/src/cli.failclosed.contract.test.ts
    - yanote-js/test/fixtures/events/events.valid.fixture.jsonl
  modified:
    - yanote-js/src/baseline/baseline.ts
    - yanote-js/src/cli.ts
    - yanote-js/src/events/readJsonl.ts
    - yanote-js/src/events/readJsonl.test.ts
    - yanote-js/src/cli.report.test.ts
requirements-completed: [GATE-01, GATE-02, GATE-04]
duration: 46min
completed: 2026-03-04
---

# Phase 3 Plan 02: Evaluator and fail-closed enforcement Summary

Wave 2 completed the core governance engine: baseline versioning, regression/threshold evaluation, deterministic precedence, and fail-closed evidence enforcement.

## Task Commits

1. **Task 1: Baseline v2 + explicit update flow** - `a56dba8`
2. **Task 2: Evaluator + precedence sorter** - `f26dc0b`
3. **Task 3: CLI fail-closed integrity enforcement** - `cb7088a`

## Verification

- `npm -C yanote-js run test -- src/baseline/baseline.v2.test.ts src/gates/evaluator.regression.test.ts` ✅
- `npm -C yanote-js run test -- src/gates/evaluator.threshold.test.ts src/gates/evaluator.regression.test.ts src/gates/failureOrder.test.ts` ✅
- `npm -C yanote-js run test -- src/cli.failclosed.contract.test.ts src/cli.report.test.ts src/events/readJsonl.test.ts src/cli.test.ts` ✅
- `npm -C yanote-js test` ✅

## Outcome

- Baseline comparison now uses a versioned snapshot and explicit update path only.
- Gate failures are sorted deterministically with precedence `input > semantic > gate > runtime` and gate-internal `regression > threshold`.
- Invalid evidence (`invalidLines`) is now fail-closed and surfaced as typed input failures with deterministic output ordering.
