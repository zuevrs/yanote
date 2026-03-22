# S05 — Research

**Date:** 2026-03-12

## Summary

S05 primarily owns **R029** (documentation architecture that separates user docs, maintainer docs, and historical artifacts). It also materially supports **R022**, **R023**, **R027**, and **R030** by preserving the concept-first landing, keeping the verified recorder/analyzer path easy to find, exposing the already-established release/support owner surface, and creating stable homes that S06 can later use for trust/policy surfaces.

The main user-facing path is no longer the problem. `README.md`, `docs/README.md`, `examples/README.md`, the S01/S02 guide graph, and the S04 release/support owner doc are already coherent and machine-checked. All current documentation verifiers pass, and a local markdown-link sweep found no broken relative links. The gap is **secondary-surface navigation**: `docs/maintainers/`, `docs/traceability/`, `docs/plans/`, and `dist/` do not have their own landing pages, while leaf secondary docs like `docs/release-and-support.md`, `docs/requirements.md`, `docs/maintainers/release-signing.md`, `docs/traceability/v1-requirements-tests.md`, and both fallback bundle READMEs provide no recovery link back to an owning map.

The biggest constraint is path stability. `docs/release-and-support.md` is already the machine-checked public owner for release/support truth, while `docs/requirements.md` and `docs/traceability/*` are consumed directly by release workflow/tests. So S05 should be **additive, not path-churning**: add explicit secondary landings and backlink patterns at current paths, then add an S05 verifier that protects the architecture. That gets the repo out of “good main landing, accidental secondary browsing” without reopening S03/S04 or breaking release tooling.

## Recommendation

Take an additive documentation-IA pass with four parts:

1. **Keep current canonical owners where they are.** Do not move `README.md`, `docs/README.md`, `examples/README.md`, `docs/release-and-support.md`, `docs/requirements.md`, `docs/guides/*`, or `docs/traceability/*` unless there is a tool-driven reason and the scripts are updated in the same slice.
2. **Add stable landing pages for secondary surfaces.** The clearest gaps are `docs/maintainers/README.md`, `docs/traceability/README.md`, `docs/plans/README.md`, and `dist/README.md`. Optional: `docs/guides/README.md` if direct directory browsing of `docs/guides/` should also become explicit.
3. **Add recovery links and ownership clauses on leaf secondary docs.** Each should say what audience it serves and where to go back: user docs map, maintainer map, historical map, or fallback/dist map. `examples/README.md` already shows the right pattern by telling readers not to treat generated artifacts as navigation surfaces.
4. **Add an S05 verifier instead of relying on prose discipline.** It should assert that secondary directories have landing pages, that secondary leaf docs link back to their owner surface, that `dist/` is clearly marked fallback/offline-only, and that root/docs landings keep canonical user guides ahead of maintainer/history/fallback surfaces.

This is the lowest-risk route because it improves the repository’s architecture without breaking S03/S04 contracts or touching release-coupled paths. It also leaves clean extension points for S06 trust files and S07 local-only maintainer workflow documentation.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Docs drift after a slice lands | `scripts/docs/verify-s03-landing.sh` and `scripts/docs/verify-s04-boundaries.sh` | The repo already uses targeted shell verifiers to lock documentation contracts; S05 should follow the same pattern instead of relying on human review. |
| Directory browsing without context | `docs/README.md`, `examples/README.md`, and example-leaf backlinks | S03 already established a proven landing + backlink pattern. Reuse it for maintainer/history/dist surfaces instead of inventing a new navigation style. |
| Release/support truth duplicated across many docs | `docs/release-and-support.md` + dynamic tag-based checks in `scripts/docs/verify-s04-boundaries.sh` | S04 already settled one authoritative public owner. S05 should route readers to it, not spread version/support claims further. |
| Traceability/reference path churn | `docs/requirements.md`, `docs/traceability/*`, and release scripts/workflows that consume them directly | These files already participate in release validation and asset assembly; moving them for aesthetics alone adds avoidable risk. |

## Existing Code and Patterns

- `README.md` — stable concept-first product landing. It already demotes maintainer/traceability/history into a secondary section and must remain the top-level user entry surface.
- `docs/README.md` — current documentation map. It already separates canonical guides, runnable demos, deeper reference, and maintainer/history, so S05 should refine this map rather than replace it.
- `examples/README.md` — strongest reusable navigation pattern for this slice: clear demo ownership, warnings about generated artifacts, and explicit “go back to docs” routing.
- `scripts/docs/verify-s03-landing.sh` — model for architecture verification via explicit headings/link/order assertions.
- `scripts/docs/verify-s04-boundaries.sh` — model for owner-doc verification where one authoritative file holds deeper truth and landings only provide thin pointers.
- `docs/release-and-support.md` — fixed public owner for release/support boundaries. S05 must preserve its path and role.
- `docs/requirements.md` — public product/reference inventory, distinct from `.gsd/REQUIREMENTS.md`; it should not be treated as a duplicate planning file.
- `.github/workflows/release.yml`, `scripts/release/traceability.contract.test.mjs`, `scripts/release/assemble-release-assets.sh` — these hard-code `docs/requirements.md` and `docs/traceability/*`, which makes aggressive re-homing expensive.
- `docs/maintainers/release-signing.md` — real maintainer-only surface, but today it is a leaf doc without a maintainer landing or backlink pattern.
- `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md` — both already label themselves fallback/offline-only, but `dist/` has no parent landing and the leaf docs have no recovery link.

