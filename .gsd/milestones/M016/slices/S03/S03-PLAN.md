# S03: Public repository boundary cleanup

**Goal:** Remove or demote internal GSD/process/proof/runtime clutter from the public default-branch face while preserving local maintainer usefulness.
**Demo:** After this: Public `main` no longer foregrounds `.gsd`, `.tmp*`, `.vite`, or similar internal residue as part of the product repository face.

## Tasks
- [x] **T01: Added a fail-closed public-boundary guard with tracked/all modes and fixture-backed contract tests.** — Turn the public-boundary expectation into an executable contract before any mass cleanup. Expand ignore rules to cover `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/`, teach the shell verifier to distinguish tracked-only vs full public-surface checks, and add a fixture-backed Node contract test so the guard can be verified even while the repo is still dirty.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git ls-files` inventory plus `.gitignore` patterns | Fail closed and print the missing pattern or offending tracked root; do not guess | Treat as indeterminate repo state and keep the contract red | Reject ambiguous inventory parsing instead of silently passing |
| `scripts/docs/verify-s03-public-artifact-boundary.sh` exercised from Node fixtures | Keep the contract test red and print captured verifier stderr/stdout | Mark the verifier contract as broken; do not skip the failing fixture | Reject fixtures that pass while private roots are present or fail when the fixture is clean |

## Load Profile

- **Shared resources**: `.gitignore`, the shell verifier, and small temporary git fixtures.
- **Per-operation cost**: path-pattern updates plus a few short fixture runs.
- **10x breakpoint**: allowlist/forbidden-path drift across verifier modes becomes the main failure source before runtime cost matters.

## Negative Tests

- **Malformed inputs**: missing `.gsd/`, `.tmp-*`, or `.vite/` ignore rules; verifier mode names that silently skip checks.
- **Error paths**: tracked `.gsd`/`.tmp*` roots are present but the verifier exits green, or public docs still mention private paths without tripping the guard.
- **Boundary conditions**: dirty fixtures fail with high-signal diagnostics and clean fixtures pass in both tracked-only and full-public modes.

## Steps

1. Update `.gitignore` so `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` are explicitly clone-local roots.
2. Expand `scripts/docs/verify-s03-public-artifact-boundary.sh` to cover the new root inventory plus forbidden references in public landing/support surfaces, while keeping an incremental tracked-only mode for later tasks.
3. Add `scripts/docs/verify-s03-public-boundary.contract.test.mjs` with dirty/clean fixture repos that prove the guard fails and passes for the right reasons.
4. Keep verifier output high-signal so later cleanup tasks can localize regressions quickly.

## Must-Haves

- [ ] Ignore rules explicitly describe the local-only roots this slice is removing from the public face.
- [ ] The shell verifier can check tracked-only cleanup separately from full public-surface wording.
- [ ] A real test file proves the verifier contract instead of relying on ad hoc manual reruns.

## Verification

- `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs`
- Expect dirty fixture repos to fail on tracked/private roots and clean fixtures to pass.
  - Estimate: 50m
  - Files: .gitignore, scripts/docs/verify-s03-public-artifact-boundary.sh, README.md, docs/README.md, SUPPORT.md
  - Verify: node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs
- [x] **T02: Removed `.gsd/`, `.tmp*`, and `.vite/` from tracked git inventory while preserving local state and documenting the maintainer boundary.** — Use the guard from T01 to remove tracked local-only trees from the public index while preserving the same files clone-locally. This task directly advances `R041`: `.gsd/**`, `.tmp/**`, `.tmp-*`, and `.vite/**` should stop being part of public git state, while maintainer docs explain that those surfaces remain local and how to verify the boundary.

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

- `bash scripts/docs/verify-s03-public-artifact-boundary.sh`
- `bash scripts/docs/verify-s07-local-agent.sh`
- Expect tracked inventory for `.gsd`/`.tmp*`/`.vite` to be empty while maintainer docs stay wired.
  - Estimate: 1h
  - Files: .gsd/PROJECT.md, .gsd/REQUIREMENTS.md, .gsd/DECISIONS.md, .tmp-m012-research-out/yanote-report.json, .tmp/m015-s03-combined-proof/artifact-manifest.txt, .vite/vitest/results.json, docs/maintainers/README.md, docs/maintainers/local-agent-workflow.md
  - Verify: bash scripts/docs/verify-s03-public-artifact-boundary.sh && bash scripts/docs/verify-s07-local-agent.sh
- [x] **T03: Demoted public proof/support docs to release assets and CI bundle names and hardened the boundary verifier contract.** — Rewrite the public landing/release/support surfaces so they stop naming local proof directories and instead speak in terms of product surfaces: `yanote-analyzer.zip`, GitHub Releases, `yanote-validation-artifacts`, and `build-and-test-artifacts/*`. Any remaining clone-local rerun paths should be discoverable only through maintainer owner maps.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public markdown surfaces in `README.md`, `docs/README.md`, `docs/release-and-support.md`, and `SUPPORT.md` | Fail closed on leftover local/private path names or broken backlinks; do not leave mixed public/private navigation | Keep verifiers red until all public surfaces agree | Reject wording that regresses to raw Node seams or tracked `dist/*` fallback docs |
| `scripts/docs/verify-m015-s04-delivery-surfaces.sh` plus `scripts/docs/verify-s05-navigation.sh` | Keep the boundary red if artifact names, support-intake wording, or owner-map links drift | N/A | Reject partial updates where one public doc still references `.yanote-ci` or `.tmp` while others do not |

## Load Profile

- **Shared resources**: the root README, docs landing, release/support owner doc, support intake doc, and their verifier scripts.
- **Per-operation cost**: synchronized wording edits plus shell verifier reruns.
- **10x breakpoint**: wording drift across public docs becomes the main failure source long before command execution is expensive.

## Negative Tests

- **Malformed inputs**: stale `.yanote-ci/` or `.tmp/` paths left in public docs, or stale `dist/*` fallback references.
- **Error paths**: support intake still asks public users for local proof directories, or release/support wording implies raw `yanote-js` commands are supported.
- **Boundary conditions**: public docs mention only release assets, CI artifact bundle names, and maintainer backlinks while preserving truthful async/combined limits.

## Steps

1. Update `README.md`, `docs/README.md`, `docs/release-and-support.md`, and `SUPPORT.md` to replace local/private directory names with release assets, CI artifact bundle names, and maintainer backlinks.
2. Keep the standalone analyzer and combined-report boundaries truthful while removing clone-local path names from public wording.
3. Update the public-boundary and delivery-surface verifiers so they fail closed on any reintroduced private path or stale artifact wording.
4. Re-run navigation checks to prove the new backlinks still resolve.

## Must-Haves

- [ ] Public landing, release/support, and support-intake docs stop foregrounding local proof/planning directories.
- [ ] Public wording still names the real shipped analyzer asset and real CI artifact bundles.
- [ ] Verifiers fail closed on regressions back to local/private path names.

## Verification

- `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`
- `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh`
- Expect public docs/support surfaces to be clean while links and artifact names remain truthful.

## Observability Impact

- Signals added/changed: public-boundary and delivery-surface verifiers now print the exact doc/reference that still exposes local paths or stale artifact wording.
- How a future agent inspects this: run `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`, `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh`, and `bash scripts/docs/verify-s05-navigation.sh`.
- Failure state exposed: which public doc, artifact name, or backlink regressed.
  - Estimate: 1h10m
  - Files: README.md, docs/README.md, docs/release-and-support.md, SUPPORT.md, scripts/docs/verify-s03-public-artifact-boundary.sh, scripts/docs/verify-m015-s04-delivery-surfaces.sh, scripts/docs/verify-s05-navigation.sh
  - Verify: bash scripts/docs/verify-s03-public-artifact-boundary.sh all && bash scripts/docs/verify-m015-s04-delivery-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh
- [x] **T04: Repointed the public example demo to the standalone analyzer launcher and added fail-closed example boundary guards.** — Finish the public-boundary cleanup on example surfaces. Update the example landing and Compose demo so the user-facing demo no longer points at `.yanote-ci` bundles or invokes `node yanote-js/dist/yanote.cjs`; move any remaining clone-local rerun/proof notes into a maintainer-only leaf and add an example-specific verifier.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `examples/docker-compose.yml` analyzer step | Fail closed if the demo still depends on the raw Node seam or on tracked `dist/*` docs; do not leave a misleading example | Keep example verification red until the analyzer entrypoint matches S01's standalone contract | Reject commands that assume local proof directories are public inputs or that hide the needed bundle-build step |
| `examples/README.md` plus `docs/maintainers/proofed-entry-paths.md` | Fail if public example docs still foreground local proof paths, or if maintainer docs lose the rerun breadcrumb after demotion | N/A | Reject broken backlinks between public example docs and maintainer-only proof notes |
| `scripts/docs/verify-s03-landing.sh` and the example-boundary verifier | Keep the task red until both markdown and compose/example checks agree | N/A | Reject partial cleanup where README links pass but the demo command still leaks the raw seam |

## Load Profile

- **Shared resources**: example docs, the Compose demo, the standalone analyzer contract from S01, and maintainer proof notes.
- **Per-operation cost**: a small set of doc/config edits plus focused shell verifier reruns.
- **10x breakpoint**: drift between public example docs, compose commands, and maintainer rerun notes becomes the main failure source.

## Negative Tests

- **Malformed inputs**: raw `node yanote-js/dist/yanote.cjs` commands left in the Compose demo or example docs.
- **Error paths**: `examples/README.md` still foregrounds `.yanote-ci`/`.tmp` proof roots, or the maintainer leaf no longer tells maintainers where clone-local rerun bundles live.
- **Boundary conditions**: public examples stay product-facing while maintainer-only docs keep the necessary local rerun breadcrumbs.

## Steps

1. Update `examples/README.md` to describe the demo via product surfaces instead of local proof directory names.
2. Rewire `examples/docker-compose.yml` so the demo analyzer step uses the standalone launcher contract from S01 rather than `node yanote-js/dist/yanote.cjs`.
3. Move any remaining clone-local rerun/proof bundle details into `docs/maintainers/proofed-entry-paths.md`.
4. Add `scripts/docs/verify-s03-example-boundary.sh` and update landing/example checks so raw-seam or local-path regressions fail closed.

## Must-Haves

- [ ] Public example surfaces stop advertising local proof directories and the raw Node seam.
- [ ] The Compose demo follows the standalone analyzer contract already established in S01.
- [ ] Maintainer-only docs keep the local rerun/proof breadcrumb after the public demotion.

## Verification

- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s03-example-boundary.sh`
- Expect example docs, compose commands, and maintainer proof notes to agree on the post-cleanup boundary.

## Observability Impact

- Signals added/changed: the example verifier reports whether the regression is in markdown navigation or in the Compose analyzer command.
- How a future agent inspects this: run `bash scripts/docs/verify-s03-landing.sh` and `bash scripts/docs/verify-s03-example-boundary.sh`.
- Failure state exposed: the exact stale command/path or missing maintainer backlink.
  - Estimate: 1h
  - Files: examples/README.md, examples/docker-compose.yml, docs/maintainers/proofed-entry-paths.md, scripts/docs/verify-s03-landing.sh, scripts/docs/verify-s03-example-boundary.sh
  - Verify: bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s03-example-boundary.sh
