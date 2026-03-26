# S01: Supported Remote Spec Inputs With Sanitized Provenance

**Goal:** Support local file, local directory, and sanitized remote single-document spec inputs through Yanote’s real analyzer entrypoints, persist truthful source provenance, and prove the remote path without regressing the deterministic local baseline.
**Demo:** Run Yanote through the real CLI and Gradle entrypoints against a fixture URL, then inspect retained artifacts showing sanitized remote provenance while the same project still works from local file and directory inputs.
**Active requirements:** None currently active in `REQUIREMENTS.md` for S01; this slice still advances the validated delivery/support boundary around `R001`, `R003`, and `R023`.

## Must-Haves

- Support exactly three first-class spec-source kinds on analyzer entrypoints: local file, local directory, and remote single-document `http(s)` URL.
- Keep local directory discovery filesystem-only and keep remote support narrow: reject userinfo, query strings, fragments, unsupported schemes, and any other unsafe remote form before any persisted surface is written.
- Preserve the deterministic analyzer behavior for the existing local file and directory flows while adding remote URL resolution for the real CLI and Gradle `report` entrypoints.
- Persist sanitized spec-source provenance on retained report, summary, and command-argument surfaces so a future agent can tell whether a run used a local file, local directory, or remote URL without seeing credentials or token-like URL parts.
- Prove the boundary with executable tests and a retained localhost fixture proof that runs Yanote from local file, local directory, and remote URL inputs and inspects sanitized artifacts.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`
- `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`
- `bash scripts/ci/verify-m013-s01-remote-spec.sh`

## Observability / Diagnostics

- Runtime signals: retained reports and machine summaries publish source kind plus sanitized provenance, and typed input/runtime failures identify unsupported remote inputs or fetch/load failures without echoing secrets.
- Inspection surfaces: `yanote-report.json`, `yanote-async-report.json`, CLI `YANOTE_SUMMARY`, CLI `YANOTE_ASYNC_SUMMARY`, Gradle `yanote-check-command.args`, Gradle `yanote-report-command.args`, and the retained bundle from `bash scripts/ci/verify-m013-s01-remote-spec.sh`.
- Failure visibility: source-resolution failures localize to source kind and fetch/load phase, while retained artifacts keep enough provenance to distinguish local file, local directory, and remote URL runs.
- Redaction constraints: never persist raw userinfo, auth headers, query tokens, or fragments from remote URLs.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/spec/discover.ts`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/report/*`, and the Gradle delivery tasks in `yanote-gradle-plugin`.
- New wiring introduced in this slice: a shared spec-source resolver for local vs remote inputs, sanitized source provenance threaded into retained analyzer surfaces, and Gradle remote-spec handling that keeps persisted command surfaces secret-safe.
- What remains before the milestone is truly usable end-to-end: S02 still needs deprecated-operation truth, S03 still needs static HTML writers, and S04 still needs CI/docs support-boundary publication for the widened delivery surface.

## Tasks

- [x] **T01: Enable supported remote spec resolution on the real CLI entrypoints** `est:1h30m`
  - Why: The highest-risk boundary is still local-only source resolution; the slice needs the real CLI entrypoints to accept the supported remote subset before provenance or Gradle wiring matters.
  - Files: `yanote-js/src/spec/discover.ts`, `yanote-js/src/spec/specSource.ts`, `yanote-js/src/spec/specSource.test.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/cli.remote-spec.contract.test.ts`
  - Do: add a shared resolver that classifies `local-file`, `local-directory`, and `remote-url`; accept only single-document public `http(s)` URLs without userinfo/query/fragment; materialize remote documents safely for the existing loaders; wire `yanote report` and `yanote async-report` through the resolver; and add localhost fixture tests that prove local file, local directory, remote URL success plus unsafe-remote rejection.
  - Verify: `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts`
  - Done when: both CLI commands can analyze a localhost-served spec URL, current local file/directory flows still pass, and unsafe remote forms fail with typed input errors before anything persists the original URL.
- [x] **T02: Publish sanitized spec-source provenance on retained report and summary surfaces** `est:1h20m`
  - Why: Remote support is not trustworthy unless the persisted analyzer outputs say where the spec came from while remaining secret-safe.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/report/asyncNormalize.ts`, `yanote-js/src/report/report.remote-spec.contract.test.ts`, `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
  - Do: thread resolved source metadata from the CLI into the HTTP and async report builders; add deterministic `specSource` sections to the canonical JSON models; update schema/normalization and human/machine summaries to expose source kind consistently for local file, local directory, and remote URL runs; and pin redaction/determinism with focused report and summary contract tests.
  - Verify: `npm -C yanote-js test -- src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.remote-spec.contract.test.ts`
  - Done when: `yanote-report.json`, `yanote-async-report.json`, `YANOTE_SUMMARY`, and `YANOTE_ASYNC_SUMMARY` disclose source kind plus sanitized provenance without changing legacy coverage math or leaking credential-bearing URL parts.
- [x] **T03: Support remote spec URLs on Gradle delivery surfaces and prove sanitized retained artifacts** `est:1h40m`
  - Why: The slice demo is only true once the Gradle path and retained proof artifacts show the same narrow remote-support contract as the CLI.
  - Files: `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`, `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`, `scripts/ci/run-yanote-gradle-check.sh`, `scripts/ci/verify-m013-s01-remote-spec.sh`, `scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs`
  - Do: widen the Gradle tasks so supported remote `http(s)` URLs bypass local `project.file(...)` existence checks while local paths stay strict; sanitize the persisted `yanote-check-command.args` and `yanote-report-command.args` surfaces; parameterize the Gradle helper script for local vs remote spec sources; and add a localhost proof script plus contract test that exercise CLI local file/local directory/remote URL flows and the Gradle remote URL path into a retained `.yanote-ci/remote-spec-proof/` bundle.
  - Verify: `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest' && bash scripts/ci/verify-m013-s01-remote-spec.sh`
  - Done when: Gradle runs succeed against the fixture URL, local path validation remains strict, and the retained proof bundle plus Gradle command-argument files show only sanitized source provenance alongside the unchanged local file/directory baseline.

## Files Likely Touched

- `yanote-js/src/spec/discover.ts`
- `yanote-js/src/spec/specSource.ts`
- `yanote-js/src/spec/specSource.test.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/verify-m013-s01-remote-spec.sh`
- `scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs`
