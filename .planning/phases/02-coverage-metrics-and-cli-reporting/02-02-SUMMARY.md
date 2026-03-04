---
phase: 02-coverage-metrics-and-cli-reporting
plan: 02
subsystem: api
tags: [report, schema, determinism, validation]
requires:
  - phase: 02-coverage-metrics-and-cli-reporting
    provides: status and parameter coverage dimension contracts from 02-01
provides:
  - Strict versioned report schema boundary with unknown-field rejection
  - Canonical report normalization and fixed-rounding helpers for deterministic output
  - Validate-then-write deterministic report artifact boundary
affects: [phase-02-cli-integration, ci-report-consumers, contract-tests]
tech-stack:
  added: [ajv, json-stable-stringify]
  patterns:
    - Report schemaVersion is an independent compatibility contract from toolVersion
    - Report writes always normalize then validate before deterministic serialization
key-files:
  created:
    - yanote-js/src/report/schema.ts
    - yanote-js/src/report/normalize.ts
    - yanote-js/src/report/report.contract.test.ts
    - yanote-js/src/report/writeReport.determinism.test.ts
  modified:
    - yanote-js/package.json
    - yanote-js/package-lock.json
    - yanote-js/src/report/writeReport.ts
key-decisions:
  - "Report schema is strict with additionalProperties false at every v1 object boundary."
  - "Stable serialization is centralized in write boundary to guarantee byte-equivalent output."
patterns-established:
  - "Normalization helpers sort all report arrays and diagnostics before write."
  - "Schema validation failures fail before file write with actionable joined errors."
requirements-completed: [COVR-04]
duration: 5min
completed: 2026-03-04
---

# Phase 2 Plan 02: Deterministic report contract boundary Summary

**The report boundary now enforces a strict v1 schema and deterministic byte-stable JSON serialization suitable for local and CI consumers.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04T12:12:40Z
- **Completed:** 2026-03-04T12:17:32Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added explicit versioned report schema contract with required-field enforcement and unknown-field rejection.
- Added normalization helpers for deterministic ordering and shared fixed-decimal rounding.
- Refactored write boundary to normalize, validate, and serialize with stable key ordering and trailing newline.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add strict report schema and normalization utilities** - `108d120` (feat)
2. **Task 2: Enforce deterministic validate-then-write report boundary** - `ccf541d` (feat)

## Files Created/Modified
- `yanote-js/package.json` - Added `ajv` and `json-stable-stringify` dependencies.
- `yanote-js/package-lock.json` - Locked report boundary dependency graph.
- `yanote-js/src/report/schema.ts` - Strict schema validator and schema version constant.
- `yanote-js/src/report/normalize.ts` - Canonical sorting and shared rounding helpers.
- `yanote-js/src/report/report.contract.test.ts` - Contract tests for schema and normalization rules.
- `yanote-js/src/report/writeReport.ts` - Validate-then-stable-serialize write pipeline.
- `yanote-js/src/report/writeReport.determinism.test.ts` - Deterministic byte-output and failure contract tests.

## Decisions Made
- Schema validation is enforced only at one write boundary to prevent divergent validation behavior.
- `schemaVersion` compatibility is validated independently from `toolVersion` lifecycle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `02-03` integration can now safely emit schema-valid deterministic reports from layered coverage outputs.
- CLI contract tests can rely on stable write ordering and explicit validation failures.

## Self-Check: PASSED
- Verified all required 02-02 files exist on disk.
- Verified plan-level report contract and deterministic write tests pass.

---
*Phase: 02-coverage-metrics-and-cli-reporting*
*Completed: 2026-03-04*
