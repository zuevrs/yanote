---
id: T03
parent: S01
milestone: M012
key_files:
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/report/report.security.contract.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - yanote-js/src/report/report.contract.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Expose HTTP security truth on a dedicated top-level `httpSecurityConformance` report section instead of mutating legacy `coverage.*` numerators.
  - Annotate security diagnostics with typed semantic codes and mirror those codes in `normalizeReport()` governance ordering so normalized report JSON stays aligned with fail-closed primary-failure precedence.
duration: ""
verification_result: passed
completed_at: 2026-03-25T21:32:06.726Z
blocker_discovered: false
---

# T03: Publish additive httpSecurityConformance report contracts with typed security diagnostics

**Publish additive httpSecurityConformance report contracts with typed security diagnostics**

## What Happened

Implemented the additive security report surface across the HTTP report pipeline. In `yanote-js/src/report/report.ts` I added a dedicated `httpSecurityConformance` section with summary, per-operation, and diagnostic DTOs sourced from the existing security conformance model, including effective branch/scheme details and per-diagnostic typed semantic annotations. I also wired `buildReport()` to evaluate security semantic failures alongside payload semantics so security drift now downgrades report status to `partial` and appears on the existing top-level governance diagnostics surface without changing `coverage.operations`, `coverage.status`, `coverage.parameters`, or `coverage.aggregate`. In `yanote-js/src/report/schema.ts` I extended the strict v1 report schema additively, keeping `schemaVersion` at `1.0.0` while validating the new security section and its typed semantic codes. In `yanote-js/src/report/normalize.ts` I added deterministic normalization for security operations, branches, schemes, suites, diagnostics, and mirrored the new security semantic code precedence into governance sorting so normalized JSON stays aligned with primary-failure ordering. I then added `yanote-js/src/report/report.security.contract.test.ts` to prove additive serialization, unchanged legacy coverage numerators, effective branch ordering, typed security governance surfacing, and secret-safe output on the shared security fixture, and extended `yanote-js/src/report/writeReport.determinism.test.ts` plus `yanote-js/src/report/report.contract.test.ts` so the writer and base schema fixtures cover the new section deterministically.

## Verification

Ran the focused task verifier `npm -C yanote-js test -- src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts` and it passed. Then ran the slice-level verifier stack for this intermediate task: `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`, `node --test scripts/ci/render-yanote-summary.test.mjs`, and `npm -C yanote-js run build`; all exited successfully on the current file set. The focused report contract assertions explicitly proved that security truth is additive, typed, deterministically ordered, and secret-safe while legacy HTTP coverage numerators remain unchanged.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts` | 0 | ✅ pass | 2269ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts` | 0 | ✅ pass | 785ms |
| 3 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 253ms |
| 4 | `npm -C yanote-js run build` | 0 | ✅ pass | 372ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.security.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `.gsd/KNOWLEDGE.md`
