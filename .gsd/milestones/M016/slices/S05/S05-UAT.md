# S05: Final public-surface integration proof — UAT

**Milestone:** M016
**Written:** 2026-03-29T03:21:28.530Z

# S05 UAT — Final public-surface integration proof

## Preconditions
- Work from the repository root of the M016 checkout.
- Java 21, Node >=20, Docker/Compose, and the normal local build toolchain are available.
- No local edits are required; this slice is validated through repo-owned proof commands and public docs.

## Test Case 1 — Canonical final public-surface proof command
1. Run `bash scripts/docs/verify-m016-s05-public-surface.sh`.
   - **Expected:** The script announces the final public-surface proof and prints stable stage labels `S05-01` through `S05-12`.
2. Watch stages `S05-01` to `S05-05` complete.
   - **Expected:** Boundary, landing, short-doc, recorder-doc, and tagging/analyzer-doc checks all pass without exposing maintainer-only rerun surfaces on public onboarding pages.
3. Watch stages `S05-06` and `S05-07` complete.
   - **Expected:** The recorder runtime proof reports captured live HTTP evidence, and the analyzer archive proof confirms the standalone bundle contract with JSON+HTML report output.
4. Watch stages `S05-08` to `S05-12` complete.
   - **Expected:** The repo demo/example boundary, release/support boundary, maintainer navigation, repo demo contract test, and retained release-pipeline proof all pass in one run.
5. Inspect the final output block.
   - **Expected:** The verifier reports overall success and prints retained release-proof artifact paths under `.yanote-ci/m016-s02-release-pipeline-proof/`.

## Test Case 2 — Maintainer rerun contract and release-tag workflow
1. Open `docs/maintainers/public-surface-proof.md`.
   - **Expected:** The page is marked maintainer-only, names `bash scripts/docs/verify-m016-s05-public-surface.sh` as the canonical command, and lists stages `S05-01` through `S05-12` with exact delegated commands.
2. Open `docs/maintainers/release-signing.md`.
   - **Expected:** The release workflow requires two local gates before pushing a real tag: first `bash scripts/ci/verify-m016-s02-release-pipeline.sh`, then `bash scripts/docs/verify-m016-s05-public-surface.sh`.
3. Open `docs/maintainers/README.md`.
   - **Expected:** The new public-surface proof leaf is discoverable from the maintainer map.

## Test Case 3 — Public newcomer surfaces stay product-first and aligned
1. Open `README.md`.
   - **Expected:** The top-level path is quickstart-first (`getting-started` -> docs map -> release/support), names the stable line `v1.0.x`, and names the published analyzer asset `yanote-analyzer.zip` only on the release/support surface.
2. Open `docs/README.md`.
   - **Expected:** The docs map preserves the order recorder -> tagging -> analyzer -> repo demo and keeps release/support as a secondary owner surface.
3. Open `examples/README.md`.
   - **Expected:** The example landing stays on one short Compose-based repo demo path and explicitly says the demo uses the same standalone analyzer launcher contract as `yanote-analyzer.zip`.
4. Open `docs/release-and-support.md`.
   - **Expected:** The page defines `v1.0.x` as the stable public release line, names `yanote-analyzer.zip` as the published analyzer asset, and does not tell the user to operate the raw Node implementation seam.

## Test Case 4 — Contract guard for the composed proof surface
1. Run `node --test scripts/docs/verify-m016-s05-public-surface.contract.test.mjs`.
   - **Expected:** All three tests pass.
2. Review the test names in the output.
   - **Expected:** The suite confirms delegated stage order, maintainer navigation/release-signing references, and the rule that `public-surface-proof.md` plus `verify-m016-s05-public-surface.sh` stay out of `README.md`, `docs/README.md`, `docs/guides/getting-started.md`, `examples/README.md`, and `docs/release-and-support.md`.

## Edge checks
- If any `S05-0N` stage fails, the top-level verifier must stop immediately and print the exact delegated command for that stage.
- If the release stage fails, the retained proof directory `.yanote-ci/m016-s02-release-pipeline-proof/` must still contain `phase-status.txt`, `artifact-manifest.txt`, `tag-context.txt`, and stderr/stdout logs for diagnosis.
- No public onboarding page should mention `public-surface-proof.md` or `verify-m016-s05-public-surface.sh`; those rerun breadcrumbs belong only to maintainer surfaces.
