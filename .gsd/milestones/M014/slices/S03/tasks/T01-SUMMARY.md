---
id: T01
parent: S03
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/model/operationKey.ts", "yanote-js/src/spec/asyncapi.ts", "yanote-js/src/spec/asyncapi.bindings.test.ts", "yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml", "yanote-js/src/report/asyncReport.ts", "yanote-js/src/report/asyncSchema.ts", "yanote-js/src/report/asyncNormalize.ts", "yanote-js/src/report/asyncReport.bindings.contract.test.ts", "yanote-js/src/report/writeAsyncReport.determinism.test.ts", "yanote-js/src/report/asyncReport.test.ts", "yanote-js/src/report/asyncReport.contract.test.ts", ".gsd/KNOWLEDGE.md"]
key_decisions: ["D054: Store flat Kafka `bindingSupport` rows on `KafkaOperationContract` and derive report JSON from those canonical rows.", "Destructure helper-returned `bindingSupport` before spreading resolved message contracts so merged channel/operation/message rows are not overwritten during contract assembly."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Focused T01 verification passed: `npm -C yanote-js test -- src/spec/asyncapi.bindings.test.ts src/report/asyncReport.bindings.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` passed, the widened slice-level test stack including `src/cli.remote-spec.contract.test.ts` passed, and `npm -C yanote-js run build` passed. The exact slice-level built CLI probe remains red at T01 because the T02-owned events fixture `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` does not exist yet, so the command fails with `INPUT_ASYNC_EVENTS_READ_FAILED` before reaching the new JSON/HTML assertions."
completed_at: 2026-03-26T12:27:15.350Z
blocker_discovered: false
---

# T01: Added canonical Kafka binding support metadata and additive bindingSupport JSON reporting without changing async operation identities.

> Added canonical Kafka binding support metadata and additive bindingSupport JSON reporting without changing async operation identities.

## What Happened
---
id: T01
parent: S03
milestone: M014
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.bindings.test.ts
  - yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReport.bindings.contract.test.ts
  - yanote-js/src/report/writeAsyncReport.determinism.test.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - D054: Store flat Kafka `bindingSupport` rows on `KafkaOperationContract` and derive report JSON from those canonical rows.
  - Destructure helper-returned `bindingSupport` before spreading resolved message contracts so merged channel/operation/message rows are not overwritten during contract assembly.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T12:27:15.351Z
blocker_discovered: false
---

# T01: Added canonical Kafka binding support metadata and additive bindingSupport JSON reporting without changing async operation identities.

**Added canonical Kafka binding support metadata and additive bindingSupport JSON reporting without changing async operation identities.**

## What Happened

Extended the canonical Kafka async contract model so AsyncAPI extraction retains additive binding-support rows for channel, operation, and message bindings. The extractor now classifies supported topic metadata, declared-only bindings, deferred bindings, and fail-closed invalid declarations while preserving canonical `kafka <action> <channel>` identities. Widened the async report DTO, schema, and normalization with an additive `bindingSupport` section, added the Kafka bindings matrix fixture, and added focused extraction/report/determinism tests. Also updated existing async report fixtures/tests to reflect the new strict report shape and recorded the canonical-source decision plus the helper-spread overwrite gotcha discovered during implementation.

## Verification

Focused T01 verification passed: `npm -C yanote-js test -- src/spec/asyncapi.bindings.test.ts src/report/asyncReport.bindings.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` passed, the widened slice-level test stack including `src/cli.remote-spec.contract.test.ts` passed, and `npm -C yanote-js run build` passed. The exact slice-level built CLI probe remains red at T01 because the T02-owned events fixture `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` does not exist yet, so the command fails with `INPUT_ASYNC_EVENTS_READ_FAILED` before reaching the new JSON/HTML assertions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/asyncapi.bindings.test.ts src/report/asyncReport.bindings.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` | 0 | ✅ pass | 996ms |
| 2 | `npm -C yanote-js test -- src/spec/asyncapi.bindings.test.ts src/report/asyncReport.bindings.contract.test.ts src/report/writeAsyncReport.determinism.test.ts src/cli.remote-spec.contract.test.ts` | 0 | ✅ pass | 1361ms |
| 3 | `npm -C yanote-js run build` | 0 | ✅ pass | 237ms |
| 4 | `rm -rf .tmp/m014-s03-bindings && node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml --events yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl --out .tmp/m014-s03-bindings --profile local | tee .tmp/m014-s03-bindings.stdout && test -f .tmp/m014-s03-bindings/yanote-async-report.json && rg -n '"bindingSupport"' .tmp/m014-s03-bindings/yanote-async-report.json && rg -n 'Kafka Binding Support' .tmp/m014-s03-bindings/yanote-async-report.html && rg -n 'YANOTE_ASYNC_SUMMARY .*report=.*/yanote-async-report.json .*binding_' .tmp/m014-s03-bindings.stdout` | 1 | ❌ fail | 626ms |


## Deviations

None.

## Known Issues

The slice-level built CLI probe is still incomplete at T01 because `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` is a T02-owned fixture and is not present yet. HTML/CLI presentation of the new binding matrix is still pending T02; this task ships the canonical contract and JSON/report-schema layer only.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.bindings.test.ts`
- `yanote-js/test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/asyncReport.bindings.contract.test.ts`
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `.gsd/KNOWLEDGE.md`


## Deviations
None.

## Known Issues
The slice-level built CLI probe is still incomplete at T01 because `yanote-js/test/fixtures/async-events/kafka-bindings.fixture.jsonl` is a T02-owned fixture and is not present yet. HTML/CLI presentation of the new binding matrix is still pending T02; this task ships the canonical contract and JSON/report-schema layer only.
