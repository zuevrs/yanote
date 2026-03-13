---
id: T01
parent: S02
milestone: M003
provides:
  - A normalized Kafka async evidence contract, JSONL reader, and fixture/test corpus that pins the missing S02 coverage semantics against covered, uncovered, unmatched, mismatched, and multi-suite evidence.
key_files:
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-js/src/events/readAsyncEventsJsonl.test.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/test/fixtures/async-events/events.fixture.jsonl
  - yanote-js/test/fixtures/async-events/partial.fixture.jsonl
  - yanote-js/test/fixtures/async-events/drift.fixture.jsonl
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S02/S02-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - First-wave async runtime evidence is a metadata-only Kafka JSONL surface (`kind`, `action`, `channel`, optional message-contract name, service/instance/error, and `test.*` attribution) rather than parser-shaped AsyncAPI output or payload-bearing broker dumps.
patterns_established:
  - Mirror the HTTP path at the evidence boundary: normalize JSONL into a typed runtime model first, then let coverage semantics consume that stable surface instead of re-parsing raw fixture lines or leaking arbitrary broker metadata downstream.
observability_surfaces:
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts
  - yanote-js/src/events/readAsyncEventsJsonl.test.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/test/fixtures/async-events/*
duration: 35m
verification_result: passed
completed_at: 2026-03-13 19:05:27 MSK
blocker_discovered: false
---

# T01: Define the normalized async evidence model and fixture contract

**Added a normalized Kafka async evidence contract and fixture corpus, with the reader green and the new async coverage tests intentionally red only where T02 still needs to implement the actual semantics.**

## What Happened

I started by mirroring the existing HTTP event boundary instead of guessing at coverage logic first. `yanote-js/src/model/asyncEvent.ts` now defines one normalized Kafka evidence shape built around the S01 canonical identity: `kind:"kafka"`, `action`, `channel`, optional message-contract name, optional service/instance/error metadata, and normalized `testRunId` / `testSuite` attribution.

On top of that model, `yanote-js/src/events/readAsyncEventsJsonl.ts` now streams JSONL into typed async evidence, normalizes action and channel values, trims optional message-contract names, carries only metadata-safe fields, and ignores malformed lines or non-Kafka entries without leaking arbitrary structures into the normalized surface. While wiring that reader, the first test run exposed a real bug: malformed `service` and `instance` values were still leaking through. I tightened the reader so only strings or explicit `null` survive there.

Then I added the async fixture corpus under `yanote-js/test/fixtures/async-events/`:

- `events.fixture.jsonl` pins basic reader normalization, invalid-line counting, and `test.*` defaults.
- `partial.fixture.jsonl` pins the partial-coverage contract: one covered send operation with two suites, leaving the receive side uncovered.
- `drift.fixture.jsonl` pins the future drift boundary: one covered operation, one message-contract mismatch on a known operation, and one unmatched Kafka event on an unknown channel.

To make T02’s target explicit, I also added `yanote-js/src/coverage/asyncCoverage.ts` as a deterministic contract placeholder and wrote `yanote-js/src/coverage/asyncCoverage.test.ts` against the intended result shape. Those tests now prove exactly what S02 still lacks: separate channel/operation/message coverage, suite attribution on covered async operations, and explicit unmatched/mismatched diagnostics.

That leaves T01 in the right state: the input contract is real, the reader is green, the drift/happy-path fixtures are durable, and the remaining failures point at missing async coverage semantics rather than ambiguous evidence assumptions.

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts`
  - `src/events/readAsyncEventsJsonl.test.ts` passed.
  - `src/coverage/asyncCoverage.test.ts` failed in the intended places:
    - the placeholder engine still leaves all channels/operations/messages uncovered;
    - suite attribution is still empty;
    - unmatched and mismatched diagnostics are not emitted yet.
- `git diff --check` — passed.

## Diagnostics

Use these first when T02 starts:

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — authoritative proof for JSONL normalization, invalid-line counting, and `test.*` defaults.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — authoritative proof for the intended async coverage result shape, suite attribution, and drift-diagnostic contract.
- `yanote-js/test/fixtures/async-events/partial.fixture.jsonl` — smallest proof for covered vs uncovered async semantics.
- `yanote-js/test/fixtures/async-events/drift.fixture.jsonl` — smallest proof for mismatched message-contract and unmatched-channel behavior.

## Deviations

- I introduced `yanote-js/src/coverage/asyncCoverage.ts` earlier than the task plan listed so the new contract tests could compile against a concrete exported result surface instead of failing at module-import time. The implementation is deliberately skeletal; its only purpose in T01 is to make the intended T02 red signals precise.

## Known Issues

- `yanote-js/src/coverage/asyncCoverage.ts` is only a deterministic placeholder. It does not yet consume async evidence, compute any covered state, preserve suites, or emit unmatched/mismatched diagnostics.
- The new async coverage tests are therefore intentionally red until T02 lands.

## Files Created/Modified

- `yanote-js/src/model/asyncEvent.ts` — added the normalized Kafka async evidence model and action/channel/message normalizers.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — added the async JSONL reader with metadata-safe normalization and invalid-line handling.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — pinned reader normalization, invalid-line counting, and malformed-field handling.
- `yanote-js/src/coverage/asyncCoverage.ts` — added the initial async coverage result surface and deterministic placeholder implementation for contract tests.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — pinned the intended async coverage result shape for partial and drift evidence.
- `yanote-js/test/fixtures/async-events/events.fixture.jsonl` — added reader-level normalization and invalid-line fixture coverage.
- `yanote-js/test/fixtures/async-events/partial.fixture.jsonl` — added partial-coverage and multi-suite async evidence fixture.
- `yanote-js/test/fixtures/async-events/drift.fixture.jsonl` — added unmatched and mismatched async evidence fixture.
- `.gsd/DECISIONS.md` — recorded the normalized metadata-only Kafka evidence boundary for S02/M004.
- `.gsd/milestones/M003/slices/S02/S02-PLAN.md` — marked T01 complete.
- `.gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md` — recorded the delivered evidence boundary, green reader proof, and intentional T02 red signals.
- `.gsd/STATE.md` — advanced the next action to S02/T02.
