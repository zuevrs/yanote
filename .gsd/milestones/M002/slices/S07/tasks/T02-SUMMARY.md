---
id: T02
parent: S07
milestone: M002
provides:
  - S07 maintainer-only AGENTS workflow leaf and owner-map wiring
key_files:
  - docs/maintainers/local-agent-workflow.md
  - docs/maintainers/README.md
key_decisions:
  - Kept the tracked S07 contract limited to handling rules, proof commands, and content boundaries; clone-local bootstrap remains a separate T03 proof step.
patterns_established:
  - Maintainer-only leaf docs can name local operational steps and exact verifier commands without turning private workflow contents into tracked repo surfaces.
observability_surfaces:
  - scripts/docs/verify-s07-local-agent.sh
  - bash scripts/docs/verify-s06-trust-surfaces.sh
  - bash scripts/docs/verify-s05-navigation.sh
  - git check-ignore -v AGENTS.md
  - git status --ignored --short AGENTS.md
  - git ls-files
duration: 30m
verification_result: passed
completed_at: 2026-03-12T23:35:59Z
blocker_discovered: false
---

# T02: Document and wire the maintainer-only AGENTS workflow

**Added the maintainer-only `local-agent-workflow.md` leaf, linked it from the maintainer map, and made the tracked S07/S06/S05 verifier stack pass without leaking the workflow onto public surfaces.**

## What Happened

Created `docs/maintainers/local-agent-workflow.md` as a Russian-first maintainer leaf following the existing audience/owner/backlink pattern. The new leaf documents the tracked part of the S07 contract only: the real file lives at the repo root as `AGENTS.md`, the ignore rule belongs in `$(git rev-parse --git-path info/exclude)`, the recommended pattern is anchored `/AGENTS.md`, and maintainers should prove the local state with `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, and `git ls-files`.

The content boundary is explicit in the leaf: tracked docs may describe handling rules, but they must not publish секреты, private prompt content, local environment notes, or personal workflow notes. Then `docs/maintainers/README.md` was updated to link the new leaf from the existing maintainer owner map.

Tracked verification passed after the wiring landed. The clone-local proof commands were also checked to establish current state for handoff: this clone still has no root `AGENTS.md` and no `/AGENTS.md` entry in the resolved `info/exclude`, so the local ignore/bootstrap proof remains correctly deferred to T03.

## Verification

Passed:

- `bash scripts/docs/verify-s07-local-agent.sh && bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- `git diff --check`
- `test -z "$(git ls-files | rg '(^|/)AGENTS\\.md' || true)"`

Observed for handoff / still pending until T03:

- `git check-ignore -v AGENTS.md` → exit 1 with no output
- `git status --ignored --short AGENTS.md` → no output
- `test -f AGENTS.md && echo exists || echo missing` → `missing`
- `rg -n '^/AGENTS\\.md$' "$(git rev-parse --git-path info/exclude)" || true` → no output

## Diagnostics

To inspect this task later:

- Open `docs/maintainers/local-agent-workflow.md` for the tracked maintainer contract.
- Run `bash scripts/docs/verify-s07-local-agent.sh` to confirm the maintainer leaf/link and no-leak boundary still hold.
- Run the existing S06/S05 verifiers to confirm adjacent trust/navigation surfaces still match their contracts.
- For the clone-local proof that T03 owns, use `git rev-parse --git-path info/exclude`, `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, and `git ls-files`.

## Deviations

none

## Known Issues

none — the missing local root `AGENTS.md` and missing `/AGENTS.md` repo-local exclude entry are expected preconditions for T03, not regressions in T02.

## Files Created/Modified

- `docs/maintainers/local-agent-workflow.md` — new maintainer-only leaf for the local root `AGENTS.md` handling contract and no-private-content boundary.
- `docs/maintainers/README.md` — maintainer owner map updated to link the new local-agent workflow leaf.
- `.gsd/milestones/M002/slices/S07/S07-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action to T03.
