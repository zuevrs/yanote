---
id: T02
parent: S02
milestone: M007
provides:
  - Internal async schema-conformance diagnostics now validate routed Kafka payloads against retained AsyncAPI schemas without widening the public async report or gate contract.
key_files:
  - yanote-js/src/coverage/asyncSchemaConformance.ts
  - yanote-js/src/coverage/asyncSchemaConformance.test.ts
  - yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts
  - yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts
  - yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl
  - yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl
key_decisions:
  - Validate only routed-and-message-aligned Kafka events so schema-depth failures stay separate from routing/message drift.
patterns_established:
  - Strip parser-only `x-parser-*` keywords before strict Ajv compilation, but retain the parser schema ids beside the validator for redacted diagnostics.
observability_surfaces:
  - yanote-js/src/coverage/asyncSchemaConformance*.test.ts
  - yanote-js/test/fixtures/async-events/schema-*.fixture.jsonl
  - .gsd/KNOWLEDGE.md
duration: PT15M
verification_result: passed
completed_at: 2026-03-20T17:07:58+0300
blocker_discovered: false
---

# T02: Add routing-first async schema conformance diagnostics

**Added internal routing-first AsyncAPI schema-conformance diagnostics with Ajv-backed parity-tested fixtures.**

## What Happened

I loaded the `vitest` skill, then added `yanote-js/src/coverage/asyncSchemaConformance.ts` as the new internal analyzer seam for schema-depth validation. The pass resolves Kafka contracts by canonical routing key, validates only routed-and-message-aligned events, strips parser-added `x-parser-*` keywords before strict Ajv compilation, and emits typed redacted diagnostics for missing payloads, invalid payloads, unsupported content types, unsupported schema formats, and header-unverifiable contracts.

To keep the analyzer deterministic and inspection-friendly, I cached validators per routed operation, de-duplicated diagnostics by semantic fingerprint, sorted them stably, and kept failure output limited to operation key, message name, schema id, JSON pointer, and reason. No payload bodies or header values are printed in the stable diagnostics.

I added the fixture corpus under `yanote-js/test/fixtures/async-events/` for valid, invalid, missing-payload, and unsupported/header scenarios, then wrote three new Vitest suites to pin the contract behavior, exact diagnostic payloads and ordering, and v2/v3 parity. I also updated `.gsd/KNOWLEDGE.md` with the Ajv/parser-keyword gotcha, marked T02 complete in the slice plan, and advanced `.gsd/STATE.md` to T03.

## Verification

I verified the new internal analyzer directly with the task-level conformance suites and fixture existence checks, then ran both non-git slice verifier commands. The schema-depth spec/conformance stack passed, and the existing async coverage/report/gate/CLI suites still passed unchanged, which confirms the richer schema diagnostics remain internal at this slice stage.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` | 0 | ✅ pass | 1.01s |
| 2 | `test -f yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl && test -f yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` | 0 | ✅ pass | 0.00s |
| 3 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` | 0 | ✅ pass | 2.65s |
| 4 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2.21s |

## Diagnostics

Future agents can inspect the new schema-depth seam by running `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts` and reading the assertion snapshots in `yanote-js/src/coverage/asyncSchemaConformance*.test.ts`.

The stable failure shapes now expose:
- `missing-payload` with `pointer: "/"`
- `invalid-payload` with JSON pointers like `/order/total`
- `unsupported-content-type` and `unsupported-schema-format` with retained payload schema ids
- `unverifiable-headers` with retained header schema ids

All of those diagnostics stay redacted to operation key, message name, schema id, pointer, and reason. The deterministic event fixtures live under `yanote-js/test/fixtures/async-events/schema-*.fixture.jsonl`.

## Deviations

- I did not run `git diff --check` even though it is listed in the slice verifier stack, because this auto-mode prompt explicitly forbade running git commands. All non-git verification commands for T02 and the current slice scope passed.

## Known Issues

- None.

## Files Created/Modified

- `yanote-js/src/coverage/asyncSchemaConformance.ts` — added the internal routing-first schema-conformance analyzer with strict Ajv validation, parser-keyword sanitization, stable ordering, and redacted diagnostics.
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts` — pinned valid-routing behavior, routing/message-drift boundaries, and unsupported payload-format/header cases.
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts` — pinned exact invalid/missing diagnostic payloads, ordering, deduplication, and redaction.
- `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts` — proved deterministic v2/v3 parity for valid, invalid, missing, and unsupported schema-depth outcomes.
- `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl` — added deterministic valid payload evidence for the schema-depth contract.
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl` — added deterministic invalid payload evidence that fails on `/order/total` without leaking payload bodies.
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl` — added deterministic observation-gap evidence for missing payload diagnostics.
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` — added deterministic evidence reused for unsupported content-type/schema-format and header-unverifiable diagnostics.
- `.gsd/KNOWLEDGE.md` — recorded the Ajv strict-mode parser-keyword sanitization rule for future schema-depth work.
- `.gsd/milestones/M007/slices/S02/S02-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action to T03.
