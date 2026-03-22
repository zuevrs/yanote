---
id: S07
parent: M002
milestone: M002
provides:
  - A verifier-backed maintainer-only workflow for a root `AGENTS.md` that stays local to each clone instead of becoming a tracked repo surface.
requires:
  - slice: S05
    provides: Maintainer-doc navigation and owner/backlink patterns that the S07 maintainer leaf reuses.
  - slice: S06
    provides: Public/trust-surface boundaries that S07 must preserve while adding the private maintainer workflow.
affects:
  - S08
key_files:
  - scripts/docs/verify-s07-local-agent.sh
  - docs/maintainers/local-agent-workflow.md
  - AGENTS.md
  - $(git rev-parse --git-path info/exclude)
  - .gsd/milestones/M002/M002-ROADMAP.md
  - .gsd/PROJECT.md
key_decisions:
  - Keep `AGENTS.md` local-only at the repo root, ignore it through the resolved repo-local `info/exclude` path with anchored `/AGENTS.md`, and split proof between tracked verifiers and clone-local Git diagnostics.
patterns_established:
  - S07 contract = tracked boundary verifier + maintainer-only leaf doc + clone-local Git proof commands, with no publication of local AGENTS contents.
observability_surfaces:
  - bash scripts/docs/verify-s07-local-agent.sh
  - bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh
  - git rev-parse --git-path info/exclude
  - git check-ignore -v AGENTS.md
  - git status --ignored --short AGENTS.md
  - git ls-files | rg '(^|/)AGENTS\.md$'
  - git diff --check
drill_down_paths:
  - .gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S07/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S07/tasks/T03-SUMMARY.md
duration: 75m
verification_result: passed
completed_at: 2026-03-13 02:40:46 +0300
---

# S07: Local Agent Development Contract

**Shipped a safe local-only root `AGENTS.md` workflow with tracked boundary verification, maintainer-only documentation, and a real clone-local ignore proof.**

## What Happened

S07 started by locking the public/private boundary first. T01 added `scripts/docs/verify-s07-local-agent.sh`, reusing the explicit shell-contract style from S05/S06 so the repo would fail closed on any tracked `AGENTS.md`, tracked `.gitignore` leakage, public-surface mentions of the local workflow, or missing maintainer-doc wiring.

T02 then added the tracked maintainer contract at `docs/maintainers/local-agent-workflow.md` and linked it from `docs/maintainers/README.md`. That leaf documents only the handling rules: resolve the repo-local exclude path with `git rev-parse --git-path info/exclude`, use anchored `/AGENTS.md`, prove the local state with `git check-ignore -v`, `git status --ignored --short AGENTS.md`, and `git ls-files`, and never publish secrets, private prompt content, local environment notes, or personal workflow notes into tracked surfaces.

T03 finished the slice by bootstrapping the real local proof in this clone: created the root `AGENTS.md` as a local-only maintainer artifact, added `/AGENTS.md` to the resolved repo-local exclude file, proved that Git now reports the file as ignored and untracked, and reran the tracked verifier stack. Because the slice was now complete, the milestone roadmap and living project snapshot were updated so they no longer describe the local-agent workflow as unfinished work.

## Verification

Across the slice, the following checks passed in the final tree:

- `bash scripts/docs/verify-s07-local-agent.sh`
- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- `git rev-parse --git-path info/exclude`
- `git check-ignore -v AGENTS.md`
- `git status --ignored --short AGENTS.md | rg '^!! AGENTS\.md$'`
- `test -z "$(git ls-files | rg '(^|/)AGENTS\.md' || true)"`
- `git diff --check`

The final operational proof is real rather than inferred: this clone now has a root `AGENTS.md`, Git names the exact ignore file/pattern that hides it, `git status` shows it as ignored, and `git ls-files` confirms it never entered tracked state.

## Requirements Advanced

- R031 — Added the tracked maintainer contract, boundary verifier, and clone-local bootstrap/proof flow for a local-only root `AGENTS.md`.

## Requirements Validated

- R031 — Validated in this clone with `bash scripts/docs/verify-s07-local-agent.sh`, `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, and `git ls-files` returning no tracked `AGENTS.md`.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Updated `.gsd/milestones/M002/M002-ROADMAP.md` and `.gsd/PROJECT.md` during T03 because the slice completed and both files still described S07 as open work.
- Added the real `S07-SUMMARY.md` now instead of relying on a later recovery placeholder; earlier M002 slices showed that missing slice summaries become avoidable cleanup work.

## Known Limitations

- New clones still need the local bootstrap step from `docs/maintainers/local-agent-workflow.md`; the repo can machine-check tracked boundaries, but it cannot auto-prove another maintainer’s local `info/exclude` state.
- `git add -f AGENTS.md` could still force the file into the index, so the operational proof must always include `git ls-files`, not just ignore-status checks.
- S08 still needs to rerun the full concept → recorder → analyzer journey with the S07 proof commands included in the final milestone acceptance pass.

## Follow-ups

- Start S08 and rerun the user journey from the docs, including the S07 public-boundary verifier plus the local `AGENTS.md` proof commands in the final acceptance set.

## Files Created/Modified

- `scripts/docs/verify-s07-local-agent.sh` — added the tracked boundary verifier for the local-agent workflow.
- `docs/maintainers/local-agent-workflow.md` — added the maintainer-only leaf describing the safe handling contract and proof commands.
- `docs/maintainers/README.md` — wired the maintainer leaf into the existing maintainer owner map.
- `AGENTS.md` — created the real local-only maintainer instruction file at the repo root.
- `$(git rev-parse --git-path info/exclude)` — added the anchored `/AGENTS.md` ignore rule for this clone.
- `.gsd/milestones/M002/M002-ROADMAP.md` — marked S07 complete.
- `.gsd/PROJECT.md` — updated the living project snapshot to reflect that the local-agent workflow and trust surfaces are now in place.
- `.gsd/milestones/M002/slices/S07/S07-SUMMARY.md` — recorded the compressed slice handoff.

## Forward Intelligence

### What the next slice should know
- The S07 verifier proves only tracked/public boundaries; the actual root-file proof remains clone-local and must be rerun with Git diagnostics in the active working clone.

### What's fragile
- The local-only boundary depends on repo-local Git admin state, not tracked files — if `info/exclude` is reset or the file is force-added, the workflow breaks silently unless the proof commands are rerun.

### Authoritative diagnostics
- `git check-ignore -v AGENTS.md` plus `git ls-files | rg '(^|/)AGENTS\.md$'` — together they prove both halves of the contract: the ignore rule is active and the file is still outside tracked state.

### What assumptions changed
- A tracked verifier alone would be enough to prove the contract — in practice the slice needed a split proof model because tracked automation cannot truthfully assert clone-local `info/exclude` state.
