---
estimated_steps: 5
estimated_files: 6
---

# T03: Add recovery links to secondary leaf docs and rerun the full doc verifier stack

**Slice:** S05 — Documentation Architecture And Navigation
**Milestone:** M002

## Description

Close the deep-link problem by adding explicit owner/audience clauses to the secondary leaf docs that readers are likely to open directly from GitHub or search results. This task completes the usable navigation loop for **R029** and supports **R022**, **R023**, **R027**, and **R030** by making release/support, requirements, traceability, maintainer, and fallback surfaces recoverable instead of dead ends.

## Steps

1. Add short owner/backlink clauses to `docs/release-and-support.md` and `docs/requirements.md` that send readers back to `docs/README.md` while preserving each file as an authoritative owner for its own scope.
2. Add maintainer/history recovery links to `docs/maintainers/release-signing.md` and `docs/traceability/v1-requirements-tests.md` so direct entry into those leaves still points back to the right map.
3. Add parent recovery links to `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md`, pointing both to `dist/README.md` and to the canonical guide that supersedes each fallback path.
4. Keep all wording additive: do not move tool-coupled files, do not duplicate release/support truth outside `docs/release-and-support.md`, and do not publish S07-style local `AGENTS.md` workflow material.
5. Run the full S01-S05 documentation verifier stack and resolve any regressions until the whole slice-level contract passes together.

## Must-Haves

- [ ] Every listed secondary leaf doc contains an explicit audience/owner clause and a recovery path to the correct landing page.
- [ ] `bash scripts/docs/verify-s01-doc-links.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/docs/verify-s05-navigation.sh` all pass together.

## Verification

- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
- Spot-check the updated leaf docs to confirm each “return to owner map” link matches the intended audience surface.

## Observability Impact

- Signals added/changed: none at runtime; drift now becomes visible through a failing verifier on the exact leaf doc that lost its backlink or secondary/fallback wording.
- How a future agent inspects this: open the affected leaf doc named by the verifier and rerun the full S01-S05 verifier stack after edits.
- Failure state exposed: missing or misrouted recovery links in secondary leaves become explicit instead of requiring manual repo browsing.

## Inputs

- `docs/maintainers/README.md`, `docs/traceability/README.md`, `docs/plans/README.md`, `dist/README.md` — T01 owner maps that secondary leaves must link back to.
- `docs/release-and-support.md`, `docs/requirements.md`, `docs/maintainers/release-signing.md`, `docs/traceability/v1-requirements-tests.md`, `dist/flatdir-recorder/README.md`, `dist/node-analyzer/README.md` — existing secondary leaves that currently act as dead ends.
- `scripts/docs/verify-s01-doc-links.sh`, `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`, `scripts/docs/verify-s05-navigation.sh` — full documentation contract suite to keep earlier slices intact.

## Expected Output

- `docs/release-and-support.md` — boundary owner doc with a recovery link back to the docs map.
- `docs/requirements.md` — public requirements inventory with a recovery link back to the docs map.
- `docs/maintainers/release-signing.md` — maintainer leaf with a backlink to `docs/maintainers/README.md`.
- `docs/traceability/v1-requirements-tests.md` — traceability leaf with a backlink to `docs/traceability/README.md`.
- `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md` — fallback leaves that point to `dist/README.md` and the canonical guides they do not replace.
