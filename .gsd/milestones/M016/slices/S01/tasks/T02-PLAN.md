---
estimated_steps: 4
estimated_files: 6
skills_used:
  - debug-like-expert
  - github-workflows
  - bash-scripting
---

# T02: Publish the standalone analyzer as a first-class release asset

**Slice:** S01 — Standalone analyzer shipping contract
**Milestone:** M016

## Description

Turn the staged bundle into the official publication contract by giving it its own asset name, manifest entries, and release workflow assertions. This lets S02 publish one analyzer artifact instead of hiding the CLI inside a generic dist archive.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `.github/workflows/release.yml` + `scripts/release/assemble-release-assets.sh` | Fail closed if the standalone analyzer asset is missing or misnamed; do not upload only the old generic dist zip | Release contract tests should fail before a real publish attempt | Invalid asset index entries or missing checksum/proof sidecars abort asset assembly |
| `./gradlew distStandaloneAnalyzer` | Do not emit a release asset entry that points to a non-existent staged bundle | Surface the staging task name in diagnostics | Reject bundles whose versioned archive shape does not match the pinned asset contract |

## Load Profile

- **Shared resources**: release asset index, checksum/proof sidecars, `build/distributions/` archive output, and the GitHub release upload step.
- **Per-operation cost**: one standalone bundle archive plus release-contract assertions.
- **10x breakpoint**: repeated archive creation and checksum generation dominate before workflow logic does.

## Negative Tests

- **Malformed inputs**: missing analyzer archive, stale generic-only asset index, or wrong tag-derived filename.
- **Error paths**: workflow uploads without a dedicated analyzer asset, asset assembly omits checksum/proof files, or release contract tests still allow `yanote-dist-all.zip` as the only analyzer surface.
- **Boundary conditions**: analyzer asset names remain deterministic across tags and coexist with the existing recorder/publication surfaces.

## Steps

1. Update release assembly to package the standalone analyzer bundle into a dedicated distribution archive (for example `build/distributions/yanote-analyzer.zip`) with deterministic contents and checksum sidecars.
2. Replace the generic release asset index contract that only uploads `yanote-dist-all.zip` with an explicit standalone analyzer asset entry and keep the rest of the release bundle deterministic.
3. Update release workflow and contract tests so the standalone analyzer archive is built, indexed, and uploaded by tag-driven publication logic.
4. Keep release naming derived from the release tag and aligned with the staged bundle version/output from T01.

## Must-Haves

- [ ] The release workflow has one dedicated analyzer asset contract instead of burying the CLI inside a generic dist archive.
- [ ] Analyzer asset naming, checksum generation, and manifest/proof sidecars stay deterministic and test-pinned.
- [ ] S02 can reuse this asset contract directly instead of redefining analyzer packaging later.

## Verification

- `./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs`
- Expect a dedicated analyzer archive contract plus release tests that pin asset naming/upload behavior.

## Observability Impact

- Signals added/changed: standalone analyzer archive name, release asset index entry, manifest rows, and checksum/proof sidecars become explicit surfaces.
- How a future agent inspects this: inspect `build/distributions/`, the assembled release asset index, and the release contract test failures.
- Failure state exposed: missing analyzer asset, wrong archive name, or asset-index drift is localized before a real tag publish runs.

## Inputs

- `build.gradle.kts` — standalone bundle staging from T01.
- `.github/workflows/release.yml` — current tag-driven release workflow.
- `scripts/release/assemble-release-assets.sh` — deterministic asset assembly logic.
- `scripts/release/release-workflow.contract.test.mjs` — workflow contract assertions.
- `scripts/release/github-release.contract.test.mjs` — release-bundle/notes/asset contract assertions.

## Expected Output

- `build.gradle.kts` — dedicated analyzer distribution archive staging.
- `.github/workflows/release.yml` — release workflow wired to the standalone analyzer asset.
- `scripts/release/assemble-release-assets.sh` — asset assembly updated for the dedicated analyzer entry.
- `scripts/release/release-workflow.contract.test.mjs` — workflow contract pinned to the analyzer asset.
- `scripts/release/github-release.contract.test.mjs` — release-bundle contract pinned to the analyzer asset.
- `build/distributions/yanote-analyzer.zip` — staged standalone analyzer archive for later release publishing and proof work.
