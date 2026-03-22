# S05: Documentation Architecture And Navigation

**Goal:** Make the repository’s documentation tree navigable by audience so first-time users, maintainers, and historical-reference readers can each find the right surface without path churn or fallback-first browsing.
**Demo:** A repo browser can move from the root/docs landings into maintainer, traceability, plans, or dist surfaces and always find an explicit owner map back to the correct audience surface.

## Must-Haves

- Add a machine-checked S05 navigation contract that verifies secondary directory landing pages, backlink ownership, fallback/offline labeling, and primary-vs-secondary ordering. This directly advances **R029** and protects supporting **R022**, **R023**, **R027**, and **R030**.
- Add stable landing pages for `docs/maintainers/`, `docs/traceability/`, `docs/plans/`, and `dist/` without moving tool-coupled files such as `docs/release-and-support.md`, `docs/requirements.md`, or `docs/traceability/*`. This directly advances **R029** and preserves the additive strategy established by research.
- Update primary maps and secondary leaf docs so direct entry into release/support, requirements, traceability, maintainer, and fallback bundle docs always includes an audience label and a recovery path back to the owning map. This directly advances **R029** and supports **R022**, **R023**, **R027**, and **R030**.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s05-navigation.sh`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s01-doc-links.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`

## Observability / Diagnostics

- Runtime signals: none — this slice enforces documentation IA through deterministic verifier failures instead of runtime logging.
- Inspection surfaces: `scripts/docs/verify-s05-navigation.sh` plus the existing S01-S04 documentation verifier scripts.
- Failure visibility: path-specific `ERROR:` lines for missing landing pages, missing backlinks, misordered primary/secondary surfaces, or fallback bundles presented as primary onboarding.
- Redaction constraints: none — verifiers inspect tracked markdown files only.

## Integration Closure

- Upstream surfaces consumed: `README.md`, `docs/README.md`, `examples/README.md`, `docs/release-and-support.md`, `docs/requirements.md`, `docs/maintainers/release-signing.md`, `docs/traceability/v1-requirements-tests.md`, `dist/flatdir-recorder/README.md`, `dist/node-analyzer/README.md`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`
- New wiring introduced in this slice: secondary landing pages for maintainer/history/fallback surfaces, explicit recovery links from secondary leaf docs to their owner maps, and a dedicated S05 verifier that protects this navigation graph.
- What remains before the milestone is truly usable end-to-end: S06 trust/policy surfaces, S07 local-only maintainer workflow boundary, and S08 end-to-end re-proof of the full concept → recorder → analyzer journey from the docs.

## Tasks

- [x] **T01: Lock the S05 navigation contract and add secondary landing pages** `est:1h`
  - Why: S05 needs an objective stopping condition, and the largest current gap is that `docs/maintainers/`, `docs/traceability/`, `docs/plans/`, and `dist/` still browse as raw directories instead of owned navigation surfaces.
  - Files: `scripts/docs/verify-s05-navigation.sh`, `docs/maintainers/README.md`, `docs/traceability/README.md`, `docs/plans/README.md`, `dist/README.md`
  - Do: Add a dedicated shell verifier for the S05 IA contract; assert required secondary README surfaces, audience labeling, backlink ownership, and fallback/offline wording; run it once to capture the expected failure against the current tree; then add the missing landing pages at the existing paths with clear ownership and recovery routes back to `docs/README.md` or canonical guides without moving tool-coupled files.
  - Verify: `bash scripts/docs/verify-s05-navigation.sh`
  - Done when: the new verifier passes and direct browsing into the maintainer, traceability, plans, and dist directories lands on an explicit README map instead of a raw listing.
- [x] **T02: Rewire the primary maps without promoting secondary surfaces** `est:45m`
  - Why: The root/docs/examples entrypoints must expose the new secondary maps, but S03/S04 only stay true if the concept-first recorder → events → analyzer path and thin release/support pointer remain dominant.
  - Files: `README.md`, `docs/README.md`, `examples/README.md`
  - Do: Update the three primary landings so they point to the new maintainer/traceability/history/dist maps; keep canonical guides, runnable demos, and `docs/release-and-support.md` ahead of maintainer/history/fallback material; and make fallback bundles visibly secondary rather than an alternate primary onboarding story.
  - Verify: `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
  - Done when: root/docs/examples navigation exposes the new maps while preserving the current product story, stable-line pointer, and user-first ordering.
- [x] **T03: Add recovery links to secondary leaf docs and rerun the full doc verifier stack** `est:1h`
  - Why: S05 is not actually complete if direct links into release/support, requirements, traceability, maintainer, or fallback bundle docs still strand readers inside a secondary surface.
  - Files: `docs/release-and-support.md`, `docs/requirements.md`, `docs/maintainers/release-signing.md`, `docs/traceability/v1-requirements-tests.md`, `dist/flatdir-recorder/README.md`, `dist/node-analyzer/README.md`
  - Do: Add short audience/owner clauses and “where to return” links from each secondary leaf to the correct owning map (`docs/README.md`, `docs/maintainers/README.md`, `docs/traceability/README.md`, `dist/README.md`); preserve `docs/release-and-support.md` as the authoritative public boundary doc; keep fallback bundles explicitly offline-only; and rerun the existing S01-S04 verifiers alongside the new S05 verifier to catch cross-surface drift.
  - Verify: `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
  - Done when: every planned secondary leaf doc has an explicit owner/backlink clause, fallback bundles still read as secondary, and the S01-S05 documentation verifiers all pass together.

## Files Likely Touched

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/maintainers/README.md`
- `docs/traceability/README.md`
- `docs/plans/README.md`
- `dist/README.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `docs/maintainers/release-signing.md`
- `docs/traceability/v1-requirements-tests.md`
- `dist/flatdir-recorder/README.md`
- `dist/node-analyzer/README.md`
- `scripts/docs/verify-s05-navigation.sh`
