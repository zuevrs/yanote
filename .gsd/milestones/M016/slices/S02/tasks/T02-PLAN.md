---
estimated_steps: 4
estimated_files: 8
skills_used:
  - debug-like-expert
  - github-workflows
  - bash-scripting
  - java-gradle
---

# T02: Prove the tag-driven release candidate pipeline locally

**Slice:** S02 — Tag-driven release and publication pipeline
**Milestone:** M016

## Description

Add one local proof command that exercises the tag-versioned release candidate path through publish staging, analyzer bundle assembly, traceability packaging, and release notes so S02 closes on real pipeline behavior rather than YAML alone.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `./gradlew -Pversion=... publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig` | Fail closed and retain the stage that did not publish expected staging or analyzer outputs; do not continue to bundle assembly | Keep build logs and partial output inventory for inspection | Reject mismatched staged versions, missing analyzer archive, or absent publication modules before the verifier reports success |
| `scripts/release/assemble-release-assets.sh` + `scripts/release/render-release-notes.mjs` | Stop the proof if manifest, traceability, checksum, or notes generation fails | Keep the release proof workspace and intermediate files | Reject missing traceability snapshot alignment or wrong analyzer asset naming |
| local release-proof workspace | Preserve phase markers and inventories so future agents can localize `preflight`, `publish`, `bundle`, or `notes` drift | Treat stalled phase execution as failure and keep the last completed phase visible | Reject proof bundles that omit required manifest, staging inventory, or notes artifacts |

## Load Profile

- **Shared resources**: `build/staging-deploy/`, `build/distributions/yanote-analyzer.zip`, `build/release-bundle/`, CycloneDX output, release notes, and the retained proof directory.
- **Per-operation cost**: one tag-versioned Gradle publish to local staging plus one asset assembly and notes-render pass.
- **10x breakpoint**: repeated full Gradle publish/build cycles dominate before shell and file assertions do.

## Negative Tests

- **Malformed inputs**: missing analyzer archive, missing traceability files, wrong tag/version propagation, or missing staged publications.
- **Error paths**: preflight passes but publish omits a module, bundle assembly points at the wrong asset, notes render against the wrong previous tag, or the proof omits inspectable outputs.
- **Boundary conditions**: a signed release tag drives identical version truth across staged publications, `yanote-analyzer.zip`, manifest rows, and release notes.

## Steps

1. Add a rerunnable verifier script that sets up a signed release-tag context, runs preflight, then executes the local release-candidate path (`publish distStandaloneAnalyzer cyclonedxBom jreleaserConfig`, asset assembly, notes rendering) without hitting external publication endpoints.
2. Retain a high-signal proof bundle that records the tagged version, staged publication inventory, release asset manifest/checksums, traceability snapshot, release notes, and phase-by-phase status so failures localize cleanly.
3. Pin the verifier with a contract test and update release and bundle contract tests where necessary so analyzer asset, staging inventory, traceability, and notes remain aligned with the workflow’s tag-driven contract.
4. Update the maintainer release-signing guidance to point at the local proof command and the retained diagnostic surfaces it produces.

## Must-Haves

- [ ] One local verifier command proves the tag-driven release candidate path end to end up through staged publication, analyzer archive assembly, and release notes.
- [ ] The retained proof bundle makes tag/version/publish/bundle drift attributable without leaking secrets or requiring a real GitHub or Maven publish.
- [ ] The official analyzer asset contract from S01 stays the shipped analyzer surface inside the tag-driven pipeline.

## Verification

- `node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs`
- `bash scripts/ci/verify-m016-s02-release-pipeline.sh`

## Observability Impact

- Signals added/changed: the local proof publishes phase status, tagged version, staged publication inventory, release manifest rows, and retained release notes under one proof root.
- How a future agent inspects this: rerun `bash scripts/ci/verify-m016-s02-release-pipeline.sh` and inspect `.yanote-ci/m016-s02-release-pipeline-proof/`, `build/staging-deploy/`, `build/release-bundle/<tag>/`, and `build/release-notes.md`.
- Failure state exposed: the proof localizes whether drift came from `preflight`, `publish`, `bundle`, or `notes`, and shows the missing asset, staging, or version surface directly.

## Inputs

- `scripts/release/preflight.sh` — runtime-tested tag gate from T01 that the local proof must execute first.
- `.github/workflows/release.yml` — target publish sequence the local proof must mirror.
- `scripts/release/assemble-release-assets.sh` — deterministic release bundle builder the proof must exercise.
- `scripts/release/render-release-notes.mjs` — release notes renderer that must stay tag and version aligned.
- `jreleaser.yml` — current staged deployment and signing expectations for release publications.
- `docs/traceability/v1-requirements-tests.json` — traceability artifact that must ship in the release bundle.
- `docs/traceability/v1-requirements-tests.md` — human-readable traceability snapshot paired with the JSON artifact.
- `docs/maintainers/release-signing.md` — maintainer-only release-tag workflow that should point at the local proof command.

## Expected Output

- `scripts/ci/verify-m016-s02-release-pipeline.sh` — local signed-tag release-candidate verifier with retained proof surfaces.
- `scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs` — contract test pinning the verifier phases, required artifacts, and fail-closed checks.
- `.github/workflows/release.yml` — workflow or source contract adjusted if the proof reveals a missing handoff or observability surface.
- `scripts/release/assemble-release-assets.sh` — release-bundle assertions updated if the proof needs additional deterministic manifest coverage.
- `scripts/release/render-release-notes.mjs` — release-notes contract updated if the verifier needs additional deterministic tag context.
- `scripts/release/github-release.contract.test.mjs` — updated release-bundle assertions for any new proof or notes surfaces.
- `scripts/release/traceability.contract.test.mjs` — updated traceability and release-bundle assertions if the proof surface expands.
- `docs/maintainers/release-signing.md` — maintainer-only instructions for running the local release proof before pushing a real tag.
