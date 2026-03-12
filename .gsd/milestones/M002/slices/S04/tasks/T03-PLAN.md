---
estimated_steps: 4
estimated_files: 4
---

# T03: Wire version and support visibility into the main landings

**Slice:** S04 — Version, Release, And Support Boundaries
**Milestone:** M002

## Description

Finish the slice by making the new boundary doc discoverable from the two main user-facing landings. The root README and `docs/README.md` should surface current version/support context quickly, but stay thin enough that S03’s concept-first path remains intact and S05/S06 still own the broader architecture and trust-surface work.

## Steps

1. Update `README.md` with a short version/support pointer that names the current stable line and links readers to `docs/release-and-support.md` for latest stable tag, released changes, compatibility, and limitations.
2. Update `docs/README.md` with a matching boundary pointer in the deeper-reference area while keeping the canonical guide sequence first.
3. Make any final wording adjustments in `docs/release-and-support.md` or `scripts/docs/verify-s04-boundaries.sh` so the landing summaries and the detailed boundary doc agree exactly.
4. Run the S04, S03, S01, and S02 doc verifiers together and fix any remaining drift until the full verification set passes.

## Must-Haves

- [ ] `README.md` exposes the current stable line and links directly to `docs/release-and-support.md` without displacing the primary recorder → events → analyzer path.
- [ ] `docs/README.md` exposes the same boundary surface without promoting maintainer-only material over the canonical user guides.
- [ ] `docs/release-and-support.md`, `README.md`, and `docs/README.md` use consistent wording about release truth, support envelope, and where to see released changes.
- [ ] `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, and `bash scripts/docs/verify-s02-doc-links.sh` all pass.

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
- `rg -n 'docs/release-and-support\.md' README.md docs/README.md`

## Observability Impact

- Signals added/changed: none beyond the verifier coverage already planned; this task closes the discoverability gap so the verifier can catch buried or inconsistent boundary surfaces.
- How a future agent inspects this: run the full verifier set, then inspect whichever landing or boundary doc the failing script names.
- Failure state exposed: navigation regressions are localized to a specific landing pointer or wording mismatch instead of showing up later as “version/support info is hard to find.”

## Inputs

- `README.md` — current concept-first root landing from S03 that must stay primary.
- `docs/README.md` — current docs landing that already separates user, maintainer, and historical surfaces.
- `docs/release-and-support.md` from T02 — detailed boundary surface that the landings must now expose.
- `scripts/docs/verify-s04-boundaries.sh` from T01/T02 — verifier that defines the landing/discoverability contract.

## Expected Output

- `README.md` — root landing with a thin version/support pointer into the new boundary doc.
- `docs/README.md` — docs landing with a matching boundary pointer that keeps user guides first.
- `docs/release-and-support.md` — final aligned boundary wording after landing integration.
- `scripts/docs/verify-s04-boundaries.sh` — passing release/support boundary verifier used in the slice completion check.
