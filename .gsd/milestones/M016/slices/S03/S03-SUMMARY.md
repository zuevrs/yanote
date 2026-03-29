---
id: S03
parent: M016
milestone: M016
provides:
  - A fail-closed public-boundary contract covering tracked clone-local roots, public wording drift, and example launcher regressions.
  - A cleaned public repo face where `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` are clone-local only and public README/docs/support/example surfaces foreground release assets and CI artifact bundles instead of private rerun paths.
  - A public example story aligned to the standalone analyzer launcher contract, with maintainer-only rerun breadcrumbs preserved separately.
requires:
  - slice: S01
    provides: The standalone analyzer launcher contract (`dist/standalone-analyzer/bin/yanote`) and release asset naming (`yanote-analyzer.zip`) that S03 reused in public docs and the example Compose flow.
affects:
  - S04
  - S05
key_files:
  - .gitignore
  - scripts/docs/verify-s03-public-artifact-boundary.sh
  - scripts/docs/verify-s03-public-boundary.contract.test.mjs
  - docs/maintainers/README.md
  - docs/maintainers/local-agent-workflow.md
  - README.md
  - docs/README.md
  - docs/release-and-support.md
  - SUPPORT.md
  - examples/README.md
  - examples/docker-compose.yml
  - docs/maintainers/proofed-entry-paths.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s03-example-boundary.sh
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - .gsd/PROJECT.md
key_decisions:
  - D030: Treat `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` as clone-local roots and enforce that boundary with fail-closed tracked/all verifier modes.
  - D031: Keep public docs/support surfaces limited to public release assets and CI artifact bundle names, with clone-local rerun roots discoverable only through maintainer owner maps.
  - D032: Mark R041 validated based on the passing full boundary/example/delivery verifier stack and fixture-backed contract tests.
  - Treat the example Compose launcher, the host standalone-analyzer prebuild, and the compose contract test as one coupled surface that must move together.
patterns_established:
  - Split the public-boundary verifier into incremental `tracked` and stricter `all` modes so tracked-inventory cleanup and public-wording cleanup can be verified independently without weakening the fail-closed contract.
  - When a public-boundary verifier grows to a new public doc surface, update the fixture-backed contract test to materialize that surface too; otherwise failures will reflect fixture-shape drift instead of the real wording regression.
  - When the public example demo changes analyzer entrypoints, update the Compose file, the host prebuild path, and the compose contract test together so docs and retained runnable proof stay aligned.
  - Keep maintainer-only rerun/proof breadcrumbs in dedicated maintainer docs (`docs/maintainers/*`) while public landing/support/example surfaces reference only shipped assets and collected CI bundles.
observability_surfaces:
  - `scripts/docs/verify-s03-public-artifact-boundary.sh` exposes tracked-root drift separately from public-wording drift through `tracked` and `all` modes and prints the offending path or unsupported mode directly.
  - `scripts/docs/verify-s03-public-boundary.contract.test.mjs` proves the verifier stays fail-closed on dirty fixtures and that clean fixtures pass in both modes, which keeps diagnostic expectations executable.
  - `scripts/docs/verify-s03-example-boundary.sh` localizes example regressions by surface: markdown navigation, Compose launcher contract, or maintainer-only rerun breadcrumb drift.
  - `scripts/docs/verify-m015-s04-delivery-surfaces.sh` and `scripts/docs/verify-s05-navigation.sh` keep public release/support wording and backlinks attributable after the cleanup.
  - `scripts/ci/run-v1-e2e.contract.test.mjs` keeps the public example’s retained runnable proof aligned to the standalone analyzer launcher contract and deterministic bundle collection.
drill_down_paths:
  - .gsd/milestones/M016/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M016/slices/S03/tasks/T03-SUMMARY.md
  - .gsd/milestones/M016/slices/S03/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T01:15:52.396Z
blocker_discovered: false
---

# S03: Public repository boundary cleanup

**S03 removed clone-local planning/proof/runtime residue from Yanote’s tracked public face, repointed public docs/support/examples to release assets and CI bundle names, and hardened fail-closed guards around tracked inventory, wording drift, and the standalone-example launcher contract.**

