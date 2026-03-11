# S03: Governance Gates

**Goal:** Establish deterministic governance policy inputs and exclusion policy mechanics for Phase 3 gate enforcement.
**Demo:** Establish deterministic governance policy inputs and exclusion policy mechanics for Phase 3 gate enforcement.

## Must-Haves


## Tasks

- [x] **T01: 03-governance-gates 01** `est:31min`
  - Establish deterministic governance policy inputs and exclusion policy mechanics for Phase 3 gate enforcement.

Purpose: Deliver policy resolution, exclusion auditability, and CLI policy plumbing as the contract foundation for downstream regression/threshold evaluation.
Output: Gate policy schema + resolver, auditable exclusion engine, and tested CLI option surface for policy precedence.
- [x] **T02: 03-governance-gates 02** `est:46min`
  - Implement deterministic governance gate evaluation, baseline regression contract, and fail-closed evidence integrity behavior.

Purpose: Deliver the core pass/fail policy engine and precedence logic required for CI-trustable governance outcomes.
Output: Versioned baseline v2 support, threshold/regression evaluator, deterministic failure ordering, and fail-closed contract tests.
- [x] **T03: 03-governance-gates 03** `est:39min`
  - Integrate policy, evaluator, baseline, and exclusion behaviors into one deterministic governance contract for CLI/report automated checks.

Purpose: Close Phase 3 by locking stable pass/fail behavior and machine/human output contracts for threshold, regression, exclusions, and fail-closed outcomes.
Output: Deterministic integrated governance behavior with contract tests and full verification command cadence.

## Files Likely Touched

- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/gates/policy.ts`
- `yanote-js/src/gates/policy.schema.ts`
- `yanote-js/src/gates/exclusions.ts`
- `yanote-js/src/gates/policy.test.ts`
- `yanote-js/src/gates/exclusions.test.ts`
- `yanote-js/src/cli.ts`
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
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/schema.ts`
