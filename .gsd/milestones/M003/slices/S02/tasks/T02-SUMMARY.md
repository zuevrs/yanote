---
id: T02
parent: S02
milestone: M003
provides:
  - Deterministic async coverage computation over the S01 semantics bundle and normalized Kafka evidence, with separate channel/operation/message-contract surfaces and explicit unmatched/mismatched diagnostics.
key_files:
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/test/fixtures/async-events/drift.fixture.jsonl
  - yanote-js/test/fixtures/async-events/action-mismatch.fixture.jsonl
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S02/S02-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Async operation matching now locks at action+channel, while message-contract identity remains a separate coverage dimension so mismatches stay visible without fragmenting the base operation key.
patterns_established:
  - Keep async drift honest by separating "known channel observed", "canonical operation matched", and "canonical message contract matched" into different result surfaces instead of deriving all async coverage from a single topic-hit boolean.
observability_surfaces:
  - npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/test/fixtures/async-events/drift.fixture.jsonl
  - yanote-js/test/fixtures/async-events/action-mismatch.fixture.jsonl
duration: 20m
verification_result: passed
completed_at: 2026-03-13 19:10:33 MSK
blocker_discovered: false
---

# T02: Implement async coverage computation and fail-closed diagnostics

**Implemented the real async coverage engine so channel, operation, and message-contract coverage are computed separately from normalized Kafka evidence, while unmatched and mismatched drift now surface as deterministic first-class diagnostics.**

## What Happened

I replaced the T01 placeholder in `yanote-js/src/coverage/asyncCoverage.ts` with the actual matching semantics.

The engine now consumes the S01 `AsyncApiSemanticsBundle` and normalized `AsyncEvent[]` directly. It builds deterministic first-seen channel state from the spec bundle, matches runtime evidence at the canonical operation boundary (`action + channel`), and keeps message-contract identity as a distinct layer on top of that operation match instead of baking it into the base key.

That gives the async result three honest surfaces:

- **channel coverage** — whether the contract channel was observed at all through known-channel evidence;
- **operation coverage** — whether the canonical `kafka <action> <channel>` operation was observed;
- **message-contract coverage** — whether the canonical message-contract identity was actually observed on a matched operation.

I also made the drift boundary explicit. When evidence lands on an unknown channel or on a known channel with the wrong action, the engine now emits an `unmatched` diagnostic. When action+channel matches but the message-contract identity is missing or different, it emits a `mismatched` diagnostic and keeps the canonical message contract uncovered. Diagnostics are deduplicated in first-seen order so repeated evidence does not create unstable noise.

To prove that split, I added `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` and a focused `action-mismatch.fixture.jsonl`. Those tests pin two useful truths for later slices: repeated runs over the same drift evidence stay deterministic, and a known channel can be marked observed while operation coverage remains zero when the observed action falls outside the canonical contract.

That leaves T03 with narrower work: the async engine itself is now real, and the remaining slice closure is parity/non-regression proof rather than another semantic rewrite.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts` — passed.
- `git diff --check` — still passes after the T02 changes.

Must-have readback confirmed:

- channel, operation, and message-contract coverage now compute separately from the same evidence;
- unmatched and mismatched async drift are explicit diagnostics instead of silent misses;
- known-channel wrong-action evidence does not create synthetic operation coverage;
- repeated runs over the same async evidence produce the same diagnostics in the same order.

## Diagnostics

Primary inspection surfaces for future work:

- `yanote-js/src/coverage/asyncCoverage.ts` — authoritative matching boundary and result-shape implementation.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — authoritative contract for partial coverage, multi-suite attribution, and message-contract coverage split.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — authoritative drift proof for mismatched message contracts, unmatched evidence, and known-channel action drift.
- `yanote-js/test/fixtures/async-events/drift.fixture.jsonl` — smallest fixture proving mismatched message + unmatched channel behavior.
- `yanote-js/test/fixtures/async-events/action-mismatch.fixture.jsonl` — smallest fixture proving channel-observed / operation-unmatched separation.

## Deviations

- I kept async evidence diagnostics local to `asyncCoverage.ts` instead of extending the existing shared `SemanticDiagnostic` type in this task. That keeps the HTTP/spec diagnostic surface stable while S02 settles the async coverage semantics and leaves S03 free to serialize the separate async diagnostic model truthfully.

## Known Issues

- S02 parity and broader slice-level non-regression proof are still pending in T03.
- The async coverage engine is not yet wired into a report or CLI surface; that remains S03 work.

## Files Created/Modified

- `yanote-js/src/coverage/asyncCoverage.ts` — replaced the placeholder with deterministic async coverage and drift-diagnostic semantics.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — now passes against the real async coverage engine and the T01 fixture contract.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — added deterministic proof for mismatched/unmatched diagnostics and known-channel action drift.
- `yanote-js/test/fixtures/async-events/action-mismatch.fixture.jsonl` — added a focused known-channel wrong-action drift fixture.
- `.gsd/DECISIONS.md` — recorded the action+channel operation-match boundary and separate message-contract coverage rule.
- `.gsd/milestones/M003/slices/S02/S02-PLAN.md` — marked T02 complete.
- `.gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md` — recorded the delivered async coverage semantics and proof surfaces.
- `.gsd/STATE.md` — advanced the next action to T03.
