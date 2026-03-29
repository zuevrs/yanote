---
id: S01
parent: M016
milestone: M016
provides:
  - A stable staged standalone analyzer launcher at `dist/standalone-analyzer/bin/yanote` backed by bundle-local version metadata.
  - A dedicated release asset contract at `build/distributions/yanote-analyzer.zip` with deterministic analyzer manifest/checksum/proof entries.
  - Gradle and CI analyzer validation surfaces that now consume the same standalone launcher contract users see publicly.
  - A retained extracted-bundle proof plus public doc guards that keep the standalone install/run story truthful for downstream slices.
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - build.gradle.kts
  - yanote-js/bin/yanote
  - .github/workflows/release.yml
  - scripts/release/assemble-release-assets.sh
  - scripts/ci/run-yanote-gradle-check.sh
  - scripts/ci/verify-m016-s01-standalone-analyzer.sh
  - README.md
  - docs/README.md
  - docs/guides/analyzer-coverage.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
key_decisions:
  - Bundle-local `VERSION` metadata drives public analyzer version truth through the stable `bin/yanote` launcher instead of exposing `yanote-js` source markers.
  - The official analyzer release contract is the dedicated `build/distributions/yanote-analyzer.zip` asset, not a generic `yanote-dist-all.zip` bundle.
  - Gradle and CI now default to `dist/standalone-analyzer/bin/yanote`, reject raw `yanote.cjs` override paths, and keep explicit override escape hatches launcher-aware.
  - Retained analyzer command surfaces publish both `analyzer_path` and `analyzer_contract` so launcher-vs-override drift is attributable from artifacts.
  - Public docs and doc guards now pin one install/run story: `yanote-analyzer.zip` -> `bin/yanote` -> `report` / `async-report` / `combined-report`.
patterns_established:
  - Treat the standalone analyzer as a first-class contract across build, release, CI, and docs: one launcher, one archive, one wording surface.
  - Keep public analyzer version truth bundle-local (`VERSION` -> launcher env -> runtime) so release-tagged bundles do not leak workspace marker versions.
  - When a public CLI contract changes, retain artifact-level provenance (`artifact-manifest.txt`, `artifact-source-paths.txt`, `analyzer_path`, `analyzer_contract`) so future slices can debug drift without reconstructing the whole pipeline.
observability_surfaces:
  - `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt` summarizes archive/build/version/report outcomes and retained proof files.
  - `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-source-paths.txt` localizes bundle-layout, launcher, runtime, and report artifact provenance.
  - `build/yanote/aggregate/check/yanote-check-command.args` publishes the exact analyzer command plus `analyzer_path` and `analyzer_contract=standalone-launcher`.
  - `.yanote-ci/yanote-command.txt` records the CI helper's chosen analyzer path/source and Gradle commands.
  - `build/release-bundle/v1.2.3/v1.2.3-manifest.txt` shows the dedicated analyzer asset row plus checksum/proof sidecars in the assembled release bundle.
drill_down_paths:
  - .gsd/milestones/M016/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M016/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M016/slices/S01/tasks/T04-SUMMARY.md
  - .gsd/milestones/M016/slices/S01/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T23:20:29.356Z
blocker_discovered: false
---

# S01: Standalone analyzer shipping contract

**S01 established Yanote’s standalone analyzer shipping contract across bundle, release asset, Gradle/CI, extracted-bundle proof, and public docs.**

## What Happened

S01 turned the analyzer from an internal-looking `yanote-js` build seam into one coherent standalone shipping contract across five surfaces: staged bundle layout, release archive, Gradle/CI defaults, end-to-end extracted-bundle proof, and public docs. Users and downstream automation now target a stable launcher at `dist/standalone-analyzer/bin/yanote` and an official release asset at `build/distributions/yanote-analyzer.zip`, while the internal Node implementation stays private behind that launcher.

Concretely, T01 introduced a tracked `bin/yanote` launcher, staged bundle metadata, and lazy version resolution so bundle-local `VERSION` truth reaches both `--version` and generated reports. T02 packaged that bundle as a dedicated `yanote-analyzer.zip` release asset with deterministic manifest/checksum/proof sidecars and fail-closed workflow assertions. T03 rewired Gradle and CI to consume the same launcher contract by default, reject raw `yanote.cjs` default usage, and retain `analyzer_path` / `analyzer_contract` breadcrumbs in their command artifacts. T04 added a rerunnable proof that extracts the official archive, runs the extracted launcher outside the build tree, and retains enough artifacts to localize archive-vs-launcher-vs-report drift. T05 updated README and public guides so HTTP and async install/run examples all point to the same standalone bundle and added fail-closed doc guards against regressions back to the raw implementation seam.

For downstream slices, the main dependency summary is: S02 can publish the dedicated analyzer asset without redesigning packaging; S03/S04 must preserve the standalone analyzer contract while cleaning the public repo face and shortening docs; S05 can reuse the retained proof bundle, release manifest, and command-args breadcrumbs as integration evidence surfaces.

