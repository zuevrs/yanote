---
id: T02
parent: S04
milestone: M015
provides: []
requires: []
affects: []
key_files: [".github/workflows/yanote-ci.yml", "scripts/ci/yanote-ci-workflow.contract.test.mjs", ".github/BRANCH_PROTECTION.md", "scripts/ci/render-yanote-summary.test.mjs", ".gsd/milestones/M015/slices/S04/tasks/T02-SUMMARY.md"]
key_decisions: ["Kept `build-and-test` as the stable required job and widened it in-place with Kafka, RabbitMQ, and combined proof steps instead of creating new merge-blocking job names.", "Published Kafka, RabbitMQ, and combined summaries from collected artifact bundle paths so CI stays fail-closed while preserving the HTTP-vs-async split."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` passed after updating the stale async renderer expectations. `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` passed after widening the workflow contract and branch-protection wording to Kafka + RabbitMQ + combined proof coverage."
completed_at: 2026-03-26T22:47:57.597Z
blocker_discovered: false
---

# T02: Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.

> Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.

## What Happened
---
id: T02
parent: S04
milestone: M015
key_files:
  - .github/workflows/yanote-ci.yml
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .github/BRANCH_PROTECTION.md
  - scripts/ci/render-yanote-summary.test.mjs
  - .gsd/milestones/M015/slices/S04/tasks/T02-SUMMARY.md
key_decisions:
  - Kept `build-and-test` as the stable required job and widened it in-place with Kafka, RabbitMQ, and combined proof steps instead of creating new merge-blocking job names.
  - Published Kafka, RabbitMQ, and combined summaries from collected artifact bundle paths so CI stays fail-closed while preserving the HTTP-vs-async split.
duration: ""
verification_result: passed
completed_at: 2026-03-26T22:47:57.597Z
blocker_discovered: false
---

# T02: Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.

**Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.**

## What Happened

Reproduced the failing verification gate first and confirmed the immediate regression was stale async renderer expectations, not broken renderer logic. Updated `scripts/ci/render-yanote-summary.test.mjs` so the widened async summaries now expect the new `protocols` line. Then widened `.github/workflows/yanote-ci.yml` inside the existing `build-and-test` job: Kafka proof stays first, RabbitMQ proof runs next, combined proof runs after that, each proof step records an exit code, artifact collection still runs on `always()`, three summaries are rendered from the collected artifact bundle paths, and the terminal enforcement step fails closed without renaming `build-and-test` or disturbing the separate HTTP validation job. Finally, updated the workflow contract suite and branch-protection documentation so the widened proof-step order, artifact paths, and required-check wording are mechanically pinned.

## Verification

`node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` passed after updating the stale async renderer expectations. `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` passed after widening the workflow contract and branch-protection wording to Kafka + RabbitMQ + combined proof coverage.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 288ms |
| 2 | `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 103ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.github/workflows/yanote-ci.yml`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `.github/BRANCH_PROTECTION.md`
- `scripts/ci/render-yanote-summary.test.mjs`
- `.gsd/milestones/M015/slices/S04/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
