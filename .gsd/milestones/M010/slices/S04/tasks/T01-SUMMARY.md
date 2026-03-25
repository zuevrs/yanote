---
id: T01
parent: S04
milestone: M010
provides:
  - Stable HTTP core semantic gate mapping for undeclared statuses plus supported parameter/header drift, wired into evaluator precedence before threshold-only logic.
key_files:
  - yanote-js/src/gates/httpCoreSemantics.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/gates/httpCoreSemantics.test.ts
  - yanote-js/src/gates/evaluator.threshold.test.ts
  - yanote-js/src/gates/failureOrder.test.ts
key_decisions:
  - HTTP core fail-closed drift maps to error-level SEMANTIC_HTTP_* codes, while recorder-limited and unsupported-subset diagnostics stay explicit as warning-level semantic outcomes.
patterns_established:
  - Additive conformance analyzers now graduate into governance through a dedicated semantic mapper instead of embedding fail-closed logic inside evaluator.ts.
observability_surfaces:
  - Focused Vitest coverage in src/gates/httpCoreSemantics.test.ts, src/gates/evaluator.threshold.test.ts, and src/gates/failureOrder.test.ts
  - Stable governance codes and reasons on semantic failures returned by evaluateGateFailures(...)
duration: 55m
verification_result: passed
completed_at: 2026-03-25T08:10:00+03:00
blocker_discovered: false
---

# T01: Add HTTP core semantic gate codes and precedence

**Added a dedicated HTTP core semantic mapper, wired it into gate evaluation ahead of threshold logic, and pinned deterministic precedence for the new HTTP core SEMANTIC_HTTP_* codes.**

## What Happened

I created `yanote-js/src/gates/httpCoreSemantics.ts` as the dedicated mapper for additive `httpCoreConformance` diagnostics. It now turns undeclared statuses plus supported parameter/header missing or invalid evidence into stable fail-closed semantic errors, while recorder-redacted, recorder-omitted, repeated-value-unsupported, and unsupported-schema paths stay explicit as warning-level semantic outcomes instead of disappearing.

I then updated `yanote-js/src/gates/evaluator.ts` so HTTP core semantics participate in the same semantic short-circuit path as existing HTTP payload semantics. That keeps threshold-only gate math from masking semantic HTTP core drift or recorder-limited cases.

Finally, I extended `yanote-js/src/gates/failureOrder.ts` and its focused tests so async semantics, the new HTTP core semantics, payload semantics, generic fail-closed wrappers, and gate failures all sort deterministically. I also added focused coverage in `httpCoreSemantics.test.ts` and expanded `evaluator.threshold.test.ts` to prove undeclared-status fail-closed behavior and explicit recorder-limited warning behavior.

## Verification

I ran the focused T01 verifier stack from the task plan and confirmed the new mapper, evaluator integration, and precedence behavior all pass. I also re-ran the existing payload semantic tests to confirm the new precedence wiring did not regress the payload-era contract.

I did not run the full slice-level verification stack because it intentionally includes later-task CLI, async-export, and docs-boundary surfaces that are still owned by T02-T05.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/gates/httpPayloadSemantics.test.ts` | 0 | ✅ pass | 403ms |

## Diagnostics

Future agents can inspect the shipped behavior by rerunning:

- `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts`
- `npm -C yanote-js test -- src/gates/evaluator.threshold.test.ts`
- `npm -C yanote-js test -- src/gates/failureOrder.test.ts`

Key failure surfaces now exposed through governance failures are:

- `SEMANTIC_HTTP_UNDECLARED_STATUS`
- `SEMANTIC_HTTP_MISSING_PARAMETER_VALUE`
- `SEMANTIC_HTTP_INVALID_PARAMETER_VALUE`
- `SEMANTIC_HTTP_MISSING_RESPONSE_HEADER`
- `SEMANTIC_HTTP_INVALID_RESPONSE_HEADER`
- explicit warning-level recorder-limited/unsupported-subset codes for parameters and response headers

## Deviations

- I chose explicit target-specific HTTP core semantic codes for parameter and response-header drift instead of one generic code family so later CLI/report work can surface truthful primary failures without additional target decoding.

## Known Issues

- Full slice verification remains incomplete because T02-T05 still need to wire CLI/report surfaces, retained proof paths, async export/public-boundary updates, and final docs verifiers.

## Files Created/Modified

- `yanote-js/src/gates/httpCoreSemantics.ts` — added the dedicated HTTP core semantic mapper and stable SEMANTIC_HTTP_* code mapping.
- `yanote-js/src/gates/httpCoreSemantics.test.ts` — added focused mapper coverage for fail-closed and recorder-limited HTTP core diagnostics.
- `yanote-js/src/gates/evaluator.ts` — wired HTTP core semantics into the semantic short-circuit path before threshold logic.
- `yanote-js/src/gates/failureOrder.ts` — added deterministic precedence slots for the new HTTP core semantic codes.
- `yanote-js/src/gates/failureOrder.test.ts` — extended precedence coverage across async, HTTP core, payload, generic semantic, and gate failures.
- `yanote-js/src/gates/evaluator.threshold.test.ts` — added regression coverage for undeclared-status and recorder-limited HTTP core evaluator behavior.
