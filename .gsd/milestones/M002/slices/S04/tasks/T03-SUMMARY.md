---
id: T03
parent: S04
milestone: M002
provides:
  - `README.md` and `docs/README.md` now expose the current stable line `v1.0.x` and point readers to `docs/release-and-support.md` for release truth, GitHub Releases, compatibility, and limitation details.
  - `scripts/docs/verify-s04-boundaries.sh` now guards stable-line visibility on both main landings in addition to the authoritative boundary doc.
key_files:
  - README.md
  - docs/README.md
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/DECISIONS.md
key_decisions:
  - Keep the root and docs landings thin, but require both to name the current stable line and defer detailed release/support truth to `docs/release-and-support.md`.
patterns_established:
  - Landing-level boundary checks can stay lightweight by asserting the release/support link plus the dynamically resolved stable line, while the owner doc continues to hold the detailed support-envelope clauses.
observability_surfaces:
  - bash scripts/docs/verify-s04-boundaries.sh
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 25m
verification_result: passed
completed_at: 2026-03-13 00:59:21 +0300
blocker_discovered: false
---

# T03: Wire version and support visibility into the main landings

**Added thin release/support pointers to the root and docs landings and closed S04 with the full documentation verifier set green.**

## What Happened

Added a short root-level callout in `README.md` that names the current public stable line `v1.0.x` and sends release/support questions to `docs/release-and-support.md` instead of expanding the landing into a changelog or support-policy page.

Updated `docs/README.md` in the deeper-reference section with the matching release/support pointer so the canonical guide sequence still comes first, while readers who already understand the main recorder → `events.jsonl` → analyzer path can jump straight to the boundary surface.

Tightened `scripts/docs/verify-s04-boundaries.sh` so it now checks not only that both landings link to `docs/release-and-support.md`, but also that they expose the dynamically resolved stable line. This locks the intended thin-pointer contract into the slice diagnostics.

Recorded the landing-pointer decision in `.gsd/DECISIONS.md`, marked T03 complete in the slice plan, updated `.gsd/PROJECT.md` so the project snapshot no longer treats version visibility as an open gap, and advanced `.gsd/STATE.md` to reflect that S04 is complete and ready for roadmap reassessment.

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh` — passed
- `rg -n 'docs/release-and-support\.md|release-and-support\.md|v1\.0\.x' README.md docs/README.md` — confirmed both landings expose the stable line and boundary link
- `git diff --check` — passed

## Diagnostics

Run `bash scripts/docs/verify-s04-boundaries.sh` first when touching release/support wording or either landing. It prints the resolved latest stable tag, expected release line, GitHub Releases URL, and `HEAD` vs latest-tag relation before naming the exact missing landing clause or boundary-doc drift.

If the S04 verifier passes but a broader docs regression is suspected, rerun `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, and `bash scripts/docs/verify-s02-doc-links.sh` to localize whether the problem is in landing ordering, recorder docs, or tagging/docs links.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md` — added a thin release/support callout with the current stable line and a direct pointer to `docs/release-and-support.md`.
- `docs/README.md` — added the matching deeper-reference release/support pointer without changing the canonical guide ordering.
- `scripts/docs/verify-s04-boundaries.sh` — extended the S04 verifier to require the current stable line on both main landings.
- `.gsd/DECISIONS.md` — recorded the thin-pointer landing contract for release/support visibility.
- `.gsd/milestones/M002/slices/S04/S04-PLAN.md` — marked T03 complete.
- `.gsd/PROJECT.md` — updated the living project snapshot to reflect that release/support visibility is now wired through the public landings.
- `.gsd/STATE.md` — recorded that S04 is complete and ready for roadmap reassessment.
