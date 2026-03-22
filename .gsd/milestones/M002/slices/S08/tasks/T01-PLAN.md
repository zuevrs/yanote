---
estimated_steps: 4
estimated_files: 3
---

# T01: Compose the final entry-path verifier

**Slice:** S08 — Proofed Entry Paths And Doc Reliability
**Milestone:** M002

## Description

Create the single rerunnable proof surface for S08. This task closes the final composition gap by wiring the existing guide-first docs, S01/S02 runtime proofs, S03-S07 boundary verifiers, and the clone-local `AGENTS.md` Git checks into one stage-ordered acceptance command with a maintainer-facing rerun doc.

## Steps

1. Create `scripts/docs/verify-s08-entry-paths.sh` as a fail-closed orchestration script that runs the existing S01-S07 verifiers in guide-first order and then executes the clone-local Git checks from `docs/maintainers/local-agent-workflow.md`.
2. Make the script print stable stage labels and keep Docker Compose explicitly optional/secondary so the acceptance path stays valid in environments without a Docker daemon.
3. Add `docs/maintainers/proofed-entry-paths.md` describing the final proof command, the canonical guide order, the required clone-local `AGENTS.md` diagnostics, and the truthful optional status of Compose.
4. Link the new maintainer proof leaf from `docs/maintainers/README.md` so the rerun surface is discoverable without exposing private workflow content elsewhere.

## Must-Haves

- [ ] The new script delegates to `scripts/docs/verify-s01-*` through `scripts/docs/verify-s07-local-agent.sh` and the clone-local Git commands instead of copying their assertions.
- [ ] The new maintainer doc stays Russian-first, keeps Docker Compose secondary, and does not publish `AGENTS.md` contents or any private prompt material.

## Verification

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `rg -n 'verify-s08-entry-paths\.sh|git check-ignore -v AGENTS\.md' docs/maintainers/proofed-entry-paths.md docs/maintainers/README.md`

## Observability Impact

- Signals added/changed: Stable stage labels for the final proof run and one top-level command that exposes exactly which proof layer failed.
- How a future agent inspects this: Run `bash scripts/docs/verify-s08-entry-paths.sh` and follow the failing stage to the delegated verifier or Git command named in the output.
- Failure state exposed: The failing proof stage, delegated verifier output, and the exact Git ignore source returned by `git check-ignore -v AGENTS.md`.

## Inputs

- `README.md` — concept-first landing order that S08 must preserve.
- `scripts/docs/verify-s01-recorder-path.sh` — authoritative live recorder proof that must remain the source of truth.
- `scripts/docs/verify-s02-analysis-path.sh` — authoritative analyzer + gate-failure proof that must remain the source of truth.
- `docs/maintainers/local-agent-workflow.md` — clone-local `AGENTS.md` proof commands that S08 must include without publishing file contents.

## Expected Output

- `scripts/docs/verify-s08-entry-paths.sh` — the composed final-assembly verifier for the milestone.
- `docs/maintainers/proofed-entry-paths.md` — the maintainer-facing rerun contract for S08.
- `docs/maintainers/README.md` — updated maintainer navigation pointing to the new proof leaf.
