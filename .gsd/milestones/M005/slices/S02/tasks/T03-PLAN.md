---
estimated_steps: 4
estimated_files: 4
---

# T03: Compose the final M005 async acceptance runner and close R048

**Slice:** S02 — CI-Grade Async Acceptance And Diagnostics
**Milestone:** M005

## Description

Assemble the final proof surface for the milestone. This task turns the already-authored S01 verifiers and M004 live Kafka proofs into one stage-labeled M005 acceptance command, locks its order with a contract test, and then updates the milestone/requirement tracking once the composed proof stack is actually green.

## Steps

1. Create `scripts/ci/verify-m005-s02-async-acceptance.sh` using the established `run_stage()` pattern so it composes `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` with stable stage labels.
2. Add `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` to assert the delegated command order and to reject any future attempt to inline or duplicate the proof logic.
3. Run the composed verifier after T01/T02 land, fixing only truthful composition drift that it reveals rather than re-implementing lower-level checks.
4. Update `.gsd/REQUIREMENTS.md` and `.gsd/milestones/M005/M005-ROADMAP.md` so R048 and S02 reflect the now-proven acceptance surface.

## Must-Haves

- [ ] The new acceptance runner only composes the existing S01 and M004 verifiers; it does not copy their assertions into a second runtime truth surface.
- [ ] Stage labels and delegated-command order are stable and contract-tested.
- [ ] The final verification command proves public async boundary truth and live Kafka analyzer truth in one rerunnable path.
- [ ] `.gsd/REQUIREMENTS.md` and `M005-ROADMAP.md` stop describing R048/S02 as incomplete once the proof is green.

## Verification

- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `git diff --check`

## Observability Impact

- Signals added/changed: stable stage labels for the final acceptance run and one top-level command that immediately shows whether drift is in S01 docs, single-service raw evidence, or two-service live proof/diagnostics.
- How a future agent inspects this: run `bash scripts/ci/verify-m005-s02-async-acceptance.sh` and follow the named failing stage to the delegated verifier already responsible for that boundary.
- Failure state exposed: exact failing stage plus the delegated verifier output, without ambiguity about whether the breakage is documentation drift, metadata propagation drift, or live Kafka analyzer drift.

## Inputs

- `scripts/docs/verify-m005-s01-async-path.sh` — authoritative S01 discoverability verifier to compose directly.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — authoritative S01 boundary/support verifier to compose directly.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative runtime proof scripts that must remain the only Kafka proof logic.
- `.gsd/milestones/M005/slices/S02/tasks/T02-PLAN.md` — CI diagnostics surfaces that should already be in place before final acceptance is declared.

## Expected Output

- `scripts/ci/verify-m005-s02-async-acceptance.sh` — final stage-labeled M005 acceptance command.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — contract tests for stage order and delegated proof composition.
- `.gsd/REQUIREMENTS.md` — R048 updated to reflect validated completion once the composed proof passes.
- `.gsd/milestones/M005/M005-ROADMAP.md` — S02 marked complete after the final acceptance surface is green.
