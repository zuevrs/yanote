---
id: T03
parent: S03
milestone: M002
provides:
  - Stable docs/examples directory landings that keep the verified Yanote user journey visible during directory browsing
  - Backlinks from example leaf READMEs to the examples landing so demo docs no longer dead-end
key_files:
  - docs/README.md
  - examples/README.md
  - examples/springmvc-service/README.md
  - examples/tests-restassured/README.md
  - .gsd/DECISIONS.md
key_decisions:
  - Treat `docs/README.md` and `examples/README.md` as stable navigation maps: primary user/demo path first, deeper reference second, maintainer/history/fallback surfaces clearly secondary, and leaf example READMEs linked back to the examples landing.
patterns_established:
  - Use directory landing pages plus leaf backlinks to keep repository browsing aligned with the verified workflow instead of raw file discovery.
observability_surfaces:
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 15m
verification_result: passed
completed_at: 2026-03-13 00:23:04 +0300
blocker_discovered: false
---

# T03: Turn docs and examples directories into stable navigation surfaces

**Expanded the docs/examples landings into user-first navigation maps and added example backlinks so directory browsing now stays on the verified Yanote path.**

## What Happened

Expanded `docs/README.md` from a thin stub into a stable user-facing docs map. The page now keeps the canonical recorder/analyzer/tagging guides first, routes runnable repo demos through `examples/README.md`, adds a separate deeper-reference section for product boundaries, and splits maintainer-only material from historical/traceability artifacts inside the explicitly secondary section.

Expanded `examples/README.md` into a narrative map of the verified demo journey. It now explains the role of `docker-compose.yml`, the Spring MVC service example, the RestAssured tests, and the demo OpenAPI file in the same recorder → `events.jsonl` → analyzer → `yanote-report.json` flow established by the root landing and S01/S02 guides.

Added explicit backlinks to `examples/README.md` from `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` so readers who land in leaf example docs can recover the surrounding story instead of dead-ending in implementation details.

Recorded the directory-navigation rule in `.gsd/DECISIONS.md`: directory landings stay user/demo-first, while fallback bundles and maintainer/history surfaces remain clearly secondary.

## Verification

- `bash scripts/docs/verify-s03-landing.sh` — passed
- `bash scripts/docs/verify-s01-doc-links.sh` — passed
- `bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s03-landing.sh` first to catch regressions in root/docs/examples navigation sections, ordering, and example backlinks. Then run `bash scripts/docs/verify-s01-doc-links.sh` and `bash scripts/docs/verify-s02-doc-links.sh` to confirm the canonical recorder/analyzer/tagging guide graph still matches the landing copy.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/README.md` — expanded into a user-first docs map with separate primary, reference, maintainer, and historical/traceability surfaces.
- `examples/README.md` — expanded into a narrative examples map that explains how Compose, service, tests, and OpenAPI fit the verified workflow.
- `examples/springmvc-service/README.md` — added a backlink to `examples/README.md` so service-level browsing returns to the examples landing.
- `examples/tests-restassured/README.md` — added a backlink to `examples/README.md` so test-level browsing returns to the examples landing.
- `.gsd/DECISIONS.md` — recorded the stable directory-navigation boundary for the rest of the docs work.
- `.gsd/milestones/M002/slices/S03/S03-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — updated slice state to reflect S03 completion and the next action.
