# M006: Runtime Delivery Hardening And Public Repo Hygiene

**Gathered:** 2026-03-23
**Status:** Complete

## Project Description

M006 restored trust in Yanote’s public runtime and delivery surfaces after the demo path, CI timing, and tracked artifact boundaries had drifted apart. The milestone focused on the public `run-v1-e2e.sh` demo/runtime path, the point in CI where delivery-sensitive proof runs, and the repository boundary between durable product assets and private maintainer/runtime residue.

## Why This Milestone

Before M006, Yanote’s public entry surfaces were weaker than the product story they were meant to support. The compose/demo runtime path had become unreliable, delivery-sensitive proof sat too late in the pipeline, and private maintainer/runtime trees still leaked into the default branch. That made the repo harder to trust even when the analyzer core itself was healthy.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run the public proof/demo path and get deterministic retained artifacts instead of a flaky or broken runtime story
- trust that the public branch contains durable product docs and proof surfaces rather than private maintainer/runtime residue

### Entry point / environment

- Entry point: `bash scripts/ci/run-v1-e2e.sh`, GitHub Actions `yanote-ci`, release proof paths, and repo docs/trust surfaces
- Environment: local dev, CI, Docker-backed runtime proof, and the default branch as the public product surface
- Live dependencies involved: Docker/compose runtime path, CI workflows, retained `.yanote-ci/` proof artifacts, and repo-tracked docs/support surfaces

## Completion Class

- Contract complete means: the public proof path and repo boundary are truthful again.
- Integration complete means: demo/runtime proof, CI job placement, and tracked public docs/artifacts align with each other.
- Operational complete means: the public delivery surfaces stay reproducible and no longer depend on hidden local/private trees.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- the public `run-v1-e2e.sh` path runs deterministically and leaves inspectable proof artifacts
- delivery-sensitive proof runs early enough in CI without destabilizing the required job names teams already depend on
- tracked private maintainer/runtime trees are removed from the public branch without breaking docs or trust surfaces

## Risks and Unknowns

- Public runtime proofs are easy to break when delivery wiring drifts from local reality. — The milestone needed real runtime re-verification, not only doc cleanup.
- Cleaning tracked artifact trees can break documentation and trust surfaces indirectly. — Repo hygiene had to be coordinated with public docs and proof paths.

## Existing Codebase / Prior Art

- `scripts/ci/run-v1-e2e.sh` — public runtime/demo proof entrypoint that M006 hardened
- `.github/workflows/yanote-ci.yml` and related CI contract tests — delivery-sensitive proof placement that M006 moved earlier without changing required job names
- tracked maintainer/runtime trees such as `.bg-shell/`, `.gsd/`, and `dist/` — public-boundary cleanup targets of the milestone

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R003` — delivery surfaces work in local and CI workflows
- `R004` — public release/support truth and reproducible verification stay explicit

## Scope

### In Scope

- hardening the public `run-v1-e2e.sh` runtime path
- moving delivery-sensitive proof earlier in CI while preserving stable required job names
- removing tracked private maintainer/runtime trees from the public branch and keeping docs truthful

### Out of Scope / Non-Goals

- new analyzer semantics or product-surface expansion
- new transport support or report-surface changes
- private maintainer conveniences that are not part of the public repo boundary

## Technical Constraints

- Keep the public proof path deterministic and inspectable.
- Preserve existing required CI job names where possible.
- Keep durable public docs/proof assets tracked and private/runtime residue untracked.

## Integration Points

- runtime demo/proof scripts
- GitHub CI workflows and contract tests
- repo docs/trust surfaces and tracked artifact boundaries

## Open Questions

- none — milestone completed and later milestones now build on the restored runtime/public-boundary baseline
