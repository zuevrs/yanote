# M002/S07 — Research

**Date:** 2026-03-12

## Summary

S07 primarily owns **R031** (local-only `AGENTS.md` contract for agent-assisted development). It does not need a new public product surface; it needs a safe maintainer-only contract that preserves the **R029/R030** boundaries already established in S05/S06. The repo is currently missing that contract entirely: there is **no tracked `AGENTS.md`**, no `AGENTS.md` ignore rule in tracked `.gitignore`, `.git/info/exclude` is still the default stock file, and the maintainer-only docs branch currently contains only `docs/maintainers/README.md` plus `release-signing.md`.

The good news is that the repo already has the right shape for S07. S05 created `docs/maintainers/README.md` as the owner map for maintainer-only workflow docs, and S03-S06 established a consistent shell-verifier pattern for repo-surface contracts. That means S07 can stay additive: keep the actual instructions local in a root `AGENTS.md`, document only the handling rules in a maintainer-only leaf doc, and lock the tracked boundary with a dedicated verifier.

The main implementation constraint is Git itself. Official Git docs put **repo-specific, unshared ignore rules** in `$GIT_DIR/info/exclude`, not in version-controlled `.gitignore` and not in global `core.excludesFile`. A temp-repo proof during this research confirmed two useful details: `git check-ignore -v AGENTS.md` cleanly reports the matching ignore rule from `.git/info/exclude`, and `git rev-parse --git-path info/exclude` remains the safe way to address that file even when a repository uses linked worktrees. One surprise: in a linked worktree, that path still resolves to the **shared repo admin dir**, so the S07 contract should describe the ignore as **repo-local**, not worktree-local.

## Recommendation

Implement S07 as a split **tracked contract + local operational proof**:

1. **Keep the real maintainer instructions in a local root file:** `/AGENTS.md`
   - Root placement matters because the requirement is explicitly about `AGENTS.md`, and future agent tooling is most likely to discover it there.
   - Do **not** create a tracked public `AGENTS.md` or a tracked surrogate at the repo root.

2. **Document only the handling rules in a maintainer-only leaf doc.**
   - Recommended tracked file: `docs/maintainers/local-agent-workflow.md`
   - Add it to `docs/maintainers/README.md` using the same audience/backlink pattern already used by `release-signing.md`.
   - The doc should explain:
     - `AGENTS.md` is local-only and must remain untracked
     - the ignore rule belongs in `$(git rev-parse --git-path info/exclude)`
     - the recommended pattern is anchored as `/AGENTS.md`
     - how to verify the rule with `git check-ignore -v AGENTS.md`
     - how to confirm the file is still untracked with `git ls-files | rg '(^|/)AGENTS\\.md$'`
   - The doc should **not** publish private prompt content, secrets, local environment notes, or personal workflow details.

3. **Add a tracked S07 verifier in the existing shell-contract style.**
   - Recommended file: `scripts/docs/verify-s07-local-agent.sh`
   - It should verify only what a clean clone can truthfully prove:
     - no tracked `AGENTS.md` anywhere in the repo
     - tracked `.gitignore` does **not** mention `AGENTS.md`
     - primary/public surfaces (`README.md`, `docs/README.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`) do not advertise the local agent workflow
     - `docs/maintainers/README.md` links to the new maintainer-only leaf
     - the new leaf contains the required commands/backlinks/boundary wording
   - It should **not** fail on missing local `.git/info/exclude` entries, because that state is intentionally untracked and clone-specific.

4. **Perform one real local proof in this repo as slice verification.**
   - Append `/AGENTS.md` to `$(git rev-parse --git-path info/exclude)` in the current clone.
   - Verify with `git check-ignore -v AGENTS.md`.
   - Optionally create and remove a temporary `AGENTS.md` to confirm ignored status via `git status --ignored --short AGENTS.md`.
   - Reconfirm there is still no tracked `AGENTS.md` with `git ls-files | rg '(^|/)AGENTS\\.md$'`.

