---
estimated_steps: 5
estimated_files: 6
---

# T02: Implement async report building, normalization, and gate evaluation

**Slice:** S03 — Separate Async Report And Gate Surface
**Milestone:** M003

## Description

Implement the real async artifact builder and gate evaluator over the S02 coverage result so separate async reporting and fail-closed gate logic become executable rather than test-only contracts.

## Steps

1. Build the async report artifact from `asyncCoverage.ts`, preserving the channel/operation/message split and explicit unmatched/mismatched diagnostics.
2. Add deterministic normalization and schema validation for the async artifact.
3. Implement async gate evaluation for threshold/regression/fail-closed scenarios using the async coverage result model instead of the HTTP one.
4. Keep async report and gate logic separate from the existing HTTP report path so the two surfaces can evolve independently.
5. Re-run the targeted report/gate tests until the artifact and gate diagnostics are deterministic.

## Must-Haves

- [ ] The async report serializes the S02 coverage result truthfully and deterministically.
- [ ] Async gate failures are explicit and fail closed.
- [ ] The HTTP report builder remains untouched in behavior.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
- Repeated runs produce identical async report JSON and gate diagnostics.

## Observability Impact

- Signals added/changed: separate async report artifact, explicit async gate diagnostics, and deterministic normalization/schema validation failures.
- How a future agent inspects this: run the targeted async report/gate tests and inspect the generated async report object plus gate result.
- Failure state exposed: schema drift, threshold/regression gate failures, or fail-closed async diagnostics.

## Inputs

- `yanote-js/src/report/asyncReport.ts` — contract owner from T01.
- `yanote-js/src/coverage/asyncCoverage.ts` — async coverage result source.
- `yanote-js/src/gates/evaluator.ts` — reference pattern for deterministic gate ordering.
- `.gsd/milestones/M003/slices/S03/tasks/T01-PLAN.md` — pinned async report/gate contract.

## Expected Output

- `yanote-js/src/report/asyncReport.ts` — implemented async report builder.
- `yanote-js/src/report/asyncSchema.ts` — async report schema validation.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic async report normalization.
- `yanote-js/src/gates/asyncEvaluator.ts` — async gate evaluator.
- `yanote-js/src/report/asyncReport.test.ts` — passing async report proof.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — passing async gate proof.
