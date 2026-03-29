# S02: Tag-driven release and publication pipeline — UAT

**Milestone:** M016
**Written:** 2026-03-29T00:21:50.060Z

# S02: Tag-driven release and publication pipeline — UAT

**Milestone:** M016
**Written:** 2026-03-29T00:34:59+03:00

# S02 UAT — Tag-driven release and publication pipeline

## Preconditions
- Work from the M016 worktree root.
- `node`, `bash`, `python3`, and Java 21/Gradle are available.
- No external Maven Central or GitHub publication credentials are required; this proof must stay local and fail closed before any external publish.
- The signed-tag runtime fixtures under `scripts/release/fixtures/preflight-runtime/` are present.
- If you are re-running the proof, clear or ignore any previous `.yanote-ci/m016-s02-release-pipeline-proof/` contents before comparing results.

## Test Case 1 — Runtime preflight proves the signed stable-tag gate
**Goal:** prove the repository executes the real preflight script against real git/tag fixtures instead of relying only on source inspection.

1. Run:
   ```bash
   node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs
   ```
   **Expected:** the command exits `0`.
2. Review the test names in the output.
   **Expected:** they include successful coverage for a signed annotated stable tag on `main`, plus fail-closed runtime cases for unsigned annotated tags, lightweight tags, off-`main` tags, prerelease tags, deterministic mixed-failure ordering, retry classification, and workflow release-tag output wiring.
3. Confirm there are no skipped or todo cases.
   **Expected:** the suite reports all tests passing and keeps the release-tag gate fully pinned.

## Test Case 2 — Release bundle and traceability contracts stay aligned to the analyzer shipping surface
**Goal:** prove the workflow-shaped contract still publishes the intended analyzer asset, traceability snapshot, and notes surfaces.

1. Run:
   ```bash
   node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs
   ```
   **Expected:** the command exits `0`.
2. Review the output.
   **Expected:** it confirms all of the following:
   - the verifier uses the stable retained proof root and signed-tag fixtures;
   - the git-compatible compatibility root is required for worktree-local JReleaser execution;
   - the local proof mirrors the workflow task graph and fails closed before any external publish step;
   - the release bundle includes the dedicated analyzer asset plus checksum/proof/manifest rows;
   - the traceability snapshot remains required and deterministic;
   - release notes still scope changelog generation from the resolved previous release tag.

## Test Case 3 — Local release proof stages publications and retains diagnostics
**Goal:** prove one rerunnable command exercises the local release-candidate path end to end.

1. Run:
   ```bash
   bash scripts/ci/verify-m016-s02-release-pipeline.sh
   ```
   **Expected:** the command exits `0` and prints a summary like `release_tag=v1.2.3 staged_publications=72 bundle_assets=12 traceability_snapshot=v1-traceability-20260304 previous_release_tag=v1.2.2`.
2. Confirm the retained proof directory exists:
   - `.yanote-ci/m016-s02-release-pipeline-proof/`
   **Expected:** the directory exists and contains phase logs, inventories, copied artifacts, and compatibility-root metadata.
3. Inspect `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt`.
   **Expected:** it contains exactly:
   - `preflight=success`
   - `publish=success`
   - `bundle=success`
   - `notes=success`
4. Inspect `.yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt`.
   **Expected:** it includes at least:
   - `proof_status=success`
   - `release_tag=v1.2.3`
   - `release_version=1.2.3`
   - `previous_release_tag=v1.2.2`
   - `preflight_retry_eligible=false`
   - `traceability_snapshot=v1-traceability-20260304`
   - `staging_publication_count=72`
   - `release_bundle_asset_count=12`
5. Inspect `.yanote-ci/m016-s02-release-pipeline-proof/tag-context.txt`.
   **Expected:** it matches the manifest on `release_tag`, `release_version`, `previous_release_tag`, `preflight_release_tag`, `preflight_project_version`, retry fields, and `traceability_snapshot`.

## Test Case 4 — Built outputs match the retained proof bundle
**Goal:** prove the retained diagnostics correspond to real staged publication and assembled release outputs.

1. Confirm these paths exist after the verifier succeeds:
   - `build/staging-deploy/`
   - `build/release-bundle/v1.2.3/`
   - `build/release-notes.md`
   **Expected:** all three exist.
2. Inspect `build/release-bundle/v1.2.3/`.
   **Expected:** it contains the assembled analyzer-centered release assets, manifest/checksum/proof sidecars, traceability artifacts, and JReleaser configuration outputs referenced from the proof bundle.
3. Open `build/release-notes.md`.
   **Expected:** it starts with `# Release v1.2.3`, states changelog scope since `v1.2.2`, and lists verification highlights for release assets, checksums, proof files, and the enforced preflight/approval gate.
4. Compare the copied artifacts in `.yanote-ci/m016-s02-release-pipeline-proof/`.
   **Expected:** `release-bundle-manifest.txt`, `release-bundle-assets.txt`, `release-notes.md`, `staged-publications.txt`, and `staging-modules.txt` agree with the live build outputs.

## Test Case 5 — Maintainer guidance points to the local proof and its diagnostics
**Goal:** prove maintainers have one documented dry-run path before pushing the real release tag.

1. Open `docs/maintainers/release-signing.md`.
   **Expected:** the release-tag workflow tells maintainers to run:
   ```bash
   bash scripts/ci/verify-m016-s02-release-pipeline.sh
   ```
   before pushing the real tag.
2. Review the failure guidance in that document.
   **Expected:** it points maintainers at `.yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt`, `phase-status.txt`, per-phase stderr logs, `build/staging-deploy/`, `build/release-bundle/v1.2.3/`, and `build/release-notes.md`.

## Edge Case 1 — Signed-tag failures remain fail-closed and attributable
**Goal:** confirm unsupported release tags do not silently fall through to publish preparation.

1. Re-run Test Case 1 and watch the named runtime cases.
   **Expected:** unsigned annotated tags, lightweight tags, off-`main` tags, prerelease tags, malformed retry scenarios, and mixed failures all remain explicit pass cases in the test suite because they are correctly rejected by the runtime gate.
2. If one of those cases fails unexpectedly, inspect the relevant fixture-backed diagnostics first.
   **Expected:** the failure remains attributable to a specific gate surface (`unsigned-tag`, `non-annotated-tag`, off-main, prerelease, retry classification, or workflow-output drift) rather than degrading into a generic publish failure.

## Edge Case 2 — Worktree-local JReleaser still needs the compatibility root
**Goal:** avoid misclassifying the known worktree git-metadata seam as product drift.

1. After Test Case 3, confirm `.yanote-ci/m016-s02-release-pipeline-proof/git-compatible-root/` exists.
   **Expected:** the compatibility root is present because the verifier stages a real `.git/` directory for JReleaser while keeping outputs in the active worktree.
2. If a future rerun fails with a `HEAD`/git-resolution error during the Gradle or JReleaser phase, inspect the compatibility-root setup before changing the release pipeline logic.
   **Expected:** the first recovery step is to inspect the retained proof bundle and compatibility-root metadata, not to weaken the tag-driven contract or bypass git-based release metadata resolution.