This is the smallest truthful contract: the **file stays private**, the **handling stays explicit**, and the **tracked repo only exposes the minimum maintainer-only boundary needed to keep the workflow from drifting back into guesswork**.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Repo-specific ignore for one private maintainer file | `$GIT_DIR/info/exclude` via `git rev-parse --git-path info/exclude` | Git documents this as the home for repository-local, unshared ignore patterns, which matches S07 better than tracked `.gitignore` or global excludes. |
| Verifying that the ignore rule is really active | `git check-ignore -v AGENTS.md` | It reports the exact matching file and pattern, so the maintainer can prove the contract without guessing from `git status`. |
| Maintainer-only documentation placement | `docs/maintainers/README.md` + the existing leaf pattern from `docs/maintainers/release-signing.md` | S05 already established the owner-map/backlink style for maintainer docs. Reusing it avoids creating a new root-level surface. |
| Repo-surface drift detection | `scripts/docs/verify-s0x-*.sh` pattern (add `verify-s07-local-agent.sh`) | S03-S06 already use explicit shell verifiers to lock repo-surface contracts. S07 should follow that pattern instead of relying on memory or prose review. |

## Existing Code and Patterns

- `.gitignore` — tracked public ignore contract with narrow exceptions like `!dist/README.md`. That is a signal that tracked ignore rules are part of the public repo surface, which is why `AGENTS.md` should stay out of it.
- `.git/info/exclude` — currently untouched apart from default comments. This is the clean local-only slot for `/AGENTS.md`.
- `docs/maintainers/README.md` — existing owner map for maintainer-only workflow docs. It is the natural tracked home for a local-agent handling leaf.
- `docs/maintainers/release-signing.md` — reusable maintainer-leaf pattern: explicit audience label, ownership statement, and backlink to the maintainer map.
- `README.md` and `docs/README.md` — user-facing entry surfaces currently do **not** mention `AGENTS.md`. S07 should preserve that silence.
- `scripts/docs/verify-s06-trust-surfaces.sh` — current verifier model for explicit shell assertions over repo policy surfaces.
- `.gsd/PROJECT.md` and `.gsd/STATE.md` — both still call out the local-only maintainer agent workflow as one of the remaining M002 gaps, so S07 is clearly not redundant.
- `.gsd/milestones/M002/slices/S06/S06-ASSESSMENT.md` — already names the exact S07 gap: there is a boundary decision, but still no proven storage/ignore/bootstrap contract for `AGENTS.md` itself.

## Constraints

- S07 primarily owns **R031** and must preserve the S05/S06 boundaries for **R029** and **R030**: no new public onboarding surface, no product-facing root `AGENTS.md`, no support/community files that mention private maintainer workflow.
- The actual private file should stay at the **repo root** as `AGENTS.md`; moving it under `docs/`, `.gsd/`, or another path would weaken tool discoverability and drift from the stated requirement.
- Tracked verification and local operational proof are different things. A clean clone or CI run can verify the tracked boundary, but it cannot honestly prove that a maintainer’s local `.git/info/exclude` already contains `/AGENTS.md`.
- Git’s documented split is important here: `.gitignore` is for shared version-controlled ignore rules, `$GIT_DIR/info/exclude` is for repo-specific unshared rules, and `core.excludesFile` is for user-wide global rules.
- `git rev-parse --git-path info/exclude` is safer than hardcoding `.git/info/exclude`, because linked worktrees use a `.git` file instead of a `.git` directory.
- In linked worktrees, `git rev-parse --git-path info/exclude` resolves to the **shared repository admin directory**, so the ignore rule is repo-local across worktrees rather than isolated per worktree.
- The current environment uses Git `2.50.1`, and the recommended commands (`git rev-parse --git-path`, `git check-ignore -v`, `git worktree list`) are available here.

## Common Pitfalls

- **Adding `AGENTS.md` to tracked `.gitignore`** — that would publish the workflow into tracked repo state, which is exactly what S07 is meant to avoid.
- **Hardcoding `.git/info/exclude` in docs or scripts** — it works in the main worktree here, but it is the wrong abstraction once linked worktrees enter the picture. Use `git rev-parse --git-path info/exclude`.
- **Using a bare `AGENTS.md` ignore pattern** — that may ignore nested files with the same name anywhere in the repo. Prefer the anchored `/AGENTS.md` pattern unless nested agent files are explicitly desired.
- **Assuming ignore rules are enough protection** — `git add -f AGENTS.md` can still force the file into the index. The contract also needs an explicit `git ls-files` check and a verifier that rejects tracked `AGENTS.md` files.
- **Treating the tracked doc verifier as the whole proof** — S07 needs one real local proof too, otherwise the slice would still only describe the local workflow instead of proving it.
- **Letting maintainer-only workflow leak into user-facing docs** — the right tracked home is `docs/maintainers/`, not `README.md`, `docs/README.md`, or the root trust files.

