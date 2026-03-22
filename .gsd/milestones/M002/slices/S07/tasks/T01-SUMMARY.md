---
id: T01
parent: S07
milestone: M002
provides:
  - S07 verifier-first boundary contract for local root AGENTS handling
key_files:
  - scripts/docs/verify-s07-local-agent.sh
  - .gsd/milestones/M002/slices/S07/S07-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Reused the S05/S06 explicit shell-assertion pattern and kept the S07 public-surface checks limited to concrete AGENTS workflow tokens so the verifier fails on wiring drift instead of vague prose matches.
patterns_established:
  - Repo-surface boundary verifiers emit per-path ERROR lines and verify only tracked state, while clone-local proof remains a later Git diagnostic step.
observability_surfaces:
  - bash scripts/docs/verify-s07-local-agent.sh
  - git ls-files | rg '(^|/)AGENTS\.md$'
  - bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh
duration: 25m
verification_result: passed
completed_at: 2026-03-13 02:33:08 MSK
blocker_discovered: false
---

# T01: Add the verifier-first local-agent boundary contract

**Added `scripts/docs/verify-s07-local-agent.sh` to fail closed on tracked/public `AGENTS.md` drift and to fail initially only on the still-missing maintainer doc wiring.**

## What Happened

Created `scripts/docs/verify-s07-local-agent.sh` in the same explicit shell-contract style as the S05/S06 repo-surface verifiers. The script now checks four boundaries:

1. no tracked `AGENTS.md` exists anywhere in the repo;
2. no tracked `.gitignore` mentions `AGENTS.md`;
3. `README.md`, `docs/README.md`, `SECURITY.md`, `SUPPORT.md`, and `CONTRIBUTING.md` stay silent about the local-agent workflow; and
4. `docs/maintainers/README.md` must link to `docs/maintainers/local-agent-workflow.md`, while that leaf must later contain the required backlink, Git commands, anchored `/AGENTS.md` rule, and no-private-content wording.

Ran the new verifier immediately against the current tree. It failed with exactly two deterministic `ERROR:` lines:

- `docs/maintainers/README.md` is missing the `local-agent-workflow.md` link
- `docs/maintainers/local-agent-workflow.md` does not exist yet

That is the expected T01 result: the verifier already proves the tracked/public boundary is clean, and it fails only on the planned S07 maintainer-doc gap.

## Verification

- `bash scripts/docs/verify-s07-local-agent.sh` — **expected fail observed**; failed only on missing maintainer-map wiring and missing maintainer leaf.
- `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh` — passed.
- `git check-ignore -v AGENTS.md` — expected fail at this stage; local ignore bootstrap is still owned by T03.
- `git status --ignored --short AGENTS.md | rg '^!! AGENTS\.md$'` — expected fail at this stage; no local `AGENTS.md` proof yet.
- `test -z "$(git ls-files | rg '(^|/)AGENTS\.md$' || true)"` — passed.
- `git diff --check` — passed after task artifacts were updated.

## Diagnostics

Run `bash scripts/docs/verify-s07-local-agent.sh` to inspect tracked-boundary drift. The script emits path-specific `ERROR:` lines for tracked `AGENTS.md`, tracked `.gitignore` leakage, public-surface leakage, missing maintainer-map wiring, and missing required leaf clauses. Use `git ls-files | rg '(^|/)AGENTS\.md$'` for the tracked-file boundary and the existing S05/S06 verifier stack to confirm adjacent documentation surfaces still hold.

## Deviations

None.

## Known Issues

- The clone-local ignore proof is intentionally not bootstrapped yet, so `git check-ignore -v AGENTS.md` and `git status --ignored --short AGENTS.md` still fail until T03 creates the local root file and repo-local exclude rule.

## Files Created/Modified

- `scripts/docs/verify-s07-local-agent.sh` — new executable verifier for the S07 local-agent public/private boundary contract.
- `.gsd/milestones/M002/slices/S07/S07-PLAN.md` — marked T01 complete.
- `.gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md` — recorded implementation and verification outcomes for this task.
- `.gsd/STATE.md` — moved the quick-glance next action to T02.
