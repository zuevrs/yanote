---
id: T02
parent: S04
milestone: M014
provides: []
requires: []
affects: []
key_files: ["scripts/ci/export-async-proof-artifacts.sh", "scripts/ci/export-async-proof-artifacts.test.mjs", "scripts/ci/collect-yanote-artifacts.sh", "scripts/ci/collect-yanote-artifacts.test.mjs", "scripts/ci/render-yanote-summary.mjs", "scripts/ci/render-yanote-summary.test.mjs", "scripts/ci/yanote-ci-workflow.contract.test.mjs", ".gsd/KNOWLEDGE.md", ".gsd/DECISIONS.md", ".gsd/milestones/M014/slices/S04/tasks/T02-SUMMARY.md"]
key_decisions: ["Derive collected async bundle metadata from the authoritative live bundle manifest instead of reconstructing it heuristically during artifact collection.", "Fail async summary rendering closed when the authoritative async report is malformed or required retained companion artifacts are missing."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed the task contract suite (`node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`), reran `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` to regenerate the authoritative live bundle with the new exporter metadata, then reran the collected-summary path into `.yanote-ci/build-and-test-artifacts/async-summary.md` and confirmed the collected manifest/source-path notes plus rendered summary now show supported bindings 2/2, declared correlation/reply operations 2/2, and runtime satisfied semantics 4/4 while staying JSON-centered and redaction-safe."
completed_at: 2026-03-26T13:58:14.793Z
blocker_discovered: false
---

# T02: Preserved widened live Kafka proof metadata and fail-closed semantics through exported artifacts, collected CI bundles, and async GitHub summaries.

> Preserved widened live Kafka proof metadata and fail-closed semantics through exported artifacts, collected CI bundles, and async GitHub summaries.

## What Happened
---
id: T02
parent: S04
milestone: M014
key_files:
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
  - .gsd/milestones/M014/slices/S04/tasks/T02-SUMMARY.md
key_decisions:
  - Derive collected async bundle metadata from the authoritative live bundle manifest instead of reconstructing it heuristically during artifact collection.
  - Fail async summary rendering closed when the authoritative async report is malformed or required retained companion artifacts are missing.
duration: ""
verification_result: passed
completed_at: 2026-03-26T13:58:14.794Z
blocker_discovered: false
---

# T02: Preserved widened live Kafka proof metadata and fail-closed semantics through exported artifacts, collected CI bundles, and async GitHub summaries.

**Preserved widened live Kafka proof metadata and fail-closed semantics through exported artifacts, collected CI bundles, and async GitHub summaries.**

## What Happened

Updated the live Kafka proof exporter and collector so the authoritative async bundle now carries richer binding-support, declared-semantics, and runtime-semantics metadata through retained manifests and collected build-and-test artifacts without preserving stale copies. Tightened the async summary renderer to print redaction-safe richer-semantics count lines while failing explicitly on malformed async report inputs or incomplete retained companion families, and strengthened the Node contract suite plus workflow contract checks around that delivery path. Re-ran the authoritative live Kafka proof, re-collected the build-and-test bundle, and confirmed the collected manifest and rendered async summary both reflect the widened semantics surface from the regenerated live bundle.

## Verification

Passed the task contract suite (`node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`), reran `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` to regenerate the authoritative live bundle with the new exporter metadata, then reran the collected-summary path into `.yanote-ci/build-and-test-artifacts/async-summary.md` and confirmed the collected manifest/source-path notes plus rendered summary now show supported bindings 2/2, declared correlation/reply operations 2/2, and runtime satisfied semantics 4/4 while staying JSON-centered and redaction-safe.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 318ms |
| 2 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 72932ms |
| 3 | `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/build-and-test-artifacts && node scripts/ci/render-yanote-summary.mjs --report .yanote-ci/build-and-test-artifacts/live-kafka-proof/yanote-async-report.json --stdout .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stdout --stderr .yanote-ci/build-and-test-artifacts/live-kafka-proof/async-report.stderr --artifacts-dir .yanote-ci/build-and-test-artifacts/live-kafka-proof --output .yanote-ci/build-and-test-artifacts/async-summary.md --exit-code 0` | 0 | ✅ pass | 117ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`
- `.gsd/milestones/M014/slices/S04/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
## Must-Haves Covered

- Exported and collected `live-kafka-proof/` artifacts retain the widened happy-path report pair plus focused companions without inventing stale files.
- The async summary renderer explains the richer semantics from the live bundle, stays redaction-safe, and preserves `report=.../yanote-async-report.json` plus counts-only machine tokens.
- Workflow contract tests keep build-and-test tied to the same deterministic async artifact family and summary path.

