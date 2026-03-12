# T02: 02-coverage-metrics-and-cli-reporting 02

**Slice:** S02 — **Milestone:** M001

## Description

Harden the report artifact boundary to guarantee strict, versioned, deterministic JSON output.

Purpose: Deliver COVR-04 as a compatibility contract for local and CI report consumers.
Output: Schema validator, canonical normalization helpers, deterministic writer behavior, and contract tests. CLI summary contract scope (COVR-05) remains in 02-03 integration.

## Files

- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/writeReport.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