## Constraints

- S05 owns **R029** and must preserve support for **R022**, **R023**, **R027**, and future **R030** trust-surface placement.
- Public user documentation remains **Russian-first**. Maintainer and historical materials can remain mixed English/Russian, but that language shift must be clearly signposted by navigation.
- `docs/release-and-support.md` is already the public release/support owner and is machine-checked by `scripts/docs/verify-s04-boundaries.sh`.
- `docs/requirements.md` and `docs/traceability/*` are referenced directly by release workflow/tests (`.github/workflows/release.yml`, `scripts/release/traceability.contract.test.mjs`, `scripts/release/assemble-release-assets.sh`). Moving them means coordinated script changes.
- Existing S01-S04 documentation verifiers already pass. S05 should not regress those contracts while improving navigation.
- `examples/build/*`, `dist/flatdir-recorder/libs/*`, and `dist/node-analyzer/*` can exist locally as ignored/generated outputs. Navigation must continue steering readers to README surfaces rather than raw artifacts.
- `AGENTS.md` remains intentionally out of scope for public tracked docs until S07. S05 should not create a public maintainer workflow surface that accidentally pre-solves S07 in the wrong place.

## Common Pitfalls

- **Re-homing machine-anchored docs just to make the tree prettier** — `docs/requirements.md`, `docs/traceability/*`, and `docs/release-and-support.md` are already coupled to tooling and verifiers. Prefer additive landings/backlinks first.
- **Promoting fallback or maintainer surfaces too high in navigation** — `dist/*` and `docs/maintainers/*` are real, but S03/S04 already established that the primary story is concept → recorder → `events.jsonl` → analyzer → report. Keep that ordering intact.
- **Treating `.gsd/REQUIREMENTS.md` and `docs/requirements.md` as the same artifact** — they serve different audiences. One is internal planning/state; the other is the public product/reference inventory.
- **Stopping at “all links resolve”** — the link graph is already healthy. The problem here is recovery navigation and truthful ownership after a reader lands in a secondary or fallback surface.
- **Leaving secondary leaf docs as dead ends** — today the biggest navigation gap is not the main landing; it is what happens after a direct click into maintainer, traceability, historical, or fallback docs.

## Open Risks

- If S05 only edits landing prose and does not add a dedicated verifier, S06/S07 can easily reintroduce raw-file browsing or secondary-surface drift.
- If maintainer/history/fallback directories remain without their own landing pages, direct GitHub directory browsing will still drop readers into mixed-language or stale-looking material with no clear “back to the right map” recovery path.
- If `dist/` remains unmapped at the parent level, fallback bundles can keep looking more primary than intended to repo browsers who scan the directory tree instead of reading the root landing first.
- If S05 overreaches into moving tool-coupled reference files, it risks breaking release automation for an organizational improvement that can be achieved more safely with additive structure.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Documentation architecture / technical writing | `supercent-io/skills-template@technical-writing` | available, not installed — strongest external match found (`npx skills find "technical writing"`) |
| Repository README/docs scaffolding | `github/awesome-copilot@readme-blueprint-generator` | available, not installed — relevant but narrower than this slice (`npx skills find "github repository docs"`) |
| Markdown documentation | `aj-geddes/useful-ai-prompts@markdown-documentation` | available, not installed — lower-signal fallback option (`npx skills find "markdown documentation"`) |
| Installed local skills | none directly relevant | `debug-like-expert`, `frontend-design`, `playwright-cli`, and `swiftui` exist locally, but none are a direct fit for repository documentation IA work |

## Sources

- The primary user/demo/release navigation contract already exists and passes verification. (source: `README.md`, `docs/README.md`, `examples/README.md`, `scripts/docs/verify-s01-doc-links.sh`, `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`)
- The strongest remaining gap is secondary-surface recovery navigation: several secondary directories have no landing pages, and secondary leaf docs have no backlink pattern. (source: directory inventory of `docs/`, `examples/`, `dist/`; `docs/maintainers/release-signing.md`; `docs/traceability/v1-requirements-tests.md`; `dist/flatdir-recorder/README.md`; `dist/node-analyzer/README.md`)
- `docs/requirements.md` and `docs/traceability/*` are tool-coupled and should not be moved casually. (source: `.github/workflows/release.yml`, `scripts/release/traceability.contract.test.mjs`, `scripts/release/assemble-release-assets.sh`, `docs/traceability/v1-requirements-tests.md`)
- `docs/release-and-support.md` is already the single public owner for release/support truth and should remain so. (source: `docs/release-and-support.md`, `scripts/docs/verify-s04-boundaries.sh`)
- `examples/README.md` already demonstrates the right approach for warning readers away from generated artifacts and routing them back to canonical docs. (source: `examples/README.md`)
- Public docs are Russian-first, while maintainer/historical materials are mixed-language; this makes explicit audience labeling part of the architecture, not optional copy polish. (source: `README.md`, `docs/README.md`, `docs/maintainers/release-signing.md`, `docs/plans/*.md`)
- A local markdown-link sweep across `README.md`, `docs/**/*.md`, `examples/**/*.md`, and repo-owned `dist/**/*.md` found no broken relative links; the problem is IA, not link rot. (source: local research command run in this slice)
