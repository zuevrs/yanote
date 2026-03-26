---
estimated_steps: 3
estimated_files: 5
skills_used:
  - bash-scripting
---

# T04: Retain a static HTML proof bundle from real HTTP and async runs

**Slice:** S03 — Static HTML Reports From Canonical HTTP And Async Truth
**Milestone:** M013

## Description

Finish the slice with a rerunnable proof bundle that future agents can inspect without rederiving the feature from unit tests.

## Steps

1. Write a verifier that builds the real CLI, runs `report` against the deprecated HTTP fixture and `async-report` against the partial AsyncAPI fixture, and retains stdout/stderr/exit codes plus sibling JSON/HTML artifacts under `.yanote-ci/static-html-reports-proof/`.
2. Assert in the verifier that both HTML files contain key canonical counts and sanitized `specSource`, stay separate by domain, use only inline/self-contained assets, and never include sentinel secret strings, raw event dumps, combined-report wording, or dashboard references.
3. Add a contract test that pins the retained bundle layout, rerun commands, manifest claims, and expected HTML/JSON artifact names for future regressions.

## Must-Haves

- [ ] The proof uses the real supported CLI entrypoints for both HTTP and async artifact generation.
- [ ] Retained artifacts make offline/self-contained, separate-surface, and provenance guarantees obvious from one inspection.
- [ ] Secret-like sentinel strings and out-of-scope dashboard/combined-report markers fail the proof immediately.

## Verification

- `bash scripts/ci/verify-m013-s03-static-html-reports.sh`
- `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`

## Observability Impact

- Signals added/changed: retained proof bundle with captured stdout/stderr, manifest notes, and sibling JSON/HTML artifacts for both report modes.
- How a future agent inspects this: open `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`, the retained `stdout.txt` files, and the sibling `*.json` / `*.html` artifacts after rerunning the verifier.
- Failure state exposed: missing offline HTML, leaked sentinel strings, provenance drift, or combined-report/dashboard references fail the proof with localized bundle paths.

## Inputs

- `scripts/ci/verify-m013-s02-deprecated-operations.sh` — prior retained-proof pattern for HTTP artifact manifests and CLI capture.
- `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` — prior contract-test style for pinned proof bundle assertions.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — HTTP fixture with explicit deprecated truth for the human artifact.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — HTTP evidence fixture used for the real CLI proof run.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — async fixture for the separate async HTML artifact proof.
- `yanote-js/test/fixtures/async-events/partial.fixture.jsonl` — async evidence fixture for the real `async-report` proof run.

## Expected Output

- `scripts/ci/verify-m013-s03-static-html-reports.sh` — rerunnable proof script for separate HTTP and async static HTML artifacts.
- `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` — proof contract test pinning retained bundle structure and claims.
- `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` — retained manifest describing rerun commands and key HTML/JSON guarantees.
- `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html` — retained HTTP static HTML artifact showing canonical report truth.
- `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html` — retained async static HTML artifact showing canonical report truth.