## What Happened

# S03: Public repository boundary cleanup

**S03 turned the public-boundary goal into an executable contract, removed clone-local roots from the tracked public face, rewrote public docs/support/examples around shipped assets instead of private rerun paths, and kept maintainer-only breadcrumbs behind dedicated owner maps.**

## What Happened

S03 started by making the cleanup boundary explicit instead of relying on ad hoc visual review. T01 expanded `.gitignore` to treat `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` as clone-local roots for this milestone, split `scripts/docs/verify-s03-public-artifact-boundary.sh` into incremental `tracked` and stricter `all` modes, and added `scripts/docs/verify-s03-public-boundary.contract.test.mjs` with dirty and clean git fixtures. That gave the slice one fail-closed source of truth for both tracked-root drift and public-wording regressions before any mass untracking happened.

T02 then used that guard to remove `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` from the tracked git inventory while preserving the working tree for the active clone. The maintainer owner map and local-agent workflow docs were updated so future maintainers still know that these surfaces remain usable locally, how to verify the boundary, and where the AGENTS/GSD contract lives after the public demotion.

T03 rewrote the public landing, docs landing, release/support owner doc, and support intake so they stop naming clone-local proof directories and instead refer to the real public surfaces: `yanote-analyzer.zip`, GitHub Releases, `yanote-validation-artifacts`, and `build-and-test-artifacts/*`. The slice also widened the boundary verifier and delivery-surface checks so regressions back to `.tmp`, `.yanote-ci`, or stale artifact wording fail closed, and repaired the fixture-backed boundary contract so its fixture repos always materialize the same public doc surface set that the live verifier inspects.

T04 finished the public-facing cleanup on examples. `examples/README.md` was rewritten in product-facing terms, `examples/docker-compose.yml` switched from the raw Node seam to the standalone launcher contract (`dist/standalone-analyzer/bin/yanote`), maintainer-only rerun breadcrumbs were concentrated in `docs/maintainers/proofed-entry-paths.md`, and `scripts/docs/verify-s03-example-boundary.sh` was added so markdown navigation, Compose launcher drift, and maintainer backlink drift fail independently with high-signal diagnostics. Because the example launcher changed, `scripts/ci/run-v1-e2e.sh` and its contract test were updated in the same slice so the retained runnable demo still prebuilds and proves the same launcher contract end to end.

For downstream readers, the key dependency summary is: public repository surfaces in `main` now present product assets and support bundles instead of maintainer-private roots, while maintainers still have explicit local-only owner maps for reruns and proof archaeology. S04 should preserve that split while shortening newcomer docs, and S05 should reuse the new verifiers as the fail-closed integration contract for the final public-surface audit.

## Requirements Advanced

- **R035 — Public repo surface is product-first.** S03 removed tracked clone-local roots from the visible repo face and rewrote public landing/support/example surfaces to speak in terms of product artifacts rather than maintainer-private directories.
- **R043 — Public release/docs/example surfaces remain truthful after cleanup.** S03 kept the public wording tied to the real standalone analyzer asset, CI artifact bundle names, and maintained example launcher contract instead of cleaning the repo by hiding or hand-waving real delivery surfaces.

## Requirements Validated

- **R041 — Internal GSD/process/proof surfaces are removed from public main.** Validated by the passing tracked/full public-boundary verifier stack, local-agent verifier, delivery-surface/navigation verifiers, example-boundary verifier, and fixture-backed contract tests that prove tracked clone-local roots and public private-path regressions fail closed.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T04 expanded beyond the original example-doc files to also update `scripts/ci/run-v1-e2e.sh` and `scripts/ci/run-v1-e2e.contract.test.mjs`, because changing the public example launcher without changing the retained demo prebuild/proof path would have left the example docs truthful only on paper.

## Known Limitations

This slice intentionally stops at boundary cleanup. It does not yet shorten all newcomer-facing product docs into the minimal final onboarding story; that remains S04 and the end-to-end coherence proof remains S05.

