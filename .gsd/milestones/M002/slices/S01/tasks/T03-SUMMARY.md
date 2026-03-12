---
id: T03
parent: S01
milestone: M002
provides:
  - "Root and fallback recorder docs now point to one canonical Spring MVC guide with consistent recommended-vs-fallback wording."
  - "An executable doc-contract script now fails closed on broken recorder doc links or missing smoke/offline fallback language."
key_files:
  - README.md
  - dist/flatdir-recorder/README.md
  - scripts/docs/verify-s01-doc-links.sh
key_decisions:
  - "Protected the recorder onboarding surfaces with an executable doc-contract script instead of relying on manual README review."
patterns_established:
  - "Repository entry docs should link to the canonical setup guide and name fallbacks explicitly instead of duplicating setup instructions."
  - "Fallback docs should state when they are still useful, link back to the primary guide, and keep smoke/offline boundary wording machine-checkable."
observability_surfaces:
  - "`scripts/docs/verify-s01-doc-links.sh` reports the exact missing file, link, or fallback phrase before README edits can drift."
duration: 30m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T03: Wire root and fallback docs to the canonical recorder path

**Updated the root and flatDir entry docs to advertise one canonical recorder path and added a script that fails on broken links or softened fallback language.**

## What Happened

I rewired the repository entry surfaces so new users land on the verified dependency-based Spring MVC recorder guide first instead of discovering competing setup stories.

In `README.md` I replaced the old inline recorder setup/fallback copy with a short navigation section that names the verified S01 journey explicitly: canonical guide, runnable service example, RestAssured metadata handoff example, and the smoke/offline fallback. The root README now calls `docs/guides/recorder-spring-mvc.md` the recommended path and keeps only the recorder property names as quick orientation.

In `dist/flatdir-recorder/README.md` I rewrote the intro so the bundle no longer reads like the primary integration story. It is now labeled as a `smoke/offline-only fallback`, explains the concrete cases where it is still useful, and links back to the canonical dependency-based guide at the top and again after the smoke proof steps.

Then I added `scripts/docs/verify-s01-doc-links.sh`, which checks the root README, canonical guide, both example READMEs, and the flatDir README for the required cross-links plus the wording that preserves the recommended-vs-fallback boundary. The script fails closed on missing files, missing links, or missing smoke/offline language and prints the exact missing contract fragment.

## Verification

- `bash scripts/docs/verify-s01-doc-links.sh` ✅
- `rg -n "recorder-spring-mvc|smoke|offline" README.md dist/flatdir-recorder/README.md docs/guides/recorder-spring-mvc.md` ✅
- `bash scripts/docs/verify-s01-recorder-path.sh` ✅
  - passed with `method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`
- Slice-level verification status: both required checks now pass
  - `bash scripts/docs/verify-s01-recorder-path.sh` ✅
  - `bash scripts/docs/verify-s01-doc-links.sh` ✅

## Diagnostics

Future agents should run `bash scripts/docs/verify-s01-doc-links.sh` before editing recorder onboarding docs. It exposes three concrete failure classes without extra investigation:

- missing required doc files;
- broken or removed cross-links between root/canonical/example/fallback docs;
- missing fallback-boundary wording such as `smoke/offline-only fallback` or the demotion back to the canonical guide.

For the runtime proof path, `bash scripts/docs/verify-s01-recorder-path.sh` remains the companion executable check.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md` — root landing now points to the canonical Spring MVC recorder guide and names the verified journey stages consistently.
- `dist/flatdir-recorder/README.md` — flatDir bundle doc now reads as a smoke/offline-only fallback and links back to the primary guide.
- `scripts/docs/verify-s01-doc-links.sh` — executable doc-contract check for cross-links and fallback warning language.
- `.gsd/milestones/M002/slices/S01/S01-PLAN.md` — marked T03 complete.
