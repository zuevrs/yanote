---
id: T03
parent: S01
milestone: M003
provides:
  - One repeatable S01 proof command that locks AsyncAPI v2/v3 canonical-key parity, parser/semantic failure paths, discovery classification, HTTP non-regression, and async bundle determinism.
key_files:
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/semantics.diagnostics.test.ts
  - yanote-js/test/fixtures/asyncapi/unsupported-version.yaml
  - yanote-js/test/fixtures/asyncapi/unresolved-message-ref.yaml
  - yanote-js/test/fixtures/asyncapi/malformed-channel-ref.yaml
  - .gsd/milestones/M003/slices/S01/S01-PLAN.md
  - .gsd/DECISIONS.md
  - .gsd/STATE.md
key_decisions:
  - Treat unsupported AsyncAPI versions and broken `$ref` resolution as parser-level invalid-document failures, while reserving structured async diagnostics for successfully parsed in-scope Kafka contracts.
patterns_established:
  - Close async contract slices with one targeted verifier command that exercises parity, explicit failure paths, discovery, HTTP compatibility, and deterministic async semantics together instead of split ad hoc reruns.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts
  - yanote-js/src/spec/asyncapi.test.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/spec/semantics.diagnostics.test.ts
  - yanote-js/test/fixtures/asyncapi/*
duration: 25m
verification_result: passed
completed_at: 2026-03-13 16:57:22 +0300
blocker_discovered: false
---

# T03: Add parity and failure-path proof for canonical async identity

**Tightened S01 into one repeatable proof surface by pinning parser-boundary AsyncAPI failures, explicit v2/v3 canonical-key parity, deterministic async semantics, and HTTP/discovery non-regression under a single test command.**

## What Happened

T01 and T02 had already established the Kafka-oriented async contract and the real normalization bundle, but the final proof layer was still incomplete in this branch.

I expanded `yanote-js/src/spec/asyncapi.test.ts` with explicit parser-boundary cases for unsupported AsyncAPI version input, unresolved message refs, and malformed channel refs. Those tests intentionally exercise both `loadAsyncApiSemanticsBundle()` and `loadAsyncApiOperations()` so the failure split is clear: parser-hard failures reject immediately, while parsed-but-invalid Kafka-scoped contracts still surface structured async semantic diagnostics.

I tightened `yanote-js/src/spec/asyncapi.parity.test.ts` so the v2/v3 parity proof now asserts serialized canonical key ordering directly and checks that `operationContractsByKey` preserves the same deterministic insertion order as the operation list. That turns the parity proof from “same contracts eventually” into “same canonical identity sequence and adjacent contract ordering.”

I also expanded `yanote-js/src/spec/semantics.diagnostics.test.ts` so the generalized diagnostics surface now proves repeated-load determinism for both valid async bundles and invalid async diagnostics, while keeping the HTTP baseline checks intact.

To make those cases durable, I added three new AsyncAPI fixtures for unsupported-version, unresolved-message-ref, and malformed-channel-ref boundaries. Then I refreshed the slice artifacts so `S01-PLAN.md`, `.gsd/DECISIONS.md`, and `.gsd/STATE.md` point at the real closed-slice proof surface instead of the stale pre-T03 state.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts` — passed.
- `git diff --check` — passed.

Must-have readback confirmed:

- equivalent v2 and v3 fixtures normalize to identical canonical Kafka identities in deterministic order
- failure-path proof covers unsupported protocol, unsupported version, unresolved refs, malformed refs, and parsed semantic invalidity explicitly
- the same proof command keeps discovery and the existing OpenAPI semantic baseline green after the async identity changes
- async bundle and diagnostic determinism are asserted directly instead of being inferred from a single green run

## Diagnostics

Primary inspection path for future agents:

- run `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
- inspect `yanote-js/src/spec/asyncapi.test.ts` for whether the failure came from parser-boundary rejection or semantic invalidation
- inspect `yanote-js/src/spec/asyncapi.parity.test.ts` for canonical key ordering or contract-order drift
- inspect `yanote-js/src/spec/semantics.diagnostics.test.ts` for repeated-load determinism of async bundles and structured diagnostics
- inspect `yanote-js/test/fixtures/asyncapi/*` for the exact boundary fixture that failed

Pinned failure split after this task:

- unsupported versions and broken `$ref` inputs fail as invalid-document parser rejections
- unsupported protocol and parsed semantic invalidity fail through the async semantics bundle with structured Kafka-scoped diagnostic context
- canonical ordering or bundle determinism drift fails in the targeted verifier without requiring broader repo reconstruction

## Deviations

- None. The delivered work matched the task plan: parity proof, failure-path expansion, one repeatable verifier command, and HTTP/discovery non-regression all landed together.

## Known Issues

- None in the touched S01 proof surface.

## Files Created/Modified

- `yanote-js/src/spec/asyncapi.test.ts` — added explicit parser-boundary failure-path coverage for unsupported version, unresolved refs, and malformed refs while preserving the semantic invalid/protocol tests.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — tightened parity proof to assert serialized canonical key ordering and `operationContractsByKey` insertion order for equivalent v2/v3 fixtures.
- `yanote-js/src/spec/semantics.diagnostics.test.ts` — added repeated-load proof for valid async bundles and invalid async diagnostics, and included runtime context in the typed async diagnostic example.
- `yanote-js/test/fixtures/asyncapi/unsupported-version.yaml` — added unsupported AsyncAPI version boundary fixture.
- `yanote-js/test/fixtures/asyncapi/unresolved-message-ref.yaml` — added unresolved message-ref boundary fixture.
- `yanote-js/test/fixtures/asyncapi/malformed-channel-ref.yaml` — added malformed channel-ref boundary fixture.
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T03 complete and collapsed the slice verification to the truthful single proof command.
- `.gsd/DECISIONS.md` — recorded the parser-vs-semantics failure-boundary decision.
- `.gsd/STATE.md` — advanced the slice state to S02 planning after the proof command passed.
