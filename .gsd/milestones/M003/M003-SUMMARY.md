---
id: M003
provides:
  - A complete Kafka-first AsyncAPI foundation: canonical v2/v3 AsyncAPI normalization, deterministic async coverage semantics with explicit drift diagnostics, and a separate async report/gate CLI surface ready for downstream Spring Kafka evidence capture.
key_decisions:
  - Keep Kafka as the canonical first-wave async runtime identity, preserve message-contract identity adjacent to the base operation key, and ship the first async release on a separate report/gate path instead of merging it into HTTP.
  - Treat unmatched and mismatched async evidence as fail-closed first-class diagnostics across coverage, report, and gate layers.
patterns_established:
  - Close async milestones in vertical order: normalize AsyncAPI contracts first, prove async coverage semantics second, then productize the result through a dedicated report/CLI path while keeping HTTP non-regression in every downstream verifier.
observability_surfaces:
  - npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts
  - npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts
  - YANOTE_ASYNC_SUMMARY
  - yanote-async-report.json
requirement_outcomes:
  - id: R037
    from_status: active
    to_status: validated
    proof: S01 verifier stack passed, proving Kafka-oriented AsyncAPI ingestion with explicit invalid/unsupported boundaries and HTTP discovery non-regression.
  - id: R038
    from_status: active
    to_status: validated
    proof: S01 parity tests passed, proving equivalent AsyncAPI v2/v3 fixtures normalize into the same canonical `kafka <action> <channel>` identities.
  - id: R039
    from_status: active
    to_status: validated
    proof: S02 verifier stack passed, proving separate channel, operation, and message-contract coverage semantics over normalized Kafka evidence.
  - id: R040
    from_status: active
    to_status: validated
    proof: S02 diagnostics and parity tests passed, proving explicit unmatched and mismatched async drift instead of silent best-effort matching.
  - id: R041
    from_status: active
    to_status: validated
    proof: S03 verifier stack passed, proving dedicated `async-report` CLI wiring, deterministic `yanote-async-report.json` output, fail-closed async gate behavior, and HTTP non-regression.
duration: 3h 25m
verification_result: passed
completed_at: 2026-03-13 20:14:38 +0300
---

# M003: AsyncAPI Coverage Foundations

**Delivered a complete first-wave async contract-coverage foundation: Yanote now normalizes supported Kafka AsyncAPI contracts into canonical identities, computes deterministic async coverage with explicit drift diagnostics, and exposes that result through a separate async report/gate path instead of blurring it into HTTP.**

## What Happened

M003 closed the async rollout in the right order.

S01 established the contract boundary. Yanote stopped treating AsyncAPI as an opaque future concern and learned how to parse Kafka-oriented AsyncAPI v2/v3 documents into one canonical runtime identity model: `kafka <action> <channel>`. That slice also kept message-contract references adjacent to the base operation key, generalized diagnostics so async failures were typed and contextual, and proved deterministic v2/v3 parity plus fail-closed invalid/unsupported handling.

S02 turned that contract surface into truthful coverage semantics. Instead of a shallow topic-hit counter, async coverage now distinguishes three real dimensions: observed channels, covered send/receive operations, and observed message-contract identities. Normalized Kafka JSONL evidence is matched at action+channel, message-contract identity remains a separate coverage layer, and drift is explicit: unknown channels or wrong actions stay `unmatched`, while action+channel matches with the wrong or missing message identity are `mismatched`.

S03 productized the async result without collapsing it back into HTTP vocabulary. Yanote now has a separate async artifact model, deterministic async schema/normalization boundary, fail-closed async evaluator, and a dedicated `yanote async-report` CLI path that writes `yanote-async-report.json` and emits `YANOTE_ASYNC_*` machine-readable lines. The HTTP report path stayed separate and green throughout. The only closure gap I found in the artifact layer was administrative, not product-level: the S03 implementation and task summaries existed, but `S03-SUMMARY.md` had not been written. I closed that gap from task evidence plus fresh verifier runs before marking the milestone complete.

## Cross-Slice Verification

### Success criteria

