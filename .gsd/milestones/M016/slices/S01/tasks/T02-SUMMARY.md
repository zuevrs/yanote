---
id: T02
parent: S01
milestone: M016
provides: []
requires: []
affects: []
key_files: ["build.gradle.kts", ".github/workflows/release.yml", "scripts/release/assemble-release-assets.sh", "scripts/release/release-workflow.contract.test.mjs", "scripts/release/github-release.contract.test.mjs", ".gsd/DECISIONS.md", ".gsd/milestones/M016/slices/S01/tasks/T02-SUMMARY.md"]
key_decisions: ["D017: publish the standalone analyzer from build/distributions/yanote-analyzer.zip and require the release asset index to expose it as analyzer|build/distributions/yanote-analyzer.zip; reject legacy generic dist archives as analyzer release surfaces."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-level verification passed with ./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs. Slice-level verification remains partial but current passing checks include the T01 standalone bundle verifier and the T03 Gradle/CI verifier, while the T04 verifier is still absent and the docs verifier stack is still red before later slice tasks. I also verified the observability surfaces directly by assembling a local release bundle from build/distributions/yanote-analyzer.zip and confirming the analyzer asset rows, checksum/proof sidecars, and manifest metadata on disk."
completed_at: 2026-03-28T22:33:25.040Z
blocker_discovered: false
---

# T02: Published the standalone analyzer as the dedicated yanote-analyzer.zip release asset contract.

> Published the standalone analyzer as the dedicated yanote-analyzer.zip release asset contract.

## What Happened
---
id: T02
parent: S01
milestone: M016
key_files:
  - build.gradle.kts
  - .github/workflows/release.yml
  - scripts/release/assemble-release-assets.sh
  - scripts/release/release-workflow.contract.test.mjs
  - scripts/release/github-release.contract.test.mjs
  - .gsd/DECISIONS.md
  - .gsd/milestones/M016/slices/S01/tasks/T02-SUMMARY.md
key_decisions:
  - D017: publish the standalone analyzer from build/distributions/yanote-analyzer.zip and require the release asset index to expose it as analyzer|build/distributions/yanote-analyzer.zip; reject legacy generic dist archives as analyzer release surfaces.
duration: ""
verification_result: mixed
completed_at: 2026-03-28T22:33:25.041Z
blocker_discovered: false
---

# T02: Published the standalone analyzer as the dedicated yanote-analyzer.zip release asset contract.

**Published the standalone analyzer as the dedicated yanote-analyzer.zip release asset contract.**

## What Happened

Refactored build.gradle.kts so ./gradlew distStandaloneAnalyzer now stages the standalone bundle and packages a deterministic build/distributions/yanote-analyzer.zip archive with a stable yanote-analyzer/ root. Rewired .github/workflows/release.yml to build that archive during tag publication and emit an explicit analyzer|build/distributions/yanote-analyzer.zip asset index entry instead of publishing the analyzer through yanote-dist-all.zip. Hardened scripts/release/assemble-release-assets.sh to fail closed on duplicate asset types, missing analyzer entries, wrong analyzer archive names, and legacy generic dist reuse, then upgraded the release contract tests so workflow wiring and release-bundle happy/negative paths are pinned behaviorally.

## Verification

Task-level verification passed with ./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs. Slice-level verification remains partial but current passing checks include the T01 standalone bundle verifier and the T03 Gradle/CI verifier, while the T04 verifier is still absent and the docs verifier stack is still red before later slice tasks. I also verified the observability surfaces directly by assembling a local release bundle from build/distributions/yanote-analyzer.zip and confirming the analyzer asset rows, checksum/proof sidecars, and manifest metadata on disk.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` | 0 | ✅ pass | 3414ms |
| 2 | `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts` | 0 | ✅ pass | 13007ms |
| 3 | `./gradlew :yanote-gradle-plugin:test && bash scripts/ci/run-yanote-gradle-check.sh && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 9013ms |
| 4 | `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh` | 1 | ❌ fail | 75ms |
| 5 | `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 1 | ❌ fail | 264131ms |
| 6 | `./gradlew cyclonedxBom && mkdir -p build/release-assets && printf 'analyzer|build/distributions/yanote-analyzer.zip\n' > build/release-assets/index.txt && RELEASE_TAG=v1.2.3 RELEASE_ASSET_INDEX=build/release-assets/index.txt SBOM_PATH=build/reports/cyclonedx/bom.json TRACEABILITY_JSON_PATH=docs/traceability/v1-requirements-tests.json TRACEABILITY_MARKDOWN_PATH=docs/traceability/v1-requirements-tests.md bash scripts/release/assemble-release-assets.sh && unzip -l build/distributions/yanote-analyzer.zip | sed -n '1,12p' && rg -n "release-tag=|traceability-snapshot=|asset=|checksum-file=|proof-file=|release-asset-types=|release-asset-count=" build/release-bundle/v1.2.3/v1.2.3-manifest.txt` | 0 | ✅ pass | 1082ms |


## Deviations

Kept the legacy distAll task available for non-release consumers, but removed it from the official tag-driven analyzer publication path instead of deleting the older internal bundle surface outright.

## Known Issues

scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs and scripts/ci/verify-m016-s01-standalone-analyzer.sh are still absent because they belong to T04, so that slice verifier remains red by design. The docs verification stack also remains red before T05; the latest retained failure artifacts are under /var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-s02-analysis.SyAuiy/.

## Files Created/Modified

- `build.gradle.kts`
- `.github/workflows/release.yml`
- `scripts/release/assemble-release-assets.sh`
- `scripts/release/release-workflow.contract.test.mjs`
- `scripts/release/github-release.contract.test.mjs`
- `.gsd/DECISIONS.md`
- `.gsd/milestones/M016/slices/S01/tasks/T02-SUMMARY.md`


## Deviations
Kept the legacy distAll task available for non-release consumers, but removed it from the official tag-driven analyzer publication path instead of deleting the older internal bundle surface outright.

## Known Issues
scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs and scripts/ci/verify-m016-s01-standalone-analyzer.sh are still absent because they belong to T04, so that slice verifier remains red by design. The docs verification stack also remains red before T05; the latest retained failure artifacts are under /var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T//yanote-s02-analysis.SyAuiy/.
