# S04: CI, Docs, And Support Truth For Delivery Surfaces — UAT

**Milestone:** M013
**Written:** 2026-03-26T04:11:04.102Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S04 changes retained CI bundles, GitHub summaries, workflow contracts, and public docs/support wording rather than introducing a new live runtime path.

## Preconditions

- The repo is on the S04 closeout state in the M013 worktree.
- Node is available so the slice contract suite can run.
- Retained proof directories exist or can be regenerated from earlier slice verifiers: `.yanote-ci/remote-spec-proof/`, `.yanote-ci/deprecated-operations-proof/`, and `.yanote-ci/static-html-reports-proof/`.
- The updated docs and CI scripts are present in the worktree.

## Smoke Test

1. Run `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`.
2. Run `bash scripts/docs/verify-s03-landing.sh`.
3. Run `bash scripts/docs/verify-s04-boundaries.sh`.
4. **Expected:** All commands pass, proving the widened CI bundle, summary, workflow-contract, and docs wording surfaces are aligned.

## Test Cases

### 1. HTTP and async CI delivery surfaces stay separate and explicit

1. Open `.github/BRANCH_PROTECTION.md`.
2. Confirm the required jobs are still `build-and-test` and `yanote-validation`.
3. Confirm the document explicitly names sanitized `specSource`, additive deprecated-operation truth, `yanote-report.json` / `yanote-report.html`, and `yanote-async-report.json` / `yanote-async-report.html` rather than a combined report surface.
4. **Expected:** Required job IDs are unchanged, while the documented summary/artifact behavior matches the widened separate HTTP/async delivery contract.

### 2. Remote provenance and deprecated-operation proof artifacts are truthful and sanitized

1. Open `.yanote-ci/remote-spec-proof/artifact-manifest.txt` and `.yanote-ci/remote-spec-proof/artifact-source-paths.txt`.
2. Confirm the retained remote reference is a sanitized single-document `http://127.0.0.1:.../simple.yaml` URL with no userinfo, query string, or fragment, and that the manifest/source-path notes only expose report/command provenance surfaces.
3. Open `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`.
4. Confirm it states `legacy_operations=2/3`, `deprecated_operations=0/1`, `http_only=true`, `async_artifacts_present=false`, and `dashboard_artifacts_present=false`.
5. **Expected:** Remote spec provenance is sanitized and additive deprecated-operation truth is explicit without any denominator drift or dashboard leakage.

### 3. Static HTML proof and public docs preserve the supported delivery boundary

1. Open `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`.
2. Confirm it lists both `http_report_json` + `http_report_html` and `async_report_json` + `async_report_html`, with `surfaces=separate-http-and-async`, `html_assets=inline-only`, and `out_of_scope_terms=absent`.
3. Open `README.md`, `docs/README.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/asyncapi-kafka.md`, and `docs/release-and-support.md`.
4. Confirm those pages describe local file/directory `--spec` as the stable baseline, remote single-document `http(s)` `--spec` as a narrow opt-in path with sanitized provenance, additive deprecated semantics, separate HTTP/async JSON+HTML artifacts, and an explicit no-dashboard/no-combined-report boundary.
5. **Expected:** Retained proof artifacts and public docs describe the same supported delivery contract with no combined-report or dashboard claims.

### 4. Fail-closed guardrails remain active for wording and artifact regressions

1. Run `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`.
2. Review the passing test names for the missing-HTML, sanitized-provenance, explicit-artifact, and stable-job-topology cases.
3. Run `bash scripts/docs/verify-s03-landing.sh` and `bash scripts/docs/verify-s04-boundaries.sh` again after the targeted suite.
4. **Expected:** The tests/verifiers remain the authoritative fail-closed guardrails for missing HTML siblings, summary wording drift, or accidental support-boundary expansion.

## Edge Cases

### Missing success-path HTML sibling

1. Run `node --test scripts/ci/export-async-proof-artifacts.test.mjs`.
2. Confirm the case named `fails closed on success exports when the happy-path HTML sibling is missing` passes.
3. **Expected:** Success bundles are not allowed to silently drop `yanote-async-report.html`.

### Accidental combined/dashboard support drift

1. Run `bash scripts/docs/verify-s04-boundaries.sh`.
2. Inspect `README.md` and `docs/release-and-support.md` for any positive combined-report or dashboard promise.
3. **Expected:** The verifier passes only when combined/dashboard wording remains explicitly out of scope.

## Failure Signals

- `build-and-test` or `yanote-validation` wording changes in `.github/BRANCH_PROTECTION.md`.
- A retained manifest or step summary stops naming `yanote-report.html` or `yanote-async-report.html` on the success path.
- A retained manifest, summary fixture, or doc page exposes credential-bearing remote URL parts, secret-like markers, or vague combined-report/dashboard claims.
- Doc verifiers fail because the local-first baseline, narrow remote-support wording, or separate HTTP/async artifact family wording drifted.

## Requirements Proved By This UAT

- `R003` — CI/workflow support surfaces remain stable while publishing the widened JSON+HTML artifact truth.
- `R024` — Remote spec loading, deprecated-operation truth, and separate human-friendly HTML artifacts are all reflected consistently across retained artifacts, summaries, and public docs.
- `R005` / `R030` — The async path stays separate and Kafka-first, and combined-report/dashboard surfaces remain explicitly out of scope.

## Not Proven By This UAT

- A new runtime feature beyond the already-proven S01-S03 analyzer/report behavior.
- Broker expansion, a combined HTTP+async report surface, or any hosted dashboard UI.
- Zero-network cold-start bootstrap for the compose/demo path.

## Notes for Tester

- Prefer the retained manifests, summary contract tests, and shell verifiers as the authoritative evidence surfaces for S04; they localize delivery regressions faster than rereading implementation code.
- If any retained proof directory is missing, regenerate it using the earlier slice proof commands before treating that absence as an S04 regression.
- Do not rely on git-based diff checks in this auto-mode worktree; use the contract suite and targeted whitespace/conflict scans instead.
