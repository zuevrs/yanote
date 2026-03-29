# S01: Standalone analyzer shipping contract

**Goal:** Establish one official standalone analyzer CLI artifact contract and install/run surface that hides the internal `yanote-js` build seam while staying truthful for release, Gradle, and public documentation surfaces.
**Demo:** After this: Yanote has one official standalone analyzer CLI artifact contract and public install/run shape, even though the implementation may still be built from `yanote-js` internally.

## Tasks
- [x] **T01: Added a versioned standalone analyzer bundle with a stable bin/yanote launcher.** — Build the actual standalone bundle contract that S02 can later publish without forcing users through the `yanote-js` source-build seam. The task should make the staged bundle itself the first-class surface and pin its launcher/version behavior in tests.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `npm -C yanote-js run build` | Fail the standalone bundle build and keep the version/launcher contract tests red until the runtime bundle is complete | Treat as a broken bundle build; do not fall back to a pre-existing `dist/node-analyzer` output | Reject the bundle if version metadata or runtime files are incomplete |
| `./gradlew distStandaloneAnalyzer` | Stop before release/consumer wiring; no silent fallback to the old `distAll` contract | Surface the exact staging task and partial output directory for inspection | Refuse to publish a launcher missing required runtime companions |

## Load Profile

- **Shared resources**: staged `dist/standalone-analyzer/` output, version metadata, launcher script, and bundled Node dependencies.
- **Per-operation cost**: one `yanote-js` build plus file copy/packaging work.
- **10x breakpoint**: repeated dependency reinstalls and bundle file copying dominate before analyzer runtime work does.

## Negative Tests

- **Malformed inputs**: missing release version metadata or stale default `0.0.0` leaking into the staged bundle.
- **Error paths**: launcher exists but cannot resolve the bundled CJS/runtime files, or the staging task silently reuses the old `dist/node-analyzer` layout.
- **Boundary conditions**: `bin/yanote --version` matches staged version while `report` / `async-report` / `combined-report` still resolve the same CLI implementation.

## Steps

1. Add a stable tracked launcher source (for example `yanote-js/bin/yanote`) and update the staging task in `build.gradle.kts` so the repo can build one standalone analyzer directory instead of exposing raw `yanote.cjs` as the public contract.
2. Make version metadata injectable into the staged bundle so release-tagged builds can expose a real standalone CLI version without requiring source-built `yanote-js` markers to become public truth.
3. Keep the internal runtime seam private: the launcher should resolve bundled implementation files relative to itself, not ask the user to run `node yanote-js/dist/yanote.cjs`.
4. Add focused contract coverage for launcher path, bundle layout, and version behavior.

## Must-Haves

- [ ] The staged standalone bundle exposes one stable launcher path for users and automation.
- [ ] Version output can come from staged bundle metadata rather than the raw `yanote-js` HEAD marker.
- [ ] The standalone bundle contract stays explicit and test-pinned instead of inferred from ad hoc `dist/` contents.
  - Estimate: 1h20m
  - Files: build.gradle.kts, yanote-js/esbuild.config.mjs, yanote-js/package.json, yanote-js/src/version.ts, yanote-js/src/cli.test.ts, yanote-js/bin/yanote, scripts/release/analyzer-standalone.contract.test.mjs
  - Verify: ./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts
- [x] **T02: Published the standalone analyzer as the dedicated yanote-analyzer.zip release asset contract.** — Turn the staged bundle into the official publication contract by giving it its own asset name, manifest entries, and release workflow assertions. This makes S02 able to publish one analyzer artifact instead of hiding it inside a generic dist zip.

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
  - Estimate: 1h
  - Files: build.gradle.kts, .github/workflows/release.yml, scripts/release/assemble-release-assets.sh, scripts/release/release-workflow.contract.test.mjs, scripts/release/github-release.contract.test.mjs
  - Verify: ./gradlew distStandaloneAnalyzer && node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs
