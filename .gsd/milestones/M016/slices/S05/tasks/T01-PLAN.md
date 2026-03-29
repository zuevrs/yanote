---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - test
---

# T01: Compose the final public-surface verifier and contract test

**Slice:** S05 — Final public-surface integration proof
**Milestone:** M016

## Description

Create the one rerunnable S05 acceptance command instead of inventing new ad hoc checks. This task closes the composition gap by wiring the already-proven S02/S03/S04 release/docs/runtime surfaces into one stage-labeled proof and documenting that proof only in maintainer surfaces.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Existing S02/S03/S04 verifier stack | Fail closed on the first delegated command and keep its `S05-0N` stage label in the output instead of continuing blindly | Stop at the timed-out delegated command and surface the owning stage label rather than masking it with downstream failures | Reject missing or reordered delegated stages instead of silently skipping them |
| Maintainer proof docs and navigation | Keep the task red until the new maintainer leaf exists, backlinks are correct, and `verify-s05-navigation.sh` knows about it | N/A | Reject a maintainer rerun surface that leaks into public docs or lacks the expected command/backlink contract |

## Load Profile

- **Shared resources**: the existing doc/runtime verifier stack plus the maintainer owner-map surface.
- **Per-operation cost**: one shell orchestrator, one Node contract test, and small maintainer-doc edits.
- **10x breakpoint**: stage-list drift and navigation drift will break first, long before runtime cost becomes the bottleneck.

## Negative Tests

- **Malformed inputs**: missing delegated command path, missing maintainer leaf backlink, or a contract test that no longer matches the stage list.
- **Error paths**: a delegated verifier is dropped, reordered, or wrapped in a way that hides which stage actually failed.
- **Boundary conditions**: the new rerun surface stays maintainer-only, and the navigation verifier rejects it if it stops being discoverable from `docs/maintainers/README.md`.

## Steps

1. Add `scripts/docs/verify-m016-s05-public-surface.sh` as a stage-labeled orchestrator that delegates to the existing S02/S03/S04 release/docs/runtime proofs.
2. Add `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` to pin stage order, delegated commands, and the required maintainer-doc references.
3. Create `docs/maintainers/public-surface-proof.md` describing the canonical rerun command, stage order, and retained diagnostic surfaces.
4. Update `docs/maintainers/README.md` and `scripts/docs/verify-s05-navigation.sh` so the new maintainer-only leaf is discoverable and fail-closed.

## Must-Haves

- [ ] `scripts/docs/verify-m016-s05-public-surface.sh` delegates to upstream proof owners instead of copying their assertions.
- [ ] The contract test fails if stage order, delegated commands, or maintainer-doc links drift.
- [ ] The new maintainer proof leaf is linked from `docs/maintainers/README.md` and remains outside public onboarding surfaces.

## Verification

- `bash -n scripts/docs/verify-m016-s05-public-surface.sh`
- `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`
- `bash scripts/docs/verify-s05-navigation.sh`

## Observability Impact

- Signals added/changed: stable `S05-0N` stage labels and deterministic command echoes from the final verifier.
- How a future agent inspects this: run `bash scripts/docs/verify-m016-s05-public-surface.sh` or `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` and inspect the named failing stage.
- Failure state exposed: missing/reordered delegated stages, missing maintainer proof leaf, or navigation drift.

## Inputs

- `scripts/docs/verify-s03-public-artifact-boundary.sh` — clean-boundary verifier that the final proof must delegate to rather than reimplement.
- `scripts/docs/verify-m016-s04-short-docs.sh` — short-doc contract the final proof must include as-is.
- `scripts/docs/verify-s01-recorder-path.sh` — live recorder proof stage that must stay authoritative.
- `scripts/docs/verify-s02-analysis-path.sh` — live analyzer archive proof stage that must stay authoritative.
- `scripts/ci/verify-m016-s02-release-pipeline.sh` — retained release proof that anchors the final release stage.
- `docs/maintainers/README.md` — current maintainer owner map that must link to the new rerun leaf.

## Expected Output

- `scripts/docs/verify-m016-s05-public-surface.sh` — composed final-assembly verifier for the milestone.
- `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` — fixture-free contract test pinning stage order and references.
- `docs/maintainers/public-surface-proof.md` — maintainer-only rerun contract for the new proof command.
- `docs/maintainers/README.md` — updated maintainer owner map pointing to the new leaf.
- `scripts/docs/verify-s05-navigation.sh` — navigation guard updated to keep the new maintainer leaf truthful and discoverable.
