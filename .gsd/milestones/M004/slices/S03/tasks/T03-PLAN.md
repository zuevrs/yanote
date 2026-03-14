---
estimated_steps: 3
estimated_files: 4
---

# T03: Run the live Kafka proof stack inside the required CI workflow

**Slice:** S03 — Live Multi-Service Kafka Proof Stack
**Milestone:** M004

## Description

Promote the composed S03 live Kafka verifier from a local-only script to a merge-blocking CI surface by running it inside the existing `build-and-test` job, then lock that wiring with workflow contract tests and refresh the maintainer state handoff.

## Steps

1. Extend `.github/workflows/yanote-ci.yml` so the existing `build-and-test` job runs `scripts/ci/verify-m004-s03-live-kafka-proof.sh` after its JVM and analyzer prerequisites without introducing a new required job name.
2. Update `scripts/ci/yanote-ci-workflow.contract.test.mjs` to assert that the live Kafka proof step exists in `build-and-test` and that the frozen required-check topology stays unchanged.
3. Refresh `.gsd/STATE.md` after the verifier is wired and green so the active-state handoff points beyond S03 planning and toward milestone completion / M005 follow-on work.

## Must-Haves

- [ ] The live Kafka proof stack runs in an existing required CI job, not a new branch-protection surface.
- [ ] Workflow contract tests fail if the live Kafka proof step disappears or required job names change.
- [ ] The maintainer handoff state no longer points at an unplanned S03 placeholder once the slice lands.

## Verification

- `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals added/changed: required CI logs now include an explicit live Kafka proof phase under `build-and-test`.
- How a future agent inspects this: run the workflow contract test locally, then inspect the `build-and-test` job log or rerun the verifier script locally for identical proof steps.
- Failure state exposed: lost CI wiring, job-topology drift, or a local-only async proof regression becomes visible before merge instead of after release.

## Inputs

- `.gsd/milestones/M004/slices/S03/tasks/T02-PLAN.md` — composed live Kafka verifier that CI must run unchanged.
- `.github/workflows/yanote-ci.yml` — current required-check topology with frozen `build-and-test` and `yanote-validation` job names.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — current workflow contract owner for required-check topology and validation wiring.

## Expected Output

- `.github/workflows/yanote-ci.yml` — `build-and-test` runs the live Kafka proof stack.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — contract coverage for the S03 proof step while keeping required job names frozen.
- `.gsd/STATE.md` — updated slice/milestone handoff after S03 execution.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — CI-consumed verifier entrypoint.
