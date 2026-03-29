---
id: T01
parent: S05
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/docs/verify-m016-s05-public-surface.sh", "scripts/docs/verify-m016-s05-public-surface.contract.test.mjs", "docs/maintainers/public-surface-proof.md", "docs/maintainers/README.md", "scripts/docs/verify-s05-navigation.sh"]
key_decisions: ["Delegate the final S05 acceptance path to existing S02-S04 proof owners under stable S05 stage labels instead of duplicating assertions.", "Enforce the rerun contract with both a fixture-free source contract test and a maintainer-only navigation leaf so stage order, command text, and discoverability drift together."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-level verification passed with bash -n scripts/docs/verify-m016-s05-public-surface.sh, node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, and bash scripts/docs/verify-s05-navigation.sh. The integrated slice-level proof bash scripts/docs/verify-m016-s05-public-surface.sh was also executed and passed stages S05-01 through S05-10 before failing at the first real downstream drift, S05-11 (node --test scripts/ci/run-v1-e2e.contract.test.mjs), which confirms the new orchestration localizes failures correctly instead of masking them. git diff --check was not run because this auto-mode execution explicitly forbade direct git commands."
completed_at: 2026-03-29T02:53:55.548Z
blocker_discovered: false
---

# T01: Added the stage-labeled S05 public-surface verifier, its contract test, and a maintainer-only rerun leaf.

> Added the stage-labeled S05 public-surface verifier, its contract test, and a maintainer-only rerun leaf.

## What Happened
---
id: T01
parent: S05
milestone: M016
key_files:
  - scripts/docs/verify-m016-s05-public-surface.sh
  - scripts/docs/verify-m016-s05-public-surface.contract.test.mjs
  - docs/maintainers/public-surface-proof.md
  - docs/maintainers/README.md
  - scripts/docs/verify-s05-navigation.sh
key_decisions:
  - Delegate the final S05 acceptance path to existing S02-S04 proof owners under stable S05 stage labels instead of duplicating assertions.
  - Enforce the rerun contract with both a fixture-free source contract test and a maintainer-only navigation leaf so stage order, command text, and discoverability drift together.
duration: ""
verification_result: mixed
completed_at: 2026-03-29T02:53:55.549Z
blocker_discovered: false
---

# T01: Added the stage-labeled S05 public-surface verifier, its contract test, and a maintainer-only rerun leaf.

**Added the stage-labeled S05 public-surface verifier, its contract test, and a maintainer-only rerun leaf.**

## What Happened

Added the new S05 top-level public-surface verifier as a fail-closed shell orchestrator that emits stable S05-0N labels and exact delegated command echoes while reusing the existing S02-S04 proof owners. Added a fixture-free node:test contract that pins the stage order, delegated commands, maintainer references, and the rule that the new rerun leaf stays out of public onboarding docs. Created docs/maintainers/public-surface-proof.md to document the canonical rerun command, the ordered stage list, and the retained release diagnostics surfaces, then linked it from docs/maintainers/README.md and tightened scripts/docs/verify-s05-navigation.sh so the new maintainer leaf is required and leak-free.

## Verification

Task-level verification passed with bash -n scripts/docs/verify-m016-s05-public-surface.sh, node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, and bash scripts/docs/verify-s05-navigation.sh. The integrated slice-level proof bash scripts/docs/verify-m016-s05-public-surface.sh was also executed and passed stages S05-01 through S05-10 before failing at the first real downstream drift, S05-11 (node --test scripts/ci/run-v1-e2e.contract.test.mjs), which confirms the new orchestration localizes failures correctly instead of masking them. git diff --check was not run because this auto-mode execution explicitly forbade direct git commands.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/docs/verify-m016-s05-public-surface.sh` | 0 | ✅ pass | 5ms |
| 2 | `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` | 0 | ✅ pass | 296ms |
| 3 | `bash scripts/docs/verify-s05-navigation.sh` | 0 | ✅ pass | 179ms |
| 4 | `bash scripts/docs/verify-m016-s05-public-surface.sh` | 1 | ❌ fail | 127700ms |


## Deviations

Verification used an absolute script path once because async_bash launched from the parent repo root instead of the active GSD worktree. The shipped maintainer command remains the planned repo-relative bash scripts/docs/verify-m016-s05-public-surface.sh.

## Known Issues

The integrated proof currently stops at S05-11 because scripts/ci/run-v1-e2e.sh and examples/docker-compose.yml have not yet been aligned to the standalone analyzer launcher contract expected by scripts/ci/run-v1-e2e.contract.test.mjs. This is downstream slice work, not a plan-invalidating blocker.

## Files Created/Modified

- `scripts/docs/verify-m016-s05-public-surface.sh`
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `docs/maintainers/public-surface-proof.md`
- `docs/maintainers/README.md`
- `scripts/docs/verify-s05-navigation.sh`


## Deviations
Verification used an absolute script path once because async_bash launched from the parent repo root instead of the active GSD worktree. The shipped maintainer command remains the planned repo-relative bash scripts/docs/verify-m016-s05-public-surface.sh.

## Known Issues
The integrated proof currently stops at S05-11 because scripts/ci/run-v1-e2e.sh and examples/docker-compose.yml have not yet been aligned to the standalone analyzer launcher contract expected by scripts/ci/run-v1-e2e.contract.test.mjs. This is downstream slice work, not a plan-invalidating blocker.
