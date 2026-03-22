---
id: T03
parent: S07
milestone: M002
provides:
  - A real clone-local root `AGENTS.md` now exists in this repository and stays outside tracked state through the repo-local admin exclude rule.
  - S07 is fully proved: tracked/public surfaces stay silent via verifier checks, while Git now reports the root `AGENTS.md` as ignored and untracked.
key_files:
  - AGENTS.md
  - $(git rev-parse --git-path info/exclude)
  - .gsd/PROJECT.md
  - .gsd/milestones/M002/M002-ROADMAP.md
  - .gsd/milestones/M002/slices/S07/S07-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Kept the local root `AGENTS.md` derived from the tracked maintainer contract and proved it only with repo-local Git diagnostics, without copying any local instructions into tracked repo surfaces.
patterns_established:
  - Clone-local AGENTS proof = resolved `info/exclude` path + anchored `/AGENTS.md` rule + root file present + `git check-ignore -v` / `git status --ignored --short` / `git ls-files` verification.
observability_surfaces:
  - git rev-parse --git-path info/exclude
  - git check-ignore -v AGENTS.md
  - git status --ignored --short AGENTS.md
  - git ls-files | rg '(^|/)AGENTS\.md$'
  - bash scripts/docs/verify-s07-local-agent.sh
  - bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh
  - git diff --check
duration: 20m
verification_result: passed
completed_at: 2026-03-13 02:40:46 +0300
blocker_discovered: false
---

# T03: Bootstrap and prove the local root AGENTS contract in this clone

**Bootstrapped the clone-local root `AGENTS.md`, proved it is ignored via the repo-local admin exclude path, and closed S07 with the full verifier stack green.**

## What Happened

Resolved the repo-local admin exclude file with `git rev-parse --git-path info/exclude` instead of hardcoding `.git/info/exclude`, then appended the anchored `/AGENTS.md` rule because this clone still had only the stock exclude file content.

The root `AGENTS.md` did not exist yet, so I created a new local-only maintainer contract derived from the tracked S07 workflow and the repo’s current GSD execution pattern. The file is intentionally omitted from this summary; the important part is that it stays local-only, contains no secrets/private prompt dumps/personal environment notes, and now exists at the repo root for maintainer use.

After the local bootstrap, I ran the Git proof commands for the real clone-local behavior. `git check-ignore -v AGENTS.md` reported the resolved exclude file and anchored `/AGENTS.md` match, `git status --ignored --short AGENTS.md` returned `!! AGENTS.md`, and `git ls-files` still showed no tracked `AGENTS.md` anywhere in the repo.

Because this completed S07, I also updated the milestone-level planning surfaces that still treated the slice as open: marked T03 complete in `S07-PLAN.md`, marked S07 complete in `M002-ROADMAP.md`, refreshed `.gsd/PROJECT.md` so the project snapshot no longer describes the local-agent boundary as unfinished work, and updated `.gsd/STATE.md` to point at post-S07 roadmap reassessment before S08.

## Verification

Passed:

- `git rev-parse --git-path info/exclude` → resolved the repo-local exclude file for this clone.
- `git check-ignore -v AGENTS.md` → reported `.git/info/exclude` with the anchored `/AGENTS.md` rule.
- `git status --ignored --short AGENTS.md | rg '^!! AGENTS\.md$'`
- `test -z "$(git ls-files | rg '(^|/)AGENTS\.md' || true)"`
- `bash scripts/docs/verify-s07-local-agent.sh`
- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- `git diff --check`

Observed outcome: the clone now keeps `AGENTS.md` available locally while tracked/public repo surfaces remain unchanged except for the expected planning/state updates.

## Diagnostics

To inspect this task later without opening the local file contents:

- `git rev-parse --git-path info/exclude` — shows the repo-local admin exclude path for the current clone/worktree layout.
- `git check-ignore -v AGENTS.md` — shows the exact ignore file and matching pattern.
- `git status --ignored --short AGENTS.md` — should return `!! AGENTS.md` while the file remains local-only.
- `git ls-files | rg '(^|/)AGENTS\.md$'` — should return nothing; any output means the local-only boundary was broken.
- `bash scripts/docs/verify-s07-local-agent.sh` — confirms the tracked/public boundary still holds.
- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh` — confirms adjacent trust/navigation surfaces still match their contracts.

## Deviations

- Updated `.gsd/milestones/M002/M002-ROADMAP.md` and `.gsd/PROJECT.md` in addition to the task-plan/state artifacts because T03 closes S07 and both files still described the slice as open work.
- Added `.gsd/milestones/M002/slices/S07/S07-SUMMARY.md` during this unit so S07 closes with the standard slice-summary artifact instead of leaving a later doctor-placeholder cleanup task.

## Known Issues

none

## Files Created/Modified

- `AGENTS.md` — created the real local-only maintainer instruction file at the repo root without publishing its contents into tracked repo surfaces.
- `$(git rev-parse --git-path info/exclude)` — added the anchored `/AGENTS.md` repo-local ignore rule.
- `.gsd/PROJECT.md` — updated the living project snapshot to reflect that the trust surfaces and local-only maintainer agent workflow are now in place.
- `.gsd/milestones/M002/M002-ROADMAP.md` — marked S07 complete now that the clone-local proof has passed.
- `.gsd/milestones/M002/slices/S07/S07-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — moved the quick-glance state to post-S07 roadmap reassessment before S08.
- `.gsd/milestones/M002/slices/S07/S07-SUMMARY.md` — added the compressed slice handoff so S07 closes with the standard summary artifact.
- `.gsd/milestones/M002/slices/S07/tasks/T03-SUMMARY.md` — recorded the implementation and proof results for this task.
