---
estimated_steps: 5
estimated_files: 5
---

# T01: Lock the S05 navigation contract and add secondary landing pages

**Slice:** S05 — Documentation Architecture And Navigation
**Milestone:** M002

## Description

Create the navigation contract that will define S05 as done, then use it to add the missing parent landing pages for maintainer, traceability, historical-plan, and fallback-bundle surfaces. This is the slice boundary task for **R029**: until these directories have owned maps and a verifier, the repo still depends on accidental browsing instead of a documentation architecture.

## Steps

1. Create `scripts/docs/verify-s05-navigation.sh`, following the explicit shell-assertion style already used by the S03 and S04 documentation verifiers.
2. Encode checks for secondary README existence, audience wording, backlink ownership, and fallback/offline positioning, then run the script once to confirm it fails against the current tree.
3. Add `docs/maintainers/README.md` with a maintainer-only audience label, mixed-language signpost, and return path to `docs/README.md`.
4. Add `docs/traceability/README.md`, `docs/plans/README.md`, and `dist/README.md` so historical/reference/fallback directories each explain what they own and where users should return for canonical guidance.
5. Re-run `bash scripts/docs/verify-s05-navigation.sh` until the new landing pages satisfy the contract without moving tool-coupled leaf files.

## Must-Haves

- [ ] `scripts/docs/verify-s05-navigation.sh` exists and fails on missing secondary README/backlink/order conditions with path-specific assertions.
- [ ] `docs/maintainers/README.md`, `docs/traceability/README.md`, `docs/plans/README.md`, and `dist/README.md` exist and route readers back to the correct owner map or canonical guides.

## Verification

- `bash scripts/docs/verify-s05-navigation.sh`
- Manual failure expectation before content lands: the first script run should fail because the required landing pages do not exist yet.

## Observability Impact

- Signals added/changed: deterministic `ERROR:` lines in `scripts/docs/verify-s05-navigation.sh` for missing landing pages, missing owner links, and mis-scoped fallback wording.
- How a future agent inspects this: run `bash scripts/docs/verify-s05-navigation.sh` and inspect the named failing path/assertion.
- Failure state exposed: the exact secondary directory or README clause that drifted becomes visible at script exit.

## Inputs

- `scripts/docs/verify-s03-landing.sh` — established pattern for shell-based documentation boundary assertions.
- `scripts/docs/verify-s04-boundaries.sh` — established pattern for protecting a single owner document while keeping landings thin.
- `docs/README.md` — existing user-facing documentation map that the new secondary landings must route back to.

## Expected Output

- `scripts/docs/verify-s05-navigation.sh` — executable S05 navigation verifier covering directory landing and backlink contracts.
- `docs/maintainers/README.md` — maintainer landing page for maintainer-only surfaces.
- `docs/traceability/README.md` — traceability/reference landing page.
- `docs/plans/README.md` — historical plans landing page.
- `dist/README.md` — fallback-bundle landing page that keeps offline assets secondary.
