---
id: T02
parent: S01
milestone: M003
provides:
  - Kafka-normalized AsyncAPI semantics loading with deterministic invalid/unsupported diagnostics and an explicit contract bundle (`operations` + `operationContractsByKey`) for downstream async coverage work
key_files:
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/discover.ts
  - yanote-js/src/spec/discover.test.ts
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S01/S01-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - AsyncAPI normalization is exposed as a semantics bundle and fails closed on unsupported protocol or semantically invalid contracts before returning canonical Kafka operations.
patterns_established:
  - Mirror the HTTP loader boundary: keep an inspectable diagnostic-rich bundle for agents and tests, but make the public operation loader reject invalid async contracts instead of silently dropping them.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts
  - npm -C yanote-js test -- src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts
  - yanote-js/src/spec/asyncapi.ts via loadAsyncApiSemanticsBundle()
duration: 20m
verification_result: passed
completed_at: 2026-03-13 16:20:14 MSK
blocker_discovered: false
---

# T02: Implement deterministic AsyncAPI semantics loading and discovery normalization

**Replaced the shallow AsyncAPI extractor with a Kafka-normalizing semantics bundle that preserves message-contract references on success and emits explicit structured diagnostics on invalid or unsupported input.**

## What Happened

I started from the exact red signals pinned by T01: the loader still returned `kind:"asyncapi"`, silently dropped malformed Kafka-scoped contracts, and treated RabbitMQ input as if it were inside the supported boundary.

The main change stayed in `yanote-js/src/spec/asyncapi.ts`. I replaced the shallow version switch with a real semantics pass that:

- parses once and returns a typed `AsyncApiSemanticsBundle`
- validates the document boundary before exposing operations
- derives the supported runtime protocol from declared servers
- normalizes AsyncAPI v2 `publish` / `subscribe` and v3 `send` / `receive` into canonical Kafka operations
- preserves message-contract metadata beside the operation identity in `operationContractsByKey`
- emits structured invalid diagnostics with runtime/version/protocol/channel/action/message context where available
- rejects invalid contracts through `loadAsyncApiOperations()` instead of returning partial or silently dropped results

For v2, channel `publish` and `subscribe` entries now normalize directly into `kafka send <channel>` and `kafka receive <channel>` operations while preserving message identity from the declared message metadata. For v3, operations now resolve channel addresses through inline channel objects or `#/channels/*` refs and lift the single-message contract into the bundle instead of throwing the metadata away.

Unsupported protocols now fail closed at the top of the loader, so `unsupported-rabbitmq.yaml` produces a deterministic invalid diagnostic instead of an in-scope operation. Likewise, malformed in-scope contracts such as `invalid.yaml` now surface precise async diagnostics instead of disappearing.

I tightened the tests to match the real runtime boundary. `yanote-js/src/spec/asyncapi.test.ts` now asserts the exact structured diagnostic bundles for invalid and unsupported fixtures and still verifies that `loadAsyncApiOperations()` rejects those cases. `yanote-js/src/spec/asyncapi.parity.test.ts` now proves that v2 and v3 fixtures normalize into the same canonical Kafka operations and the same ordered message-contract bundle.

`yanote-js/src/spec/discover.ts` did not need a code change. The existing direct-file and content-sniff logic already classified AsyncAPI inputs correctly once the fixtures and loader became truthful, so I left it alone and kept `discover.test.ts` as the regression guard rather than rewriting working code.

That leaves T03 with much narrower work: the full parity/discovery/OpenAPI proof stack is already green, so the remaining task is formal slice-proof closure rather than another loader rewrite.

## Verification

Task-level verification:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts` — passed.
- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts` — covered inside the broader passing slice command below.
- `npm -C yanote-js test -- src/spec/openapi.test.ts` — covered inside the broader passing OpenAPI/diagnostics command below.

Slice-level verification status after T02:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts` — passed.
- `npm -C yanote-js test -- src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts` — passed.
- `git diff --check` — passed before artifact updates.

Must-have readback confirmed:

- supported v2/v3 fixtures normalize into the same canonical async semantics bundle
- invalid and unsupported AsyncAPI inputs now surface structured diagnostics instead of raw or silent failure modes
- OpenAPI discovery behavior remains green while AsyncAPI discovery stays explicit through direct-file and content-sniff detection

## Diagnostics

Primary inspection surface:

- `yanote-js/src/spec/asyncapi.ts` → `loadAsyncApiSemanticsBundle(specPath)` returns:
  - `operations`: canonical Kafka operation keys in stable first-seen order
  - `operationContractsByKey`: adjacent message-contract metadata keyed by serialized canonical operation identity
  - `diagnostics`: structured async failures with runtime/version/protocol/channel/action/message context
  - `hasInvalid`: fail-closed semantic invalidity signal

Useful proof commands:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `npm -C yanote-js test -- src/spec/discover.test.ts src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts`

Pinned failure shapes now include:

- `AsyncAPI v3 operation channel must resolve to a non-empty address` with async context including `runtime:"kafka"`, `asyncapiVersion:"3.0.0"`, `protocol:"kafka"`, and `action:"send"`
- `Unsupported AsyncAPI protocol: amqp. Only kafka is supported.` with async context including `runtime:"kafka"`, `asyncapiVersion:"3.0.0"`, and `protocol:"amqp"`

## Deviations

- `yanote-js/src/spec/discover.ts` did not require a source change. The task plan named discovery normalization explicitly, but the existing direct-path plus content-sniff behavior already satisfied the intended boundary once the fixture corpus and loader semantics were corrected.

## Known Issues

- None in the touched T02 surface. The slice proof stack is already green, but T03 still needs to record the formal parity/failure-path proof closure in the GSD artifacts.

## Files Created/Modified

- `yanote-js/src/spec/asyncapi.ts` — replaced the shallow extractor with a Kafka-scoped AsyncAPI semantics bundle, structured diagnostics, canonical normalization, and fail-closed error formatting.
- `yanote-js/src/spec/asyncapi.test.ts` — updated loader tests to assert exact structured invalid/unsupported diagnostics and public fail-closed rejection behavior.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — upgraded parity proof to validate the ordered contract bundle, not only the canonical operation keys.
- `.gsd/DECISIONS.md` — recorded the AsyncAPI semantics-bundle and fail-closed loader boundary for downstream async work.
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T02 complete.
- `.gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md` — recorded the delivered loader boundary, verification results, and handoff diagnostics.
- `.gsd/STATE.md` — advanced the next action to T03.
