---
id: T01
parent: S03
milestone: M002
provides:
  - S03 landing-contract verifier for root/docs/examples navigation boundaries
  - Initial user-facing docs and examples landing pages
key_files:
  - scripts/docs/verify-s03-landing.sh
  - docs/README.md
  - examples/README.md
key_decisions:
  - Keep the S03 navigation work additive: codify the contract first, add thin directory landings now, and leave the root README rewrite plus leaf backlinks to later tasks.
patterns_established:
  - Encode landing requirements as explicit heading/link/order checks before rewriting copy-heavy docs.
observability_surfaces:
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 25m
verification_result: passed
completed_at: 2026-03-13 00:14:42 +0300
blocker_discovered: false
---

# T01: Codify the landing contract and seed navigation stubs

**Added the S03 landing verifier plus real docs/examples entry pages, with failures now isolated to the unreworked root README and missing example backlinks.**

## What Happened

Added `scripts/docs/verify-s03-landing.sh` as the new slice-level contract for the concept-first landing. The script checks exact root landing sections, direct canonical guide links, links to `docs/README.md` and `examples/README.md`, ordering for secondary maintainer surfaces, required directory-landing clauses, and example-leaf backlinks back into `examples/README.md`.

Added `docs/README.md` as a Russian-first map of the canonical guides, the runnable demo surfaces, and the explicitly demoted maintainer/historical surfaces.

Added `examples/README.md` as a Russian-first map of the verified demo route (`docker-compose.yml` → service example → RestAssured example) plus links back to the canonical docs.

Ran the new S03 verifier after adding the landing stubs and confirmed that its failures are now localized to T02/T03-owned gaps: the current root `README.md` still lacks the new landing sections/links, and the example leaf READMEs still lack backlinks to `examples/README.md`. The existing S01/S02 doc-link verifiers still pass unchanged.

## Verification

- `bash scripts/docs/verify-s03-landing.sh` — expected failure, localized to 9 targeted diagnostics:
  - missing root landing sections `## Что такое Yanote`, `## Для кого`, `## Проверенный цикл`, `## Куда идти дальше`, `## Вторичные поверхности`
  - missing root links to `docs/README.md` and `examples/README.md`
  - missing `../README.md` backlinks in `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md`
- `bash scripts/docs/verify-s01-doc-links.sh` — passed
- `bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s03-landing.sh` first to localize regressions in the root/docs/examples landing contract. Then run `bash scripts/docs/verify-s01-doc-links.sh` and `bash scripts/docs/verify-s02-doc-links.sh` to confirm the canonical recorder/analyzer/tagging guide graph is still intact.

## Deviations

None.

## Known Issues

- `README.md` still needs the concept-first landing rewrite required by S03; T02 owns that work.
- `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` still need backlinks to `examples/README.md`; T03 owns that work.

## Files Created/Modified

- `scripts/docs/verify-s03-landing.sh` — added the new landing-contract verifier with targeted section/link/order diagnostics.
- `docs/README.md` — added a Russian-first docs landing page for canonical guides, demo routes, and secondary surfaces.
- `examples/README.md` — added a Russian-first examples landing page for the runnable demo route and supporting assets.
- `.gsd/milestones/M002/slices/S03/S03-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
