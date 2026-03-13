---
estimated_steps: 4
estimated_files: 4
---

# T01: Define the separate async report and gate contract

**Slice:** S03 — Separate Async Report And Gate Surface
**Milestone:** M003

## Description

Pin the separate async report JSON shape and async gate contract in tests before wiring the builder and CLI, so S03 can preserve the S02 semantics honestly without smuggling them into the existing HTTP artifact.

## Steps

1. Audit the current HTTP report, normalization, schema, and gate patterns to identify which pieces can be mirrored and which must stay async-specific.
2. Define the async report sections for summary, channel/operation/message coverage, and explicit unmatched/mismatched diagnostics.
3. Add contract tests that prove the async artifact stays separate from the HTTP report surface and rejects schema drift.
4. Add async gate tests that pin threshold/regression/fail-closed behavior against the async coverage result model.

## Must-Haves

- [ ] The async report shape is deterministic and separate from the HTTP report surface.
- [ ] The async gate contract is pinned in tests before CLI wiring starts.
- [ ] Async diagnostics remain explicit instead of being flattened into generic HTTP-era fields.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts`
- The new tests fail only where the missing async report/gate implementation still needs to land.

## Inputs

- `yanote-js/src/coverage/asyncCoverage.ts` — authoritative async coverage result surface from S02.
- `yanote-js/src/report/report.ts` — current HTTP report pattern to mirror carefully, not merge into.
- `yanote-js/src/gates/evaluator.ts` — current gate-evaluation boundary and deterministic failure ordering pattern.
- `.gsd/milestones/M003/slices/S02/S02-SUMMARY.md` — confirms what S02 already proved and what the report layer must preserve.

## Expected Output

- `yanote-js/src/report/asyncReport.ts` — async report contract owner.
- `yanote-js/src/report/asyncReport.test.ts` — report-shape and builder expectations.
- `yanote-js/src/report/asyncReport.contract.test.ts` — strict schema/normalization contract.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — async gate contract proof.
