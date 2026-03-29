---
id: T03
parent: S04
milestone: M016
provides: []
requires: []
affects: []
key_files: ["docs/guides/analyzer-coverage.md", "examples/README.md", "scripts/docs/verify-m016-s04-short-docs.sh", "scripts/docs/verify-m016-s04-short-docs.contract.test.mjs", "scripts/docs/verify-s03-example-boundary.sh", "scripts/docs/verify-s04-boundaries.sh", ".gsd/milestones/M016/slices/S04/tasks/T03-SUMMARY.md"]
key_decisions: ["Keep the public examples landing on a short Compose-plus-leaf-doc path and keep rerun/proof breadcrumbs only in maintainer docs with reverse backlinks to the public example surface (D033)."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs and it passed all four fixture cases, including the new analyzer/examples negative checks. Then ran the exact slice verification command from the task plan: bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s02-analysis-path.sh. All commands passed, including the live standalone analyzer runtime proof from the extracted archive contract."
completed_at: 2026-03-29T02:15:52.925Z
blocker_discovered: false
---

# T03: Shortened the analyzer guide and examples landing into one standalone-launcher demo path with fail-closed wording checks.

> Shortened the analyzer guide and examples landing into one standalone-launcher demo path with fail-closed wording checks.

## What Happened
---
id: T03
parent: S04
milestone: M016
key_files:
  - docs/guides/analyzer-coverage.md
  - examples/README.md
  - scripts/docs/verify-m016-s04-short-docs.sh
  - scripts/docs/verify-m016-s04-short-docs.contract.test.mjs
  - scripts/docs/verify-s03-example-boundary.sh
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/milestones/M016/slices/S04/tasks/T03-SUMMARY.md
key_decisions:
  - Keep the public examples landing on a short Compose-plus-leaf-doc path and keep rerun/proof breadcrumbs only in maintainer docs with reverse backlinks to the public example surface (D033).
duration: ""
verification_result: passed
completed_at: 2026-03-29T02:15:52.925Z
blocker_discovered: false
---

# T03: Shortened the analyzer guide and examples landing into one standalone-launcher demo path with fail-closed wording checks.

**Shortened the analyzer guide and examples landing into one standalone-launcher demo path with fail-closed wording checks.**

## What Happened

Rewrote docs/guides/analyzer-coverage.md into a short install → run → read loop centered on yanote-analyzer.zip, ./yanote-analyzer/bin/yanote, report, and the persisted JSON/HTML report pair, with deeper release/support context linked out instead of inlined. Rewrote examples/README.md into one Compose-first repo-demo route that points readers to the Spring MVC and RestAssured leaf READMEs and keeps the same standalone analyzer contract that examples/docker-compose.yml executes through dist/standalone-analyzer/bin/yanote. Hardened the short-doc verifier, the short-doc contract test, the example boundary verifier, and the release/support boundary verifier so they now fail closed on overlong analyzer/example docs, raw Node seams, proof-bundle-first wording, and drift between the short public docs and the real standalone/Compose launcher contract.

## Verification

Ran node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs and it passed all four fixture cases, including the new analyzer/examples negative checks. Then ran the exact slice verification command from the task plan: bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s02-analysis-path.sh. All commands passed, including the live standalone analyzer runtime proof from the extracted archive contract.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` | 0 | ✅ pass | 2426ms |
| 2 | `bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s02-analysis-path.sh` | 0 | ✅ pass | 8239ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/guides/analyzer-coverage.md`
- `examples/README.md`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`
- `scripts/docs/verify-s03-example-boundary.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `.gsd/milestones/M016/slices/S04/tasks/T03-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
