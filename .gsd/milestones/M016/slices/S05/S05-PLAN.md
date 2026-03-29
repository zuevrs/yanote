# S05: Final public-surface integration proof

**Goal:** Compose and prove one rerunnable final public-surface acceptance path so the clean public repo boundary, quickstart/docs story, standalone analyzer contract, example/demo path, and tag-driven release proof stay truthful together.
**Demo:** After this: Clean checkout, short docs, official analyzer CLI surface, and tag-driven release truth all fit together as one coherent public product story.

## Tasks
- [x] **T01: Added the stage-labeled S05 public-surface verifier, its contract test, and a maintainer-only rerun leaf.** — Create the top-level S05 acceptance command instead of inventing new ad hoc checks.

Steps:
1. Add `scripts/docs/verify-m016-s05-public-surface.sh` as a stage-labeled orchestrator that delegates to the existing S02/S03/S04 release/docs/runtime proofs.
2. Add `scripts/docs/verify-m016-s05-public-surface.contract.test.mjs` to pin stage order, delegated commands, and required maintainer-doc references.
3. Add a maintainer-only rerun leaf and wire it into the maintainer owner map plus the navigation verifier.

Must-haves:
- One command exists for the final public-surface proof.
- Stage order is machine-checked.
- The rerun surface stays maintainer-only.
  - Estimate: 45m
  - Files: scripts/docs/verify-m016-s05-public-surface.sh, scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, docs/maintainers/public-surface-proof.md, docs/maintainers/README.md, scripts/docs/verify-s05-navigation.sh
  - Verify: bash -n scripts/docs/verify-m016-s05-public-surface.sh && node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && bash scripts/docs/verify-s05-navigation.sh
- [x] **T02: Aligned the public landing/docs/examples story around the same quickstart-first flow, stable release line `v1.0.x`, and standalone analyzer asset `yanote-analyzer.zip`, then tightened the focused verifiers to fail closed on wording and ordering drift.** — Use the composed proof expectations to reconcile the public repo face so it stays product-first and truthful.

Steps:
1. Tighten `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md` so they tell the same quickstart-first, standalone-analyzer, release-asset story.
2. Keep maintainer-only proof breadcrumbs out of public docs while preserving allowed public asset names and support boundaries.
3. Update the landing/short-doc/example/release verifiers wherever the final story changes so regressions fail closed.

Must-haves:
- Public docs stay product-first and silent about clone-local proof roots.
- Public asset names and owner-map/backlink order stay consistent across root/docs/examples/release.
- Existing verifiers catch final-story regressions.
  - Estimate: 1h
  - Files: README.md, docs/README.md, examples/README.md, docs/release-and-support.md, scripts/docs/verify-s03-landing.sh, scripts/docs/verify-m016-s04-short-docs.sh, scripts/docs/verify-s03-example-boundary.sh, scripts/docs/verify-s04-boundaries.sh
  - Verify: bash scripts/docs/verify-s03-public-artifact-boundary.sh all && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh
- [x] **T03: Required both release-candidate and final public-surface proofs before pushing a real release tag.** — Close the slice on live evidence: the new verifier must pass end to end, and release prep docs must require it.

Steps:
1. Execute `bash scripts/docs/verify-m016-s05-public-surface.sh` and use the first failing stage label to repair any remaining recorder/tagging/analyzer/example/release composition drift without reimplementing delegated logic.
2. Update `docs/maintainers/release-signing.md` so maintainers run the final public-surface verifier alongside the local release-candidate proof before pushing a real tag.
3. Re-run the composed verifier and contract test until the full public story is green.

Must-haves:
- The full S05 verifier passes against live runtime and release proof surfaces.
- Release-signing guidance points at the final public-surface gate.
- Future maintainers can rerun the proof from the maintainer docs alone.
  - Estimate: 1h15m
  - Files: scripts/docs/verify-m016-s05-public-surface.sh, scripts/docs/verify-m016-s05-public-surface.contract.test.mjs, docs/maintainers/public-surface-proof.md, docs/maintainers/release-signing.md, docs/maintainers/README.md
  - Verify: bash scripts/docs/verify-m016-s05-public-surface.sh && node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs && git diff --check
