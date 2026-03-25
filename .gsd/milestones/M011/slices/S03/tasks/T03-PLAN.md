---
estimated_steps: 3
estimated_files: 8
skills_used:
  - json-schema-validator
  - vitest
---

# T03: Fail closed and serialize unsupported-format payload semantics

**Slice:** S03 — Format Policy And Media Specificity Truth
**Milestone:** M011

## Description

Once the analyzer knows the truth, governance and report artifacts must publish it through the existing contract. This task wires the new payload diagnostic into fail-closed precedence and the strict report schema.

## Steps

1. Extend `yanote-js/src/gates/httpPayloadSemantics.ts` with a dedicated `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` mapping and update `yanote-js/src/gates/failureOrder.ts` so HTTP payload precedence stays deterministic across invalid body, missing body, unsupported schema format, unsupported media, and unsupported schema cases.
2. Update `yanote-js/src/report/report.ts` and `yanote-js/src/report/schema.ts` so `yanote-report.json` remains schema-valid while serializing the new diagnostic code and the S03 fixture scenarios.
3. Expand gate/report tests to prove full-observation invalid-format, unsupported-format, and media-specificity scenarios stay fail-closed through the same report contract without changing legacy coverage numerators.

## Must-Haves

- [ ] Unsupported declared formats map to `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` with deterministic precedence.
- [ ] `yanote-report.json` remains schema-valid and explicitly serializes the new payload diagnostic code.
- [ ] Report/governance tests cover invalid-format, unsupported-format, and media-specificity outcomes from the shared S03 fixtures.

## Verification

- Gate/report Vitest suites prove the new semantic code, precedence ordering, and strict report schema serialization.
- `npm -C yanote-js test -- src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts`

## Observability Impact

- Signals added/changed: governance diagnostics and report payload diagnostics gain a dedicated unsupported-schema-format failure path.
- How a future agent inspects this: run the focused gate/report suites and inspect `governance.diagnostics` plus `httpPayloadConformance.diagnostics` in `yanote-report.json`.
- Failure state exposed: ordered semantic codes and report items show whether the failure came from invalid data, unsupported format policy, unsupported media, or unusable schema.

## Inputs

- `yanote-js/src/coverage/httpPayloadConformance.ts` — analyzer output surface created by T01/T02.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — shared fixture coverage for S03 analyzer behavior.
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — shared S03 OpenAPI fixture bundle.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — green supported-format evidence.
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl` — invalid email evidence.
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl` — unsupported/custom format evidence.
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` — most-specific media selection evidence.

## Expected Output

- `yanote-js/src/gates/httpPayloadSemantics.ts` — semantic mapping for unsupported schema formats.
- `yanote-js/src/gates/httpPayloadSemantics.test.ts` — gate regression coverage for S03 payload semantics.
- `yanote-js/src/gates/failureOrder.ts` — updated deterministic precedence for HTTP payload semantic failures.
- `yanote-js/src/gates/failureOrder.test.ts` — precedence regression coverage including the new semantic code.
- `yanote-js/src/report/report.ts` — report serialization for the new diagnostic code.
- `yanote-js/src/report/schema.ts` — strict report schema enum coverage for unsupported schema formats.
- `yanote-js/src/report/report.test.ts` — report builder regression coverage for S03 payload states.
- `yanote-js/src/report/report.contract.test.ts` — schema-valid contract coverage for invalid-format, unsupported-format, and media-specificity scenarios.
