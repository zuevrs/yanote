---
estimated_steps: 5
estimated_files: 2
---

# T03: Bootstrap and prove the local root AGENTS contract in this clone

**Slice:** S07 — Local Agent Development Contract
**Milestone:** M002

## Description

Finish S07 by exercising the clone-local part that no tracked verifier can prove on its own. This task bootstraps the repo-local Git ignore rule, creates or updates the real root `AGENTS.md`, and demonstrates that maintainers can keep local agent instructions available without publishing them into tracked repo state.

## Steps

1. Resolve the correct repo-local admin exclude path with `git rev-parse --git-path info/exclude` instead of hardcoding `.git/info/exclude`, so the contract remains valid for linked-worktree layouts.
2. Append anchored `/AGENTS.md` to the resolved exclude file if it is missing, avoiding broader patterns that would ignore nested files with the same name.
3. Create or update the local root `AGENTS.md` with maintainer-safe instructions derived from the tracked contract and current repo workflow, while excluding secrets, private prompt dumps, or personal environment notes.
4. Prove the local behavior with `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, and `git ls-files`, confirming the file is ignored and absent from tracked state.
5. Re-run `bash scripts/docs/verify-s07-local-agent.sh` and `git diff --check`, then leave the clone with the local file available but still untracked.

## Must-Haves

- [ ] The repo-local admin exclude file resolved via `git rev-parse --git-path info/exclude` contains anchored `/AGENTS.md`, and `AGENTS.md` exists at the repo root as a local-only artifact.
- [ ] Git proves the file is ignored and untracked (`git check-ignore -v`, `git status --ignored --short AGENTS.md`, `git ls-files`), and the tracked S07 verifier still passes afterward.

## Verification

- `git check-ignore -v AGENTS.md`
- `git status --ignored --short AGENTS.md | rg '^!! AGENTS\.md$'`
- `test -z "$(git ls-files | rg '(^|/)AGENTS\.md' || true)"`
- `bash scripts/docs/verify-s07-local-agent.sh && git diff --check`

## Observability Impact

- Signals added/changed: Git’s ignore diagnostics become the operational signal for the local-only contract; no new app/runtime logging is introduced.
- How a future agent inspects this: run `git rev-parse --git-path info/exclude`, `git check-ignore -v AGENTS.md`, and `git status --ignored --short AGENTS.md` in the active clone.
- Failure state exposed: the exact ignore file/pattern is shown when the rule works, and tracked-state leakage becomes visible immediately through `git ls-files` or `git status` output.

## Inputs

- `.gsd/milestones/M002/slices/S07/S07-RESEARCH.md` — records why the ignore rule belongs in repo-local `info/exclude` and why the proof must be split from tracked verification.
- `.gsd/DECISIONS.md` — locks the choice that `AGENTS.md` stays local-only and untracked.
- `docs/maintainers/local-agent-workflow.md` — tracked maintainer contract created in T02 that this local bootstrap follows.
- `scripts/docs/verify-s07-local-agent.sh` — tracked verifier that must still pass after the local file is present.
- `T02 completion` — the maintainer doc and map wiring must exist before the clone-local bootstrap can be considered fully documented and stable.

## Expected Output

- `AGENTS.md` — real local-only maintainer instruction file at the repo root, present in the clone but not tracked.
- `$(git rev-parse --git-path info/exclude)` — repo-local Git admin ignore file updated with anchored `/AGENTS.md`.
