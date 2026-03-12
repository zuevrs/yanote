---
estimated_steps: 4
estimated_files: 1
---

# T01: Add the verifier-first local-agent boundary contract

**Slice:** S07 — Local Agent Development Contract
**Milestone:** M002

## Description

Create the S07 verifier before writing the maintainer leaf or bootstrapping a local `AGENTS.md`. This makes the slice fail closed on public-boundary drift and gives future work a deterministic contract instead of relying on prose review or maintainer memory.

## Steps

1. Create `scripts/docs/verify-s07-local-agent.sh`, following the explicit shell-assertion style already used by the S03-S06 repo-surface verifiers.
2. Encode assertions that no tracked `AGENTS.md` exists anywhere in the repo, tracked `.gitignore` does not mention `AGENTS.md`, and the public/trust-facing surfaces (`README.md`, `docs/README.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`) do not advertise the local-agent workflow.
3. Add assertions that `docs/maintainers/README.md` links to `docs/maintainers/local-agent-workflow.md` and that the leaf must contain the required backlink, `git rev-parse --git-path info/exclude`, anchored `/AGENTS.md`, `git check-ignore -v`, `git status --ignored --short AGENTS.md`, `git ls-files`, and the no-private-content boundary wording.
4. Run the verifier once against the current tree and keep the failure deterministic: it should fail because the new maintainer leaf/link is still missing, not because the verifier is ambiguous.

## Must-Haves

- [ ] `scripts/docs/verify-s07-local-agent.sh` exists and emits path-specific `ERROR:` lines for tracked `AGENTS.md`, tracked `.gitignore` leakage, public-surface leakage, missing maintainer-map wiring, and missing required clauses in the maintainer leaf.
- [ ] The first verifier run fails for the expected current gap (missing S07 maintainer doc wiring) while already proving that the public/tracked surfaces stay silent about the local-only workflow.

## Verification

- `bash scripts/docs/verify-s07-local-agent.sh`
- First-run expectation: the script should fail because `docs/maintainers/local-agent-workflow.md` and its maintainer-map link do not exist yet.

## Observability Impact

- Signals added/changed: deterministic `ERROR:` lines in `scripts/docs/verify-s07-local-agent.sh` that localize public-boundary and maintainer-doc drift.
- How a future agent inspects this: run `bash scripts/docs/verify-s07-local-agent.sh` before or after any repo-surface change touching docs, ignore rules, or maintainer guidance.
- Failure state exposed: the exact file or missing clause that violates the S07 contract becomes visible at script exit.

## Inputs

- `.gsd/milestones/M002/slices/S07/S07-RESEARCH.md` — defines the split between tracked contract proof and clone-local operational proof.
- `.gsd/DECISIONS.md` — already locks the boundary that `AGENTS.md` must remain a local-only untracked artifact.
- `scripts/docs/verify-s05-navigation.sh` — prior repo-surface verifier pattern to mirror for deterministic shell checks.
- `scripts/docs/verify-s06-trust-surfaces.sh` — adjacent verifier pattern for boundary-focused repo-surface assertions.
- `docs/maintainers/README.md` — maintainer owner map that will later need the new S07 leaf link.

## Expected Output

- `scripts/docs/verify-s07-local-agent.sh` — executable S07 verifier that fails closed on boundary drift and initially fails on the still-missing maintainer doc wiring.
