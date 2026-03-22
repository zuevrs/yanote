---
estimated_steps: 4
estimated_files: 6
---

# T03: Retain AsyncAPI payload schema metadata beside canonical Kafka keys

**Slice:** S01 — Payload-Bearing Async Evidence Contract
**Milestone:** M007

## Description

Relevant skills: `asyncapi-design`, `kafka-engineer`, `vitest`.

Extend the AsyncAPI semantics bundle so the spec side of the contract keeps payload-bearing message metadata beside the stable `kafka <action> <channel>` identity, giving S02 a real schema-bearing input without reopening routing/message coverage semantics or the separate async report surface.

## Steps

1. Extend `KafkaMessageContract` so it can retain raw payload-schema material and stable string metadata such as `contentType` / `schemaFormat` when the parser exposes them deterministically.
2. Update `asyncapi.ts` to extract that payload-bearing message metadata for AsyncAPI v2 and v3 while keeping `serializeOperationKey()` and canonical operation identity unchanged.
3. Strengthen `asyncapi.test.ts` and `asyncapi.parity.test.ts` to assert that payload-bearing message metadata survives normalization and that v2/v3 fixtures stay equivalent at the contract level.
4. Re-run the existing single-service async proof as a regression guard so S01 proves only the contract-depth seam and does not accidentally change `asyncCoverage.ts`, async report writing, or CLI/gate behavior.

## Must-Haves

- [ ] `KafkaMessageContract` retains payload-bearing message metadata beside, not inside, the canonical Kafka operation key.
- [ ] AsyncAPI v2 and v3 fixtures normalize to equivalent payload-bearing message contracts.
- [ ] `asyncCoverage.ts`, `async-report`, `yanote-async-report.json`, and CLI/gate semantics remain unchanged in this task except for any type plumbing needed to compile.

## Verification

- `npm -C yanote-js ci && npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`

## Observability Impact

- Signals added/changed: AsyncAPI semantics bundles and parity tests now expose payload-bearing message-contract metadata while keeping existing routing/message coverage outputs stable.
- How a future agent inspects this: run the targeted Vitest files, inspect `operationContractsByKey`, and use the existing metadata-propagation script as the no-regression guard.
- Failure state exposed: payload-schema extraction drift shows up as explicit AsyncAPI contract/parity test failures rather than a silent change in report output.

## Inputs

- `yanote-js/src/model/asyncEvent.ts` — payload-bearing evidence model from T01 that the spec-side contract must be able to meet later.
- `yanote-js/src/model/operationKey.ts` — current Kafka message-contract type and canonical key serializer.
- `yanote-js/src/spec/asyncapi.ts` — current AsyncAPI loader that only retains message names.
- `yanote-js/src/spec/asyncapi.test.ts` — semantic invalid/unsupported contract tests that should stay fail-closed.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — v2/v3 parity guard for canonical Kafka contracts.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — existing v2 payload-bearing fixture.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — existing v3 payload-bearing fixture.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — Kafka message-contract type extended with payload-bearing schema metadata.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI normalization that retains payload-bearing message metadata beside canonical keys.
- `yanote-js/src/spec/asyncapi.test.ts` — contract tests asserting payload-bearing metadata retention and fail-closed invalid-document behavior.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity proof that v2 and v3 yield equivalent payload-bearing contracts.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — fixture kept aligned with the new payload-bearing parity assertions.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — fixture kept aligned with the new payload-bearing parity assertions.
