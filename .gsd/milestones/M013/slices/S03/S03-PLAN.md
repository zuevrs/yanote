# S03: Static HTML Reports From Canonical HTTP And Async Truth

**Goal:** Generate separate static offline HTML artifacts for HTTP and async analyzer reports from the same canonical normalized truth as the sibling JSON files, while preserving sanitized provenance, supported delivery boundaries, and the out-of-scope combined-dashboard contract.
**Demo:** Open `yanote-report.html` and `yanote-async-report.html` after real analyzer runs and review the same truth as JSON in separate offline-viewable artifacts.
**Active requirements:** Support `R003` by making the human-friendly artifact appear on real supported analyzer delivery surfaces instead of an ad hoc local renderer. Support `R004` by rendering explicit sanitized `specSource` kind/reference in both HTML artifacts. Preserve `R005` and `R030` by keeping HTTP and async artifacts separate, static, and out of dashboard/server-hosted scope. Continue supporting `R001`, `R002`, and `R022` by deriving HTML strictly from canonical normalized report truth without changing gate or coverage semantics.

## Must-Haves

- `writeYanoteReport()` writes a sibling `yanote-report.html` derived from the normalized, schema-valid HTTP report object, including deprecated truth, coverage/request/security/governance sections, and sanitized `specSource`.
- `writeAsyncYanoteReport()` writes a sibling `yanote-async-report.html` derived from the normalized, schema-valid async report object, including channel/operation/message coverage, diagnostics, and sanitized `specSource` without HTTP-only sections.
- Both HTML artifacts are static, offline-viewable, self-contained documents with semantic headings/tables, skip-link navigation, no external scripts/styles/fonts, and no raw event dumps or secret-bearing values.
- Real CLI runs keep `Report Path` and `report=` machine tokens JSON-centered while producing sibling `.html` files, and the supported Gradle report path continues passing through successful analyzer-created sibling artifacts without inventing stub HTML.
- A retained proof bundle captures separate HTTP and async JSON+HTML artifacts and fails on combined-report/dashboard drift, missing provenance, external asset references, or leaked sentinel secret strings.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/writeAsyncReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts`
- `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`
- `bash scripts/ci/verify-m013-s03-static-html-reports.sh`
- `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`

## Observability / Diagnostics

- Runtime signals: sibling `yanote-report.html` and `yanote-async-report.html` files next to the canonical JSON reports, plus retained proof manifests/stdout that restate key counts and `specSource`.
- Inspection surfaces: focused writer/CLI tests, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`, and `.yanote-ci/static-html-reports-proof/`.
- Failure visibility: missing sibling HTML, JSON-vs-HTML truth drift, external asset references, or secret sentinel leakage fail focused tests/proof checks with localized artifact paths.
- Redaction constraints: render only canonical normalized report fields, keep sanitized `specSource` intact, and never embed raw events, credentials, or unsanitized retained values.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/report/report.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/asyncNormalize.ts`, `yanote-js/src/cli.ts`, and `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`.
- New wiring introduced in this slice: self-contained HTML sibling writers hang off `writeReport` / `writeAsyncReport`; CLI and Gradle delivery tests pin successful pass-through without widening JSON machine summaries or stub surfaces.
- What remains before the milestone is truly usable end-to-end: S04 still needs CI artifact publication, docs/support wording, and public support-boundary closeout; no combined dashboard/server UI is introduced here.

## Tasks

- [x] **T01: Render self-contained HTTP HTML from canonical report truth** `est:1h25m`
  - Why: HTTP is the broader and riskier human-facing surface, so it should establish the shared HTML shell, redaction rules, and canonical section mapping first.
  - Files: `yanote-js/src/report/writeReport.ts`, `yanote-js/src/report/reportHtml.ts`, `yanote-js/src/report/htmlDocument.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`, `yanote-js/src/report/report.remote-spec.contract.test.ts`, `yanote-js/src/report/report.test.ts`
  - Do: add self-contained HTML shell/helpers with inline CSS and safe escaping; render `yanote-report.html` from the normalized validated HTTP DTO beside JSON; extend deterministic writer/provenance tests to assert deprecated truth, `specSource`, offline/self-contained behavior, and secret-safe rendering without changing the returned JSON path.
  - Verify: `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.test.ts`
  - Done when: the HTTP writer emits stable sibling JSON+HTML artifacts, the HTML exposes deprecated/provenance truth from canonical data only, and focused tests fail on external assets or leaked sentinel strings.
- [x] **T02: Mirror the static HTML contract on async reports** `est:1h10m`
  - Why: Async needs the same offline human artifact guarantees as HTTP, but with a deliberately separate async-only surface that does not inherit HTTP wording or combined-report behavior.
  - Files: `yanote-js/src/report/writeAsyncReport.ts`, `yanote-js/src/report/asyncReportHtml.ts`, `yanote-js/src/report/htmlDocument.ts`, `yanote-js/src/report/writeAsyncReport.determinism.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
  - Do: reuse the shared shell for an async-specific renderer; emit `yanote-async-report.html` from the normalized async DTO beside JSON while keeping the writer JSON-centered; add the missing async writer determinism/provenance coverage to prove separate async sections, self-contained assets, and no HTTP-only leakage.
  - Verify: `npm -C yanote-js test -- src/report/writeAsyncReport.determinism.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`
  - Done when: the async writer emits stable sibling JSON+HTML artifacts, async HTML shows only async-native truth plus sanitized provenance, and focused tests catch HTTP-section leakage or external-asset drift.
- [x] **T03: Pin CLI and Gradle delivery surfaces around sibling HTML artifacts** `est:1h15m`
  - Why: The slice does not satisfy `R003` until real supported entrypoints prove the new human artifacts appear without widening the existing JSON-centered machine summary contract.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
  - Do: update CLI integration/summary tests so `report` and `async-report` assert sibling `.html` output while `Report Path` and machine `report=` tokens stay JSON-centered; extend the Gradle remote-spec contract test’s fake analyzer output to include `yanote-report.html` and assert successful report runs preserve analyzer-created sibling artifacts without inventing stub HTML.
  - Verify: `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts && ./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`
  - Done when: real CLI tests find sibling HTML for both report modes, Gradle report tests preserve analyzer-created HTML artifacts, and no combined-report/dashboard or report-path drift appears in summaries.
- [x] **T04: Retain a static HTML proof bundle from real HTTP and async runs** `est:55m`
  - Why: Future agents need one rerunnable retained proof that demonstrates separate offline HTML artifacts from real entrypoints without re-reading all unit and integration tests.
  - Files: `scripts/ci/verify-m013-s03-static-html-reports.sh`, `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`, `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`, `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html`, `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html`
  - Do: build the real CLI, run HTTP `report` and async `async-report` against the dedicated fixtures, retain stdout/stderr/exit codes plus sibling JSON/HTML artifacts, and pin a contract test plus manifest claims for separate surfaces, sanitized provenance, offline/self-contained HTML, and secret-safe rendering.
  - Verify: `bash scripts/ci/verify-m013-s03-static-html-reports.sh && node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`
  - Done when: the retained proof bundle shows separate HTTP and async HTML artifacts beside JSON, restates key provenance/count guarantees in the manifest, and fails immediately on dashboard/combined-report drift, external assets, or sentinel secret leakage.

## Files Likely Touched

- `yanote-js/src/report/writeReport.ts`
- `yanote-js/src/report/reportHtml.ts`
- `yanote-js/src/report/htmlDocument.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/writeAsyncReport.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
- `scripts/ci/verify-m013-s03-static-html-reports.sh`
- `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`
- `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`
- `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html`
- `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html`
