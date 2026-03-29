---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T04: Clean example entrypoints and the maintainer proof map for the post-cleanup boundary

**Slice:** S03 — Public repository boundary cleanup
**Milestone:** M016

## Description

Finish the public-boundary cleanup on example surfaces. Update the example landing and Compose demo so the user-facing demo no longer points at `.yanote-ci` bundles or invokes `node yanote-js/dist/yanote.cjs`; move any remaining clone-local rerun/proof notes into a maintainer-only leaf and add an example-specific verifier.

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

- Run `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s03-example-boundary.sh`.
- Expect example docs, compose commands, and maintainer proof notes to agree on the post-cleanup boundary.

## Observability Impact

- Signals added/changed: the example verifier reports whether the regression is in markdown navigation or in the Compose analyzer command.
- How a future agent inspects this: run `bash scripts/docs/verify-s03-landing.sh` and `bash scripts/docs/verify-s03-example-boundary.sh`.
- Failure state exposed: the exact stale command/path or missing maintainer backlink.

## Inputs

- `examples/README.md` — public demo landing that currently foregrounds local proof bundle paths.
- `examples/docker-compose.yml` — public runnable demo that still invokes the raw Node seam.
- `docs/maintainers/proofed-entry-paths.md` — maintainer-only leaf that can absorb the clone-local rerun/proof breadcrumb.
- `scripts/docs/verify-s03-landing.sh` — landing verifier that should stay aligned with the cleaned example surfaces.

## Expected Output

- `examples/README.md` — example landing rewritten around product-facing demo surfaces.
- `examples/docker-compose.yml` — Compose demo updated to the standalone analyzer launcher contract.
- `docs/maintainers/proofed-entry-paths.md` — maintainer-only leaf updated with the clone-local rerun/proof breadcrumb removed from public docs.
- `scripts/docs/verify-s03-landing.sh` — landing verifier updated for the cleaned example wording if needed.
- `scripts/docs/verify-s03-example-boundary.sh` — new example-specific guard for raw-seam and local-path regressions.
