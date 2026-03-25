---
id: T03
parent: S03
milestone: M010
provides:
  - Durable proof that the CI/GitHub summary now maps and orders async Kafka header failures like the async gate path.
key_files:
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
key_decisions:
  - Mirrored the async gate failure order in the summary renderer by adding missing-header, unavailable-header, and invalid-header between payload failures and unverifiable-headers.
patterns_established:
  - Report-only async summary tests should pin both synthesized primary semantic failure text and medium-severity diagnostic ordering so header regressions are obvious without relying on stderr fallbacks.
observability_surfaces:
  - scripts/ci/render-yanote-summary.mjs
  - node --test scripts/ci/render-yanote-summary.test.mjs
  - GitHub summary markdown generated from retained async proof artifacts
  - .yanote-ci/live-kafka-proof
duration: 0h55m
verification_result: passed
completed_at: 2026-03-25T07:02:00+03:00
blocker_discovered: false
---

# T03: Align CI summary rendering with async header failure order

**Added async header semantic mapping, precedence, and report-only summary tests so CI now renders Kafka header failures with the same ordering and wording as the async gate path.**

## What Happened

I kept the task narrow to the summary surface. In `scripts/ci/render-yanote-summary.mjs` I added the missing async header diagnostic mappings for `missing-header`, `unavailable-header`, and `invalid-header`, inserted them into the async precedence table at the same positions used by the async gate failure order, and taught both the synthesized primary-failure formatter and the medium-severity issue formatter to render header failures with schema id, pointer, and reason context.

I then extended `scripts/ci/render-yanote-summary.test.mjs` with two stronger report-only fixtures:

1. a mixed payload + header + routing fixture that proves the summary still prefers higher-precedence payload failures while rendering header diagnostics in the correct place before routing drift, and
2. a header-only-primary fixture that proves `missing-header` becomes the primary semantic failure when no higher-precedence payload failure is present.

I also updated `.gsd/milestones/M010/slices/S03/S03-PLAN.md` to mark T03 complete and refreshed `.gsd/STATE.md` so the next action now points at T04.

## Verification

I verified the task directly with the node summary-renderer suite, which passed after the renderer and fixture updates.

I also ran the slice-level verification stack for an intermediate-task snapshot:

- the expanded `yanote-js` async JS suite still fails in `src/coverage/asyncCoverage.diagnostics.test.ts` on the already-known stale T01 expectations that still assume older `unverifiable-headers` behavior,
- the live Kafka proof verifier passed on direct rerun, and
- the docs / async acceptance stack passed end-to-end.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 0.261s |
| 2 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/gates/asyncEvaluator.test.ts` | 1 | ❌ fail | 3.837s |
| 3 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 113.140s |
| 4 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh` | 0 | ✅ pass | 123.480s |

## Diagnostics

To inspect this task later:

- run `node --test scripts/ci/render-yanote-summary.test.mjs` for the direct contract,
- run `node scripts/ci/render-yanote-summary.mjs --help` and point it at retained async proof artifacts to inspect report-only rendering,
- inspect `.yanote-ci/live-kafka-proof` for the retained async proof bundle that now feeds the same summary surface.

The failure state exposed by this task is now explicit in summary markdown: async header failures surface their semantic code plus schema/pointer/reason context, and report-only ordering makes it obvious whether a payload, header, or routing problem is primary.

## Deviations

- None in product scope. The implementation stayed within the planned renderer and test surfaces.

## Known Issues

- The broader `yanote-js` async suite is still not fully green because `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` retains the already-known stale expectations captured in the T01 handoff; those failures are outside the renderer change shipped here.
- T04 remains open for the slice and still needs the public async boundary docs/verifier refresh.

## Files Created/Modified

- `scripts/ci/render-yanote-summary.mjs` — added async header semantic code mapping, precedence, and failure/issue formatting aligned with the async gate path.
- `scripts/ci/render-yanote-summary.test.mjs` — added mixed payload+header+routing and header-primary report-only fixtures that pin ordering, class counts, and header issue text.
- `.gsd/milestones/M010/slices/S03/S03-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — advanced the next action to T04.
- `.gsd/milestones/M010/slices/S03/tasks/T03-SUMMARY.md` — recorded the durable implementation and verification snapshot for this task.
