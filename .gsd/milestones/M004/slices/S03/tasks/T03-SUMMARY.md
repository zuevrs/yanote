---
id: T03
parent: S03
milestone: M004
provides:
  - Merge-blocking CI execution of the composed S03 live Kafka proof stack under the existing `build-and-test` required check, with workflow contract coverage for placement and job-topology drift
key_files:
  - .github/workflows/yanote-ci.yml
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .gsd/STATE.md
  - .gsd/milestones/M004/slices/S03/S03-PLAN.md
key_decisions:
  - Keep the live Kafka proof stack in the existing `build-and-test` job, after JVM and analyzer prerequisites, instead of introducing a new required GitHub check name.
  - Extend the workflow contract test to pin both the live-proof step placement in `build-and-test` and the existing `build-and-test` → `yanote-validation` → `v1-e2e` dependency chain.
patterns_established:
  - Lock CI workflow placement with regex-backed contract tests that assert both step order and job dependency topology, not only the presence of job names.
observability_surfaces:
  - `.github/workflows/yanote-ci.yml` `build-and-test` step `Run live Kafka proof stack`
  - `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`
duration: 45m
verification_result: passed
completed_at: 2026-03-14T11:54:20+0300
blocker_discovered: false
---

# T03: Run the live Kafka proof stack inside the required CI workflow

**Promoted the composed S03 verifier into the existing `build-and-test` required CI job, locked that placement with workflow contract tests, and advanced the maintainer handoff beyond S03 execution.**

## What Happened

I updated `.github/workflows/yanote-ci.yml` so `build-and-test` now runs `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` immediately after the JVM test and analyzer-test prerequisites. This keeps the live Kafka proof merge-blocking without creating a new required job name or changing the existing branch-protection surface.

I extended `scripts/ci/yanote-ci-workflow.contract.test.mjs` in two ways. First, it now asserts that the live Kafka proof step exists inside `build-and-test` and appears after `Run JVM tests` and `Run analyzer tests`, so losing the step or moving it outside the required job fails locally. Second, it now asserts the existing workflow dependency chain (`yanote-validation` needs `build-and-test`, `v1-e2e` needs `yanote-validation`) so the frozen topology cannot drift silently while job names stay the same.

After the wiring and contract checks were green, I marked T03 complete in `.gsd/milestones/M004/slices/S03/S03-PLAN.md` and refreshed `.gsd/STATE.md` so the repo handoff no longer points at an unplanned S03 placeholder. The state now points to M004 closure and M005 follow-on planning from the completed S03 proof stack.

## Verification

Passed task-level verification:

- `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

Passed full slice-level verification:

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`
  - verified expected exit status `1`
  - verified retained artifacts plus structured async stderr (`YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE ...`)
- `git diff --check`

Observed signals directly:

- `.github/workflows/yanote-ci.yml` now exposes `Run live Kafka proof stack` under `build-and-test`
- retained `merge.log` still reports deterministic `ordered_inputs=...`
- retained producer/consumer JSONL files still show role-correct service attribution

## Diagnostics

Future agents can inspect this task via:

- `.github/workflows/yanote-ci.yml` — `build-and-test` now contains the explicit `Run live Kafka proof stack` phase
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — fails if the live-proof step disappears, moves out of `build-and-test`, or the dependency chain drifts
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` — reruns the same composed proof locally that CI now executes
- retained failure artifacts from `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`, especially:
  - `01-producer.events.jsonl` — producer-only HTTP + Kafka send evidence with `producer-role-service`
  - `02-consumer.events.jsonl` — consumer-only Kafka receive evidence with `consumer-role-service`
  - `merge.log` — deterministic `ordered_inputs=...` proof
  - `async-report.stderr` — structured gate failure shape (`YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE ...`)

## Deviations

- None.

## Known Issues

- None.

## Files Created/Modified

- `.github/workflows/yanote-ci.yml` — added the live Kafka proof stack step to the existing `build-and-test` required job.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — added assertions for the live-proof step placement and the frozen workflow dependency topology.
- `.gsd/milestones/M004/slices/S03/S03-PLAN.md` — marked T03 complete.
- `.gsd/milestones/M004/slices/S03/tasks/T03-SUMMARY.md` — recorded the task handoff, verification, and diagnostics.
- `.gsd/STATE.md` — advanced the maintainer handoff beyond S03 execution toward M004 closure and M005 planning.
