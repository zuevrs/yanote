---
id: T05
parent: S01
milestone: M016
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "docs/guides/analyzer-coverage.md", "docs/guides/asyncapi-kafka.md", "docs/release-and-support.md", "scripts/docs/verify-s01-doc-links.sh", "scripts/docs/verify-s02-analysis-path.sh", "scripts/docs/verify-s04-boundaries.sh", "scripts/docs/verify-m005-s01-async-path.sh", "scripts/docs/verify-m005-s01-async-boundaries.sh"]
key_decisions: ["Public doc guards now fail closed on regressions from the standalone analyzer bundle back to raw yanote-js/dist/yanote.cjs launch commands.", "HTTP and async public docs now share one launcher contract: yanote-analyzer.zip -> bin/yanote -> report/async-report/combined-report."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Verified shell syntax for all updated doc guards with bash -n, then ran the exact slice verification stack from the task plan: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh. All five guards passed and agreed on the standalone analyzer bundle/launcher wording."
completed_at: 2026-03-28T23:12:42.905Z
blocker_discovered: false
---

# T05: Updated public analyzer docs and doc guards to the standalone yanote-analyzer.zip launcher contract.

> Updated public analyzer docs and doc guards to the standalone yanote-analyzer.zip launcher contract.

## What Happened
---
id: T05
parent: S01
milestone: M016
key_files:
  - README.md
  - docs/README.md
  - docs/guides/analyzer-coverage.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - scripts/docs/verify-s01-doc-links.sh
  - scripts/docs/verify-s02-analysis-path.sh
  - scripts/docs/verify-s04-boundaries.sh
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
key_decisions:
  - Public doc guards now fail closed on regressions from the standalone analyzer bundle back to raw yanote-js/dist/yanote.cjs launch commands.
  - HTTP and async public docs now share one launcher contract: yanote-analyzer.zip -> bin/yanote -> report/async-report/combined-report.
duration: ""
verification_result: passed
completed_at: 2026-03-28T23:12:42.906Z
blocker_discovered: false
---

# T05: Updated public analyzer docs and doc guards to the standalone yanote-analyzer.zip launcher contract.

**Updated public analyzer docs and doc guards to the standalone yanote-analyzer.zip launcher contract.**

## What Happened

Replaced the public analyzer install/run story in README.md, docs/README.md, docs/guides/analyzer-coverage.md, docs/guides/asyncapi-kafka.md, and docs/release-and-support.md so the canonical contract is now the standalone analyzer bundle yanote-analyzer.zip with the bin/yanote launcher. Updated the HTTP and async guides to use the same launcher surface for report, async-report, and combined-report examples. Rewrote the doc verifier scripts so they pin that standalone contract and fail closed on regressions back to raw yanote-js/dist/yanote.cjs commands. verify-s02-analysis-path.sh now validates the updated analyzer guide and runs the extracted standalone launcher from build/distributions/yanote-analyzer.zip against stable fixtures instead of proving the docs through the internal raw CJS seam.

## Verification

Verified shell syntax for all updated doc guards with bash -n, then ran the exact slice verification stack from the task plan: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh. All five guards passed and agreed on the standalone analyzer bundle/launcher wording.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/docs/verify-s01-doc-links.sh scripts/docs/verify-s02-analysis-path.sh scripts/docs/verify-s04-boundaries.sh scripts/docs/verify-m005-s01-async-path.sh scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 24ms |
| 2 | `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 3188ms |


## Deviations

Adjusted scripts/docs/verify-s02-analysis-path.sh to prove the already-built official archive build/distributions/yanote-analyzer.zip directly instead of requiring a fresh Gradle/plugin-resolution cycle. This preserved a real extracted-launcher verification while avoiding unrelated plugin-resolution failures from becoming false negatives for the doc contract task.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s01-doc-links.sh`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`


## Deviations
Adjusted scripts/docs/verify-s02-analysis-path.sh to prove the already-built official archive build/distributions/yanote-analyzer.zip directly instead of requiring a fresh Gradle/plugin-resolution cycle. This preserved a real extracted-launcher verification while avoiding unrelated plugin-resolution failures from becoming false negatives for the doc contract task.

## Known Issues
None.
