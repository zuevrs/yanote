---
id: T02
parent: S01
milestone: M012
key_files:
  - yanote-js/src/gates/httpSecuritySemantics.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/gates/httpSecuritySemantics.test.ts
  - yanote-js/src/gates/failureOrder.test.ts
key_decisions:
  - Derive security semantic reasons and hints from structured security diagnostics instead of forwarding free-form messages so fail-closed governance text stays deterministic and secret-safe.
  - Rank and return HTTP security semantic failures ahead of request, payload, and threshold/regression gate failures so security drift becomes the primary exit-5 signal for a covered operation.
duration: ""
verification_result: passed
completed_at: 2026-03-25T21:18:02.643Z
blocker_discovered: false
---

# T02: Add fail-closed HTTP security semantics and precedence ahead of request, payload, and gate failures

**Add fail-closed HTTP security semantics and precedence ahead of request, payload, and gate failures**

## What Happened

Added a dedicated HTTP security semantic classifier that converts additive httpSecurityConformance diagnostics into typed fail-closed governance failures: SEMANTIC_HTTP_MISSING_SECURITY, SEMANTIC_HTTP_UNAVAILABLE_SECURITY, and SEMANTIC_HTTP_UNSUPPORTED_SECURITY. The mapper derives its reason and hint text from structured fields such as operation key, scheme type, location, key name, and evidence provenance instead of replaying raw diagnostic message text, which keeps the output stable and prevents retained secret values from leaking into governance surfaces. I then extended the gate evaluator to accept security diagnostics and short-circuit with security semantics before request semantics, payload semantics, threshold math, or regression math. Finally, I updated failure precedence so every new security semantic code sorts ahead of request, payload, generic fail-closed, and gate failures, and I added focused tests proving missing/unavailable/unsupported security cases fail closed with exit code 5 while satisfied, optional, and cleared security stays out of the semantic failure set.

## Verification

Ran the focused task verifier `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts` and it passed, proving typed security mapping plus deterministic ordering. Then ran the slice-level verifier stack for this intermediate task boundary: `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`, `node --test scripts/ci/render-yanote-summary.test.mjs`, and `npm -C yanote-js run build`; all passed on the current file set. The focused security tests directly verified the observability contract by asserting ordered `SEMANTIC_HTTP_*SECURITY` governance failures, checking that clear/optional/satisfied security stays out of the semantic failure set, and confirming that threshold math is bypassed when security drift exists.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts` | 0 | ✅ pass | 693ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts` | 0 | ✅ pass | 738ms |
| 3 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 290ms |
| 4 | `npm -C yanote-js run build` | 0 | ✅ pass | 239ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/gates/httpSecuritySemantics.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/httpSecuritySemantics.test.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
