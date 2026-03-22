---
id: T03
parent: S02
milestone: M003
provides:
  - One repeatable S02 proof command that locks async coverage parity across AsyncAPI v2/v3, deterministic unmatched/mismatched diagnostics, and HTTP coverage non-regression.
key_files:
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/asyncCoverage.test.ts
  - .gsd/DECISIONS.md
  - .gsd/milestones/M003/slices/S02/S02-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Close async coverage semantics with one verifier that replays the same normalized Kafka evidence against equivalent AsyncAPI v2/v3 bundles and keeps the HTTP coverage baseline in the same proof stack.
patterns_established:
  - Reuse the canonical contract fixtures from S01 and the normalized evidence fixtures from S02 together, so parity proves real async semantics rather than only parser output equality.
observability_surfaces:
  - npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts
  - yanote-js/src/coverage/asyncCoverage.parity.test.ts
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - yanote-js/src/coverage/coverage.test.ts
duration: 10m
verification_result: passed
completed_at: 2026-03-13 19:12:15 MSK
blocker_discovered: false
---

# T03: Add parity and non-regression proof for async coverage semantics

**Closed S02 on one rerunnable proof command that shows equivalent AsyncAPI v2/v3 contracts yield the same async coverage semantics under shared evidence, while the existing HTTP coverage baseline stays green.**

## What Happened

This task stayed in the proof layer, not the semantics layer.

I added `yanote-js/src/coverage/asyncCoverage.parity.test.ts`, which replays the same normalized Kafka evidence fixtures against both `test/fixtures/asyncapi/v2.yaml` and `test/fixtures/asyncapi/v3.yaml`. That test proves parity at the coverage level rather than only at the contract-loader level: partial async coverage and drifted async evidence now resolve to identical channel, operation, message-contract, and diagnostic outputs across the two supported AsyncAPI versions.

Then I reran the full S02 verifier stack with the reader, async coverage contract, async coverage diagnostics, async coverage parity, the existing S01 AsyncAPI parity proof, and the HTTP coverage baseline together. That leaves one trustworthy proof command for the slice instead of a pile of narrower reruns.

With that command green, S02 is technically closed: async coverage semantics are now version-agnostic, drift diagnostics are deterministic, and the new async engine did not disturb the existing HTTP path.

## Verification

- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts` — passed.
- `git diff --check` — passed.

Must-have readback confirmed:

- equivalent AsyncAPI v2 and v3 bundles now yield identical async coverage results under the same partial and drift evidence;
- unmatched and mismatched async diagnostics remain deterministic under the same verifier;
- the existing HTTP coverage tests stay green after the async coverage engine landed.

## Diagnostics

Primary future-agent inspection path:

- run `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.parity.test.ts src/coverage/coverage.test.ts`
- inspect `yanote-js/src/coverage/asyncCoverage.parity.test.ts` first for v2/v3 drift in async semantics
- inspect `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` next for unmatched/mismatched ordering or known-channel action-drift failures
- inspect `yanote-js/src/coverage/coverage.test.ts` if the async work appears to have spilled into the HTTP baseline

## Deviations

- None. The task stayed on proof closure exactly as planned.

## Known Issues

- None in the touched S02 proof surface. The remaining milestone work is S03 report/gate integration, not another async coverage semantic gap.

## Files Created/Modified

- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — added async coverage parity proof across AsyncAPI v2/v3 bundles under shared evidence.
- `.gsd/DECISIONS.md` — recorded the combined v2/v3 async coverage parity plus HTTP non-regression proof boundary.
- `.gsd/milestones/M003/slices/S02/S02-PLAN.md` — marked T03 complete.
- `.gsd/milestones/M003/slices/S02/tasks/T03-SUMMARY.md` — recorded the proof command and slice-closure diagnostics.
- `.gsd/STATE.md` — advanced the next action past T03.
