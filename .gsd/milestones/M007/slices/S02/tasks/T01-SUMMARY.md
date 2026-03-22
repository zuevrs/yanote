---
id: T01
parent: S02
milestone: M007
provides:
  - AsyncAPI Kafka message contracts now retain stable payload and header schema-depth metadata beside unchanged canonical routing keys.
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml
  - yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml
key_decisions:
  - Use parser-emitted `x-parser-schema-id` values as the retained schema-depth identifier instead of widening Kafka operation-key serialization.
patterns_established:
  - Represent header support explicitly with `headerValidationCapability` while keeping `serializeOperationKey()` routing-only.
observability_surfaces:
  - loadAsyncApiSemanticsBundle(...).operationContractsByKey
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - .gsd/KNOWLEDGE.md
duration: PT1H
verification_result: passed
completed_at: 2026-03-20T16:54:38+0300
blocker_discovered: false
---

# T01: Retain schema-depth AsyncAPI contract metadata and parity fixtures

**Retained AsyncAPI payload and header schema metadata without changing Kafka routing keys.**

## What Happened

I loaded the `asyncapi-design` and `vitest` skills, fixed the task plan’s missing `## Observability Impact` section, and then extended `KafkaMessageContract` with retained `payloadSchemaId`, `headersSchemaId`, and explicit `headerValidationCapability` metadata while leaving `serializeOperationKey()` unchanged.

In `yanote-js/src/spec/asyncapi.ts`, I taught the AsyncAPI normalization seam to read parser-resolved `x-parser-schema-id` values from payload and header schemas. Payload schemas still retain the normalized JSON schema body, while header contracts now explicitly surface whether validation is absent (`none`) or currently not truthfully verifiable (`unverifiable`).

I added deterministic `schema-depth-v2.yaml` and `schema-depth-v3.yaml` fixtures with matching Kafka routing identity, referenced payload schemas, required nested payload structure, and declared message headers. I then expanded the AsyncAPI spec and parity Vitest suites to pin the retained schema-depth metadata and prove v2/v3 parity stays deterministic without reopening the public async boundary.

I also recorded the parser gotcha in `.gsd/KNOWLEDGE.md`, marked T01 complete in the slice plan, and advanced `.gsd/STATE.md` to T02.

## Verification

I verified the new contract metadata directly through Vitest assertions on `loadAsyncApiSemanticsBundle()` and by checking the new fixture files exist. I also ran the slice-level non-git test suites to confirm the richer internal metadata did not break existing async coverage, report, gate, or CLI behavior.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` | 0 | ✅ pass | 2.50s |
| 2 | `test -f yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml && test -f yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` | 0 | ✅ pass | 0.00s |
| 3 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` | 0 | ✅ pass | 2.95s |
| 4 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2.43s |

## Diagnostics

Future agents can inspect schema-depth metadata via `loadAsyncApiSemanticsBundle(specPath).operationContractsByKey`. For the new fixture pair, the stable key remains `kafka send orders.created`, while the retained contract now exposes `payloadSchemaId: "OrderCreatedPayload"`, `headersSchemaId: "OrderEventHeaders"`, and `headerValidationCapability: "unverifiable"` without leaking that metadata into the canonical routing key.

The pinned inspection surfaces are `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, and the schema-depth fixtures under `yanote-js/test/fixtures/asyncapi/`.

## Deviations

- I did not run `git diff --check` even though it appears in the slice verifier list, because this auto-mode prompt also explicitly forbade running git commands. All non-git verification commands for T01 and the slice passed.

## Known Issues

- None.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — added retained schema-depth fields to `KafkaMessageContract` while keeping routing-key serialization unchanged.
- `yanote-js/src/spec/asyncapi.ts` — retained parser-resolved payload and header schema ids plus explicit header validation capability metadata.
- `yanote-js/src/spec/asyncapi.test.ts` — pinned the new retained schema-depth metadata on direct AsyncAPI normalization.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — proved deterministic v2/v3 parity for both the baseline and schema-depth fixtures.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` — added deterministic AsyncAPI v2 fixture with referenced payload and header schemas.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — added deterministic AsyncAPI v3 fixture with equivalent routing and schema-depth metadata.
- `.gsd/milestones/M007/slices/S02/tasks/T01-PLAN.md` — added the missing Observability Impact section called out in pre-flight.
- `.gsd/KNOWLEDGE.md` — recorded the parser `x-parser-schema-id` retention behavior for future schema-depth work.
- `.gsd/milestones/M007/slices/S02/S02-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