## Follow-ups

S04 should keep using release-asset and CI-bundle names, not clone-local paths, when rewriting the short public docs and examples. S05 should reuse `verify-s03-public-artifact-boundary.sh`, `verify-s03-example-boundary.sh`, `verify-m015-s04-delivery-surfaces.sh`, `verify-s05-navigation.sh`, and `scripts/ci/run-v1-e2e.contract.test.mjs` as part of the final public-surface integration proof.

## Files Created/Modified

- `.gitignore` — Declared `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` as clone-local roots for the S03 contract.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — Added split tracked/all fail-closed public-boundary verification.
- `scripts/docs/verify-s03-public-boundary.contract.test.mjs` — Added dirty/clean fixture-backed contract coverage for tracked-root and wording regressions.
- `docs/maintainers/README.md` — Repointed the maintainer owner map to the new clone-local boundary.
- `docs/maintainers/local-agent-workflow.md` — Preserved truthful local-agent workflow guidance after untracking clone-local roots.
- `README.md` — Removed clone-local proof-path foregrounding and replaced it with public release-asset / CI-bundle wording.
- `docs/README.md` — Kept docs landing product-facing and aligned to the cleaned release/support story.
- `docs/release-and-support.md` — Reframed public release/support guidance around release assets and CI artifact bundles rather than local proof directories.
- `SUPPORT.md` — Updated support intake so public users attach release/CI artifacts instead of clone-local paths.
- `examples/README.md` — Rewrote example guidance around the standalone analyzer asset and public artifact bundles.
- `examples/docker-compose.yml` — Switched the example report flow to the standalone analyzer launcher contract.
- `docs/maintainers/proofed-entry-paths.md` — Concentrated maintainer-only rerun breadcrumbs after the public demotion.
- `scripts/docs/verify-s03-landing.sh` — Realigned landing verification to the post-cleanup public wording.
- `scripts/docs/verify-s03-example-boundary.sh` — Added fail-closed example-boundary verification.
- `scripts/ci/run-v1-e2e.sh` — Updated host prebuild and retained demo proof to match the standalone example launcher.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — Pinned the updated Compose/analyzer launcher contract.
- `.gsd/PROJECT.md` — Refreshed current state to show S03 complete and M016 narrowed to S04/S05.


## Verification

Passed the full slice verification stack on current HEAD:

- `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs` — passed; output confirmed dirty fixtures fail closed on tracked clone-local roots, `all` mode adds public-surface wording checks, clean fixtures pass in both modes, and missing ignore rules / unsupported modes emit actionable diagnostics.
- `bash scripts/docs/verify-s03-public-artifact-boundary.sh` — passed in tracked mode with `Tracked public-boundary inventory entries under .bg-shell/.gsd/.tmp/.tmp-*/.vite/dist: 0`.
- `bash scripts/docs/verify-s07-local-agent.sh` — passed, confirming the maintainer-only workflow boundary still resolves correctly after untracking clone-local roots.
- `bash scripts/docs/verify-s03-public-artifact-boundary.sh all` — passed, confirming public landing/support surfaces stay silent about private paths.
- `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` — passed, confirming public release/support wording still matches real retained artifact families.
- `bash scripts/docs/verify-s05-navigation.sh` — passed, confirming backlinks and navigation still resolve after the wording cleanup.
- `bash scripts/docs/verify-s03-landing.sh` — passed, confirming root/docs/examples landing wording stays aligned.
- `bash scripts/docs/verify-s03-example-boundary.sh` — passed, confirming markdown navigation, Compose launcher contract, and maintainer-only rerun breadcrumbs agree.
- `node --test scripts/ci/run-v1-e2e.contract.test.mjs` — passed; output confirmed the example demo prebuilds the standalone analyzer launcher on the host, the Compose report container consumes that launcher instead of the raw Node seam, raw Node assets remain only for host-side focused reruns, retained bundle collection stays deterministic, and teardown remains unconditional.