- [x] **T03: Routed Gradle and CI analyzer validation through the standalone launcher contract and removed the raw yanote.cjs seam from the default path.** — Keep existing Gradle and CI delivery surfaces truthful by consuming the same standalone launcher contract instead of separately documented raw `yanote.cjs` paths.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/ci/run-yanote-gradle-check.sh` | Fail the helper with a clear missing-launcher message and keep command-args surfaces | Do not silently rerun `npm -C yanote-js ...` as a hidden fallback | Reject malformed analyzer-path overrides before invoking Gradle tasks |
| `yanote-gradle-plugin` tasks | Missing standalone launcher must fail or stub exactly as the contract says; no implicit raw-cjs fallback | Long analyzer runs should still leave `yanote-*-command.args` and output dirs inspectable | Malformed override paths should surface typed Gradle diagnostics rather than hanging |

## Load Profile

- **Shared resources**: staged standalone bundle, helper fixture project, plugin output dirs, and command-args surfaces.
- **Per-operation cost**: one bundle staging task plus one helper-driven Gradle run.
- **10x breakpoint**: repeated bundle staging and fixture Gradle invocations dominate before analyzer execution.

## Negative Tests

- **Malformed inputs**: missing launcher path, override pointing at a directory, or override pointing back to a stale raw CJS file.
- **Error paths**: helper runs without the bundle, plugin error messages still instruct source-built `yanote-js` commands, or args surfaces leak the old raw path.
- **Boundary conditions**: default launcher path works, explicit `analyzerPath` override still works, and remote-spec/report flows remain supported.

## Steps

1. Change the default analyzer path in the Gradle plugin and CI helper to the standalone launcher path from T01 while keeping explicit overrides possible.
2. Update missing-runtime diagnostics and command-args surfaces so they reference the standalone bundle contract rather than `dist/node-analyzer/bin/yanote.cjs`.
3. Extend Gradle plugin tests to prove the launcher path, override path, and remote-spec flows still work through the new contract.
4. Keep required CI contract tests aligned with the helper's new launcher path and build task.

## Must-Haves

- [ ] Gradle and CI consumers no longer make the raw `yanote.cjs` seam the default public contract.
- [ ] Missing-bundle diagnostics point future agents to the standalone bundle staging step and launcher path.
- [ ] Existing Gradle validation capabilities still work with the new launcher contract.
  - Estimate: 1h10m
  - Files: scripts/ci/run-yanote-gradle-check.sh, scripts/ci/yanote-ci-workflow.contract.test.mjs, yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt, yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt, yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt, yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt, yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteStandaloneBundleContractTest.kt
  - Verify: ./gradlew :yanote-gradle-plugin:test && bash scripts/ci/run-yanote-gradle-check.sh && node --test scripts/ci/yanote-ci-workflow.contract.test.mjs
- [x] **T04: Added a staged-bundle verifier that proves the standalone `yanote-analyzer.zip` install/run path works end to end.** — Add one rerunnable proof that stages and extracts the standalone analyzer bundle the way a user or release automation would, then proves `--version` and `report` work without source-build commands.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `build/distributions/yanote-analyzer.zip` | Fail with exact missing-asset guidance and retain build/proof logs | Bundle build timeout retains the proof workspace for inspection | Malformed archive structure aborts before report execution |
| extracted `bin/yanote` | Non-zero exit retains stdout/stderr and extracted bundle layout | Report timeout retains fixtures and output paths | Missing or unexpected summary/report outputs fail closed |
| fixture-based `report` run | Missing report JSON/HTML or version drift fails the proof | Timed out report run retains extracted bundle and inputs | Malformed report surfaces fail with exact file/field diagnostics |

## Load Profile

- **Shared resources**: extracted standalone bundle, fixture inputs, retained proof directory, and stdout/stderr artifacts.
- **Per-operation cost**: one bundle build/extract, one `--version` call, and one `report` invocation.
- **10x breakpoint**: repeated bundle extraction and report generation dominate the cost.

## Negative Tests

- **Malformed inputs**: missing archive, missing launcher, or missing bundled runtime files after extraction.
- **Error paths**: `--version` reports the wrong version, `report` requires `node yanote-js/dist/yanote.cjs`, or report outputs are absent.
- **Boundary conditions**: extracted bundle works from outside the repo build tree and emits the same `yanote-report.json` / `yanote-report.html` contract as the existing fixtures.

## Steps

1. Add a focused verifier script that builds the standalone bundle, extracts it to a temp/proof directory, and records high-signal artifact locations on failure.
2. Assert the extracted launcher can answer `--version` and run `report` against existing fixture spec/events inputs without any `npm -C yanote-js ...` or `node yanote-js/dist/yanote.cjs` user command.
3. Retain stdout/stderr/report artifacts plus a small manifest/source-path note so future agents can localize launcher-vs-report-vs-doc drift.
4. Pin the verifier with a contract test that locks expected archive names, launcher commands, and proof artifacts.

## Must-Haves

- [ ] One command proves the standalone analyzer install/run story from the staged bundle.
- [ ] The proof retains enough artifacts to debug bundle-layout, launcher, and report failures separately.
  - Estimate: 1h
  - Files: scripts/ci/verify-m016-s01-standalone-analyzer.sh, scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs
  - Verify: node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh
- [x] **T05: Updated public analyzer docs and doc guards to the standalone yanote-analyzer.zip launcher contract.** — Replace source-built analyzer wording across public docs with the new standalone CLI surface and update the doc verifiers so HTTP and async docs stay aligned on the same install/run contract.

## Load Profile

- **Shared resources**: the public README/docs surfaces and the doc verifier scripts that must stay in lockstep.
- **Per-operation cost**: synchronized wording updates plus rerunnable verifier scripts.
- **10x breakpoint**: wording drift across multiple docs/scripts becomes the main failure source long before command execution is expensive.

## Negative Tests

- **Malformed inputs**: stale `node yanote-js/dist/yanote.cjs` commands or source-built wording left in public docs.
- **Error paths**: HTTP guide and async guide describe different install/run stories, or the release/support doc still treats the standalone bundle as a secondary fallback.
- **Boundary conditions**: root README, docs landing, analyzer guide, async guide, and release/support doc all point to one official standalone CLI surface and one fallback story.

## Steps

1. Update root/public docs to describe the standalone analyzer bundle as the canonical install/run path and relegate raw `yanote-js` build details to internal implementation context only when truly needed.
2. Update HTTP and async analyzer command examples to use the standalone launcher surface consistently, while keeping the underlying `report` / `async-report` / `combined-report` semantics unchanged.
3. Rewrite release/support boundary wording so the official bundle is versioned public truth and the raw `yanote-js` build seam is no longer the user-facing contract.
4. Update doc verifier scripts to pin the new standalone CLI wording and reject regressions back to raw `yanote.cjs` commands.

## Must-Haves

- [ ] Public docs expose one standalone analyzer install/run story instead of source-building `yanote-js`.
- [ ] HTTP and async guides share the same launcher contract.
- [ ] Doc verifier scripts fail closed on drift back to the raw Node build seam.
  - Estimate: 1h10m
  - Files: README.md, docs/README.md, docs/guides/analyzer-coverage.md, docs/guides/asyncapi-kafka.md, docs/release-and-support.md, scripts/docs/verify-s01-doc-links.sh, scripts/docs/verify-s02-analysis-path.sh, scripts/docs/verify-s04-boundaries.sh, scripts/docs/verify-m005-s01-async-path.sh, scripts/docs/verify-m005-s01-async-boundaries.sh
  - Verify: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh
