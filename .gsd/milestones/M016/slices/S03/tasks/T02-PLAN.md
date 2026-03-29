---
estimated_steps: 4
estimated_files: 6
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T02: Untrack clone-local planning and proof trees without deleting local state

**Slice:** S03 — Public repository boundary cleanup
**Milestone:** M016

## Description

Use the guard from T01 to remove tracked local-only trees from the public index while preserving the same files clone-locally. This task directly advances `R041`: `.gsd/**`, `.tmp/**`, `.tmp-*`, and `.vite/**` should stop being part of public git state, while maintainer docs explain that those surfaces remain local and how to verify the boundary.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git rm --cached` on local-only trees | Stop immediately and verify working-copy files still exist locally; never destroy clone-local state | Treat as partial cleanup and inspect staged deletions before retrying | Reject commands that leave mixed tracked and ignored copies of the same tree |
| maintainer workflow docs | Fail closed if they still imply `.gsd` or proof residue belongs in the public branch | N/A | Reject wording that hides how to inspect clone-local state after untracking |
| `scripts/docs/verify-s03-public-artifact-boundary.sh` and `scripts/docs/verify-s07-local-agent.sh` | Keep the task red until tracked inventory is empty and maintainer links are correct | N/A | Reject partial cleanup that passes one verifier but not the other |

## Load Profile

- **Shared resources**: the git index, ignored working-tree roots, and maintainer workflow docs.
- **Per-operation cost**: staged untracking plus a couple of doc edits and verifier reruns.
- **10x breakpoint**: inspecting partial staged deletions and mixed tracked/ignored state dominates before command execution cost matters.

## Negative Tests

- **Malformed inputs**: untracking commands that would delete local files instead of removing index entries only.
- **Error paths**: `.gsd`, `.tmp-m012-research-out`, `.tmp/m015-s03-combined-proof`, or `.vite/vitest/results.json` remain tracked after the cleanup.
- **Boundary conditions**: public git inventory is empty for those roots, while maintainer docs still explain clone-local AGENTS/GSD handling truthfully.

## Steps

1. Inventory representative tracked files under `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` and confirm T01's ignore rules are in place.
2. Remove those trees from git tracking with `--cached`/index-only cleanup so the local clone keeps using them privately.
3. Update maintainer workflow docs to say those trees are clone-local only and to keep the AGENTS/GSD boundary explicit.
4. Re-run the tracked-only boundary guard and the local-agent verifier before handing off.

## Must-Haves

- [ ] Tracked inventory under `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` is empty after the task.
- [ ] The cleanup preserves working-copy files for the current clone instead of deleting them.
- [ ] Maintainer docs explain the new clone-local boundary clearly enough for future agents to verify it.

## Verification

- Run `bash scripts/docs/verify-s03-public-artifact-boundary.sh`.
- Run `bash scripts/docs/verify-s07-local-agent.sh` and expect both verifiers to pass.

## Inputs

- `.gsd/PROJECT.md` — representative tracked GSD root file that must leave public git state.
- `.gsd/REQUIREMENTS.md` — representative tracked GSD contract file that will stay clone-local only.
- `.gsd/DECISIONS.md` — representative tracked GSD decision log currently visible in public git state.
- `.tmp-m012-research-out/yanote-report.json` — representative tracked temp proof artifact that should become local-only.
- `.tmp/m015-s03-combined-proof/artifact-manifest.txt` — representative tracked combined proof artifact that should become local-only.
- `.vite/vitest/results.json` — representative tracked tool-cache artifact that should become local-only.
- `docs/maintainers/README.md` — maintainer owner map that must still point to the surviving private workflow docs.
- `docs/maintainers/local-agent-workflow.md` — maintainer leaf describing clone-local AGENTS and git-admin boundaries.

## Expected Output

- `docs/maintainers/README.md` — maintainer map updated for the post-untracking local-only boundary.
- `docs/maintainers/local-agent-workflow.md` — local workflow doc updated so GSD/proof roots are explicitly clone-local.
- `.gsd/PROJECT.md` — removed from tracked public git state while remaining available clone-locally.
- `.tmp-m012-research-out/yanote-report.json` — removed from tracked public git state while remaining available clone-locally.
- `.tmp/m015-s03-combined-proof/artifact-manifest.txt` — removed from tracked public git state while remaining available clone-locally.
- `.vite/vitest/results.json` — removed from tracked public git state while remaining available clone-locally.
