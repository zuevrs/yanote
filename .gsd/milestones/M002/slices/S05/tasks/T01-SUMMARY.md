---
id: T01
parent: S05
milestone: M002
provides:
  - Machine-checked S05 navigation contract plus owned secondary landing pages for maintainer, traceability, historical-plan, and dist fallback surfaces.
key_files:
  - scripts/docs/verify-s05-navigation.sh
  - docs/maintainers/README.md
  - docs/traceability/README.md
  - docs/plans/README.md
  - dist/README.md
key_decisions:
  - Secondary directory landing pages must present the owner-map return path before local leaf links, and `dist/` must stay explicitly below canonical guides as an offline fallback only.
patterns_established:
  - Secondary README contract = audience label + early owner backlink + thin local inventory + verifier-enforced ordering/fallback wording.
observability_surfaces:
  - `bash scripts/docs/verify-s05-navigation.sh` emits path-specific `ERROR:` lines for missing landing pages, missing owner links, and fallback-order regressions.
duration: 27m
verification_result: passed
completed_at: 2026-03-12T22:17:12Z
blocker_discovered: false
---

# T01: Lock the S05 navigation contract and add secondary landing pages

**Added the S05 navigation verifier, created the missing secondary directory owner maps, and made `dist/README.md` trackable without relaxing binary-artifact ignores.**

## What Happened

I created `scripts/docs/verify-s05-navigation.sh` in the same explicit shell-assertion style as the S03/S04 doc verifiers. The contract checks four secondary directory landings (`docs/maintainers/`, `docs/traceability/`, `docs/plans/`, and `dist/`) for README existence, audience wording, owner-map backlinks, and ordering that keeps recovery paths ahead of local leaf links. For `dist/`, it also asserts canonical recorder/analyzer guide links appear before bundle links and that fallback wording stays explicit.

I ran the new verifier immediately after creating it. The first run failed as expected because all four landing pages were still missing. During that run I also caught and fixed one shell-quoting bug in the `dist/` wording assertion so later failures would reflect documentation drift rather than a bad checker.

Then I added the missing landing pages:

- `docs/maintainers/README.md` as a maintainer-only map with a mixed Russian/English signpost and an early return path to `docs/README.md`
- `docs/traceability/README.md` as a reference-only map back to `docs/README.md` and `docs/requirements.md`
- `docs/plans/README.md` as a historical-only map that points readers back to current docs before listing archived design/proof notes
- `dist/README.md` as an offline/fallback-only landing that sends readers to canonical recorder/analyzer guides before exposing bundle-level docs

One repo-level issue surfaced while closing the task: `.gitignore` ignored all of `dist/`, which would have caused the new `dist/README.md` to disappear from the auto-commit. I added a narrow `!dist/README.md` exception while keeping generated bundle outputs ignored.

I also appended the landing-ordering rule to `.gsd/DECISIONS.md`, marked T01 complete in the slice plan, and advanced `.gsd/STATE.md` to T02.

## Verification

- Initial failure check: `bash scripts/docs/verify-s05-navigation.sh`
  - Failed intentionally with path-specific `ERROR:` lines for the missing secondary landing pages and missing clauses.
- Final task verification: `bash scripts/docs/verify-s05-navigation.sh`
  - Passed.
- Slice-level verification stack:
  - `bash scripts/docs/verify-s05-navigation.sh` — passed
  - `bash scripts/docs/verify-s03-landing.sh` — passed
  - `bash scripts/docs/verify-s04-boundaries.sh` — passed
  - `bash scripts/docs/verify-s01-doc-links.sh` — passed
  - `bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s05-navigation.sh`.

The script reports deterministic `ERROR:` lines naming the exact surface and clause that drifted:

- missing secondary README surfaces
- missing audience labels
- missing owner-map backlinks
- backlink/canonical-guide ordering regressions
- `dist/` fallback wording that stops marking bundle docs as secondary

## Deviations

- Added a narrow `.gitignore` exception for `dist/README.md` so the required `dist/` landing page is tracked while `dist` bundle outputs remain ignored.

## Known Issues

- None.

## Files Created/Modified

- `scripts/docs/verify-s05-navigation.sh` — new S05 documentation IA verifier for secondary landings, backlinks, ordering, and fallback wording.
- `docs/maintainers/README.md` — maintainer-only landing page with owner-map return path.
- `docs/traceability/README.md` — traceability/reference landing page with links back to current requirements and docs map.
- `docs/plans/README.md` — historical-plan landing page that routes readers back to current docs before archived notes.
- `dist/README.md` — fallback-bundle landing page that keeps offline assets secondary to canonical guides.
- `.gitignore` — unignored `dist/README.md` without exposing generated bundle artifacts.
- `.gsd/DECISIONS.md` — recorded the owner-map-first ordering rule for secondary landings.
- `.gsd/milestones/M002/slices/S05/S05-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
