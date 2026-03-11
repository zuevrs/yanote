# S02: Coverage Metrics And Cli Reporting

**Goal:** Define deterministic status and parameter coverage primitives so Phase 2 can compute layered coverage with explicit evidence semantics.
**Demo:** Define deterministic status and parameter coverage primitives so Phase 2 can compute layered coverage with explicit evidence semantics.

## Must-Haves


## Tasks

- [x] **T01: 02-coverage-metrics-and-cli-reporting 01** `est:8min`
  - Define deterministic status and parameter coverage primitives so Phase 2 can compute layered coverage with explicit evidence semantics.

Purpose: Establish COVR-02/COVR-03 math and evidence contracts before CLI/report integration.
Output: Coverage-dimension contracts, parameter-evidence ingestion, and focused status/parameter test suites.
- [x] **T02: 02-coverage-metrics-and-cli-reporting 02** `est:5min`
  - Harden the report artifact boundary to guarantee strict, versioned, deterministic JSON output.

Purpose: Deliver COVR-04 as a compatibility contract for local and CI report consumers.
Output: Schema validator, canonical normalization helpers, deterministic writer behavior, and contract tests. CLI summary contract scope (COVR-05) remains in 02-03 integration.
- [x] **T03: 02-coverage-metrics-and-cli-reporting 03** `est:24min`
  - Integrate Phase 2 coverage dimensions and deterministic report/CLI contracts into a runnable standalone analyzer flow.

Purpose: Fulfill operation-level coverage plus readable deterministic CLI reporting for local and CI usage.
Output: Integrated compute/report/CLI behavior with deterministic contract tests and build verification.

## Files Likely Touched

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/events/readJsonl.parameters.test.ts`
- `yanote-js/src/coverage/statusCoverage.ts`
- `yanote-js/src/coverage/statusCoverage.test.ts`
- `yanote-js/src/coverage/parameterCoverage.ts`
- `yanote-js/src/coverage/parameterCoverage.test.ts`
- `yanote-js/package.json`
- `yanote-js/package-lock.json`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/writeReport.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.test.ts`
