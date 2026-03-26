---
estimated_steps: 3
estimated_files: 4
skills_used:
  - debug-like-expert
  - vitest
---

# T03: Map runtime semantic diagnostics to stable async gate failures

**Slice:** S02 — Header-backed correlation and reply truth
**Milestone:** M014

## Description

Promote coverage-layer runtime truth into the typed gate/stderr contract. Add dedicated correlation/reply failure codes and deterministic precedence so malformed declarations still surface as `ASYNC_SEMANTIC_SPEC_INVALID`, runtime semantic drift wins before threshold/regression logic, and no retained header values leak into failure reasons or hints.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public async coverage diagnostics and failure-order precedence | Keep `ASYNC_SEMANTIC_SPEC_INVALID` first and map runtime semantic drift to typed failure codes instead of falling back to ad-hoc strings. | Treat gate mapping as blocked and keep threshold/regression logic from masking semantic failures. | Unknown or malformed runtime-semantic diagnostics must sort to a stable fail-closed bucket rather than silently disappearing from stderr/primary failure selection. |

## Load Profile

- **Shared resources**: Sorted semantic failure arrays, primary-failure selection, and machine-summary `primary=` tokens.
- **Per-operation cost**: Map each public runtime diagnostic to one governance failure and sort failures by severity/class/code/operation key.
- **10x breakpoint**: Large diagnostic sets increase sorting and duplication pressure before anything else; precedence tests catch unstable ordering early.

## Negative Tests

- **Malformed inputs**: Unknown diagnostic kinds or missing operation context must not crash precedence sorting.
- **Error paths**: Multiple semantic and gate failures must still choose the correct primary runtime-semantic failure ahead of threshold/regression warnings.
- **Boundary conditions**: Failure reasons and hints may mention operation keys, declaration locations, evidence states/reasons, and expected reply channel/address, but must never echo retained header values.

## Steps

1. Extend `yanote-js/src/gates/asyncEvaluator.ts` to map new runtime semantic diagnostics to stable correlation/reply missing/unavailable/unsupported/mismatched failure codes and hints.
2. Update `yanote-js/src/gates/failureOrder.ts` so spec-invalid stays first, the new runtime semantic failures sort deterministically ahead of generic drift/threshold failures, and equal-severity ties stay stable by operation key.
3. Expand `yanote-js/src/gates/asyncEvaluator.test.ts` and `yanote-js/src/gates/failureOrder.test.ts` to pin precedence, reason wording, and redaction-safe failure strings.

## Must-Haves

- [ ] Typed stderr/primary-failure behavior is driven by stable runtime semantic codes, not ad-hoc text matching.
- [ ] Semantic failures short-circuit threshold/regression evaluation.
- [ ] Reasons and hints mention operation keys, declaration locations, evidence states/reasons, or expected reply channel/address without retained header values.

## Verification

- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts`
- Ordered failures keep `ASYNC_SEMANTIC_SPEC_INVALID` first, then the new correlation/reply runtime failures, and never echo retained header values in reason text.

## Observability Impact

- Signals added/changed: stderr/primary-failure selection and machine `primary=` tokens can now expose dedicated correlation/reply runtime failure codes.
- How a future agent inspects this: rerun `yanote-js/src/gates/asyncEvaluator.test.ts` and `yanote-js/src/gates/failureOrder.test.ts`, or inspect sorted failures from `evaluateAsyncGateFailures()`.
- Failure state exposed: the primary gate failure now distinguishes malformed declarations, missing/unavailable headers, unsupported locations, and reply mismatches explicitly.

## Inputs

- `yanote-js/src/coverage/asyncSemanticConformance.ts` — runtime semantic diagnostic kinds and truth states produced by T02.
- `yanote-js/src/coverage/asyncCoverage.ts` — public async coverage diagnostics that now include runtime semantic outcomes.
- `yanote-js/src/gates/asyncEvaluator.ts` — current async semantic gate mapper.
- `yanote-js/src/gates/failureOrder.ts` — deterministic failure precedence contract used by CLI stderr output.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — async gate contract coverage to widen with runtime semantic failures.
- `yanote-js/src/gates/failureOrder.test.ts` — precedence guard to update for the new failure codes.

## Expected Output

- `yanote-js/src/gates/asyncEvaluator.ts` — typed runtime semantic failure mapping for correlation/reply outcomes.
- `yanote-js/src/gates/failureOrder.ts` — deterministic precedence updated for the new async semantic failure codes.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — gate assertions proving runtime semantic failures short-circuit threshold/regression logic.
- `yanote-js/src/gates/failureOrder.test.ts` — precedence assertions proving spec-invalid and runtime semantic ordering stay stable.
