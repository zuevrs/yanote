---
id: S03
parent: M001
milestone: M001
provides:
  - Deterministic governance policy resolution with precedence CLI > policy file > defaults
  - Auditable exclusion rule engine with metadata requirements and wildcard guardrails
  - CLI policy/profile plumbing that resolves one effective policy before gate checks
  - Versioned baseline v2 snapshot contract with explicit update-only workflow
  - Threshold/regression evaluator modules with deterministic precedence hooks
  - Fail-closed evidence integrity in CLI with typed primary/secondary error rendering
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
# S03: Governance Gates

**# Phase 3 Plan 01: Policy and exclusion foundation Summary**

## What Happened

# Phase 3 Plan 01: Policy and exclusion foundation Summary

Phase 3 wave 1 delivered deterministic governance inputs and auditable exclusion policy behavior without breaking CLI machine-summary grammar.

## Task Commits

1. **Task 1: Policy schema + deterministic resolver** - `e14a6df`
2. **Task 2: Auditable exclusion engine + guardrails** - `21de6ff`
3. **Task 3: CLI policy/profile integration** - `ec10e20`

## Verification

- `npm -C yanote-js run test -- src/gates/policy.test.ts` ✅
- `npm -C yanote-js run test -- src/gates/exclusions.test.ts src/coverage/coverage.test.ts` ✅
- `npm -C yanote-js run test -- src/cli.test.ts src/gates/policy.test.ts` ✅

## Outcome

- Effective gate policy is resolved once, deterministically.
- Exclusions are transparent, validated, and deterministic in apply/unmatched behavior.
- CLI now accepts `--policy` and `--profile` and applies policy precedence before threshold/regression evaluation.

# Phase 3 Plan 02: Evaluator and fail-closed enforcement Summary

Wave 2 completed the core governance engine: baseline versioning, regression/threshold evaluation, deterministic precedence, and fail-closed evidence enforcement.

## Task Commits

1. **Task 1: Baseline v2 + explicit update flow** - `a56dba8`
2. **Task 2: Evaluator + precedence sorter** - `f26dc0b`
3. **Task 3: CLI fail-closed integrity enforcement** - `cb7088a`

## Verification

- `npm -C yanote-js run test -- src/baseline/baseline.v2.test.ts src/gates/evaluator.regression.test.ts` ✅
- `npm -C yanote-js run test -- src/gates/evaluator.threshold.test.ts src/gates/evaluator.regression.test.ts src/gates/failureOrder.test.ts` ✅
- `npm -C yanote-js run test -- src/cli.failclosed.contract.test.ts src/cli.report.test.ts src/events/readJsonl.test.ts src/cli.test.ts` ✅
- `npm -C yanote-js test` ✅

## Outcome

- Baseline comparison now uses a versioned snapshot and explicit update path only.
- Gate failures are sorted deterministically with precedence `input > semantic > gate > runtime` and gate-internal `regression > threshold`.
- Invalid evidence (`invalidLines`) is now fail-closed and surfaced as typed input failures with deterministic output ordering.

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