## Open Risks

- There is a genuine tradeoff between **public discoverability of the handling rules** and **zero public mention of agent workflow**. My recommendation is a thin maintainer-only leaf doc with no private contents; hiding everything in local notes would weaken proof and future maintainability.
- Because `.git/info/exclude` is shared across linked worktrees, the contract is repository-local rather than worktree-local. That is good for consistency, but it would not support different AGENTS contracts per linked worktree.
- New clones will not inherit the local ignore rule. Without a clearly documented bootstrap command and a verification step, the workflow can drift back into “I thought it was ignored.”
- `.gsd` planning artifacts already mention `AGENTS.md`, so any S07 verifier must scope its “no public mention” checks carefully to user-facing and trust-facing surfaces rather than the entire repository.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Git / local ignore workflow | `github/awesome-copilot@git-commit` | available, low relevance — generic Git workflow skill only; install with `npx skills add github/awesome-copilot@git-commit` |
| Git ignore editing | `jeremylongshore/claude-code-plugins-plus-skills@gitignore-generator` | available, low relevance — about generating `.gitignore`, not the repo-local `.git/info/exclude` contract S07 needs; install with `npx skills add jeremylongshore/claude-code-plugins-plus-skills@gitignore-generator` |
| Developer agent workflow | none directly relevant found | searched skill catalogue; no high-signal skill specifically matched private `AGENTS.md` handling |
| Installed local skills | none directly relevant | `debug-like-expert`, `frontend-design`, `playwright-cli`, and `swiftui` are installed locally, but none are a direct fit for repo-local Git/admin contract work |

## Sources

- The repo still lacks an explicit local `AGENTS.md` contract, but it already has the right maintainer-only doc branch and verifier culture for S07 to extend. (source: [`docs/maintainers/README.md`](../../../../../docs/maintainers/README.md), [`docs/maintainers/release-signing.md`](../../../../../docs/maintainers/release-signing.md), [`scripts/docs/verify-s06-trust-surfaces.sh`](../../../../../scripts/docs/verify-s06-trust-surfaces.sh), [`.gsd/PROJECT.md`](../../../../../.gsd/PROJECT.md), [`.gsd/milestones/M002/slices/S06/S06-ASSESSMENT.md`](../S06/S06-ASSESSMENT.md))
- Tracked `.gitignore` is a curated public surface, `.git/info/exclude` is still untouched, and there is currently no tracked `AGENTS.md` anywhere in the repo. (source: [`../../../../../.gitignore`](../../../../../.gitignore), local `.git/info/exclude` inspection, local `git ls-files` / `git status --ignored` / repo search output during this slice)
- Git documents `.gitignore` for shared version-controlled ignore rules, `$GIT_DIR/info/exclude` for repo-specific unshared rules, and `core.excludesFile` for user-wide global rules. (source: [Git — gitignore Documentation](https://git-scm.com/docs/gitignore))
- Git documents `git check-ignore` as the inspection tool for ignore matches, which makes it the right verification command for the local contract. (source: [Git — git-check-ignore Documentation](https://git-scm.com/docs/git-check-ignore))
- Git worktree/config docs plus a temp-repo proof show why `git rev-parse --git-path info/exclude` is safer than hardcoding `.git/info/exclude`, and why the ignore should be described as repo-local across linked worktrees. (source: [Git — git-worktree Documentation](https://git-scm.com/docs/git-worktree), [Git — git-config Documentation](https://git-scm.com/docs/git-config), local temp-repo experiments run during this slice)
- A temp-repo proof also confirmed that adding `/AGENTS.md` to `.git/info/exclude` makes `git check-ignore -v AGENTS.md` report the exact matching rule and marks a real `AGENTS.md` as ignored in `git status --ignored`. (source: local temp-repo experiments run during this slice)
