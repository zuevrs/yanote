---
id: T01
parent: S01
milestone: M012
key_files:
  - yanote-js/src/spec/semantics.ts
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpSecurityConformance.ts
  - yanote-js/src/spec/openapi.security.test.ts
  - yanote-js/src/coverage/httpSecurityConformance.test.ts
  - yanote-js/test/fixtures/openapi/http-security-api-key.yaml
  - yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl
key_decisions:
  - Resolve effective OpenAPI security in the semantic layer first, then materialize typed security contracts in the coverage model so extraction stays deterministic and canonical HTTP operation keys remain unchanged.
  - Evaluate only apiKey schemes backed by retained query/header/cookie evidence, and treat http/oauth2/openIdConnect plus unsupported apiKey locations as explicit unsupported truth instead of silently passing or pretending to validate them.
  - Record additive per-branch security truth plus an overall operation truth so OR security branches remain inspectable without incorrectly failing operations that satisfy an alternate branch.
duration: ""
verification_result: passed
completed_at: 2026-03-25T21:07:17.036Z
blocker_discovered: false
---

# T01: Added effective OpenAPI security extraction and truthful apiKey conformance fixtures for HTTP operations

**Added effective OpenAPI security extraction and truthful apiKey conformance fixtures for HTTP operations**

## What Happened

Implemented the first honest HTTP security contract for M012 S01. I added a dedicated OpenAPI fixture corpus and retained-event fixture covering root inheritance, operation override, explicit clear via security: [], optional {} branches, OR/AND combinations, redacted and unavailable evidence, and unsupported scheme types and locations. In yanote-js/src/spec/semantics.ts I extended HTTP semantic extraction to normalize effective per-operation security requirements, preserve operation identities, and fail fast on missing or malformed referenced apiKey schemes. In yanote-js/src/spec/openapi.ts I materialized the resolved security requirements into typed operation contracts without changing legacy status/parameter/body extraction. I then added yanote-js/src/coverage/httpSecurityConformance.ts to evaluate only the truthful apiKey subset from retained request evidence for query/header/cookie, keep unsupported scheme types and locations explicit, preserve secret safety by never surfacing raw values, and retain additive per-branch truth alongside overall operation truth so OR branches do not incorrectly fail a satisfied operation. Finally, I added focused Vitest coverage for extraction, fail-closed invalid-reference handling, branch truth evaluation, redaction/unavailability handling, and confirmation that legacy coverage dimensions remain unchanged.

## Verification

Ran the task-level focused verifier and it passed: npm --prefix yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts. Then ran the slice-level verifier stack adaptations from the worktree root: npm --prefix yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts, node --test scripts/ci/render-yanote-summary.test.mjs, and npm --prefix yanote-js run build. The slice-level Vitest command exited successfully on the current file set; later-task security gate/report/CLI test files are not present yet, so Vitest exercised the existing T01/shared files only. The conformance tests explicitly proved secret-safe diagnostics and that coverage.operations/status/parameters/aggregate math stayed on the legacy surface.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts` | 0 | ✅ pass | 685ms |
| 2 | `npm --prefix yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts` | 0 | ✅ pass | 742ms |
| 3 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 327ms |
| 4 | `npm --prefix yanote-js run build` | 0 | ✅ pass | 286ms |


## Deviations

Used npm --prefix yanote-js ... instead of the slice plan's npm -C yanote-js ... form because the local harness's npm -C invocation did not reliably resolve the project-local test binary in this worktree. No product-scope deviation was required.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/spec/semantics.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/httpSecurityConformance.ts`
- `yanote-js/src/spec/openapi.security.test.ts`
- `yanote-js/src/coverage/httpSecurityConformance.test.ts`
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml`
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`
