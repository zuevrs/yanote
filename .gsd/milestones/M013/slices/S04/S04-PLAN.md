# S04: CI, Docs, And Support Truth For Delivery Surfaces

**Goal:** Publish truthful CI, summary, and public-support surfaces for the existing delivery paths so uploaded artifacts, GitHub step summaries, and docs all show separate HTTP/async JSON+HTML reports, sanitized remote provenance, additive deprecated-operation truth, and the explicit local-first/no-dashboard boundary.
**Demo:** Inspect a CI-style artifact bundle and published docs that show separate JSON+HTML reports, sanitized remote provenance, and explicit support wording for the local baseline, remote path, deprecated semantics, and out-of-scope dashboard behavior.
**Active requirements:** None remain active in `.gsd/STATE.md`. This slice closes the remaining M013 delivery/support work for validated `R003` and `R024` while preserving the supporting boundaries from `R001`, `R002`, `R004`, `R005`, and `R030`.

## Must-Haves

- The build-and-test and yanote-validation artifact bundles upload separate HTTP/async JSON+HTML artifacts, and their manifests/source-path notes disclose sanitized `specSource`, additive deprecated counts, and bundle provenance without leaking raw credentials or inventing combined-report surfaces.
- `scripts/ci/render-yanote-summary.mjs` publishes spec-source kind/reference, additive deprecated-operation truth, and explicit JSON-vs-HTML artifact names for both HTTP and async summaries using canonical report data and collected artifact directories.
- The required GitHub workflow topology stays stable (`build-and-test`, `yanote-validation`, `v1-e2e`), but branch-protection/workflow contract surfaces document the widened artifact and summary truth so CI remains the supported `R003` delivery path.
- Public docs (`README.md`, docs landing, analyzer/async guides, examples, and release/support`) explain the stable local baseline, narrow remote single-document `http(s)` support with sanitized provenance, additive deprecated semantics, separate offline HTML artifacts, and the explicit no-dashboard/no-combined-report boundary.
- Existing contract tests and doc verifiers fail closed when HTML siblings are missing, provenance/deprecated wording drifts, secret-like markers appear, or HTTP/async surfaces collapse into combined/dashboard claims.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: deterministic `artifact-manifest.txt` / `artifact-source-paths.txt` notes, explicit JSON+HTML artifact filenames, and GitHub step summaries that expose `specSource` and deprecated counts.
- Inspection surfaces: `build-and-test-artifacts`, `yanote-validation-artifacts`, `.yanote-ci/v1-e2e/`, `.yanote-ci/live-kafka-proof/`, `.github/BRANCH_PROTECTION.md`, and the public docs pages that name those surfaces.
- Failure visibility: focused node tests and shell verifiers localize missing HTML siblings, provenance/deprecated drift, or combined-surface wording to the exact collector, summary, workflow-contract, or docs surface.
- Redaction constraints: persisted surfaces must keep remote URLs sanitized, must not retain raw credentials or secret-like fixture markers, and must keep HTTP vs async artifacts separate.

## Integration Closure

- Upstream surfaces consumed: `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/render-yanote-summary.mjs`, `.github/workflows/yanote-ci.yml`, `.github/BRANCH_PROTECTION.md`, `README.md`, and `docs/release-and-support.md`.
- New wiring introduced in this slice: existing CI artifact bundles and GitHub summaries publish separate JSON+HTML, sanitized provenance, and additive deprecated truth on top of the already-proven CLI/Gradle/report contracts; public docs and doc verifiers point at the same retained surfaces.
- What remains before the milestone is truly usable end-to-end: milestone validation/closeout only; no new required job, combined report surface, or dashboard surface should be added after this slice.

## Tasks

- [x] **T01: Widen retained CI artifact bundles for HTML and delivery metadata** `est:1h20m`
  - Why: CI cannot truthfully publish the new delivery surface until the collected HTTP, async, and v1 proof bundles retain the real JSON+HTML artifacts and the metadata that explains them.
  - Files: `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/collect-yanote-artifacts.test.mjs`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.test.mjs`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/run-v1-e2e.contract.test.mjs`
  - Do: copy sibling `yanote-report.html` into the top-level HTTP artifact bundle; export `yanote-async-report.html` siblings for happy-path, runtime-selected, and schema-failure async proof bundles; and widen deterministic manifest/source-path notes so bundle metadata exposes JSON+HTML presence plus report-derived delivery facts without changing the existing compose-copy or redaction boundaries.
  - Verify: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs`
  - Done when: collected CI bundles and retained v1/async proof bundles expose separate JSON+HTML files with deterministic metadata, and the contract tests fail when required HTML siblings or metadata facts are missing.
- [x] **T02: Publish widened delivery truth in GitHub summaries and workflow contracts** `est:1h05m`
  - Why: Once the bundles retain the right files, the GitHub-facing summaries and workflow contract docs must publish the same truth while keeping the required-job topology stable.
  - Files: `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`, `.github/workflows/yanote-ci.yml`, `.github/BRANCH_PROTECTION.md`, `scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - Do: extend HTTP and async step summaries to report sanitized `specSource`, additive deprecated truth, and explicit JSON-vs-HTML artifact names from canonical report data plus collected artifact directories; then sync workflow and branch-protection contract surfaces so they still promise the same required jobs while acknowledging the widened artifact and summary behavior.
  - Verify: `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - Done when: summary tests pin the new wording and artifact lists, the workflow contract still enforces the stable required jobs, and the contract docs mention the widened delivery surfaces without introducing combined-report or dashboard claims.
- [x] **T03: Align public docs and support verifiers with the delivery boundary** `est:1h15m`
  - Why: The slice is not complete until the public docs say exactly what CI now proves about local-vs-remote support, deprecated semantics, separate HTML artifacts, and the out-of-scope dashboard boundary.
  - Files: `README.md`, `docs/README.md`, `examples/README.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`
  - Do: update the public landings, guides, and release/support doc to describe the stable local baseline, narrow remote single-document `http(s)` `--spec` support with sanitized provenance, additive deprecated semantics, and separate HTTP/async JSON+HTML artifacts; then extend the doc verifiers so wording drift fails closed.
  - Verify: `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && git diff --check`
  - Done when: the public docs point at the widened retained bundles and separate HTML artifacts, the local-vs-remote and no-dashboard boundaries remain explicit, and both doc verifier scripts pass.

## Files Likely Touched

- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `.github/workflows/yanote-ci.yml`
- `.github/BRANCH_PROTECTION.md`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
