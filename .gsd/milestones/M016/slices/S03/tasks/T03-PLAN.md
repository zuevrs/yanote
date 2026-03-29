---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T03: Demote private proof paths from public landing, release, and support docs

**Slice:** S03 — Public repository boundary cleanup
**Milestone:** M016

## Description

Rewrite the public landing/release/support surfaces so they stop naming local proof directories and instead speak in terms of product surfaces: `yanote-analyzer.zip`, GitHub Releases, `yanote-validation-artifacts`, and `build-and-test-artifacts/*`. Any remaining clone-local rerun paths should be discoverable only through maintainer owner maps.

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

- Run `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`.
- Run `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh && bash scripts/docs/verify-s05-navigation.sh` and expect the cleaned public wording to pass.

## Observability Impact

- Signals added/changed: public-boundary and delivery-surface verifiers now print the exact doc/reference that still exposes local paths or stale artifact wording.
- How a future agent inspects this: run `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`, `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh`, and `bash scripts/docs/verify-s05-navigation.sh`.
- Failure state exposed: which public doc, artifact name, or backlink regressed.

## Inputs

- `README.md` — root product landing that currently foregrounds local proof surfaces.
- `docs/README.md` — docs landing whose summary wording still exposes local proof directories.
- `docs/release-and-support.md` — public owner doc that must stop naming clone-local proof paths.
- `SUPPORT.md` — public intake doc that must stop asking users for clone-local proof roots by default.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — boundary verifier that will enforce the cleaned wording.
- `scripts/docs/verify-m015-s04-delivery-surfaces.sh` — delivery-surface verifier that must follow the new public/private split.
- `scripts/docs/verify-s05-navigation.sh` — navigation verifier that must keep backlinks truthful after doc rewiring.

## Expected Output

- `README.md` — root landing rewritten around product-facing release and CI artifact surfaces.
- `docs/README.md` — docs landing rewritten to stop foregrounding local proof directories.
- `docs/release-and-support.md` — release/support owner doc updated to public artifact names and maintainer backlinks.
- `SUPPORT.md` — public intake doc updated to avoid clone-local proof path requests.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — full-public boundary guard updated for the new wording contract.
- `scripts/docs/verify-m015-s04-delivery-surfaces.sh` — delivery-surface guard updated for public artifact names instead of local roots.
- `scripts/docs/verify-s05-navigation.sh` — navigation guard updated if backlink expectations change.
