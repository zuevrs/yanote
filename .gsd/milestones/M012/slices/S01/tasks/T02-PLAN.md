---
estimated_steps: 4
estimated_files: 5
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T02: Fail closed on security drift with typed governance precedence

**Slice:** S01 — Security Semantics Through Report, CLI, And CI
**Milestone:** M012

## Description

Once conformance exists, route supported security drift through the same semantic-failure layer that already protects request and payload truth. This task adds typed security failures, wires them ahead of threshold math, and locks deterministic ordering across security, request, payload, and gate issues.

## Steps

1. Add `yanote-js/src/gates/httpSecuritySemantics.ts` to map missing, unavailable, and unsupported security diagnostics to secret-safe typed semantic failures such as `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`.
2. Extend `yanote-js/src/gates/evaluator.ts` to short-circuit on security semantic failures before threshold/regression math, alongside the existing request and payload semantics.
3. Update `yanote-js/src/gates/failureOrder.ts` and focused tests so security failures sort deterministically ahead of lower-level request, payload, and gate issues for the same operation.
4. Add focused tests proving satisfied, optional, and cleared security stays green while fail-closed security cases exit `5` with stable primary-failure ordering.

## Must-Haves

- [ ] Typed security failures stay stable and never echo retained secret values in reason or hint text.
- [ ] Security semantic failures preempt threshold/regression math the same way other fail-closed semantic surfaces do.
- [ ] Failure ordering makes security drift deterministic relative to request, payload, input, and gate failures.

## Verification

- Focused gate and failure-order tests prove exit-5 security failures and deterministic precedence.
- `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts`

## Observability Impact

- Signals added/changed: typed `SEMANTIC_HTTP_*SECURITY` governance failures and explicit precedence across security, request, payload, and gate classes.
- How a future agent inspects this: run the focused gate tests and inspect ordered governance diagnostics from the security fixture cases.
- Failure state exposed: primary failure selection now distinguishes missing vs unavailable vs unsupported security drift deterministically.

## Inputs

- `yanote-js/src/coverage/httpSecurityConformance.ts` — new security diagnostic source.
- `yanote-js/src/gates/evaluator.ts` — current semantic short-circuit and threshold/regression gate entrypoint.
- `yanote-js/src/gates/failureOrder.ts` — precedence table for primary-failure selection.
- `yanote-js/src/gates/httpRequestSemantics.ts` — existing request semantic failure mapping to preserve ordering intent.
- `yanote-js/src/gates/httpPayloadSemantics.ts` — existing payload semantic failure mapping to preserve ordering intent.

## Expected Output

- `yanote-js/src/gates/httpSecuritySemantics.ts` — typed security semantic failure mapper.
- `yanote-js/src/gates/evaluator.ts` — security semantics wired ahead of threshold/regression math.
- `yanote-js/src/gates/failureOrder.ts` — deterministic precedence updated for security failures.
- `yanote-js/src/gates/httpSecuritySemantics.test.ts` — focused gate-mapping coverage.
- `yanote-js/src/gates/failureOrder.test.ts` — focused precedence coverage.
