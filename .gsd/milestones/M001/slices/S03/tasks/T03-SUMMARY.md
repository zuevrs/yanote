---
id: T03
parent: S03
milestone: M001
provides:
  - Integrated governance verdict rendering in CLI with profile-aware strictness
  - Stable primary/secondary failure rendering contract and machine summary enrichments
  - Report governance transparency blocks for applied/unmatched exclusions and ordered diagnostics
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 39min
verification_result: passed
completed_at: 2026-03-04
blocker_discovered: false
---
# T03: 03-governance-gates 03

**# Phase 3 Plan 03: Integrated governance output contract Summary**

## What Happened

# Phase 3 Plan 03: Integrated governance output contract Summary

Wave 3 integrated governance output contracts across CLI/report surfaces and published exclusion transparency artifacts with deterministic ordering.

## Task Commits

1. **Task 1: Integrate governance verdict rendering in CLI path** - `cb7088a`, `3c5c3c3`
2. **Task 2: Lock primary+secondary failure rendering contract** - `b79c317`
3. **Task 3: Publish exclusion transparency in report schema/artifacts** - `8120afe`

## Verification

- `npm -C yanote-js run test -- src/cli.report.test.ts src/cli.test.ts` ✅
- `npm -C yanote-js run test -- src/cli.summary.contract.test.ts src/cli.test.ts` ✅
- `npm -C yanote-js run test -- src/report/report.test.ts src/cli.report.test.ts src/report/report.contract.test.ts` ✅
- `npm -C yanote-js test && npm -C yanote-js run build` ✅
- `./gradlew test` ✅ (passed after setting `JAVA_HOME` to OpenJDK 21 in local environment)

## Outcome

- CLI now emits one primary `YANOTE_ERROR` plus deterministic `YANOTE_ERROR_SECONDARY` lines.
- Machine summary includes stable `primary=` and `class_counts=` tokens and continues to emit `report=none` on report-write failures.
- Report artifacts now carry deterministic governance transparency (`governance.exclusions.appliedRules`, `governance.exclusions.unmatchedRules`, `governance.diagnostics`), including explicit `usedCriticalOverride` visibility.
