---
id: S02
parent: M001
milestone: M001
provides:
  - Deterministic status-code coverage scorer over declared OpenAPI response tokens
  - Required-vs-optional parameter coverage scorer with explicit N/A semantics
  - JSONL parameter evidence ingestion contract with stable query/header normalization
  - Strict versioned report schema boundary with unknown-field rejection
  - Canonical report normalization and fixed-rounding helpers for deterministic output
  - Validate-then-write deterministic report artifact boundary
  - Integrated layered operation/status/parameter coverage engine with fixed aggregate weighting
  - Schema-aligned deterministic report payload builder over canonical operation identity
  - Standalone CLI summary contract with typed fail-closed exits and machine summary line
requires: []
affects: []
key_files: []
key_decisions:
  - "Status scoring treats default as covered only when an observed status is not matched by any explicit/range declaration."
  - "Path parameters are considered covered when the operation itself is observed; query/header require explicit evidence keys."
  - "Report schema is strict with additionalProperties false at every v1 object boundary."
  - "Stable serialization is centralized in write boundary to guarantee byte-equivalent output."
  - "OpenAPI loader now publishes per-operation response and parameter contracts keyed by canonical operation key while preserving Phase 1 identity semantics."
  - "generatedAt is deterministic: minimum event timestamp when present, otherwise fixed epoch fallback."
  - "CLI always emits summary stdout and typed stderr failures while preserving report snapshots when deterministic artifacts can be produced."
patterns_established:
  - "Dimension scorers are pure functions over normalized contracts for deterministic reuse."
  - "JSONL parser normalizes malformed evidence to empty arrays without rejecting otherwise valid events."
  - "Normalization helpers sort all report arrays and diagnostics before write."
  - "Schema validation failures fail before file write with actionable joined errors."
  - "Layered coverage contracts flow directly into report schema without ad-hoc CLI recomputation."
  - "Top issues are deterministically sorted and truncated with explicit tail marker."
observability_surfaces: []
drill_down_paths: []
duration: 24min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# S02: Coverage Metrics And Cli Reporting

**# Phase 2 Plan 01: Status and parameter coverage primitives Summary**

## What Happened

# Phase 2 Plan 01: Status and parameter coverage primitives Summary

**Phase 2 now has deterministic status/parameter scoring primitives and evidence ingestion contracts that preserve fail-closed semantics without changing canonical operation matching.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T12:04:00Z
- **Completed:** 2026-03-04T12:12:37Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added shared coverage dimension contracts for status and parameter outputs, including explicit `N/A` state.
- Extended JSONL event ingestion to parse optional `queryKeys`/`headerKeys` with deterministic normalization and backward-compatible defaults.
- Implemented dedicated status and parameter scorers with focused deterministic tests for declared-denominator and required/optional behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define dimension contracts and ingest optional parameter evidence** - `c164d8a` (feat)
2. **Task 2: Implement deterministic status-code coverage scorer** - `34a4d07` (feat)
3. **Task 3: Implement required-vs-optional parameter coverage scorer** - `86432f4` (feat)

## Files Created/Modified
- `yanote-js/src/coverage/dimensions.ts` - Shared deterministic status/parameter dimension contracts and comparators.
- `yanote-js/src/model/httpEvent.ts` - Added optional evidence fields to normalized analyzer event shape.
- `yanote-js/src/events/readJsonl.ts` - Ingests/normalizes query and header evidence fields.
- `yanote-js/src/events/readJsonl.parameters.test.ts` - Contract tests for parser evidence handling.
- `yanote-js/src/coverage/statusCoverage.ts` - Pure declared-response status coverage scorer.
- `yanote-js/src/coverage/statusCoverage.test.ts` - Deterministic status token behavior tests.
- `yanote-js/src/coverage/parameterCoverage.ts` - Pure required/optional/location-aware parameter coverage scorer.
- `yanote-js/src/coverage/parameterCoverage.test.ts` - Required/optional/N/A and location contract tests.

## Decisions Made
- Status `default` is covered only by observed statuses that are not already matched by explicit codes or ranges.
- Query evidence keeps observed key case identity; header evidence is normalized to lowercase for deterministic matching.
- Missing/malformed evidence fields never crash parsing and always normalize to empty evidence collections.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layered coverage integration can now consume stable status and parameter contracts.
- Report schema and deterministic writer work in Plan 02 can proceed without re-defining evidence semantics.

