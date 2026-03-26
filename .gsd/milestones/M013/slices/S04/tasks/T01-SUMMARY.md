---
id: T01
parent: S04
milestone: M013
key_files:
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
key_decisions:
  - Collector and proof manifests now derive `specSource` and deprecated-operation facts from canonical report JSON instead of duplicating hand-maintained strings.
  - Async success exports now fail closed when any allowlisted HTML sibling is missing, matching the widened retained artifact contract.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T03:36:40.487Z
blocker_discovered: false
---

# T01: Retained CI proof bundles now ship HTML siblings and report-derived delivery metadata

**Retained CI proof bundles now ship HTML siblings and report-derived delivery metadata**

## What Happened

Updated the top-level CI artifact collector to retain both `yanote-report.json` and sibling `yanote-report.html`, emit deterministic `artifact-source-paths.txt`, and persist report-derived delivery metadata (`specSource` kind/reference plus deprecated-operation counts) into the top-level manifest. Extended the async proof exporter to retain happy-path, runtime-selected, and schema-failure `yanote-async-report.html` siblings, surface async report metadata in its manifest/source note, and fail success exports when an allowlisted HTML artifact is missing. Widened the retained v1 demo bundle metadata so `artifact-source-paths.txt` and `artifact-manifest.txt` now acknowledge the happy-path HTML report and record local report-derived provenance/deprecated facts. Refreshed the three task-contract test files to seed and assert the widened JSON+HTML bundle layouts and metadata, and updated `scripts/ci/verify-m004-s03-live-kafka-proof.sh` so the real async proof exporter receives the new HTML inputs on successful runs.

## Verification

Focused T01 verification passed with `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs`. I then ran the broader slice node suite, which passed all T01/T02 docs-summary contracts except one existing workflow-helper contract outside this task’s touched surfaces. Both slice doc verifiers passed. I also ran `bash -n` over the edited bash scripts (`scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`) to confirm syntax validity after the shell changes.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs` | 0 | ✅ pass | 242ms |
| 2 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 1 | ❌ fail | 365ms |
| 3 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 105ms |
| 4 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 183ms |
| 5 | `bash -n scripts/ci/collect-yanote-artifacts.sh scripts/ci/export-async-proof-artifacts.sh scripts/ci/run-v1-e2e.sh scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 3ms |


## Deviations

Expanded `scripts/ci/verify-m004-s03-live-kafka-proof.sh` beyond the six planned files so the real async success path now exports the newly required HTML siblings. I did not run `git diff --check` because this auto-mode contract also explicitly forbids running git commands.

## Known Issues

The wider slice node suite still has one unrelated failure in `scripts/ci/yanote-ci-workflow.contract.test.mjs` (`gradle parity helper executes rooted yanoteCheck invocation`) against `scripts/ci/run-yanote-gradle-check.sh`, which was not touched by T01. Focused T01 contracts and both current docs verifiers passed.

## Files Created/Modified

- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
