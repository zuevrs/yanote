---
id: T02
parent: S05
milestone: M002
provides:
  - Primary root/docs/examples maps now expose the maintainer, traceability, historical-plan, and dist owner maps without changing the concept-first onboarding order.
key_files:
  - README.md
  - docs/README.md
  - examples/README.md
key_decisions:
  - Expose secondary branches through owner-map links on the primary landings, but keep canonical guides, the thin `docs/release-and-support.md` pointer, and runnable demos ahead of them.
patterns_established:
  - Primary landing pattern = canonical user/demo path first, secondary owner-map discoverability later, fallback bundles named only as explicitly secondary routes.
observability_surfaces:
  - `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/docs/verify-s05-navigation.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, and `bash scripts/docs/verify-s02-doc-links.sh`
duration: 16m
verification_result: passed
completed_at: 2026-03-12T22:22:11Z
blocker_discovered: false
---

# T02: Rewire the primary maps without promoting secondary surfaces

**Updated the root, docs, and examples landings to advertise the new secondary owner maps while keeping the verified user path and release/support delegation in front.**

## What Happened

I updated `README.md` so the existing concept → recorder → `events.jsonl` → analyzer → `yanote-report.json` story stayed intact, then rewired the secondary-surfaces section to point at the new owner maps for maintainer, traceability, historical plans, and offline/fallback bundles. The direct maintainer and traceability leaf links remain visible, but they now sit under the map-level entry instead of being the only way in.

In `docs/README.md`, I left the canonical guides, runnable demo branch, and thin `release-and-support.md` pointer in their existing order. I only expanded the secondary section so it explicitly lists `maintainers/README.md`, `traceability/README.md`, `plans/README.md`, and `../dist/README.md` as owner maps before the underlying leaf/reference docs.

In `examples/README.md`, I kept the repo-demo path and canonical docs links first, then added `../dist/README.md` as the recovery route when someone truly needs offline bundles. The copy still frames `dist/` as a secondary owner map rather than an alternate onboarding story.

I also recorded this IA rule in `.gsd/DECISIONS.md`, marked T02 complete in the slice plan, and advanced `.gsd/STATE.md` to T03.

## Verification

- Required task verification:
  - `bash scripts/docs/verify-s03-landing.sh` — passed
  - `bash scripts/docs/verify-s04-boundaries.sh` — passed
  - `bash scripts/docs/verify-s05-navigation.sh` — passed
- Slice-level verification stack:
  - `bash scripts/docs/verify-s01-doc-links.sh` — passed
  - `bash scripts/docs/verify-s02-doc-links.sh` — passed
  - `bash scripts/docs/verify-s03-landing.sh` — passed
  - `bash scripts/docs/verify-s04-boundaries.sh` — passed
  - `bash scripts/docs/verify-s05-navigation.sh` — passed

## Diagnostics

Inspect `README.md`, `docs/README.md`, and `examples/README.md`, then rerun the verifier stack above. Failures localize the regression by contract layer: S01/S02 for canonical doc links, S03 for primary landing ordering, S04 for release/support delegation, and S05 for secondary-surface routing.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md` — rewired the secondary-surfaces section to expose maintainer, traceability, plans, and dist owner maps without changing the primary onboarding story.
- `docs/README.md` — added explicit owner-map links for maintainer, traceability, plans, and dist secondary branches while preserving canonical-guide and release/support ordering.
- `examples/README.md` — added the dist owner-map route as a secondary offline path behind canonical docs.
- `.gsd/DECISIONS.md` — recorded the primary-map wiring rule for secondary owner-map discoverability.
- `.gsd/milestones/M002/slices/S05/S05-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action to T03.
