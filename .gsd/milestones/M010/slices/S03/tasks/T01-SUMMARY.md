---
id: T01
parent: S03
milestone: M010
provides:
  - Durable resume notes and failing verification evidence for the real-input async header diagnostics task.
key_files:
  - yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts
  - .gsd/milestones/M010/slices/S03/tasks/T01-SUMMARY.md
key_decisions:
  - No product code was changed under the context-budget wrap-up; the next executor should resume from the focused async test failures captured here.
patterns_established:
  - The current pre-edit focused async suite is green except for stale asyncCoverage diagnostics expectations that still assume the older broad header-unverifiable behavior.
observability_surfaces:
  - `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`
duration: 0h25m
verification_result: failed
completed_at: 2026-03-25T06:38:00+03:00
blocker_discovered: false
---

# T01: Prove real-input async header diagnostics and authored unverifiable coverage

**Captured wrap-up notes and failing verification evidence for the unfinished real-input async header diagnostics task.**

## What Happened

I followed the required startup flow for this slice: activated the requested skills, read `.gsd/STATE.md`, the slice plan, and the T01 plan, then inspected the exact task surfaces in `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/cli.async-report.test.ts`, and the existing AsyncAPI / async-event fixtures.

The main local finding is that the stale test pattern identified by the planner is real: several public tests still rely on message-contract mutation helpers such as `withMessageOverride()` / `withoutHeaderValidation()` instead of proving all four header outcomes through authored AsyncAPI fixtures. I also confirmed that the currently failing focused pre-edit surface is narrower than the full task scope: the parser, conformance, report, and CLI tests already pass, while `src/coverage/asyncCoverage.diagnostics.test.ts` still expects the older broad `unverifiable-headers` behavior.

A context-budget warning arrived before I had landed a truthful fixture-backed implementation, so I stopped investigation, removed the disposable probe file I created under `.gsd/`, and wrote these resume notes instead of starting partial code edits that I could not verify cleanly.

## Verification

I ran the focused T01 verification stack before making any product changes. The result was useful for resume context:

- `src/spec/asyncapi.test.ts` passed.
- `src/coverage/asyncSchemaConformance.test.ts` passed.
- `src/report/asyncReport.test.ts` passed.
- `src/cli.async-report.test.ts` passed.
- `src/coverage/asyncCoverage.diagnostics.test.ts` failed in 3 places because it still expects `unverifiable-headers` entries that no longer appear in the current behavior.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts` | 1 | ❌ fail | 178.6s |

## Diagnostics

Resume from the failing suite first:

- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- failing assertions currently expect `unverifiable-headers` alongside payload/schema diagnostics
- actual current output omits those older header-capability-gap expectations and now includes a routing `mismatched` diagnostic reason field

The concrete failing cases from the test run were:

1. `keeps schema and routing diagnostics deterministic across repeated runs`
2. `publishes unsupported content-type diagnostics without leaking payload bodies`
3. `publishes unsupported schema-format diagnostics without changing routing coverage`

The next executor should use the focused command above as the first feedback loop, then implement the fixture-backed `unverifiable-headers` path in the parser/test surfaces before refreshing the coverage/report/CLI expectations.

## Deviations

- Context-budget wrap-up interrupted execution before any product-code changes were landed.
- No authored `schema-header-unverifiable-v3.yaml` fixture was created in this unit.
- No task-plan implementation steps were completed beyond reading, tracing, and capturing the failing verification surface.

## Known Issues

- The real AsyncAPI fixture path for `unverifiable-headers` is still unresolved.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` still encodes the previous broad header-unverifiable contract and is the only failing file in the focused pre-edit suite.
- Public tests in report/CLI/gate areas still contain in-memory contract mutation helpers that should be replaced or narrowed once the truthful fixture-backed path exists.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S03/tasks/T01-SUMMARY.md` — durable wrap-up summary with failing verification evidence and resume notes.
