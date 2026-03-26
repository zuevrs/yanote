---
estimated_steps: 3
estimated_files: 8
skills_used:
  - debug-like-expert
  - kafka-engineer
  - vitest
---

# T02: Evaluate header-backed runtime semantics in async coverage

**Slice:** S02 — Header-backed correlation and reply truth
**Milestone:** M014

## Description

Build the dedicated runtime evaluator for `correlationId` and `reply.address` truth using retained Kafka headers only. Reuse `resolveAsyncMessageContract()` and `AsyncHeaderEvidence` states so users get positive runtime truth plus deterministic missing/unavailable/unsupported/mismatched diagnostics without changing channel/operation/message coverage math or leaking retained values.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `resolveAsyncMessageContract()` and retained `AsyncHeaderEvidence` | Surface deterministic runtime diagnostics (`missing`, `unavailable`, `unsupported`, `mismatched`) and keep channel/operation/message numerators unchanged. | Stop runtime-semantic evaluation for the affected operation and leave coverage truth additive rather than partially inferred. | Treat malformed or unsupported header-backed locations as fail-closed runtime semantics; never invent broker metadata or cross-event reply proof. |

## Load Profile

- **Shared resources**: Async coverage aggregation, retained header maps, and runtime diagnostic arrays.
- **Per-operation cost**: For each matched event, resolve the canonical message contract, inspect only supported header-backed declarations, and append at most a bounded set of sanitized semantic outcomes.
- **10x breakpoint**: Diagnostic volume and repeated sort work grow before raw header lookup cost; focused coverage tests keep deterministic ordering and numerator stability in view.

## Negative Tests

- **Malformed inputs**: Unsupported runtime-expression strings, missing `headers` maps, and simplified raw-string header fixtures must fail closed.
- **Error paths**: Missing captured headers, `redacted` / `omitted` header evidence, ambiguous message selection, and reply-address mismatches must stay explicit and redaction-safe.
- **Boundary conditions**: Inline-vs-trait declaration fixtures must produce identical runtime truth, and coverage percentages must remain unchanged when runtime semantics are added.

## Steps

1. Add `yanote-js/src/coverage/asyncSemanticConformance.ts` to parse only the supported `$message.header#/...` subset against flat retained header keys, reuse `resolveAsyncMessageContract()`, and classify satisfied/missing/unavailable/unsupported plus reply-mismatched states using optional resolved reply-channel address.
2. Thread the result into `yanote-js/src/coverage/asyncCoverage.ts` as an additive runtime-truth surface and public diagnostics while leaving channel/operation/message summaries and canonical operation keys unchanged.
3. Add real `AsyncHeaderEvidence` JSONL fixtures and expand coverage tests to pin green and negative states, no raw header leakage, and inline-vs-trait runtime parity.

## Must-Haves

- [ ] Only the header-backed subset is supported; no broker metadata or cross-event request/reply proof is inferred.
- [ ] Coverage gains additive runtime truth and redaction-safe diagnostics for missing/unavailable/unsupported/mismatched states.
- [ ] Runtime fixtures use `{ state, value | reason }` header evidence objects instead of raw string header maps.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts`
- Focused coverage assertions prove satisfied/missing/unavailable/unsupported/mismatched runtime truth with unchanged legacy coverage numerators and no header-value leakage.

## Observability Impact

- Signals added/changed: additive runtime-truth summaries and diagnostics become available before report/CLI delivery, scoped by operation key and declaration location.
- How a future agent inspects this: rerun `yanote-js/src/coverage/asyncSemanticConformance.test.ts` and `yanote-js/src/coverage/asyncCoverage*.test.ts`, or inspect the runtime-truth section on the `AsyncCoverageResult` snapshot.
- Failure state exposed: missing retained header evidence, omitted/unsupported header capture, unsupported runtime-expression locations, and reply mismatches all become explicit, deterministic states.

## Inputs

- `yanote-js/src/model/operationKey.ts` — declared correlation/reply contract shape produced by T01.
- `yanote-js/src/spec/asyncapi.ts` — retained declaration locations and reply-channel address metadata from T01.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — existing runtime message-selection logic to reuse instead of reimplementing.
- `yanote-js/src/coverage/asyncCoverage.ts` — current async coverage aggregator that must stay stable on legacy numerators.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — baseline coverage contract assertions to widen additively.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — current deterministic/public-diagnostic guard to extend without leaking retained values.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — parity guard for equivalent contracts and shared event evidence.
- `yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml` — supported declaration fixture from T01 for runtime-truth evaluation.

## Expected Output

- `yanote-js/src/coverage/asyncSemanticConformance.ts` — dedicated header-backed runtime semantic evaluator for correlation/reply truth.
- `yanote-js/src/coverage/asyncSemanticConformance.test.ts` — focused runtime semantic assertions covering satisfied and fail-closed states.
- `yanote-js/src/coverage/asyncCoverage.ts` — additive runtime truth and public diagnostics threaded into async coverage without numerator drift.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — coverage-level assertions pinning runtime truth beside unchanged channel/operation/message summaries.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — deterministic diagnostic coverage for missing/unavailable/unsupported/mismatched states with no retained header values.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — parity assertions proving inline-vs-trait declaration forms yield identical runtime truth.
- `yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl` — real retained-header evidence fixture for satisfied correlation/reply truth.
- `yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl` — retained-header evidence fixture covering missing/unavailable/mismatched failure paths.
