---
id: T02
parent: S02
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/ci/verify-m016-s02-release-pipeline.sh", "scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs", "docs/maintainers/release-signing.md", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Run the local release-candidate Gradle phase from a symlinked git-compatible proof root so JReleaser can resolve HEAD while build outputs still land in the active GSD worktree.", "Retain release-proof observability as one bundle of phase logs, inventories, copied release artifacts, and source-path notes under .yanote-ci/m016-s02-release-pipeline-proof/ instead of relying on scattered build outputs alone."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs (18/18 passing). Passed bash scripts/ci/verify-m016-s02-release-pipeline.sh, which retained the expected diagnostics under .yanote-ci/m016-s02-release-pipeline-proof/ and populated build/staging-deploy/, build/release-bundle/v1.2.3/, and build/release-notes.md."
completed_at: 2026-03-29T00:15:07.606Z
blocker_discovered: false
---

# T02: Added a local tag-driven release proof that stages publications, assembles the analyzer bundle, and retains diagnostic artifacts.

> Added a local tag-driven release proof that stages publications, assembles the analyzer bundle, and retains diagnostic artifacts.

## What Happened
---
id: T02
parent: S02
milestone: M016
key_files:
  - scripts/ci/verify-m016-s02-release-pipeline.sh
  - scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs
  - docs/maintainers/release-signing.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Run the local release-candidate Gradle phase from a symlinked git-compatible proof root so JReleaser can resolve HEAD while build outputs still land in the active GSD worktree.
  - Retain release-proof observability as one bundle of phase logs, inventories, copied release artifacts, and source-path notes under .yanote-ci/m016-s02-release-pipeline-proof/ instead of relying on scattered build outputs alone.
duration: ""
verification_result: passed
completed_at: 2026-03-29T00:15:07.607Z
blocker_discovered: false
---

# T02: Added a local tag-driven release proof that stages publications, assembles the analyzer bundle, and retains diagnostic artifacts.

**Added a local tag-driven release proof that stages publications, assembles the analyzer bundle, and retains diagnostic artifacts.**

## What Happened

Added scripts/ci/verify-m016-s02-release-pipeline.sh as the rerunnable local release-candidate verifier for S02. The script restores the signed-tag preflight fixture from T01, runs the real release preflight gate first, creates a git-compatible proof root so the Gradle/JReleaser phase can resolve HEAD from this GSD worktree, then executes the workflow-shaped local task graph (publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig) without hitting external publication endpoints. After the Gradle phase it assembles the analyzer-centered release bundle, renders release notes, verifies staged publication coverage and manifest truth, and retains one proof bundle under .yanote-ci/m016-s02-release-pipeline-proof/ with phase logs, staged-publication inventory, copied release notes, traceability snapshots, JReleaser output, and source-path metadata. Added scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs to pin those contracts, updated docs/maintainers/release-signing.md to point maintainers at the local proof command and inspection paths, and recorded the worktree-local JReleaser gotcha in .gsd/KNOWLEDGE.md.

## Verification

Passed node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs (18/18 passing). Passed bash scripts/ci/verify-m016-s02-release-pipeline.sh, which retained the expected diagnostics under .yanote-ci/m016-s02-release-pipeline-proof/ and populated build/staging-deploy/, build/release-bundle/v1.2.3/, and build/release-notes.md.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs` | 0 | ✅ pass | 707ms |
| 2 | `bash scripts/ci/verify-m016-s02-release-pipeline.sh` | 0 | ✅ pass | 11064ms |


## Deviations

Used a symlinked git-compatible proof root for the Gradle/JReleaser phase so the verifier could stay worktree-local while still exercising the real workflow task graph; JReleaser could not resolve HEAD directly from this GSD worktree’s .git file layout.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/verify-m016-s02-release-pipeline.sh`
- `scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs`
- `docs/maintainers/release-signing.md`
- `.gsd/KNOWLEDGE.md`


## Deviations
Used a symlinked git-compatible proof root for the Gradle/JReleaser phase so the verifier could stay worktree-local while still exercising the real workflow task graph; JReleaser could not resolve HEAD directly from this GSD worktree’s .git file layout.

## Known Issues
None.
