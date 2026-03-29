# S02: Tag-driven release and publication pipeline

**Goal:** Make the release tag the single trustworthy trigger for validating and publishing the shipping surfaces.
**Demo:** After this: A release tag exercises a fail-closed shipping workflow that validates and assembles the intended publication surfaces.

## Tasks
- [x] **T01: Added archive-backed runtime preflight contract coverage for signed release tags and aligned the release workflow with the tested release-tag/retry output surface.** — Turn the release tag gate into a runtime-tested contract that proves only signed stable tags from `main` can unlock the publication path, and that every rejection stays deterministic and inspectable.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `git` tag/signature inspection plus `gpg` fixture material | Fail closed with the exact diagnostic class/code for unsigned, unannotated, missing, or off-main tags; do not downgrade to a warning | Treat the gate as blocked and keep the captured stdout/stderr from the fixture run for inspection | Reject imported keys or tags whose fingerprint/object type does not match the expected signed annotated-tag contract |
| `scripts/release/preflight.sh` environment validation | Missing freeze approval or credentials must stop the pipeline before any publish/build step runs | Treat as a failed gate; never continue with partial publish preparation | Reject malformed retry or tag metadata instead of emitting ambiguous outputs |
| `.github/workflows/release.yml` preflight output wiring | Fail the workflow contract tests if job outputs drift from the runtime preflight contract | Treat stale wiring as a broken release trigger | Reject renamed or missing outputs that would make downstream publish steps read the wrong release tag/retry state |

## Load Profile

- **Shared resources**: local git refs, temporary GPG homedir/key material, and the workflow output names consumed by downstream release steps.
- **Per-operation cost**: several short preflight executions against fixture repos/tags plus source-level contract checks.
- **10x breakpoint**: repeated temporary repo/key setup dominates before shell logic does.

## Negative Tests

- **Malformed inputs**: missing tag, bad `vMAJOR.MINOR.PATCH` format, prerelease suffixes, non-annotated tags, and `SNAPSHOT` project version.
- **Error paths**: unsigned tag, tag not reachable from `main`, missing credentials, missing freeze approval, and non-transient publish failure classification.
- **Boundary conditions**: signed stable tag on `main` passes, transient publish reasons remain retry-eligible, and deterministic diagnostic ordering survives mixed failure cases.

## Steps

1. Add a process-level contract test harness that executes `bash scripts/release/preflight.sh` against controlled git/tag and environment fixtures instead of only source-inspecting the script.
2. Tighten `scripts/release/preflight.sh` only where runtime gaps exist so signed annotated tags on `main` pass, malformed/unsigned/off-main/snapshot release attempts fail closed, and the emitted class/code/retry outputs stay deterministic.
3. Keep `.github/workflows/release.yml` aligned with the runtime preflight contract by consuming the same release-tag and retry outputs that the process-level tests assert.
4. Update the existing preflight contract tests so they pin the runtime gate surface rather than stale implementation details.

## Must-Haves

- [ ] Real script execution proves the signed-tag gate instead of relying only on source inspection.
- [ ] Every fail-closed rejection emits deterministic diagnostic class/code/retry output that later release steps can consume or surface.
- [ ] Workflow preflight wiring still matches the runtime-tested contract exactly.
  - Estimate: 1h20m
  - Files: scripts/release/preflight.sh, scripts/release/preflight.runtime.contract.test.mjs, scripts/release/maven-central-preflight.contract.test.mjs, scripts/release/release-failclosed.contract.test.mjs, .github/workflows/release.yml
  - Verify: - `node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs`
- Runtime cases cover signed annotated tag success, unsigned/off-main/prerelease/snapshot rejection, and retry-classification drift.
- [x] **T02: Added a local tag-driven release proof that stages publications, assembles the analyzer bundle, and retains diagnostic artifacts.** — Add one local proof command that exercises the tag-versioned release candidate path through publish staging, analyzer bundle assembly, traceability packaging, and release notes so S02 closes on real pipeline behavior rather than YAML alone.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `./gradlew -Pversion=... publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig` | Fail closed and retain the stage that did not publish expected staging or analyzer outputs; do not continue to bundle assembly | Keep build logs and partial output inventory for inspection | Reject mismatched staged versions, missing analyzer archive, or absent publication modules before the verifier reports success |
| `scripts/release/assemble-release-assets.sh` + `scripts/release/render-release-notes.mjs` | Stop the proof if manifest, traceability, checksum, or notes generation fails | Keep the release proof workspace and intermediate files | Reject missing traceability snapshot alignment or wrong analyzer asset naming |
| local release-proof workspace | Preserve phase markers and inventories so future agents can localize `preflight`, `publish`, `bundle`, or `notes` drift | Treat stalled phase execution as failure and keep the last completed phase visible | Reject proof bundles that omit required manifest, staging inventory, or notes artifacts |

## Load Profile

- **Shared resources**: `build/staging-deploy/`, `build/distributions/yanote-analyzer.zip`, `build/release-bundle/`, CycloneDX output, release notes, and the retained proof directory.
- **Per-operation cost**: one tag-versioned Gradle publish to local staging plus one asset assembly and notes-render pass.
- **10x breakpoint**: repeated full Gradle publish/build cycles dominate before shell/file assertions do.

## Negative Tests

- **Malformed inputs**: missing analyzer archive, missing traceability files, wrong tag/version propagation, or missing staged publications.
- **Error paths**: preflight passes but publish omits a module, bundle assembly points at the wrong asset, notes render against the wrong previous tag, or the proof omits inspectable outputs.
- **Boundary conditions**: a signed release tag drives identical version truth across staged publications, `yanote-analyzer.zip`, manifest rows, and release notes.

## Steps

1. Add a rerunnable verifier script that sets up a signed release-tag context, runs preflight, then executes the local release-candidate path (`publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig`, asset assembly, notes rendering) without hitting external publication endpoints.
2. Retain a high-signal proof bundle that records the tagged version, staged publication inventory, release asset manifest/checksums, traceability snapshot, release notes, and phase-by-phase status so failures localize cleanly.
3. Pin the verifier with a contract test and update release/bundle contract tests where necessary so analyzer asset, staging inventory, traceability, and notes remain aligned with the workflow’s tag-driven contract.
4. Update the maintainer release-signing guidance to point at the local proof command and the retained diagnostic surfaces it produces.

## Must-Haves

- [ ] One local verifier command proves the tag-driven release candidate path end to end up through staged publication, analyzer archive assembly, and release notes.
- [ ] The retained proof bundle makes tag/version/publish/bundle drift attributable without leaking secrets or requiring a real GitHub or Maven publish.
- [ ] The official analyzer asset contract from S01 stays the shipped analyzer surface inside the tag-driven pipeline.
  - Estimate: 1h40m
  - Files: scripts/ci/verify-m016-s02-release-pipeline.sh, scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs, .github/workflows/release.yml, scripts/release/assemble-release-assets.sh, scripts/release/render-release-notes.mjs, scripts/release/github-release.contract.test.mjs, scripts/release/traceability.contract.test.mjs, docs/maintainers/release-signing.md
  - Verify: - `node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs`
- `bash scripts/ci/verify-m016-s02-release-pipeline.sh`
