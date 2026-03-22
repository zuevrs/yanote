---
estimated_steps: 4
estimated_files: 2
---

# T01: Codify the public boundary contract and seed the reference surface

**Slice:** S04 — Version, Release, And Support Boundaries
**Milestone:** M002

## Description

Create the executable contract for S04 before changing public wording, then add the future owner file for release/support boundaries so later tasks can fill one stable surface instead of scattering version claims across the repo.

## Steps

1. Create `scripts/docs/verify-s04-boundaries.sh` so it resolves the latest `v*` tag and expected release line, then checks for the dedicated boundary doc, required release/support sections, GitHub Releases visibility, root/docs landing pointers, and explicit non-authoritative handling of `0.1.0-SNAPSHOT` and analyzer `0.0.0` markers.
2. Run the new verifier against the current repo state and keep its failures targeted to missing S04 clauses or links instead of vague generic output.
3. Add an initial Russian-first `docs/release-and-support.md` skeleton with sections for current stable line, latest stable release, current repository state vs release, stable surfaces, compatibility assumptions, limitations, and fallback boundaries.
4. Re-run the S03, S01, and S02 doc verifiers to confirm the new stub work does not regress the already-verified landing and guide contracts.

## Must-Haves

- [ ] `scripts/docs/verify-s04-boundaries.sh` exists and reports targeted failures that name the missing section, broken pointer, or misleading version-source clause.
- [ ] `docs/release-and-support.md` exists as a real public entry surface with the final section structure, not a placeholder TODO.
- [ ] The verifier resolves the latest stable tag dynamically instead of hardcoding the current release tag.
- [ ] S03/S01/S02 documentation verifiers still pass after the new S04 contract files are added.

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh` — expected to fail only on still-missing S04 content or landing links until T02/T03 complete.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability Impact

- Signals added/changed: targeted shell assertion messages that print the resolved latest tag/release line and the exact missing S04 clause.
- How a future agent inspects this: run `bash scripts/docs/verify-s04-boundaries.sh` first, then the S03/S01/S02 verifiers to see whether the regression is new to S04 or inherited from an older landing contract.
- Failure state exposed: the verifier output identifies whether the break is in release visibility, support-boundary wording, landing discoverability, or version-source disclaimers.

## Inputs

- `.gsd/milestones/M002/slices/S04/S04-RESEARCH.md` — defines the slice risks, recommended one-doc strategy, and required boundary clauses.
- `README.md` — current concept-first landing that T03 will later extend with a thin version/support pointer.
- `docs/README.md` — current docs landing that needs a later boundary pointer without losing user-first guide ordering.
- `docs/maintainers/release-signing.md` — current maintainer-only release truth source for the public line and signing workflow.
- `gradle.properties`, `yanote-js/package.json`, `dist/node-analyzer/package.json` — non-authoritative version markers the verifier must guard against being promoted.

## Expected Output

- `scripts/docs/verify-s04-boundaries.sh` — executable release/support boundary verifier with dynamic tag resolution and targeted diagnostics.
- `docs/release-and-support.md` — initial public boundary document skeleton with the final section shape.
