---
id: T03
parent: S02
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/gates/asyncEvaluator.ts", "yanote-js/src/gates/failureOrder.ts", "yanote-js/src/gates/asyncEvaluator.test.ts", "yanote-js/src/gates/failureOrder.test.ts"]
key_decisions: ["Mapped runtimeSemantics diagnostics to dedicated ASYNC_SEMANTIC_CORRELATION_ID_* and ASYNC_SEMANTIC_REPLY_ADDRESS_* gate codes instead of relying on ad-hoc reason text matching.", "Added ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED as the stable fallback bucket so malformed runtime semantic diagnostics cannot disappear from stderr or primary failure selection.", "Ranked the new runtime semantic codes immediately after ASYNC_SEMANTIC_SPEC_INVALID and ahead of generic async drift/gate failures to preserve deterministic precedence."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts` and confirmed the new runtime semantic codes, semantic short-circuiting ahead of threshold/regression logic, deterministic precedence with ASYNC_SEMANTIC_SPEC_INVALID first, stable fail-closed handling for malformed runtime diagnostics, and redaction-safe reason text that does not echo retained header values."
completed_at: 2026-03-26T10:49:29.811Z
blocker_discovered: false
---

# T03: Added typed async gate failures for header-backed correlationId and reply.address runtime drift

> Added typed async gate failures for header-backed correlationId and reply.address runtime drift

## What Happened
---
id: T03
parent: S02
milestone: M014
key_files:
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/gates/failureOrder.test.ts
key_decisions:
  - Mapped runtimeSemantics diagnostics to dedicated ASYNC_SEMANTIC_CORRELATION_ID_* and ASYNC_SEMANTIC_REPLY_ADDRESS_* gate codes instead of relying on ad-hoc reason text matching.
  - Added ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED as the stable fallback bucket so malformed runtime semantic diagnostics cannot disappear from stderr or primary failure selection.
  - Ranked the new runtime semantic codes immediately after ASYNC_SEMANTIC_SPEC_INVALID and ahead of generic async drift/gate failures to preserve deterministic precedence.
duration: ""
verification_result: passed
completed_at: 2026-03-26T10:49:29.812Z
blocker_discovered: false
---

# T03: Added typed async gate failures for header-backed correlationId and reply.address runtime drift

**Added typed async gate failures for header-backed correlationId and reply.address runtime drift**

## What Happened

Extended async gate evaluation so runtime semantic diagnostics from coverage.runtimeSemantics now participate in the semantic short-circuit path, map to dedicated correlationId and reply.address failure codes, and stay redaction-safe in reasons and hints. Added a stable ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED fallback for malformed runtime semantic diagnostics, updated failure precedence so ASYNC_SEMANTIC_SPEC_INVALID remains first and the new runtime semantic failures sort ahead of generic async drift and gate failures, and expanded the focused Vitest coverage to prove precedence, fail-closed behavior, short-circuiting, operation-key tie-breaking, and absence of retained header-value leaks.

## Verification

Ran `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts` and confirmed the new runtime semantic codes, semantic short-circuiting ahead of threshold/regression logic, deterministic precedence with ASYNC_SEMANTIC_SPEC_INVALID first, stable fail-closed handling for malformed runtime diagnostics, and redaction-safe reason text that does not echo retained header values.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts` | 0 | ✅ pass | 1590ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/asyncEvaluator.test.ts`
- `yanote-js/src/gates/failureOrder.test.ts`


## Deviations
None.

## Known Issues
None.
