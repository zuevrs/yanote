---
id: T02
parent: S02
milestone: M013
key_files:
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/report/report.contract.test.ts
  - yanote-js/src/report/report.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
key_decisions:
  - Expose deprecated HTTP coverage truth under `summary.deprecatedOperations` as an additive subset summary instead of introducing a new top-level coverage dimension.
  - Require explicit `deprecated` booleans on canonical `coverage.perOperation[]` report rows so report JSON stays schema-valid and deterministic even when source contracts omit `deprecated: false`.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T01:09:26.249Z
blocker_discovered: false
---

# T02: Add additive deprecated-operation summary and flags to the HTTP JSON report

**Add additive deprecated-operation summary and flags to the HTTP JSON report**

## What Happened

I extended the canonical HTTP report DTO so deprecated-operation truth is now first-class additive report metadata instead of an implicit coverage-only detail. In `yanote-js/src/report/report.ts`, the report summary now publishes `deprecatedOperations { totalOperations, coveredOperations, uncoveredOperations, operationCoveragePercent }`, and each `coverage.perOperation[]` row now emits an explicit `deprecated` boolean sourced from the T01 coverage metadata. The deprecated summary is computed as a filtered subset over existing operation coverage, so legacy `summary.coveredOperations`, `coverage.operations`, `coverage.status`, `coverage.parameters`, `coverage.aggregate`, and report-status semantics remain unchanged.

I extended `yanote-js/src/report/schema.ts` so the new summary block and per-operation boolean are schema-required and fail closed if omitted, then updated `yanote-js/src/report/normalize.ts` so deprecated coverage percent is rounded deterministically alongside the existing percent fields. I also updated the focused report tests: `report.contract.test.ts` now validates the additive deprecated JSON shape, preserves the S01 `specSource` contract, and proves normalization keeps deprecated ordering/rounding deterministic; `report.test.ts` now proves the dedicated deprecated fixture still reports partial legacy HTTP coverage at `2/3` while surfacing one uncovered deprecated operation explicitly; and `writeReport.determinism.test.ts` now exercises the expanded DTO so byte-stable JSON emission still holds.

## Verification

Focused report verification passed with `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/report.test.ts src/report/writeReport.determinism.test.ts`, proving the new deprecated fields are schema-valid, additive, and deterministically written. The broader slice Vitest verification also passed with `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts`, confirming no regressions across the current HTTP/CLI/report contract stack. As expected for an intermediate task, the T04-owned retained proof checks still fail because `scripts/ci/verify-m013-s02-deprecated-operations.sh` and `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` do not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/report.test.ts src/report/writeReport.determinism.test.ts` | 0 | ✅ pass | 847ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2010ms |
| 3 | `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` | 127 | ❌ fail | 5ms |
| 4 | `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` | 1 | ❌ fail | 79ms |


## Deviations

None.

## Known Issues

The slice-level retained proof commands `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` and `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` still fail because those T04-owned files have not been created yet.

## Files Created/Modified

- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