## Operational Readiness
- **Health signal:** `bash scripts/ci/verify-m016-s01-standalone-analyzer.sh` succeeds and `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt` reports `proof_status=success`, matching `expected_version` / `version_output`, plus `report_json_found=true` and `report_html_found=true`.
- **Failure signal:** `bash scripts/ci/run-yanote-gradle-check.sh` fails, `build/yanote/aggregate/check/yanote-check-command.args` loses `analyzer_contract=standalone-launcher`, `build/release-bundle/<tag>/<tag>-manifest.txt` stops listing the analyzer asset/checksum/proof rows, or the doc guards reintroduce raw `yanote-js/dist/yanote.cjs` commands.
- **Recovery procedure:** rerun `./gradlew distStandaloneAnalyzer`, then rerun the release/CI/doc verifier stack sequentially. If the extracted proof still fails, inspect `.yanote-ci/m016-s01-standalone-analyzer-proof/{artifact-manifest.txt,artifact-source-paths.txt,distStandaloneAnalyzer.stdout.log,distStandaloneAnalyzer.stderr.log,archive-contents.txt,bundle-layout.txt,version/,report/}` together with `build/yanote/aggregate/check/yanote-check-command.args` and `.yanote-ci/yanote-command.txt` to localize whether drift came from bundle staging, archive packaging, launcher resolution, or report execution.
- **Monitoring gaps:** there is not yet a single end-to-end tag-publication proof for this analyzer asset contract; that gap is what S02 closes. Parallel `distStandaloneAnalyzer` consumers can also race during packaging, so verification runners should stay serialized until the staging directory is isolated per invocation.

## Verification

All slice-plan verification commands passed in the worktree:

- ✅ `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts` (`--version` printed `0.1.0-SNAPSHOT`; duration ~12.7s)
- ✅ `./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` (duration ~3.5s)
- ✅ `./gradlew :yanote-gradle-plugin:test && bash scripts/ci/run-yanote-gradle-check.sh && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` (duration ~4.8s)
- ✅ `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh` (duration ~7.0s)
- ✅ `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` (duration ~3.6s)

Additional closeout confirmation:
- ✅ `YANOTE_ANALYZER_PATH=yanote-js/dist/yanote.cjs bash scripts/ci/run-yanote-gradle-check.sh` failed closed with exit `2` and the expected raw-seam rejection message.
- ✅ Observability/diagnostic surfaces were inspected directly: `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-manifest.txt`, `.yanote-ci/m016-s01-standalone-analyzer-proof/artifact-source-paths.txt`, `build/yanote/aggregate/check/yanote-check-command.args`, `.yanote-ci/yanote-command.txt`, and `build/release-bundle/v1.2.3/v1.2.3-manifest.txt` all reflected the standalone launcher/analyzer asset contract truthfully.

## Requirements Advanced

None.

## Requirements Validated

- R039 — Validated by the passing standalone-bundle contract test, dedicated analyzer release-asset contract tests, Gradle/CI launcher migration verifier, extracted-bundle install/run proof, and public doc guard stack.
- R042 — Validated by the public `yanote-analyzer.zip` -> `bin/yanote` install/run path, rejection of raw `yanote.cjs` as the default Gradle/CI contract, and fail-closed doc guards that prevent Node-internal commands from reappearing in public docs.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Kept the legacy `distAll` / raw `yanote.cjs` implementation seam available for internal compatibility and focused tests, but removed it from the public default contract. Also made `scripts/docs/verify-s02-analysis-path.sh` prove the public docs against the extracted official archive instead of the raw implementation seam so the doc guard matches the shipped surface.

## Known Limitations

S01 defines and proves the standalone analyzer shipping contract, but the fully authoritative tag-driven publication flow still belongs to S02. Broader public-repo cleanup and the remaining product-doc simplification still belong to S03/S04. Also, `distStandaloneAnalyzer` consumers should be run sequentially for now because parallel packaging can race on `dist/standalone-analyzer/node_modules` and create false-negative verifier failures.

## Follow-ups

S02 should reuse `build/distributions/yanote-analyzer.zip` and the analyzer asset-index contract as the authoritative publishable analyzer surface, then prove the release tag drives it fail-closed end to end. S03/S04 should preserve the standalone analyzer wording while cleaning the broader repo boundary and shortening product docs. S05 should reuse the retained proof bundle plus command-args/release-manifest surfaces as cross-slice integration breadcrumbs.

## Files Created/Modified

- `build.gradle.kts` — Added shared standalone analyzer staging/archive tasks, bundle metadata injection, and the dedicated `yanote-analyzer.zip` distribution contract.
- `yanote-js/bin/yanote` — Added the stable public launcher that exports bundle-local version metadata before invoking the bundled runtime.
- `yanote-js/src/version.ts` — Made analyzer version resolution lazy so staged bundle metadata reaches `--version` and generated report `toolVersion` fields.
- `scripts/release/analyzer-standalone.contract.test.mjs` — Pinned the standalone bundle layout, launcher behavior, and fail-closed version/runtime cases.
- `.github/workflows/release.yml` — Rewired tag publication to build and upload the dedicated standalone analyzer asset contract.
- `scripts/release/assemble-release-assets.sh` — Made release assembly fail closed on missing/misnamed analyzer assets and emit analyzer checksum/proof/manifest rows.
- `scripts/ci/run-yanote-gradle-check.sh` — Moved the CI helper to the standalone launcher default and retained analyzer command provenance for debugging.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` — Switched Gradle plugin default analyzer execution and diagnostics to the standalone launcher contract.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/AnalyzerCommandSupport.kt` — Centralized launcher-aware analyzer execution and override validation for Gradle tasks.
- `scripts/ci/verify-m016-s01-standalone-analyzer.sh` — Added the rerunnable extracted-bundle proof with retained manifest/source-path observability artifacts.
- `scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs` — Pinned the extracted-bundle proof contract and retained artifact expectations.
- `README.md` — Rewrote the public README install/run path to the standalone analyzer bundle.
- `docs/README.md` — Aligned the docs landing page with the standalone analyzer launcher contract.
- `docs/guides/analyzer-coverage.md` — Updated the HTTP analyzer guide to use the standalone bundle and launcher commands.
- `docs/guides/asyncapi-kafka.md` — Updated the async guide to use the same standalone launcher contract for `async-report` and `combined-report`.
- `docs/release-and-support.md` — Reframed release/support docs around the standalone analyzer asset as public truth.
