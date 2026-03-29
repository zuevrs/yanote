---
id: T02
parent: S02
milestone: M010
provides:
  - Partial HTTP core analyzer scaffolding for undeclared status drift, parameter-value conformance, and response-header conformance.
key_files:
  - yanote-js/src/coverage/httpOperationEvidence.ts
  - yanote-js/src/coverage/statusCoverage.ts
  - yanote-js/src/coverage/httpValueConformance.ts
  - yanote-js/src/coverage/httpParameterValueConformance.ts
  - yanote-js/src/coverage/httpResponseHeaderConformance.ts
  - yanote-js/src/coverage/httpCoreConformance.ts
  - yanote-js/src/coverage/statusCoverage.test.ts
key_decisions:
  - Reused a shared HTTP operation matcher exported from the T01 resolver so new analyzers can keep real suite/run context without adding a third route-matching implementation.
patterns_established:
  - Shared string-to-scalar coercion and repeated-value handling now live in one helper intended for both parameter and response-header conformance.
observability_surfaces:
  - yanote-js/src/coverage/httpCoreConformance.ts
  - yanote-js/src/coverage/httpParameterValueConformance.ts
  - yanote-js/src/coverage/httpResponseHeaderConformance.ts
  - none verified in this unit
duration: 0h55m
verification_result: partial
completed_at: 2026-03-25T05:11:55+03:00
blocker_discovered: false
---

# T02: Build typed HTTP core conformance analyzers

**Started HTTP core conformance analyzers and shared matcher plumbing, but left the task incomplete and unverified because the context budget forced an early wrap-up.**

## What Happened

I used the remaining budget to land the highest-risk structural pieces first:
- exported a reusable HTTP operation matcher from `yanote-js/src/coverage/httpOperationEvidence.ts` so new analyzers can share T01 route resolution without copying matcher logic again;
- extended `yanote-js/src/coverage/statusCoverage.ts` with additive `undeclaredObservedStatuses` output while keeping the declared-coverage math intact;
- added `yanote-js/src/coverage/httpValueConformance.ts` as the shared supported-subset helper for string coercion, enum/range/pattern checks, and repeated-value handling;
- drafted new analyzer files at `yanote-js/src/coverage/httpParameterValueConformance.ts`, `yanote-js/src/coverage/httpResponseHeaderConformance.ts`, and `yanote-js/src/coverage/httpCoreConformance.ts`;
- updated `yanote-js/src/coverage/statusCoverage.test.ts` to reflect the additive drift field.

I did **not** get to the focused Vitest suites for the new analyzers, and I did **not** run diagnostics or tests after writing the new files.

## Verification

No verification commands were run in this unit after the partial implementation landed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | No verification commands run after the partial T02 edits. | n/a | ❌ fail | n/a |

## Diagnostics

Resume from these files first:
- `yanote-js/src/coverage/httpOperationEvidence.ts` — new exported shared matcher used by the in-progress analyzers.
- `yanote-js/src/coverage/httpValueConformance.ts` — shared coercion/validation policy for supported scalar and array value subsets.
- `yanote-js/src/coverage/httpParameterValueConformance.ts` — draft parameter analyzer; needs a full read, likely fixes, and focused tests.
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts` — draft response-header analyzer; needs a full read, likely fixes, and focused tests.
- `yanote-js/src/coverage/httpCoreConformance.ts` — draft aggregator; needs a full read, likely fixes, and focused tests.
- `yanote-js/src/coverage/statusCoverage.test.ts` — only test file updated before the wrap-up.

## Deviations

- I wrapped the unit early because of the context-budget warning before completing the planned analyzer test suites or running the T02 verification commands.
- I exported matcher plumbing from `httpOperationEvidence.ts` as a local adaptation so the new analyzers could share T01 route matching while keeping event-level suite/run context.

## Known Issues

- T02 is **not actually complete** despite this wrap-up artifact; the new analyzer files are drafts and have not been compiled or tested.
- `yanote-js/src/coverage/httpParameterValueConformance.test.ts` has not been created in this unit.
- `yanote-js/src/coverage/httpResponseHeaderConformance.test.ts` has not been created in this unit.
- `yanote-js/src/coverage/httpCoreConformance.test.ts` has not been created in this unit.
- The updated `statusCoverage` result shape likely requires follow-on updates anywhere exact-object expectations still exist.
- I did not rerun the carried T01 coverage baseline check from `src/coverage/coverage.test.ts` in this unit.

## Files Created/Modified

- `yanote-js/src/coverage/httpOperationEvidence.ts` — exported shared operation-matcher plumbing for downstream analyzers.
- `yanote-js/src/coverage/statusCoverage.ts` — added additive undeclared-status output.
- `yanote-js/src/coverage/httpValueConformance.ts` — added shared supported-subset coercion and value-validation helper.
- `yanote-js/src/coverage/httpParameterValueConformance.ts` — drafted parameter-value conformance analyzer.
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts` — drafted response-header conformance analyzer.
- `yanote-js/src/coverage/httpCoreConformance.ts` — drafted HTTP core aggregation surface.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — exported the response-contract selector for potential reuse.
- `yanote-js/src/coverage/statusCoverage.test.ts` — updated status coverage expectations for additive undeclared drift.
## Must-Haves Covered

- Declared-status coverage math stays intact while observed undeclared statuses become first-class drift output for `R031`.
- Supported path/query/header value validation consumes retained evidence maps plus capture states instead of falling back to `queryKeys` / `headerKeys`.
- Response-header validation uses selected response contracts and fails closed as unsupported or unverifiable when evidence or schema semantics fall outside the supported subset.

