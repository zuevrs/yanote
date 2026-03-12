---
estimated_steps: 4
estimated_files: 3
---

# T02: Rewire the primary maps without promoting secondary surfaces

**Slice:** S05 — Documentation Architecture And Navigation
**Milestone:** M002

## Description

Update the three main navigation surfaces — root, docs, and examples — so they acknowledge the new maintainer/traceability/history/dist maps while preserving the concept-first onboarding and release/support ownership established in S03 and S04. This task supports **R022**, **R023**, and **R027** while keeping **R029** honest: the user path must still stay first even after secondary navigation improves.

## Steps

1. Update `README.md` so the primary concept → recorder → `events.jsonl` → analyzer → `yanote-report.json` story remains first, but the new secondary maps are discoverable from the secondary surfaces section.
2. Update `docs/README.md` so maintainer, traceability, plans, and dist/fallback maps are listed explicitly as secondary branches without displacing canonical guides or the thin pointer to `docs/release-and-support.md`.
3. Update `examples/README.md` so runnable demos still point back to canonical docs first while also routing readers to the new fallback-bundle map when they truly need offline assets.
4. Re-run the S03, S04, and S05 verifiers and adjust ordering/copy until all three agree on the intended navigation hierarchy.

## Must-Haves

- [ ] `README.md`, `docs/README.md`, and `examples/README.md` expose the new secondary maps without moving maintainer/history/fallback content ahead of canonical user and demo guidance.
- [ ] The stable-line pointer and single-owner release/support pattern from S04 remain intact after the navigation updates.

## Verification

- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`

## Observability Impact

- Signals added/changed: none beyond the existing and new documentation verifier failures that now validate ordering and owner routing across all three landings.
- How a future agent inspects this: read the three landing pages, then rerun the S03/S04/S05 verifier trio.
- Failure state exposed: verifier output identifies whether the regression is in product-story ordering, release/support delegation, or secondary-map discoverability.

## Inputs

- `README.md` — current concept-first product landing from S03.
- `docs/README.md` and `examples/README.md` — existing directory maps that need secondary-surface wiring.
- `docs/maintainers/README.md`, `docs/traceability/README.md`, `docs/plans/README.md`, `dist/README.md` — T01 outputs that the primary maps must now reference.

## Expected Output

- `README.md` — updated root navigation that exposes secondary maps without changing primary onboarding order.
- `docs/README.md` — updated docs map with explicit secondary branches.
- `examples/README.md` — updated examples map that points to canonical docs first and dist fallback only as a secondary path.
