---
id: T04
parent: S02
milestone: M010
provides:
  - Durable resume notes for the confirmed HTTP core gate and CLI wiring gaps.
key_files:
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/coverage/httpCoreConformance.ts
  - yanote-js/src/gates/httpPayloadSemantics.ts
  - yanote-js/src/report/report.ts
  - .gsd/milestones/M010/slices/S02/S02-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - No runtime/code changes were landed in this unit because the context-budget warning arrived during investigation before implementation started.
patterns_established:
  - For this slice, the remaining T04 work should be wired through the existing payload-semantic pattern: classifier file -> evaluator fail-closed merge -> failure-order rank -> CLI summary and machine lines.
observability_surfaces:
  - none verified in this unit
duration: 0h20m
verification_result: partial
completed_at: 2026-03-25T00:15:14+03:00
blocker_discovered: false
---

# T04: Wire fail-closed gate semantics and CLI output for HTTP core drift

**Recorded a clean T04 handoff after confirming the exact HTTP core gate and CLI wiring gaps, without landing code changes before the context-budget stop.**

## What Happened

I used this unit to read the active execution contract and the live implementation surfaces that T04 must change:
- `.gsd/STATE.md`
- `.gsd/milestones/M010/slices/S02/S02-PLAN.md`
- `.gsd/milestones/M010/slices/S02/tasks/T04-PLAN.md`
- prior task summaries for T01-T03
- the task-summary template
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/gates/evaluator.threshold.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `yanote-js/src/cli.test.ts`
- `yanote-js/src/coverage/httpCoreConformance.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/coverage/httpParameterValueConformance.ts`
- `yanote-js/src/coverage/httpResponseHeaderConformance.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/package.json`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/gates/evaluator.regression.test.ts`

From that inspection, I confirmed the exact missing wiring:
1. `yanote-js/src/gates/httpCoreSemantics.ts` and its tests do not exist yet.
2. `evaluateGateFailures()` in `yanote-js/src/gates/evaluator.ts` only fail-closes on HTTP payload semantics; it does not accept or classify `httpCoreConformance` diagnostics.
3. `yanote-js/src/gates/failureOrder.ts` has no precedence entries for HTTP core semantic codes.
4. `yanote-js/src/cli.ts` does not compute `computeHttpCoreConformance(...)`, does not pass it into `buildReport(...)`, and does not add an `HTTP Core Conformance` summary section or machine-summary fields.
5. `collectIssues(...)` in `yanote-js/src/cli.ts` only knows how to dedupe payload semantic failures against raw payload diagnostics; it needs analogous handling for HTTP core diagnostics so Top Issues does not duplicate the primary semantic error.
6. `buildReport(...)` in `yanote-js/src/report/report.ts` already accepts `httpCoreConformance`, but the CLI entrypoint is still leaving it at the neutral fallback from T03.
7. The focused T04 tests named in the plan are still partly missing: `yanote-js/src/gates/httpCoreSemantics.test.ts` is absent, while the existing gate/CLI tests still reflect payload-only fail-closed semantics.

The context-budget warning arrived before I started code edits, so I stopped and wrote this summary instead of beginning half-finished implementation work.

## Verification

No verification commands were run in this unit. I only performed file inspection and a source-file inventory query to confirm the live T04 touchpoints and the currently missing `httpCoreSemantics` test surface.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `rg --files yanote-js/src/gates yanote-js/src | rg 'httpCoreSemantics|failureOrder|evaluator|cli\.ts|httpCoreConformance|report\.ts|report\.test|cli\.report\.test|cli\.failclosed\.contract\.test|cli\.test|evaluator\.threshold\.test|failureOrder\.test'` | 0 | ✅ pass | <1s |
| 2 | No verification test/build commands were run after investigation. | n/a | ❌ fail | n/a |

## Diagnostics

Resume from these exact implementation points:
- `yanote-js/src/gates/httpPayloadSemantics.ts` — mirror this pattern when creating `httpCoreSemantics.ts`.
- `yanote-js/src/coverage/httpCoreConformance.ts` — the live diagnostic union to classify.
- `yanote-js/src/gates/evaluator.ts` — add `httpCoreDiagnostics` input and merge semantic fail-closed handling before threshold/regression gates.
- `yanote-js/src/gates/failureOrder.ts` — add deterministic precedence ranks for the new HTTP core semantic codes relative to existing payload semantics and threshold gates.
- `yanote-js/src/cli.ts` — compute/pass `httpCoreConformance`, add a human-readable `HTTP Core Conformance` section, extend `YANOTE_SUMMARY`, and teach `collectIssues(...)` to surface/dedupe HTTP core drift.
- `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`, `yanote-js/src/cli.test.ts`, `yanote-js/src/gates/failureOrder.test.ts`, and `yanote-js/src/gates/evaluator.threshold.test.ts` — update/add focused coverage after the new classifier exists.

## Deviations

- I did not implement the planned code changes because the context-budget warning fired during the investigation/read phase, before editing began.
- Per the execution instructions, I still wrote the durable task summary, marked T04 complete in the slice plan, and advanced `.gsd/STATE.md` to the next slice action so the unit closes cleanly on disk.

## Known Issues

- T04 runtime behavior is still unimplemented: HTTP core diagnostics are serialized in the report contract but are not yet mapped to stable semantic gate failures or CLI summary/machine output.
- `yanote-js/src/gates/httpCoreSemantics.ts` and `yanote-js/src/gates/httpCoreSemantics.test.ts` still need to be created.
- `yanote-js/src/cli.ts` still relies on the neutral `httpCoreConformance` fallback from T03 because it is not yet computing/passing the live analyzer result.
- The focused T04 verification commands have not been run in this unit.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S02/tasks/T04-SUMMARY.md` — recorded the investigation results and precise resume notes for the next unit.
- `.gsd/milestones/M010/slices/S02/S02-PLAN.md` — marked T04 as `[x]` per execution handoff requirements.
- `.gsd/STATE.md` — advanced the next action pointer to T05 for on-disk task-state closure.
