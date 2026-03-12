---
estimated_steps: 4
estimated_files: 2
---

# T02: Document and wire the maintainer-only AGENTS workflow

**Slice:** S07 — Local Agent Development Contract
**Milestone:** M002

## Description

Add the tracked part of the S07 contract without publishing any private prompt or workflow contents. This task creates the maintainer-only leaf, wires it into the existing maintainer map, and makes the tracked verifier stack pass while preserving the user-facing/trust-facing silence established in S05 and S06.

## Steps

1. Create `docs/maintainers/local-agent-workflow.md` as a Russian-first maintainer leaf that follows the same audience/owner/backlink pattern already used by `docs/maintainers/release-signing.md`.
2. Document the local-only contract: the real file lives at the repo root as `AGENTS.md`, the ignore rule belongs in `$(git rev-parse --git-path info/exclude)`, the recommended pattern is anchored `/AGENTS.md`, and maintainers should verify the state with `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, and `git ls-files`.
3. Explicitly state the content boundary: the tracked doc explains only handling rules and must not publish secrets, private prompt content, local environment notes, or personal workflow details; then add a link from `docs/maintainers/README.md` to the new leaf.
4. Re-run `bash scripts/docs/verify-s07-local-agent.sh` together with the existing S05/S06 verifiers and adjust wording until all tracked boundary checks pass.

## Must-Haves

- [ ] `docs/maintainers/local-agent-workflow.md` contains the required commands, owner/backlink language, repo-root `AGENTS.md` placement, anchored `/AGENTS.md` guidance, and the explicit no-private-content boundary.
- [ ] `docs/maintainers/README.md` links to the new leaf, and the S05/S06/S07 verifier stack passes without introducing any mention of the workflow into public repo surfaces.

## Verification

- `bash scripts/docs/verify-s07-local-agent.sh && bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- `git diff --check`

## Observability Impact

- Signals added/changed: none beyond the tracked verifier clauses introduced by T01.
- How a future agent inspects this: open `docs/maintainers/local-agent-workflow.md` for the maintainer contract, then run the S07/S06/S05 verifier stack to confirm the public/private boundary still holds.
- Failure state exposed: missing backlink, missing commands, or leaked wording is surfaced by the verifier as a file-specific contract failure.

## Inputs

- `.gsd/milestones/M002/slices/S07/S07-RESEARCH.md` — defines the recommended tracked doc scope and warns against publishing private `AGENTS.md` contents.
- `.gsd/DECISIONS.md` — locks the local-only `AGENTS.md` publication boundary that this doc must preserve.
- `docs/maintainers/README.md` — owning map that must link to the new leaf.
- `docs/maintainers/release-signing.md` — existing maintainer-leaf pattern for audience label, ownership statement, and backlink structure.
- `scripts/docs/verify-s07-local-agent.sh` — verifier created in T01 that sets the exact clauses this task must satisfy.

## Expected Output

- `docs/maintainers/local-agent-workflow.md` — maintainer-only handling guide for the local root `AGENTS.md` contract.
- `docs/maintainers/README.md` — maintainer map updated to link the new local-agent workflow leaf.
