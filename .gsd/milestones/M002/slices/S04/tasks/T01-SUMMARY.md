---
id: T01
parent: S04
milestone: M002
provides:
  - Dynamic S04 release/support boundary verification tied to the latest stable `v*` tag instead of a hardcoded release number.
  - A Russian-first public owner doc for release visibility, repository-vs-release distinction, stable surfaces, compatibility assumptions, limitations, and fallback boundaries.
key_files:
  - scripts/docs/verify-s04-boundaries.sh
  - docs/release-and-support.md
key_decisions:
  - Keep `docs/release-and-support.md` as the single public owner surface for S04 and leave root/docs landings as thin pointers for T03.
  - Make the S04 verifier resolve the latest `v*` tag at runtime and reject `0.1.0-SNAPSHOT` / analyzer `0.0.0` markers as public release truth.
patterns_established:
  - Documentation boundary verifiers should print the resolved tag/line context first, skip duplicate clause noise when the owner doc is missing, and name the exact missing section or landing pointer.
observability_surfaces:
  - bash scripts/docs/verify-s04-boundaries.sh
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 25m
verification_result: passed
completed_at: 2026-03-13 00:49:16 +0300
blocker_discovered: false
---

# T01: Codify the public boundary contract and seed the reference surface

**Added the dynamic S04 boundary verifier and seeded `docs/release-and-support.md` as the public release/support owner surface.**

## What Happened

Added `scripts/docs/verify-s04-boundaries.sh` as the executable contract for S04. The script now resolves the latest stable `v*` tag at runtime, derives the expected `vMAJOR.MINOR.x` release line, prints the GitHub Releases surface plus `HEAD` vs latest-tag relation, and checks the dedicated boundary doc, required section headings, latest stable tag/line wording, GitHub Releases visibility, repository-vs-release wording, non-authoritative handling of `0.1.0-SNAPSHOT` and analyzer `0.0.0` markers, and landing pointers from `README.md` / `docs/README.md`.

Ran the verifier immediately after creating it against the pre-doc tree. It failed narrowly on exactly three gaps: the missing `docs/release-and-support.md` file and the two not-yet-added landing pointers. That confirmed the contract was specific instead of vague.

Added `docs/release-and-support.md` as a Russian-first public owner surface with the final section shape for S04: current stable line, latest stable release, repository state vs release, stable surfaces, compatibility assumptions, limitations, and fallback boundaries. The seed content already points readers at tags/GitHub Releases for public version truth, distinguishes `HEAD` from the last published release, names the current stable line and latest stable tag, captures the current stable surfaces, and explicitly demotes `0.1.0-SNAPSHOT` plus analyzer `0.0.0` markers.

Re-ran the S04 verifier after the doc landed. At that point the only remaining failures were the intentional T03 gaps: missing release/support links from `README.md` and `docs/README.md`.

## Verification

- `bash -n scripts/docs/verify-s04-boundaries.sh` — passed
- `bash scripts/docs/verify-s04-boundaries.sh` — expected partial failure, localized to:
  - `README.md` missing `docs/release-and-support.md`
  - `docs/README.md` missing `release-and-support.md`
- `bash scripts/docs/verify-s03-landing.sh` — passed
- `bash scripts/docs/verify-s01-doc-links.sh` — passed
- `bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s04-boundaries.sh` first when touching release/support wording. It prints the resolved latest stable tag, expected release line, GitHub Releases URL, and how far `HEAD` is from the latest stable tag, then reports the exact missing section, misleading version-source clause, or landing pointer.

If S04 fails but `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, and `bash scripts/docs/verify-s02-doc-links.sh` still pass, the regression is local to the new release/support surface rather than the older landing/guide contracts.

## Deviations

None.

## Known Issues

- `README.md` and `docs/README.md` do not link to `docs/release-and-support.md` yet, so `bash scripts/docs/verify-s04-boundaries.sh` still fails on those two targeted T03-owned pointers.

## Files Created/Modified

- `scripts/docs/verify-s04-boundaries.sh` — added the dynamic S04 doc-boundary verifier with targeted diagnostics for missing clauses, misleading version sources, and missing landing pointers.
- `docs/release-and-support.md` — added the Russian-first public owner doc for release visibility and support boundaries with the final section structure.
- `.gsd/milestones/M002/slices/S04/S04-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the slice state to T02.
