# S03: Static HTML Reports From Canonical HTTP And Async Truth — UAT

**Milestone:** M013
**Written:** 2026-03-26T02:57:29.851Z

# S03: Static HTML Reports From Canonical HTTP And Async Truth — UAT

**Milestone:** M013
**Written:** 2026-03-26

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: this slice changes both real analyzer delivery paths and retained offline artifacts, so the correct acceptance check is to run the supported CLI/proof commands and inspect the emitted HTML/JSON bundle directly.

## Preconditions

- Run from the repo worktree root with the existing Node/Gradle toolchain available.
- `yanote-js` dependencies are installed and `./gradlew` is runnable.
- The fixture inputs referenced by the proof script exist under `yanote-js/test/fixtures/openapi/`, `yanote-js/test/fixtures/events/`, `yanote-js/test/fixtures/asyncapi/`, and `yanote-js/test/fixtures/async-events/`.

## Smoke Test

1. Run `bash scripts/ci/verify-m013-s03-static-html-reports.sh`.
2. Confirm the command exits `0` and prints `Static HTML proof bundle ready at .yanote-ci/static-html-reports-proof.`.
3. **Expected:** `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.json`, `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html`, `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.json`, and `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html` all exist.

## Test Cases

### 1. HTTP CLI report emits a sibling offline HTML artifact without changing the JSON-centered contract

1. Run `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml --events yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl --out .yanote-ci/static-html-reports-proof/http-report/out --profile local`.
2. Open `.yanote-ci/static-html-reports-proof/http-report/stdout.txt` and confirm `Report Path` points to `yanote-report.json`, not the HTML file.
3. Open `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html` in a browser or read it as text.
4. **Expected:** the HTML contains Overview, Provenance, Coverage summary, Deprecated operations, Per-operation coverage, HTTP payload conformance, HTTP request conformance, HTTP security conformance, Diagnostics, and Governance sections; it shows `specSource kind` / `specSource reference`; and it contains no external scripts, remote styles, raw event dumps, or `SECRET_` markers.

### 2. Async CLI report emits a sibling offline HTML artifact that stays async-only

1. Run `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/v3.yaml --events yanote-js/test/fixtures/async-events/partial.fixture.jsonl --out .yanote-ci/static-html-reports-proof/async-report/out --profile local`.
2. Open `.yanote-ci/static-html-reports-proof/async-report/stdout.txt` and confirm `Report Path` points to `yanote-async-report.json`.
3. Open `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html`.
4. **Expected:** the HTML contains Overview, Provenance, Async coverage summary, Channel coverage, Operation coverage, Message coverage, and Diagnostics; it shows sanitized `specSource`; and it does not contain HTTP-only sections such as Deprecated operations, HTTP payload conformance, HTTP request conformance, or HTTP security conformance.

### 3. Supported delivery tests keep CLI and Gradle behavior aligned with sibling HTML output

1. Run `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts`.
2. Run `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`.
3. **Expected:** both commands exit `0`; CLI tests prove sibling HTML output while JSON machine tokens remain unchanged; Gradle tests prove report tasks preserve analyzer-created HTML siblings rather than inventing placeholders.

## Edge Cases

### HTML artifacts stay self-contained and sanitized

1. Run `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`.
2. Inspect `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`.
3. **Expected:** the contract test passes; the manifest records `html_assets=inline-only`, `surfaces=separate-http-and-async`, `provenance=sanitized-spec-source-retained`, `sensitive_markers=absent`, `event_dump_markers=absent`, and `out_of_scope_terms=absent`.

### HTTP semantic drift still reports truthful top-level status while HTML remains aligned

1. Open `.yanote-ci/static-html-reports-proof/http-report/stdout.txt` and `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html`.
2. **Expected:** both surfaces show `status: partial`, deprecated operations `0/1`, and the same local-file `specSource`, while coverage counts remain aligned with the canonical JSON report.

## Failure Signals

- Missing `.html` sibling files next to canonical JSON outputs.
- `Report Path` or machine `report=` tokens pointing at HTML instead of JSON.
- Async HTML containing HTTP-only sections, or HTTP HTML dropping provenance/deprecated/conformance sections.
- Any external asset references, `SECRET_` markers, raw event-shape fields, or combined-dashboard wording in the retained HTML or manifest.
- Gradle report tests synthesizing stub HTML instead of preserving analyzer-created artifacts.

## Requirements Proved By This UAT

- R024 — proves the static HTML artifact portion of the analyzer-consumption requirement on real supported analyzer entrypoints with retained offline artifacts.
- R003 — proves supported CLI and Gradle delivery surfaces expose the new HTML artifacts without breaking the JSON-centered machine contract.
- R001 — proves the human-facing HTML surfaces reflect the same canonical report truth as the sibling JSON outputs.
- R002 — proves drift and leakage conditions fail closed through focused tests and the retained proof bundle.

## Not Proven By This UAT

- CI publication, public docs wording, and support-boundary closeout for the new HTML artifacts; that is S04 work.
- Any hosted dashboard, combined HTTP+async report UI, or server-rendered report surface; those remain explicitly out of scope.

## Notes for Tester

The retained proof bundle is the fastest inspection path. If a failure appears, start with `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` and the per-mode `stdout.txt` / `stderr.txt` files before reading source code; those files localize whether the break is provenance drift, HTML-surface drift, or a delivery-surface contract regression.
