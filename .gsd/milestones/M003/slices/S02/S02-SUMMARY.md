---
id: S02
parent: M003
milestone: M003
provides:
  - Deterministic async coverage semantics over canonical Kafka contracts and normalized Kafka evidence, with separate channel/operation/message-contract result surfaces and explicit unmatched/mismatched drift diagnostics.
requires:
  - slice: S01
    provides: canonical Kafka async identities, AsyncAPI semantics bundles, and deterministic v2/v3 contract parity.
affects:
  - M003/S03
  - M004/S01
  - M005/S02
key_files:
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/test/fixtures/async-events/*
  - .gsd/STATE.md
key_decisions:
  - Represent async runtime evidence as metadata-only Kafka JSONL, match async operations at action+channel, and keep message-contract identity as a separate coverage dimension so drift stays visible without fragmenting the base operation key.
patterns_established:
  - Reuse the S01 AsyncAPI semantics bundle and replay the same normalized Kafka evidence against equivalent v2/v3 contracts, so async parity is proven at the coverage-semantics layer rather than only at the parser layer.
observability_surfaces:
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts
  - yanote-js/src/events/readAsyncEventsJsonl.test.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/test/fixtures/async-events/*
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T03-SUMMARY.md
duration: 1h 05m
verification_result: passed
completed_at: 2026-03-13 19:12:15 MSK
---

# S02: Async Coverage And Diagnostics Semantics

**Yanote now computes deterministic async coverage from canonical Kafka contracts and normalized Kafka evidence, separating channel, operation, and message-contract coverage while surfacing unmatched and mismatched async drift explicitly under one repeatable proof command.**

## What Happened

S02 started by locking the runtime-facing evidence contract before touching coverage logic. T01 introduced `yanote-js/src/model/asyncEvent.ts` and `yanote-js/src/events/readAsyncEventsJsonl.ts`, defining a metadata-only Kafka JSONL shape built around the S01 canonical identity: `kind`, `action`, `channel`, optional message-contract name, optional service/instance/error metadata, and normalized `test.*` attribution. The new fixture corpus under `yanote-js/test/fixtures/async-events/` deliberately covered partial happy-path evidence, multi-suite evidence, unmatched-channel drift, mismatched message-contract drift, and basic reader normalization. The reader went green, and the intentionally red coverage tests pinned the exact semantics T02 still had to implement.

T02 then replaced the placeholder async engine with the real matching semantics in `yanote-js/src/coverage/asyncCoverage.ts`. The engine now consumes the S01 `AsyncApiSemanticsBundle` plus normalized Kafka evidence directly, matches canonical operations at `action + channel`, and treats message-contract identity as a distinct coverage layer on top of the base operation match. That gives the result three honest surfaces instead of one topic-hit counter: channel coverage, operation coverage, and message-contract coverage. It also keeps drift explicit: unknown-channel or wrong-action evidence becomes `unmatched`, while action+channel matches with the wrong or missing message-contract identity become `mismatched`. Known-channel action drift still marks the channel observed without minting fake operation coverage.

T03 closed the slice at the proof layer. `yanote-js/src/coverage/asyncCoverage.parity.test.ts` now replays the same normalized Kafka evidence against equivalent AsyncAPI v2 and v3 bundles and proves identical coverage results at the semantics layer, not only at the parser layer. The slice-level verifier also keeps the HTTP coverage baseline green, so the new async engine is proven not to spill into the established HTTP path.

That leaves M003 in the right state for S03: the analyzer already has one truthful async contract surface from S01 and one truthful async coverage surface from S02. What remains is to serialize and gate that async result separately rather than recomputing semantics again.

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts` — passed.
- `git diff --check` — passed.

The passing verifier proves:

- normalized async evidence is read deterministically and safely from JSONL;
- partial async evidence produces separate covered/uncovered channel, operation, and message-contract surfaces;
- unmatched and mismatched async drift stay explicit and deterministic;
- equivalent AsyncAPI v2/v3 bundles yield identical async coverage semantics under shared evidence;
- the existing HTTP coverage baseline remains green after the async coverage engine landed.

## Requirements Advanced

- R046 — Advanced the async quality bar with a repeatable integration-level verifier that composes reader normalization, async coverage semantics, drift diagnostics, v2/v3 parity, and HTTP non-regression in one stack.

## Requirements Validated

- R039 — Validated by the S02 verifier stack proving distinct channel, send/receive operation, and message-contract coverage semantics from normalized Kafka evidence.
- R040 — Validated by explicit `unmatched` and `mismatched` async drift diagnostics, including message-contract mismatch and known-channel action-drift proof.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T01 introduced `yanote-js/src/coverage/asyncCoverage.ts` slightly earlier than the original task wording implied so the new contract tests could compile against a concrete exported result shape instead of failing at module import time.
- T02 kept async evidence diagnostics local to the async coverage engine rather than extending the shared HTTP/spec `SemanticDiagnostic` type immediately. That preserved the current HTTP/report surface while the separate async result model was still being settled.

## Known Limitations

- S02 does not yet serialize async coverage into a separate report artifact or gate surface; that is S03 work.
- There is still no live Spring Kafka evidence capture or Kafka-header propagation proof; those remain in M004.
- Payload validation against AsyncAPI message schemas is still deferred.

## Follow-ups

- Plan and execute S03 against `asyncCoverage.ts`, serializing and gating the new async coverage result through a separate async report/CLI path.
- Keep the future report schema aligned with the local async drift-diagnostic model instead of forcing it back through the HTTP/spec diagnostic vocabulary.

## Files Created/Modified

- `yanote-js/src/model/asyncEvent.ts` — introduced the normalized Kafka async evidence model and field normalizers.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — added the async JSONL reader used by all slice proofs.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — pinned safe normalization and invalid-line handling for async evidence.
- `yanote-js/src/coverage/asyncCoverage.ts` — implemented deterministic async coverage and unmatched/mismatched drift diagnostics.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — proved partial coverage, multi-suite attribution, and message-contract coverage separation.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — proved deterministic async drift diagnostics and known-channel action-drift behavior.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — proved v2/v3 async coverage parity under shared evidence.
- `yanote-js/test/fixtures/async-events/events.fixture.jsonl` — added reader-level normalization and invalid-line fixture coverage.
- `yanote-js/test/fixtures/async-events/partial.fixture.jsonl` — added partial-coverage and multi-suite async evidence proof.
- `yanote-js/test/fixtures/async-events/drift.fixture.jsonl` — added mismatched-message and unmatched-channel async drift proof.
- `yanote-js/test/fixtures/async-events/action-mismatch.fixture.jsonl` — added known-channel wrong-action drift proof.
- `.gsd/REQUIREMENTS.md` — moved R039 and R040 to validated and refreshed summary counts.
- `.gsd/milestones/M003/M003-ROADMAP.md` — marked S02 complete.
- `.gsd/milestones/M003/slices/S02/S02-SUMMARY.md` — recorded the slice narrative, proof surface, and downstream handoff.
- `.gsd/milestones/M003/slices/S02/S02-UAT.md` — recorded the slice acceptance path.
- `.gsd/PROJECT.md` — refreshed the project-level current state to include the now-proven async coverage semantics.
- `.gsd/STATE.md` — advanced the active slice to S03 planning.

## Forward Intelligence

### What the next slice should know
- `asyncCoverage.ts` is the right handoff seam for S03. The report/gate layer should consume its result model directly rather than re-deriving async semantics from raw evidence or AsyncAPI documents.

### What's fragile
- The async drift-diagnostic model currently lives in `asyncCoverage.ts`, not in the shared HTTP/spec diagnostic vocabulary — S03 needs to serialize that truthfully without collapsing `mismatched` back into a generic HTTP-era diagnostic kind.

### Authoritative diagnostics
- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts` — this is the slice-level truth surface because it localizes reader drift, coverage semantics drift, v2/v3 parity regressions, async diagnostic ordering problems, and HTTP fallout in one run.

### What assumptions changed
- S02 did not need to reuse the existing shared `SemanticDiagnostic` type directly — a local async drift-diagnostic model was cleaner and more honest while the separate async report path does not yet exist.
- Channel coverage turned out to be usefully distinct from operation coverage: a known channel can be truthfully marked observed even when the action is outside the canonical contract and therefore still unmatched at the operation layer.
