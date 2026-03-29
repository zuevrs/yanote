---
id: T03
parent: S05
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/maintainers/release-signing.md", "scripts/docs/verify-s05-navigation.sh", "scripts/docs/verify-m016-s05-public-surface.contract.test.mjs", ".gsd/milestones/M016/slices/S05/tasks/T03-SUMMARY.md"]
key_decisions: ["D039: Require the local release-candidate proof before the final public-surface proof in the maintainer release workflow."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `bash scripts/docs/verify-m016-s05-public-surface.sh` and it passed all twelve delegated stages, including the retained release proof bundle under `.yanote-ci/m016-s02-release-pipeline-proof/`. Ran `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` and all three tests passed, including the new release-signing assertions. Ran `git diff --check` and it exited cleanly."
completed_at: 2026-03-29T03:10:35.121Z
blocker_discovered: false
---

# T03: Required both release-candidate and final public-surface proofs before pushing a real release tag.

> Required both release-candidate and final public-surface proofs before pushing a real release tag.

## What Happened
---
id: T03
parent: S05
milestone: M016
key_files:
  - docs/maintainers/release-signing.md
  - scripts/docs/verify-s05-navigation.sh
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
  - .gsd/milestones/M016/slices/S05/tasks/T03-SUMMARY.md
key_decisions:
  - D039: Require the local release-candidate proof before the final public-surface proof in the maintainer release workflow.
duration: ""
verification_result: passed
completed_at: 2026-03-29T03:10:35.122Z
blocker_discovered: false
---

# T03: Required both release-candidate and final public-surface proofs before pushing a real release tag.

**Required both release-candidate and final public-surface proofs before pushing a real release tag.**

## What Happened

Read the active state, slice/task plans, verifier, and maintainer surfaces first, then ran the composed S05 verifier as the primary evidence source. The live public-surface proof already passed end to end, including recorder runtime, analyzer archive/runtime, maintainer navigation, repo demo contract, and retained S02 release-pipeline proof. With the runtime/release composition confirmed, the remaining gap was maintainer workflow guidance: docs/maintainers/release-signing.md only required the local release-candidate proof before pushing a tag. Updated that leaf to require both proof gates in order, linked it to docs/maintainers/public-surface-proof.md, then tightened scripts/docs/verify-s05-navigation.sh and scripts/docs/verify-m016-s05-public-surface.contract.test.mjs so the release workflow contract now fails closed if either reference disappears or drifts out of order.

## Verification

Ran `bash scripts/docs/verify-m016-s05-public-surface.sh` and it passed all twelve delegated stages, including the retained release proof bundle under `.yanote-ci/m016-s02-release-pipeline-proof/`. Ran `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` and all three tests passed, including the new release-signing assertions. Ran `git diff --check` and it exited cleanly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-m016-s05-public-surface.sh` | 0 | ✅ pass | 188050ms |
| 2 | `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | 0 | ✅ pass | 370ms |
| 3 | `git diff --check` | 0 | ✅ pass | 65ms |


## Deviations

None. The live S05 verifier already passed, so no orchestrator or delegated-proof repairs were needed; the task closed by wiring the final gate into maintainer release workflow and enforcing that contract.

## Known Issues

None.

## Files Created/Modified

- `docs/maintainers/release-signing.md`
- `scripts/docs/verify-s05-navigation.sh`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `.gsd/milestones/M016/slices/S05/tasks/T03-SUMMARY.md`


## Deviations
None. The live S05 verifier already passed, so no orchestrator or delegated-proof repairs were needed; the task closed by wiring the final gate into maintainer release workflow and enforcing that contract.

## Known Issues
None.