## Self-Check: PASSED
- Verified all required 02-01 files exist on disk.
- Verified task-scoped and plan verification tests pass.

---
*Phase: 02-coverage-metrics-and-cli-reporting*
*Completed: 2026-03-04*

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

# Phase 2 Plan 03: Layered coverage CLI integration Summary

**Phase 2 now delivers deterministic standalone CLI coverage with layered operation/status/parameter metrics, strict report contracts, and typed fail-closed output semantics for local and CI workflows.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-03-04T12:17:35Z
- **Completed:** 2026-03-04T12:41:08Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Integrated layered coverage computation over canonical operation identities with fixed aggregate weighting and explicit N/A behavior.
- Built schema-aligned report assembly including deterministic generatedAt policy and diagnostics ordering guarantees.
- Enforced standalone CLI summary contract (`Summary -> Coverage Dimensions -> Top Issues -> Report Path -> Machine Summary Line`) with no ANSI output and typed stderr failures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate layered coverage computation over canonical operation identities** - `1b55910` (feat)
2. **Task 2: Build schema-aligned deterministic report payload from layered coverage** - `d6528bd` (feat)
3. **Task 3: Enforce standalone CLI summary and typed exit contract** - `199765b` (feat)

## Files Created/Modified
- `yanote-js/src/spec/openapi.ts` - Added coverage metadata extraction keyed by canonical operation identity.
- `yanote-js/src/coverage/coverage.ts` - Integrated operation/status/parameter dimensions and weighted aggregate semantics.
- `yanote-js/src/coverage/coverage.test.ts` - Added layered integration coverage tests including aggregate N/A policy.
- `yanote-js/src/coverage/coverage.matching.test.ts` - Updated matcher tests to current event evidence shape.
- `yanote-js/src/coverage/coverage.parity.test.ts` - Kept parity fixture adapter aligned with updated event shape.
- `yanote-js/src/report/report.ts` - Emits strict layered schema payload with deterministic generatedAt and report status.
- `yanote-js/src/report/report.test.ts` - Validates layered schema-aligned report assembly.
- `yanote-js/src/report/normalize.ts` - Maintains canonical sorting/rounding for expanded report shape.
- `yanote-js/src/report/report.contract.test.ts` - Locks strict schema contract on updated payload fields.
- `yanote-js/src/report/writeReport.determinism.test.ts` - Verifies deterministic write for layered payload.
- `yanote-js/src/cli.ts` - Adds fixed summary contract, typed exits, and fail-closed behavior with deterministic snapshots.
- `yanote-js/src/cli.summary.contract.test.ts` - Adds section-order/no-ANSI/machine-line/top-issues contract tests.
- `yanote-js/src/cli.report.test.ts` - Verifies report path + typed gate exits.
- `yanote-js/src/cli.test.ts` - Verifies help, typed failures, fail-closed semantics, and single machine line behavior.

## Decisions Made
- Aggregate coverage remains `N/A` when any weighted dimension is `N/A`; no redistribution of weights.
- CLI stderr contract is standardized as `YANOTE_ERROR class=... code=... reason=... hint=...` for parseable failure handling.
- Semantic invalid/ambiguous outcomes remain fail-closed with deterministic report snapshot writing when artifact generation succeeds.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escaping and scripted string-literal regressions during bulk rewrites**
- **Found during:** Task 1 and Task 3 implementation
- **Issue:** Generated TypeScript had broken escape literals in wildcard regex and some test fixture newline joins.
- **Fix:** Rewrote affected files with corrected escapes and reran failing task-scoped verification until green.
- **Files modified:** `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/cli.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`
- **Verification:** Re-ran task-level coverage and CLI contract test commands and full plan verification command block.
- **Committed in:** `199765b` (final task commit includes test fixes)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** No scope expansion; fixes were required for deterministic correctness and testability.

## Issues Encountered
- Initial scripted multi-file update exceeded shell argument constraints, resolved by splitting edits into smaller file-level updates.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 requirements and CLI/report contracts are now deterministic and ready for governance gate enforcement in Phase 3.
- Downstream CI and policy phases can rely on stable machine-line and typed stderr contracts without introducing compatibility drift.

## Self-Check: PASSED
- Verified required 02-03 files exist and are committed.
- Verified task-level, plan-level, full `yanote-js` test suite, and build commands are green.

---
*Phase: 02-coverage-metrics-and-cli-reporting*
*Completed: 2026-03-04*
