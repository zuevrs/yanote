---
id: T02
parent: S03
milestone: M002
provides:
  - Concept-first root landing for Yanote with the verified recorder → `events.jsonl` → analyzer workflow up front
  - Direct routing from the root README into canonical guides plus docs/examples landing pages
key_files:
  - README.md
  - .gsd/DECISIONS.md
key_decisions:
  - Keep the root README product-first while preserving direct canonical guide links and demoting maintainer/historical/module-inventory surfaces.
patterns_established:
  - Rewrite root onboarding copy around the verified workflow and let deeper guides own command/detail drift.
observability_surfaces:
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 20m
verification_result: passed
completed_at: 2026-03-13 00:18:30 +0300
blocker_discovered: false
---

# T02: Rewrite README as the concept-first product landing

**Reworked the root README into a concept-first product landing that explains Yanote’s value and the recorder → `events.jsonl` → analyzer → report loop before deep navigation.**

## What Happened

Rewrote `README.md` from a module/index surface into a Russian-first product landing. The new opening explains what Yanote is, what problem it solves, who the verified path is for, and what concrete artifact flow a user gets out of the repository: recorder evidence in `events.jsonl`, analyzer execution against OpenAPI, and a persisted `yanote-report.json` with contract-coverage interpretation.

Kept the direct canonical guide links that S01/S02 already protect: recorder setup in `docs/guides/recorder-spring-mvc.md`, analyzer execution and report reading in `docs/guides/analyzer-coverage.md`, and the RestAssured/Cucumber metadata handoff in `docs/guides/test-tagging.md`.

Added explicit routing from the root landing into `docs/README.md` and `examples/README.md`, while keeping runnable leaf links to `examples/springmvc-service/README.md`, `examples/tests-restassured/README.md`, and the Compose demo. Offline bundle docs remain present but clearly secondary fallback paths rather than the main story.

Moved maintainer, historical, and module-inventory surfaces under `## Вторичные поверхности` so first-time readers hit product framing and the verified workflow before internal/release context.

Recorded the copy-structure decision in `.gsd/DECISIONS.md` so T03 can keep the same boundary while expanding directory-level navigation.

## Verification

- `bash scripts/docs/verify-s03-landing.sh` — expected failure, now limited to the two T03-owned example backlink clauses:
  - `examples/springmvc-service/README.md` missing `../README.md`
  - `examples/tests-restassured/README.md` missing `../README.md`
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s03-landing.sh` first. If it fails anywhere other than the two example-leaf backlink checks above, the root/docs/examples landing contract regressed. Then run `bash scripts/docs/verify-s01-doc-links.sh` and `bash scripts/docs/verify-s02-doc-links.sh` to confirm the canonical recorder/analyzer/tagging graph is still intact.

## Deviations

None.

## Known Issues

- `examples/springmvc-service/README.md` still needs a backlink to `examples/README.md`; T03 owns that.
- `examples/tests-restassured/README.md` still needs a backlink to `examples/README.md`; T03 owns that.

## Files Created/Modified

- `README.md` — rewritten as the concept-first root landing with the verified workflow, direct canonical guide links, and secondary maintainer/historical surfaces.
- `.gsd/DECISIONS.md` — recorded the root landing copy strategy for the remainder of S03.
- `.gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md` — captured what shipped and the expected remaining verifier failures.