Observability/diagnostic surfaces were also confirmed: the boundary contract test explicitly proved that failing fixtures print the offending tracked paths and mode-specific actionable diagnostics, and the example/release-surface verifiers localized regressions by surface (markdown wording, Compose launcher, maintainer backlink, or artifact wording).

## Requirements Advanced

- R035 — Removed tracked clone-local roots from the public repository face and rewrote public landing/support/example surfaces around product assets and CI bundles instead of maintainer-private directories.
- R043 — Kept the cleaned public wording tied to the real standalone analyzer asset, CI artifact bundle names, and the runnable example launcher contract instead of hiding or overclaiming delivery surfaces.

## Requirements Validated

- R041 — Validated by the passing `node --test scripts/docs/verify-s03-public-boundary.contract.test.mjs`, `bash scripts/docs/verify-s03-public-artifact-boundary.sh`, `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`, `bash scripts/docs/verify-s07-local-agent.sh`, `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh`, `bash scripts/docs/verify-s05-navigation.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s03-example-boundary.sh`, and `node --test scripts/ci/run-v1-e2e.contract.test.mjs` verification stack.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T04 expanded beyond the listed files by updating `scripts/ci/run-v1-e2e.sh` and `scripts/ci/run-v1-e2e.contract.test.mjs` so the changed public example launcher remains runnable and contract-tested rather than becoming a docs-only claim.

## Known Limitations

This slice intentionally covers repository-boundary cleanup, not the final newcomer-doc simplification. The broader short-doc reshape still belongs to S04, and the final end-to-end public-surface coherence proof still belongs to S05.

## Follow-ups

Preserve the release-asset / CI-bundle wording split in S04, keep maintainer-only rerun breadcrumbs inside maintainer docs only, and reuse the new boundary/example/delivery/navigation verifier stack plus `scripts/ci/run-v1-e2e.contract.test.mjs` in S05’s final public-surface integration proof.

## Files Created/Modified

- `.gitignore` — Marked `.gsd/`, `.tmp/`, `.tmp-*`, and `.vite/` as clone-local roots for the S03 public-boundary contract.
- `scripts/docs/verify-s03-public-artifact-boundary.sh` — Added fail-closed tracked/all public-boundary verification and actionable diagnostics.
- `scripts/docs/verify-s03-public-boundary.contract.test.mjs` — Added fixture-backed contract coverage for dirty/clean boundary states and verifier failure modes.
- `docs/maintainers/README.md` — Updated the maintainer owner map to reflect the clone-local boundary after public cleanup.
- `docs/maintainers/local-agent-workflow.md` — Preserved explicit maintainer workflow guidance for clone-local AGENTS/GSD handling after untracking.
- `README.md` — Removed clone-local proof-path foregrounding and rewrote public guidance around release assets and CI bundle names.
- `docs/README.md` — Aligned the docs landing with the cleaned product-first public boundary.
- `docs/release-and-support.md` — Replaced local proof-directory wording with release assets, GitHub Releases, and CI artifact bundle names.
- `SUPPORT.md` — Reframed support intake around public artifacts instead of clone-local rerun paths.
- `examples/README.md` — Rewrote the example landing around the standalone analyzer asset and public artifact bundles.
- `examples/docker-compose.yml` — Switched the example report step to `dist/standalone-analyzer/bin/yanote` instead of the raw Node seam.
- `docs/maintainers/proofed-entry-paths.md` — Centralized maintainer-only local rerun/proof breadcrumbs after public demotion.
- `scripts/docs/verify-s03-landing.sh` — Updated landing checks to match the cleaned public wording contract.
- `scripts/docs/verify-s03-example-boundary.sh` — Added example-boundary verification for markdown, Compose launcher, and maintainer backlink drift.
- `scripts/ci/run-v1-e2e.sh` — Updated host prebuild/proof wiring so the retained runnable demo uses the standalone analyzer launcher contract.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — Pinned the updated example Compose/analyzer contract and deterministic retained bundle behavior.
- `.gsd/PROJECT.md` — Refreshed project state to record S03 as complete and narrow M016 to S04/S05.
