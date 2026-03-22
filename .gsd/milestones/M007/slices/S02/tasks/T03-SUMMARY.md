---
id: T03
parent: S02
milestone: M007
provides:
  - Public async coverage/report/gate/CLI surfaces now compose from the internal schema-conformance seam while preserving the S02 unmatched-or-mismatched-only contract.
key_files:
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/cli.async-report.test.ts
key_decisions:
  - Use `computeAsyncSchemaConformance(...).matchedOperationKeys` as the internal routing truth for public async operation coverage while keeping public diagnostics limited to unmatched and mismatched drift until S03.
patterns_established:
  - Prove the S02 boundary with paired internal-vs-public fixture tests: schema-invalid and missing-payload fixtures fail only in `asyncSchemaConformance*` suites while coverage/report/gate/CLI stay green and diagnostic-count stable.
observability_surfaces:
  - yanote-js/src/coverage/asyncCoverage*.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/cli.async-report.test.ts
duration: PT30M
verification_result: passed
completed_at: 2026-03-20T17:27:09+0300
blocker_discovered: false
---

# T03: Preserve public async coverage/report/gate compatibility while schema semantics stay internal

**Composed public async coverage from internal schema conformance without widening report, gate, or CLI diagnostics.**

## What Happened

I loaded the `vitest` skill, then updated `yanote-js/src/coverage/asyncCoverage.ts` to consume the internal schema-conformance seam by deriving public operation coverage from `matchedOperationKeys` while keeping the exported public diagnostic union unchanged at `unmatched | mismatched`.

I extended the public async coverage suites to pin the compatibility boundary explicitly. The new coverage tests prove that invalid and missing payload fixtures from the schema-depth corpus still count as publicly covered routing/message evidence in S02, while only true routing or message drift produces public diagnostics. I also added parity coverage for the schema-depth v2/v3 fixtures.

To keep the downstream public contract guarded, I added non-regression tests in `asyncReport.test.ts`, `asyncEvaluator.test.ts`, and `cli.async-report.test.ts` that use the schema-invalid fixture and assert the public report stays `ok`, gate evaluation stays empty, and CLI output still reports zero public diagnostics. I left the report-schema and CLI-contract suites unchanged and revalidated them as guards against accidental contract widening.

Finally, I marked T03 complete in the slice plan and refreshed `.gsd/STATE.md` to handoff state for the completed S02 slice.

## Verification

I verified both the internal observability seam and the public compatibility boundary with the slice’s non-git Vitest stacks. I also ran a targeted `asyncCoverage.test.ts` command after repairing a late syntax insertion to confirm the new schema-boundary coverage guard itself executed as expected.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts --reporter=verbose` | 0 | ✅ pass | 0.70s |
| 2 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` | 0 | ✅ pass | 1.51s |
| 3 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 1.41s |
| 4 | `git diff --check` | not run | ⚠️ skipped | 0.00s |

## Diagnostics

Future agents can inspect the S02 public/internal boundary by running the same two Vitest commands above and comparing the outcomes:

- `yanote-js/src/coverage/asyncSchemaConformance*.test.ts` should still surface schema-depth failures like `invalid-payload` and `missing-payload` for the schema-depth fixtures.
- `yanote-js/src/coverage/asyncCoverage*.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, and `yanote-js/src/cli.async-report.test.ts` should continue to show those same fixtures as publicly compatible in S02, with zero leaked schema-depth diagnostics.

The pinned fixtures are under `yanote-js/test/fixtures/asyncapi/schema-depth-v{2,3}.yaml` and `yanote-js/test/fixtures/async-events/schema-*.fixture.jsonl`.

## Deviations

- I did not run `git diff --check` even though it is part of the slice verifier list, because this auto-mode run explicitly forbade git commands. All non-git verification commands for the task and the full slice passed.

## Known Issues

- None.

## Files Created/Modified

- `yanote-js/src/coverage/asyncCoverage.ts` — composed public operation coverage from the internal schema-conformance match set while preserving the public diagnostic union.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — added schema-depth compatibility coverage assertions proving invalid and missing payload fixtures stay publicly covered in S02.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — added a regression guard that schema-validation failures do not leak public diagnostic kinds beyond `unmatched` and `mismatched`.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — added schema-depth v2/v3 parity coverage for the unchanged public surface.
- `yanote-js/src/report/asyncReport.test.ts` — added a non-regression test proving internal schema failures do not widen the public async report contract.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — added a non-regression test proving internal schema failures do not create public gate failures in S02.
- `yanote-js/src/cli.async-report.test.ts` — added a non-regression CLI guard proving schema-invalid fixtures still emit the unchanged public async contract.
- `.gsd/milestones/M007/slices/S02/S02-PLAN.md` — marked T03 complete and thereby closed the slice task list.
- `.gsd/STATE.md` — advanced the milestone state from execution to handoff after S02 completion.
- `.gsd/milestones/M007/slices/S02/tasks/T03-SUMMARY.md` — recorded the implementation, verification evidence, and task handoff details.
