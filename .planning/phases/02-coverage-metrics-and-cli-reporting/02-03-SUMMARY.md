---
phase: 02-coverage-metrics-and-cli-reporting
plan: 03
subsystem: api
tags: [coverage, report, cli, deterministic]
requires:
  - phase: 02-coverage-metrics-and-cli-reporting
    provides: status/parameter scorers and strict deterministic report write boundary from 02-01 and 02-02
provides:
  - Integrated layered operation/status/parameter coverage engine with fixed aggregate weighting
  - Schema-aligned deterministic report payload builder over canonical operation identity
  - Standalone CLI summary contract with typed fail-closed exits and machine summary line
affects: [phase-03-governance-gates, ci-delivery, coverage-consumer-contracts]
tech-stack:
  added: []
  patterns:
    - Coverage aggregate remains N/A when any weighted dimension is N/A with no weight redistribution
    - CLI keeps plain text fixed section ordering and exactly one final YANOTE_SUMMARY line
    - Failure classes emit deterministic stderr contract in typed input/semantic/gate/runtime buckets
key-files:
  created:
    - yanote-js/src/cli.summary.contract.test.ts
  modified:
    - yanote-js/src/spec/openapi.ts
    - yanote-js/src/coverage/coverage.ts
    - yanote-js/src/coverage/coverage.test.ts
    - yanote-js/src/coverage/coverage.matching.test.ts
    - yanote-js/src/coverage/coverage.parity.test.ts
    - yanote-js/src/report/report.ts
    - yanote-js/src/report/report.test.ts
    - yanote-js/src/report/normalize.ts
    - yanote-js/src/report/report.contract.test.ts
    - yanote-js/src/report/writeReport.determinism.test.ts
    - yanote-js/src/cli.ts
    - yanote-js/src/cli.report.test.ts
    - yanote-js/src/cli.test.ts
key-decisions:
  - "OpenAPI loader now publishes per-operation response and parameter contracts keyed by canonical operation key while preserving Phase 1 identity semantics."
  - "generatedAt is deterministic: minimum event timestamp when present, otherwise fixed epoch fallback."
  - "CLI always emits summary stdout and typed stderr failures while preserving report snapshots when deterministic artifacts can be produced."
patterns-established:
  - "Layered coverage contracts flow directly into report schema without ad-hoc CLI recomputation."
  - "Top issues are deterministically sorted and truncated with explicit tail marker."
requirements-completed: [COVR-01, COVR-02, COVR-03, COVR-05, DELV-01]
duration: 24min
completed: 2026-03-04
---

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
