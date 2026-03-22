---
id: T01
parent: S01
milestone: M003
provides:
  - Kafka-oriented async identity types, structured async diagnostic context, and a fixture/test contract that pins the remaining AsyncAPI loader gaps for T02
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/diagnostics.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/semantics.diagnostics.test.ts
  - yanote-js/test/fixtures/asyncapi/v2.yaml
  - yanote-js/test/fixtures/asyncapi/v3.yaml
  - yanote-js/test/fixtures/asyncapi/invalid.yaml
  - yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml
  - .gsd/milestones/M003/slices/S01/S01-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Canonical async identities are framed as Kafka runtime keys (`kafka <action> <channel>`), while message-contract metadata stays adjacent to the operation key and async diagnostics carry structured context for version/protocol/channel/action/message detail.
patterns_established:
  - T01 hardens the async contract first with parity and fail-closed fixtures/tests, leaving the shallow loader intentionally red so T02 has a precise target instead of implicit parser behavior.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/semantics.diagnostics.test.ts
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts
  - npm -C yanote-js test -- src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts
  - npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/baseline/baseline.v2.test.ts
  - yanote-js/test/fixtures/asyncapi/*
  - git diff --check
duration: 30m
verification_result: passed
completed_at: 2026-03-13 15:58:41 MSK
blocker_discovered: false
---

# T01: Define the Kafka-oriented async identity and fixture contract

**Pinned the Kafka-first async contract in code and fixtures so the remaining S01 loader work now fails on explicit parity and fail-closed expectations instead of vague shallow extraction.**

## What Happened

I started by fixing the execution-state conflict rather than trusting the stale runtime dispatch files. `.gsd/runtime/units/execute-task-M003-S01-T01.json` and `execute-task-M003-S01-T03.json` were still marked `dispatched` from older auto runs even though the live repo was still at the pre-S01 code state. I cleared those stale runtime-unit files first so the tracked GSD artifacts and the actual source tree could become the source of truth again.

Then I audited the current seams named in the task plan. `yanote-js/src/model/operationKey.ts` still treated async identities as `kind:"asyncapi"`, `yanote-js/src/spec/diagnostics.ts` only carried HTTP method/route context, the v2/v3 fixtures were too shallow, and there was no parity proof file at all. That confirmed the task really was still open in this branch.

I updated `yanote-js/src/model/operationKey.ts` so the canonical async identity is expressed as a Kafka runtime key (`kind:"kafka"` with `action` + `channel`) and added explicit `KafkaOperationContract` / `KafkaMessageContract` types so message-contract metadata has a real home beside the primary operation key instead of being encoded into a string. The serialization seam now emits `kafka <action> <channel>` while still normalizing legacy `kind:"asyncapi"` objects when they flow through older code.

I generalized `yanote-js/src/spec/diagnostics.ts` with a structured `async` context carrying runtime, protocol, AsyncAPI version, channel, action, and message detail. To keep downstream compatibility seams from preserving the old assumption, I also updated `yanote-js/src/baseline/baseline.ts` to deserialize both legacy `asyncapi ...` strings and canonical `kafka ...` strings into the Kafka-shaped identity, and updated the report normalization/schema path so structured async diagnostics remain deterministic and schema-valid once T02 starts emitting them.

The fixture corpus now pins the intended boundary. `v2.yaml` and `v3.yaml` describe the same Kafka send/receive pair with explicit message identities; `invalid.yaml` is a malformed in-scope Kafka contract that the current loader still drops silently; `unsupported-rabbitmq.yaml` is an explicit non-Kafka protocol boundary that the current loader still treats as in scope.

On the test side, `yanote-js/src/spec/asyncapi.test.ts` now asserts Kafka key serialization and fail-closed invalid/unsupported behavior, `yanote-js/src/spec/asyncapi.parity.test.ts` proves the intended v2/v3 equivalence contract plus the separate message-contract placement, and `yanote-js/src/spec/semantics.diagnostics.test.ts` now pins the structured async diagnostic shape without regressing the HTTP checks.

That leaves the codebase in the correct T01 state: the contract surfaces are real, the async proof stack is red in the right places, and the next task is now a straightforward loader/diagnostic implementation pass instead of more contract guessing.

## Verification

Task-level verification:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/semantics.diagnostics.test.ts`
  - `src/spec/semantics.diagnostics.test.ts` passed.
  - `src/spec/asyncapi.test.ts` failed in the intended places:
    - `invalid.yaml` still resolves to `[]` instead of failing closed.
    - `unsupported-rabbitmq.yaml` still resolves to an in-scope `kind:"asyncapi"` operation instead of rejecting the non-Kafka protocol.

Slice-level verification status after T01:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts`
  - `discover.test.ts` passed.
  - `semantics.diagnostics.test.ts` passed.
  - `asyncapi.parity.test.ts` failed in the intended place because the loader still returns `kind:"asyncapi"` instead of canonical Kafka keys.
  - `asyncapi.test.ts` failed in the intended places because invalid and unsupported async inputs still do not fail closed.
- `npm -C yanote-js test -- src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts` — passed.

Compatibility checks for the touched non-async seams:

- `npm -C yanote-js test -- src/report/report.test.ts src/report/report.contract.test.ts src/baseline/baseline.v2.test.ts` — passed.
- `git diff --check` — passed.

## Diagnostics

Use the async proof stack directly:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `npm -C yanote-js test -- src/spec/discover.test.ts src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts`

The intended T02 red signals are now localized and concrete:

1. `invalid.yaml` is parsed but silently dropped instead of producing a fail-closed invalid diagnostic.
2. `unsupported-rabbitmq.yaml` is parsed as if it were in scope instead of being rejected on protocol.
3. Equivalent v2/v3 happy paths still materialize as `kind:"asyncapi"` operations instead of canonical Kafka keys.

Inspection surfaces:

- `yanote-js/src/model/operationKey.ts` — canonical Kafka identity and serialization seam.
- `yanote-js/src/spec/diagnostics.ts` — structured async diagnostic context.
- `yanote-js/src/spec/asyncapi.test.ts` — fail-closed invalid/unsupported boundary proof.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — v2/v3 parity proof and explicit message-contract placement.
- `yanote-js/test/fixtures/asyncapi/*` — supported and unsupported fixture corpus.

## Deviations

- I cleared stale `.gsd/runtime/units/execute-task-M003-S01-T01.json` and `execute-task-M003-S01-T03.json` before implementation because they falsely advertised in-flight work from older auto runs and were the source of the current execution-state conflict.
- I also updated `yanote-js/src/baseline/baseline.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/normalize.ts`, and `yanote-js/src/report/schema.ts` even though they were not listed in the task’s expected-output block, because leaving those seams on legacy async key/diagnostic assumptions would have created immediate downstream incompatibilities once the new T01 contract landed.

## Known Issues

- `yanote-js/src/spec/asyncapi.ts` is still the old shallow extractor. It does not yet normalize to Kafka keys, reject non-Kafka protocols, or fail closed on malformed in-scope contracts.
- The new async proof stack is therefore intentionally red until T02 lands.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — added canonical Kafka async identity/message-contract types and `kafka <action> <channel>` serialization with legacy normalization support.
- `yanote-js/src/spec/diagnostics.ts` — added structured async diagnostic context for runtime/protocol/version/channel/action/message detail.
- `yanote-js/src/spec/asyncapi.test.ts` — replaced shallow extraction checks with Kafka-identity and fail-closed contract expectations.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — added the missing parity proof for equivalent v2/v3 Kafka contract identity.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` — pinned the structured async diagnostic shape while keeping the HTTP diagnostics checks green.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — refreshed the v2 fixture to model Kafka protocol and explicit message IDs.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — refreshed the v3 fixture to match the same Kafka send/receive contract as v2.
- `yanote-js/test/fixtures/asyncapi/invalid.yaml` — added a malformed in-scope Kafka fixture for fail-closed semantics.
- `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml` — added a non-Kafka protocol boundary fixture.
- `yanote-js/src/baseline/baseline.ts` — made baseline deserialization accept canonical Kafka keys and legacy AsyncAPI keys.
- `yanote-js/src/report/report.ts` — kept diagnostic ordering deterministic when async context is present.
- `yanote-js/src/report/normalize.ts` — normalized/sorted async-context diagnostics deterministically.
- `yanote-js/src/report/schema.ts` — allowed structured async diagnostic context in the report schema.
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T01 complete.
- `.gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md` — recorded the delivered contract surface, intentional red signals, and cleanup of stale runtime-unit state.
- `.gsd/STATE.md` — advanced the next action to T02.
