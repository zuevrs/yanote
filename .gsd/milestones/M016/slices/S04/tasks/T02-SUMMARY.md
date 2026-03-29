---
id: T02
parent: S04
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/guides/recorder-spring-mvc.md", "docs/guides/test-tagging.md", "examples/springmvc-service/README.md", "examples/tests-restassured/README.md", "scripts/docs/verify-s01-doc-links.sh", "scripts/docs/verify-s02-doc-links.sh", ".gsd/milestones/M016/slices/S04/tasks/T02-SUMMARY.md"]
key_decisions: ["Keep yanote.suite as the shared suite surface and document YANOTE_SUITE / YANOTE_EVENTS_PATH only as example-level env bridges.", "Use short canonical guides plus runnable companion READMEs plus fail-closed shell verifiers as the pattern for this product-facing docs path."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the exact slice verification command: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s01-recorder-path.sh. The focused doc verifiers passed immediately. The first combined recorder-proof attempt stalled before the fixture reported readiness, so I inspected the retained logs, confirmed the issue was operational rather than a docs-contract regression, reran the isolated runtime proof successfully, and then reran the exact slice verification command to a clean pass. Final gate result: all three commands passed, including the live Spring MVC recorder smoke proof."
completed_at: 2026-03-29T02:07:07.728Z
blocker_discovered: false
---

# T02: Shortened the recorder and tagging guides and aligned the Spring MVC and RestAssured example READMEs to one explicit evidence loop.

> Shortened the recorder and tagging guides and aligned the Spring MVC and RestAssured example READMEs to one explicit evidence loop.

## What Happened
---
id: T02
parent: S04
milestone: M016
key_files:
  - docs/guides/recorder-spring-mvc.md
  - docs/guides/test-tagging.md
  - examples/springmvc-service/README.md
  - examples/tests-restassured/README.md
  - scripts/docs/verify-s01-doc-links.sh
  - scripts/docs/verify-s02-doc-links.sh
  - .gsd/milestones/M016/slices/S04/tasks/T02-SUMMARY.md
key_decisions:
  - Keep yanote.suite as the shared suite surface and document YANOTE_SUITE / YANOTE_EVENTS_PATH only as example-level env bridges.
  - Use short canonical guides plus runnable companion READMEs plus fail-closed shell verifiers as the pattern for this product-facing docs path.
duration: ""
verification_result: passed
completed_at: 2026-03-29T02:07:07.729Z
blocker_discovered: false
---

# T02: Shortened the recorder and tagging guides and aligned the Spring MVC and RestAssured example READMEs to one explicit evidence loop.

**Shortened the recorder and tagging guides and aligned the Spring MVC and RestAssured example READMEs to one explicit evidence loop.**

## What Happened

Rewrote docs/guides/recorder-spring-mvc.md into a single dependency -> config -> request -> events.jsonl proof loop that matches the real Spring MVC recorder contract. Rewrote docs/guides/test-tagging.md around the live X-Test-Run-Id / X-Test-Suite -> test.run_id / test.suite -> coverage.perOperation[].suites handoff, while keeping YANOTE_SUITE documented only as the repo demo bridge and yanote.suite as the shared suite surface. Aligned examples/springmvc-service/README.md and examples/tests-restassured/README.md to the same vocabulary and backlink pattern, including a factual correction to the service example's real default events-path template. Tightened scripts/docs/verify-s01-doc-links.sh and scripts/docs/verify-s02-doc-links.sh so they fail closed on size drift, missing proof commands, missing backlinks, and incorrect bridge/shared-surface wording.

## Verification

Ran the exact slice verification command: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s01-recorder-path.sh. The focused doc verifiers passed immediately. The first combined recorder-proof attempt stalled before the fixture reported readiness, so I inspected the retained logs, confirmed the issue was operational rather than a docs-contract regression, reran the isolated runtime proof successfully, and then reran the exact slice verification command to a clean pass. Final gate result: all three commands passed, including the live Spring MVC recorder smoke proof.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 141091ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/guides/recorder-spring-mvc.md`
- `docs/guides/test-tagging.md`
- `examples/springmvc-service/README.md`
- `examples/tests-restassured/README.md`
- `scripts/docs/verify-s01-doc-links.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `.gsd/milestones/M016/slices/S04/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