- **Supported Kafka-oriented AsyncAPI contracts normalize into canonical async identities without leaking spec-version differences downstream** — verified by the S01 proof command:
  - `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
  - Fresh result: passed (5 files, 21 tests).
  - Evidence: `asyncapi.parity.test.ts` proves equivalent v2/v3 contracts resolve to the same canonical Kafka operation ordering; `asyncapi.test.ts` and `semantics.diagnostics.test.ts` prove deterministic fail-closed invalid/unsupported handling.

- **Yanote computes async coverage that distinguishes channel coverage, send/receive operation coverage, and message-contract identity coverage** — verified by the S02 proof command:
  - `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`
  - Fresh result: passed (6 files, 12 tests).
  - Evidence: `asyncCoverage.test.ts` proves separate channel/operation/message result surfaces; `asyncCoverage.parity.test.ts` proves those semantics stay stable across equivalent AsyncAPI v2/v3 bundles.

- **Yanote surfaces unmatched and mismatched async evidence explicitly instead of silently treating it as covered** — verified by the same S02 stack:
  - Fresh result: passed.
  - Evidence: `asyncCoverage.diagnostics.test.ts` proves deterministic unmatched/mismatched ordering and known-channel wrong-action behavior; `asyncCoverage.test.ts` proves drift does not mint synthetic operation/message coverage.

- **Yanote emits a separate deterministic async report and gate result alongside the existing HTTP path** — verified by the S03 proof command:
  - `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
  - Fresh result: passed (8 files, 22 tests).
  - Evidence: `asyncReport.test.ts` and `asyncReport.contract.test.ts` prove dedicated async artifact shape and schema; `cli.async-report.test.ts` and `cli.async-report.contract.test.ts` prove `yanote async-report`, `yanote-async-report.json`, and `YANOTE_ASYNC_*` output surfaces; `report.test.ts` and `coverage.test.ts` prove HTTP non-regression.

- **The new async semantics are protected by fixture, unit, and contract-proof tests matching the product’s fail-closed quality posture** — verified by the three authoritative slice proof commands above plus `git diff --check`.
  - Fresh result: `git diff --check` passed.
  - Evidence: parser/semantics parity, evidence normalization, async coverage, async diagnostics, async artifact schema, async gates, dedicated CLI contract, and HTTP baseline all have explicit proof surfaces.

### Definition of done

- **All slices are `[x]`** — verified from the inlined roadmap and the live `S03-PLAN.md`, whose T01/T02/T03 checklist is fully complete.
- **All slice summaries exist** — verified after writing the missing `.gsd/milestones/M003/slices/S03/S03-SUMMARY.md`; S01 and S02 summaries already existed.
- **Cross-slice integration points work correctly** — verified by the fresh S03 proof stack consuming S02 coverage results and preserving HTTP non-regression, plus the fresh S01/S02 proof stacks that keep the upstream AsyncAPI ingestion and async coverage seams green.
- **No success criterion failed** — all milestone success criteria were met with fresh passing proof.

## Requirement Changes

- R037: active → validated — S01 proof stack passed, proving Kafka-oriented AsyncAPI ingestion with explicit invalid/unsupported boundaries and HTTP discovery non-regression.
- R038: active → validated — S01 parity proof passed, proving equivalent AsyncAPI v2/v3 contracts normalize into the same canonical Kafka identities.
- R039: active → validated — S02 proof stack passed, proving distinct channel, operation, and message-contract coverage semantics over normalized Kafka evidence.
- R040: active → validated — S02 diagnostics proof passed, proving explicit unmatched and mismatched async drift instead of silent best-effort matches.
- R041: active → validated — S03 proof stack passed, proving the dedicated async report/CLI/gate surface and HTTP non-regression.

`REQUIREMENTS.md` already reflected these validated transitions when I closed the milestone, so no additional status correction was needed there.

## Forward Intelligence

### What the next milestone should know
- M004 should treat the M003 seams as fixed inputs: emit metadata-only Kafka evidence into `readAsyncEventsJsonl.ts` / `asyncCoverage.ts`, preserve the canonical `kafka <action> <channel>` identity, and let the separate async report/gate path consume that output unchanged.

### What's fragile
- A single oversized Vitest invocation that piles slow AsyncAPI, coverage, report, and CLI files together can trip the default 5s per-test timeout even when the official slice proof commands pass cleanly — use the slice verifier stacks as the authoritative acceptance surface.

### Authoritative diagnostics
- The three slice proof commands above are the right first stop because they localize failures by milestone seam: S01 for AsyncAPI normalization, S02 for async coverage/drift semantics, S03 for artifact/gate/CLI wiring and HTTP non-regression.

### What assumptions changed
- The missing `S03-SUMMARY.md` initially looked like a possible product gap, but the actual shipped async CLI/report surface and task proofs were already present; closure work needed to restore the artifact trail, not re-implement the feature.

## Files Created/Modified

- `.gsd/milestones/M003/slices/S03/S03-SUMMARY.md` — recorded the final slice narrative, proof surface, requirement outcome, and downstream handoff.
- `.gsd/milestones/M003/M003-SUMMARY.md` — recorded milestone-level closure, success-criteria verification, and requirement transitions.
- `.gsd/PROJECT.md` — refreshed the living project snapshot so M003 is explicitly complete and M004 is the next product frontier.
- `.gsd/STATE.md` — advanced the tracker from M003 completion to M004 ready-for-planning state.
