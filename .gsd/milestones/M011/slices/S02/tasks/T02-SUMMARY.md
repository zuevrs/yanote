---
id: T02
parent: S02
milestone: M011
key_files:
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/coverage/httpRequestConformance.test.ts
  - yanote-js/src/report/report.requestEvidence.contract.test.ts
key_decisions:
  - Validate supported repeated query arrays from `declaredSupport.shape === 'array'` using retained ordered `values[]` and per-item scalar schema checks instead of reconstructing unsupported delimiter-based shapes.
  - Keep scalar/redacted/omitted behavior additive and classify unsupported declared contracts or ambiguous retained scalar shapes as `unsupported` diagnostics so legacy coverage numerators remain unchanged.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T16:27:25.870Z
blocker_discovered: false
---

# T02: Validate supported repeated query arrays in request conformance while keeping unsupported semantics explicit

**Validate supported repeated query arrays in request conformance while keeping unsupported semantics explicit**

## What Happened

Activated the OpenAPI 3.2 and Vitest skills, re-read the active GSD state plus the S02/T02 contracts, and then updated `yanote-js/src/coverage/httpRequestConformance.ts` so request conformance now evaluates against the published `declaredSupport` matrix instead of treating every observed parameter as a scalar-only case. Supported scalar parameters still follow the existing first-scalar path, preserving redacted/omitted handling and unsupported classification for ambiguous multi-value scalar evidence. Supported repeated query arrays (`declaredSupport.shape === 'array'`) now validate the recorder’s retained ordered `values[]` honestly by running item-schema validation against each retained value and emitting `captured-valid` or `captured-invalid` without reconstructing delimiter-based shapes. Unsupported declared contracts continue to emit deterministic `unsupported` diagnostics, with explicit reasons for content/style/explode/schema cases and retained values preserved only on the JSON/report surface. I expanded `yanote-js/src/coverage/httpRequestConformance.test.ts` to cover both captured-valid and captured-invalid repeated query arrays alongside scalar, unavailable, and unsupported cases, and updated `yanote-js/src/report/report.requestEvidence.contract.test.ts` so the schema-valid report fixture proves additive counts, ordered diagnostics, supported array truth, and unchanged aggregate coverage numerators.

## Verification

Verified the task contract with `npm -C yanote-js test -- src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts`, which passed and confirmed the analyzer/report contract changes. Ran the slice-level Vitest stack from the slice plan; it passed for all present suites and confirmed the array-validation change did not regress OpenAPI extraction, determinism, CLI request evidence reporting, or failure-order behavior. Verified the observability impact directly through the updated report contract fixture, which asserts `httpRequestConformance.summary`, per-parameter counts, and ordered `httpRequestConformance.diagnostics.items` containing supported repeated-query-array truth plus explicit unsupported diagnostics. Ran the slice shell verifier command as required by the slice plan; it still exits 127 because `scripts/ci/verify-m011-s02-request-semantics.sh` is not present in this worktree yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts` | 0 | ✅ pass | 531ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1090ms |
| 3 | `bash scripts/ci/verify-m011-s02-request-semantics.sh` | 127 | ❌ fail | 0ms |


## Deviations

None.

## Known Issues

`scripts/ci/verify-m011-s02-request-semantics.sh` is still absent in this worktree, so the shell-based slice verifier remains unavailable until the later end-to-end proof task creates it.

## Files Created/Modified

- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
## Must-Haves Covered

- Supported repeated query arrays can pass or fail based on item-schema validation against the retained ordered `values[]`.
- Unsupported request contracts still produce deterministic unsupported diagnostics with retained values only in `yanote-report.json`.
- Summary counts remain additive and deterministic across the existing `httpRequestConformance` surface.

