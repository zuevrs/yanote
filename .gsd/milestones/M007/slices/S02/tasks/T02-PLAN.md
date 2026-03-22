---
estimated_steps: 5
estimated_files: 8
---

# T02: Add routing-first async schema conformance diagnostics

**Slice:** S02 — AsyncAPI Schema Validation And Drift Semantics
**Milestone:** M007

## Description

Load the `vitest` skill and build the bounded analyzer-only seam for S02. This task introduces a new internal async schema-conformance result that validates payload-bearing Kafka evidence only after routing has matched, uses Ajv against parser-resolved AsyncAPI schemas, and emits deterministic schema-depth diagnostics without changing the public async report/gate union yet.

## Steps

1. Create `yanote-js/src/coverage/asyncSchemaConformance.ts` with a routing-first conformance pass that resolves the expected Kafka contract, validates payloads only for matched operations, and keeps schema-depth diagnostics separate from routing drift.
2. Sanitize parser-added schema keywords such as `x-parser-schema-id` before Ajv compilation, and define explicit semantics for unsupported schema formats/content types instead of silently passing them.
3. Add deterministic JSONL fixtures for valid payloads, invalid payloads, missing payload observation gaps, and unsupported-format/header-unverifiable cases under `yanote-js/test/fixtures/async-events/`.
4. Write `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`, and `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts` to pin exact outcomes, ordering, and v2/v3 parity.
5. Keep diagnostics redacted: use operation keys, message names, schema/reference ids, and JSON pointers/reasons rather than dumping full payload bodies or headers.

## Must-Haves

- [ ] Schema validation runs only after routing alignment, so action/channel drift remains routing drift and does not double-report as schema drift.
- [ ] Internal diagnostics deterministically cover valid, invalid, missing, unsupported-format, and header-unverifiable cases with stable ordering and parity across equivalent v2/v3 specs.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
- `test -f yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl`

## Observability Impact

- Signals added/changed: ordered internal schema-conformance diagnostics that identify invalid payload, missing payload, unsupported schema-format/content-type, and header-unverifiable outcomes with schema/reference context.
- How a future agent inspects this: run `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` and inspect the fixture-driven assertion failures.
- Failure state exposed: exact diagnostic kind, operation key, schema/reference id, and JSON pointer/reason become visible when schema conformance fails.

## Inputs

- `yanote-js/src/model/asyncEvent.ts` — payload-bearing async event boundary established in S01.
- `yanote-js/src/model/operationKey.ts` — schema-depth contract metadata retained by T01.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI semantics bundle that now exposes schema-depth contract metadata.
- `yanote-js/src/coverage/asyncCoverage.ts` — current routing-only coverage analyzer to mirror and keep compatible.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — current deterministic routing diagnostic expectations to preserve.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` — existing payload-bearing evidence corpus from S01.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` — v2 contract fixture produced by T01.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — v3 contract fixture produced by T01.

## Expected Output

- `yanote-js/src/coverage/asyncSchemaConformance.ts` — internal routing-first schema-conformance analyzer.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — contract tests for valid/invalid/missing/unsupported schema-depth cases.
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts` — deterministic ordering and redaction tests for schema diagnostics.
- `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts` — v2/v3 parity tests for schema conformance.
- `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl` — deterministic valid payload evidence.
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl` — deterministic invalid payload evidence.
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl` — deterministic missing-payload observation-gap evidence.
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` — deterministic unsupported-format/header-unverifiable evidence.
