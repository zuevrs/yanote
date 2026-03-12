---
id: T03
parent: S05
milestone: M002
provides:
  - Secondary release/support, requirements, maintainer, traceability, and `dist/` leaf docs now open with audience/owner recovery clauses instead of acting as dead ends.
  - `scripts/docs/verify-s05-navigation.sh` now guards secondary leaf recovery links and fallback-guide backlinks in addition to secondary landing pages.
key_files:
  - scripts/docs/verify-s05-navigation.sh
  - docs/release-and-support.md
  - docs/requirements.md
  - docs/maintainers/release-signing.md
  - docs/traceability/v1-requirements-tests.md
  - dist/flatdir-recorder/README.md
  - dist/node-analyzer/README.md
  - .gsd/PROJECT.md
key_decisions:
  - Require direct-entry secondary leaf docs to open with an audience/owner clause plus a backlink to their owning map; `dist/` leaves also point back to the canonical guide they do not replace.
patterns_established:
  - Secondary leaf contract = top-of-file audience label + explicit return path to the owning map + canonical-guide backlink for fallback bundles, enforced by the S05 verifier.
observability_surfaces:
  - `bash scripts/docs/verify-s05-navigation.sh`
  - `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
duration: 22m
verification_result: passed
completed_at: 2026-03-13 01:29:01 +0300
blocker_discovered: false
---

# T03: Add recovery links to secondary leaf docs and rerun the full doc verifier stack

**Added owner-map recovery clauses to the planned secondary leaf docs, taught the S05 verifier to enforce them, and closed the slice with the full S01-S05 documentation stack green.**

## What Happened

I extended `scripts/docs/verify-s05-navigation.sh` first so the task would be observable instead of relying on a one-off copy edit. The updated verifier now checks the six planned secondary leaves for audience wording, explicit recovery links, and — for the two `dist/` leaves — backlinks both to `dist/README.md` and to the canonical guide each bundle does not replace.

Running the tightened S05 verifier immediately exposed the real gap: 21 path-specific failures across `docs/release-and-support.md`, `docs/requirements.md`, `docs/maintainers/release-signing.md`, `docs/traceability/v1-requirements-tests.md`, `dist/flatdir-recorder/README.md`, and `dist/node-analyzer/README.md`.

I then added short top-of-file recovery blocks to each leaf without moving ownership or duplicating product truth:

- `docs/release-and-support.md` stays the public boundary owner, but now sends direct-entry readers back to `docs/README.md` when they need the broader docs map.
- `docs/requirements.md` stays the canonical requirements inventory and now points direct-entry readers back to `docs/README.md`.
- `docs/maintainers/release-signing.md` now identifies itself as a maintainer-only leaf and routes readers back to `docs/maintainers/README.md`.
- `docs/traceability/v1-requirements-tests.md` now identifies itself as a reference-only leaf and links back to both `docs/traceability/README.md` and `docs/requirements.md`.
- `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md` now route direct-entry readers first to `dist/README.md`, then to their canonical recorder/analyzer guides so the offline bundles stay explicitly secondary.

Because this completed S05, I also recorded the leaf-recovery rule in `.gsd/DECISIONS.md`, updated `.gsd/PROJECT.md` so the project snapshot reflects that the docs architecture/navigation slice is no longer open, marked T03 complete in the slice plan, and updated `.gsd/STATE.md` to show S05 complete and ready for roadmap reassessment.

## Verification

- `bash scripts/docs/verify-s05-navigation.sh` — failed first with 21 exact `ERROR:` lines naming the missing leaf-doc clauses, then passed after the edits.
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh` — passed.
- `git diff --check` — passed.
- Spot-checked the updated leaf-doc intros to confirm each recovery link points to the intended owner map and that the `dist/` leaves still demote themselves beneath canonical guides.

## Diagnostics

Run `bash scripts/docs/verify-s05-navigation.sh` when touching any secondary landing or secondary leaf doc. It now reports deterministic `ERROR:` lines for:

- missing audience/owner clauses on secondary leaves
- missing owner-map backlinks from deep-link entry docs
- missing canonical-guide backlinks on `dist/` fallback leaves
- recovery-link ordering regressions that move the return path below leaf-local content

If S05 passes but a broader documentation regression is suspected, rerun the full S01-S05 stack in the command listed above to localize whether the drift is in canonical guides, landing ordering, boundary ownership, or secondary-surface recovery.

## Deviations

- Updated `scripts/docs/verify-s05-navigation.sh` even though the task-plan file list focused on markdown leaves; without that verifier change, the new recovery clauses would not have been machine-checked and future regressions would remain invisible.
- Updated `.gsd/PROJECT.md` because T03 closes the slice and the prior project snapshot still described docs architecture/navigation as open work.

## Known Issues

None.

## Files Created/Modified

- `scripts/docs/verify-s05-navigation.sh` — extended the S05 contract to check recovery links and audience wording on the planned secondary leaf docs.
- `docs/release-and-support.md` — added a public-boundary owner clause and a recovery link back to `docs/README.md`.
- `docs/requirements.md` — added a requirements-owner clause and a recovery link back to `docs/README.md`.
- `docs/maintainers/release-signing.md` — added a maintainer-only leaf clause and a backlink to `docs/maintainers/README.md`.
- `docs/traceability/v1-requirements-tests.md` — added a reference-only leaf clause plus backlinks to the traceability map and canonical requirements inventory.
- `dist/flatdir-recorder/README.md` — added fallback-leaf recovery links to `dist/README.md` and the canonical recorder guide.
- `dist/node-analyzer/README.md` — added fallback-leaf recovery links to `dist/README.md` and the canonical analyzer guide.
- `.gsd/DECISIONS.md` — recorded the secondary leaf recovery contract.
- `.gsd/PROJECT.md` — updated the project snapshot to reflect that docs architecture/navigation is now in place and machine-checked.
- `.gsd/milestones/M002/slices/S05/S05-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — marked S05 complete and set the next action to roadmap reassessment before S06.
