---
estimated_steps: 4
estimated_files: 5
---

# T03: Wire the async CLI/report path and prove HTTP non-regression

**Slice:** S03 — Separate Async Report And Gate Surface
**Milestone:** M003

## Description

Expose the separate async report/gate surface through a real CLI entry point, then close the slice with one proof stack that keeps the existing HTTP report path green and separate.

## Steps

1. Add a dedicated async CLI/report entry path that accepts AsyncAPI specs plus normalized async evidence and writes the async artifact separately from the HTTP report.
2. Wire async gate evaluation into that path with fail-closed exit behavior and deterministic summary output.
3. Re-run the existing HTTP report/coverage tests to prove the new async CLI path did not regress or blur the current HTTP surface.
4. Collapse S03 to one truthful proof command and refresh `STATE.md` so the next milestone starts from the real post-M003 state.

## Must-Haves

- [ ] The async report/gate path is reachable through a real CLI entry point.
- [ ] Async and HTTP report paths stay separate and both remain truthful.
- [ ] The final verifier proves async artifact output, async gate behavior, and HTTP non-regression together.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/report/report.test.ts src/coverage/asyncCoverage.test.ts src/coverage/coverage.test.ts`
- `git diff --check`

## Observability Impact

- Signals added/changed: separate async CLI summary/error output and deterministic async artifact path.
- How a future agent inspects this: run the full S03 verifier and inspect whether failures come from async report building, async gate evaluation, async CLI wiring, or HTTP non-regression.
- Failure state exposed: async CLI input errors, async semantic fail-closed exits, gate failures, or HTTP report drift.

## Inputs

- `yanote-js/src/cli.ts` — current HTTP CLI entry point.
- `yanote-js/src/report/asyncReport.ts` — async artifact builder from T02.
- `yanote-js/src/gates/asyncEvaluator.ts` — async gate evaluator from T02.
- `yanote-js/src/report/report.test.ts` — existing HTTP report baseline that must stay green.

## Expected Output

- `yanote-js/src/cli.ts` — async CLI/report entry path wired into the analyzer.
- `yanote-js/src/cli.async-report.test.ts` — async CLI behavior proof.
- `yanote-js/src/cli.async-report.contract.test.ts` — fail-closed contract proof for the separate async path.
- `.gsd/milestones/M003/slices/S03/S03-PLAN.md` — truthful final slice verifier command.
- `.gsd/STATE.md` — updated to reflect post-S03 reality.
