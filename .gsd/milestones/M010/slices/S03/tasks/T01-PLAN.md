---
estimated_steps: 4
estimated_files: 8
skills_used:
  - asyncapi-design
  - vitest
  - test
  - debug-like-expert
---

# T01: Prove real-input async header diagnostics and authored unverifiable coverage

**Slice:** S03 — Async Kafka Header Validation As A Supported Core Surface
**Milestone:** M010

## Description

Make the async header surface truthful before touching live proof or docs. This task replaces stale in-memory `unverifiable-headers` assumptions with authored AsyncAPI fixtures and real analyzer/report/CLI coverage so the slice can honestly claim that all four header diagnostics are reachable from public inputs.

## Steps

1. Add authored AsyncAPI fixture coverage for the supported and `unverifiable` header-validation capability path, making any minimal `yanote-js/src/spec/asyncapi.ts` adjustment needed so `loadAsyncApiSemanticsBundle()` exposes a real fixture-backed `headerValidationCapability` instead of relying on test-only mutation.
2. Refresh `yanote-js/src/coverage/asyncSchemaConformance.test.ts` and `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` so missing, invalid, unavailable, and unverifiable header diagnostics all come from fixture-backed AsyncAPI + retained event inputs and still avoid leaking payload/header values.
3. Refresh `yanote-js/src/report/asyncReport.test.ts` and `yanote-js/src/cli.async-report.test.ts` so public report/CLI surfaces pin the same real-input header diagnostics, including schema ids, pointers, and reasons.
4. Keep the task additive: do not widen beyond Kafka-only AsyncAPI support, and do not fake `unverifiable-headers` by mutating message contracts after parsing unless the parser/extractor path itself is what becomes fixture-backed and public.

## Must-Haves

- [ ] `loadAsyncApiSemanticsBundle()` can derive real fixture-backed header validation capabilities for both supported and unverifiable header schemas.
- [ ] `missing-header`, `invalid-header`, `unavailable-header`, and `unverifiable-headers` are all proven through authored AsyncAPI fixtures plus retained JSONL evidence in analyzer/report/CLI tests.
- [ ] Updated diagnostics tests still prove that retained payload/header values are redacted from error messages and serialized snapshots.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`
- `npm -C yanote-js test -- src/report/asyncReport.contract.test.ts src/cli.async-report.contract.test.ts src/gates/asyncEvaluator.test.ts`

## Observability Impact

- Signals added/changed: fixture-backed async diagnostics now prove real `schemaId`, `pointer`, `reason`, and `kind` combinations for all four header outcomes instead of test-only mutated contract state.
- How a future agent inspects this: run the focused `yanote-js` tests above and inspect the authored fixture in `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml` plus the expected diagnostics snapshots in the updated test files.
- Failure state exposed: regressions should show whether the break is in AsyncAPI parsing (`headerValidationCapability`), schema conformance, report serialization, or CLI issue formatting.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — current AsyncAPI parser/extractor that already models `headerValidationCapability` but does not yet prove a real fixture-backed `unverifiable` path.
- `yanote-js/src/spec/asyncapi.test.ts` — current extractor tests that need a real authored header-capability fixture.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — current typed header-diagnostic logic the new fixtures must drive.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — stale coverage-level tests that still encode payload-era header assumptions.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — existing supported-schema fixture that can stay the baseline for supported header validation.
- `yanote-js/test/fixtures/async-events/schema-missing-header.fixture.jsonl` — retained Kafka evidence for missing-header proof.
- `yanote-js/test/fixtures/async-events/schema-unavailable-header.fixture.jsonl` — retained Kafka evidence for unavailable-header proof.
- `yanote-js/test/fixtures/async-events/schema-invalid-header.fixture.jsonl` — retained Kafka evidence for invalid-header proof.

## Expected Output

- `yanote-js/src/spec/asyncapi.ts` — fixture-backed header validation capability extraction kept truthful for supported/unverifiable header schemas.
- `yanote-js/src/spec/asyncapi.test.ts` — real AsyncAPI fixture assertions for supported and unverifiable header capability paths.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — any minimal conformance tweak needed to keep the real-input `unverifiable-headers` path truthful and deterministic.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — fixture-backed analyzer tests for all four header diagnostics.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — coverage-level diagnostics expectations aligned to retained-header reality.
- `yanote-js/src/report/asyncReport.test.ts` — public report assertions updated to the real-input header-diagnostic path.
- `yanote-js/src/cli.async-report.test.ts` — public CLI assertions updated to the real-input header-diagnostic path.
- `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml` — authored AsyncAPI fixture that produces the public `unverifiable-headers` path without in-memory contract mutation.
