---
estimated_steps: 5
estimated_files: 5
---

# T01: Define the normalized async evidence model and fixture contract

**Slice:** S02 — Async Coverage And Diagnostics Semantics
**Milestone:** M003

## Description

Define the runtime-facing Kafka evidence shape and the fixture corpus that will drive async coverage semantics, so S02 can prove honest matching behavior before implementing the engine and M004 can later emit the same normalized surface.

## Steps

1. Audit the S01 semantics bundle and the existing HTTP event/JSONL reader patterns to identify the minimum async evidence fields needed for channel, operation, message-contract, and suite attribution semantics.
2. Add a normalized async evidence model plus a JSONL reader that preserves action, channel, message-contract identity, and test metadata without carrying payload bodies or arbitrary broker headers.
3. Create fixture JSONL covering covered operations, uncovered contracts, unmatched evidence, mismatched message-contract evidence, and repeated-suite evidence on the same operation.
4. Add tests that pin the reader normalization and the intended async coverage result shape against those fixtures.
5. Leave the coverage-engine tests intentionally red only where the missing semantics implementation in T02 should now close the loop.

## Must-Haves

- [ ] The normalized async evidence shape is explicit enough for channel, operation, and message-contract coverage plus future suite/run attribution.
- [ ] Fixture JSONL covers both happy-path and drift-path evidence instead of only covered cases.
- [ ] No payload dumps, secrets, or arbitrary header blobs enter the evidence fixtures.

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts`
- The new fixture/test surface makes the missing async coverage engine behavior explicit rather than ambiguous.

## Inputs

- `yanote-js/src/spec/asyncapi.ts` — authoritative async contract bundle from S01.
- `yanote-js/src/model/httpEvent.ts` — current normalized event shape and naming conventions.
- `yanote-js/src/events/readJsonl.ts` — current JSONL reader pattern to mirror for async evidence.
- `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md` — confirms what S01 already locked and what S02 must consume.

## Expected Output

- `yanote-js/src/model/asyncEvent.ts` — normalized Kafka async evidence shape.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — JSONL reader for normalized async evidence fixtures.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — reader-level proof for async evidence normalization.
- `yanote-js/test/fixtures/async-events/*` — fixture corpus for covered, unmatched, mismatched, and multi-suite evidence.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — contract-level expectations for the async coverage result surface.
