# M006: Runtime Delivery Hardening And Public Repo Hygiene

**Vision:** Restore trust in Yanote’s public delivery surfaces by fixing the broken compose/demo runtime path, moving delivery-sensitive proof closer to merge, and cleaning tracked technical artifact trees out of the default branch without breaking docs or trust surfaces.

## Success Criteria

- The public `run-v1-e2e.sh` proof path runs deterministically again and leaves inspectable artifacts.
- Delivery-sensitive proof runs earlier in CI without changing the stable required job names teams already depend on.
- Private maintainer/runtime trees are no longer tracked on the public branch, and docs still point readers to the correct supported surfaces.

## Key Risks / Unknowns

- Runtime proof and public docs can drift apart even when analyzer code is healthy. — The milestone needed live runtime proof, not only static cleanup.
- Cleaning tracked artifact trees can silently break public entry paths. — Repo hygiene had to be coordinated with docs and proof scripts.

## Proof Strategy

- Public runtime truth risk → retire in S01 by proving the demo/runtime path works again end to end through `run-v1-e2e.sh`.
- CI topology/trust risk → retire in S02 by proving delivery-sensitive verification moves earlier without destabilizing required check names.
- Public repo boundary drift risk → retire in S03 by proving tracked private/runtime trees are removed while docs and trust surfaces remain truthful.

## Verification Classes

- Contract verification: workflow and release contract tests under `scripts/ci/*.test.mjs` and `scripts/release/*.test.mjs`
- Integration verification: `bash scripts/ci/run-v1-e2e.sh`
- Operational verification: GitHub Actions `yanote-ci` run `23319759762` and release run `23320033592`
- UAT / human verification: verify public docs and repo surfaces still describe the supported entry path truthfully after cleanup

## Milestone Definition of Done

This milestone is complete only when all are true:

- the public runtime/demo proof path is deterministic again
- CI runs delivery-sensitive proof early enough to matter without renaming the stable required jobs
- tracked private/runtime residue is removed from the default branch
- public docs and trust surfaces still align with the actual public entry path after cleanup
- the final integrated runtime and repo-boundary acceptance checks pass

## Requirement Coverage

- Covers: `R003`, `R004`
- Partially covers: none
- Leaves for later: analyzer semantic expansion work in later milestones
- Orphan risks: none

## Slices

- [x] **S01: Demo Runtime Truth And Jar Resolution** `risk:high` `depends:[]`
  > After this: the public `run-v1-e2e.sh` path produces a deterministic retained proof bundle again instead of a flaky demo story.
- [x] **S02: Merge-Gate And Contract Execution Hardening** `risk:medium` `depends:[S01]`
  > After this: delivery-sensitive verification runs earlier in CI while the stable required job names stay intact.
- [x] **S03: Public Repo Artifact Boundary Cleanup** `risk:medium` `depends:[S01,S02]`
  > After this: the default branch no longer tracks private maintainer/runtime trees and the docs still point to the right supported public surfaces.

## Boundary Map

### S01 → S02

Produces:
- deterministic `run-v1-e2e.sh` runtime proof path and retained public proof artifacts
- corrected runtime/jar resolution assumptions for the public demo path

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- stable CI topology where delivery-sensitive proof runs earlier without changing required job names
- contract tests that pin the expected workflow shape

Consumes:
- S01 deterministic runtime proof path
