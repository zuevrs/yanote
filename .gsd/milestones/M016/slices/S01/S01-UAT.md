# S01: Standalone analyzer shipping contract — UAT

**Milestone:** M016
**Written:** 2026-03-28T23:20:29.356Z

# S01 UAT — Standalone analyzer shipping contract

## Preconditions
- Work from the M016 worktree root.
- Java 21, Node.js, npm, and unzip are available.
- No other `distStandaloneAnalyzer` run is executing in parallel (the bundle staging directory is not isolated yet).
- Delete or ignore previous `.yanote-ci/m016-s01-standalone-analyzer-proof/` contents before re-running proof commands.

## Test Case 1 — Stage the standalone analyzer bundle and verify bundle-local version truth
**Goal:** prove the staged bundle exposes one stable launcher path and truthful version output.

1. Run:
   ```bash
   ./gradlew distStandaloneAnalyzer
   ```
   **Expected:** build succeeds and creates `dist/standalone-analyzer/`.
2. Confirm these files exist:
   - `dist/standalone-analyzer/bin/yanote`
   - `dist/standalone-analyzer/lib/yanote.cjs`
   - `dist/standalone-analyzer/VERSION`
   - `dist/standalone-analyzer/package.json`
   **Expected:** all files are present under the standalone bundle root.
3. Run:
   ```bash
   dist/standalone-analyzer/bin/yanote --version
   ```
   **Expected:** stdout matches the contents of `dist/standalone-analyzer/VERSION` and does not fall back to an internal `0.0.0` source marker.
4. Run:
   ```bash
   node --test scripts/release/analyzer-standalone.contract.test.mjs
   npm -C yanote-js test -- src/cli.test.ts
   ```
   **Expected:** both test commands pass; contract coverage pins the launcher path, bundle layout, and version behavior.

## Test Case 2 — Verify the official release archive works after extraction
**Goal:** prove the public `yanote-analyzer.zip` artifact works outside the build tree.

1. Run:
   ```bash
   node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs
   bash scripts/ci/verify-m016-s01-standalone-analyzer.sh
   ```
   **Expected:** both commands pass.
2. Inspect `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt`.
   **Expected:** it contains `proof_status=success`, `version_output=` equal to `expected_version`, `report_json_found=true`, `report_html_found=true`, and a `proof_summary=` line.
3. Inspect `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-source-paths.txt`.
   **Expected:** it lists the extracted launcher, runtime, `VERSION`, report outputs, and the exact `version_command=` / `report_command=` used from the extracted bundle.
4. Open `.yanote-ci/m016-s01-standalone-analyzer-proof/report/out/yanote-report.json` and `.yanote-ci/m016-s01-standalone-analyzer-proof/report/out/yanote-report.html`.
   **Expected:** both files exist, were produced by the extracted launcher, and represent the same report run.

## Test Case 3 — Verify the dedicated analyzer release-asset contract
**Goal:** prove release assembly exposes one deterministic analyzer asset contract.

1. Run:
   ```bash
   ./gradlew cyclonedxBom distStandaloneAnalyzer
   mkdir -p build/release-assets
   printf 'analyzer|build/distributions/yanote-analyzer.zip\n' > build/release-assets/index.txt
   RELEASE_TAG=v1.2.3 \
   RELEASE_ASSET_INDEX=build/release-assets/index.txt \
   SBOM_PATH=build/reports/cyclonedx/bom.json \
   TRACEABILITY_JSON_PATH=docs/traceability/v1-requirements-tests.json \
   TRACEABILITY_MARKDOWN_PATH=docs/traceability/v1-requirements-tests.md \
   bash scripts/release/assemble-release-assets.sh
   ```
   **Expected:** the assembly succeeds and creates `build/release-bundle/v1.2.3/`.
2. Inspect `build/release-bundle/v1.2.3/v1.2.3-manifest.txt`.
   **Expected:** it includes:
   - `asset=v1.2.3-analyzer.zip`
   - matching `.sha256` and `.sha256.proof` rows
   - `release-asset-types=analyzer`
3. Run:
   ```bash
   node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs
   ```
   **Expected:** both contract suites pass and reject missing/misnamed analyzer assets or legacy generic analyzer publication.

## Test Case 4 — Verify Gradle and CI use the standalone launcher by default
**Goal:** prove internal delivery surfaces now consume the same launcher contract users see publicly.

1. Run:
   ```bash
   ./gradlew :yanote-gradle-plugin:test
   bash scripts/ci/run-yanote-gradle-check.sh
   node --test scripts/ci/yanote-ci-workflow.contract.test.mjs
   ```
   **Expected:** all three commands pass.
2. Inspect `build/yanote/aggregate/check/yanote-check-command.args`.
   **Expected:** it shows the analyzer command beginning with `dist/standalone-analyzer/bin/yanote`, and contains both `analyzer_path=` and `analyzer_contract=standalone-launcher`.
3. Inspect `.yanote-ci/yanote-command.txt`.
   **Expected:** it records `YANOTE_ANALYZER_PATH=` pointing to `dist/standalone-analyzer/bin/yanote` and `YANOTE_ANALYZER_SOURCE=default`.

## Test Case 5 — Verify public docs agree on the standalone install/run story
**Goal:** prove the public README and guides do not regress to the raw `yanote-js` seam.

1. Run:
   ```bash
   bash scripts/docs/verify-s01-doc-links.sh
   bash scripts/docs/verify-s02-analysis-path.sh
   bash scripts/docs/verify-s04-boundaries.sh
   bash scripts/docs/verify-m005-s01-async-path.sh
   bash scripts/docs/verify-m005-s01-async-boundaries.sh
   ```
   **Expected:** all five verifiers pass.
2. Spot-check `README.md`, `docs/guides/analyzer-coverage.md`, and `docs/guides/asyncapi-kafka.md`.
   **Expected:** each surface points to the standalone bundle/launcher contract and uses `report`, `async-report`, or `combined-report` through `bin/yanote` rather than `node yanote-js/dist/yanote.cjs`.

## Edge Case 1 — Raw `yanote.cjs` override is rejected fail-closed
**Goal:** prove legacy raw-seam overrides are no longer accepted as the default public contract.

1. Run:
   ```bash
   YANOTE_ANALYZER_PATH=yanote-js/dist/yanote.cjs bash scripts/ci/run-yanote-gradle-check.sh
   ```
   **Expected:** command exits with status `2` and prints an error explaining that `YANOTE_ANALYZER_PATH` must point to the standalone launcher contract, not the raw `yanote.cjs` runtime.

## Edge Case 2 — Re-run verifiers sequentially if packaging fails unexpectedly
**Goal:** catch the known packaging race without misclassifying it as contract drift.

1. If a `distStandaloneAnalyzer`-consuming verifier fails with a missing path under `dist/standalone-analyzer/node_modules`, stop any parallel verifier runs.
2. Re-run the failed command by itself.
   **Expected:** the sequential rerun passes; if it does not, inspect the retained proof/log artifacts before filing a product regression.
