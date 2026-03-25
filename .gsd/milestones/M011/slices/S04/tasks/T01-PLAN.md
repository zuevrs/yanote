---
estimated_steps: 4
estimated_files: 5
skills_used:
  - bash-scripting
  - openapi-specification-v3.2
  - vitest
---

# T01: Add request-semantics sidecars to the public v1 proof bundle

**Slice:** S04 — Public Contract Closeout For HTTP Semantics
**Milestone:** M011

## Description

Additive CI proof comes first. The standard public bundle currently proves the happy path plus payload semantic-red behavior only; this task widens it with request-semantics truth derived from the already-recorded live events so teams can see the M011 request boundary on the same entrypoint without spinning up a second runtime harness.

## Steps

1. Update `scripts/ci/run-v1-e2e.sh` to filter the retained live `.yanote-ci/v1-e2e/events.jsonl` down to the `/request-evidence/users/{userId}` records and rerun `node yanote-js/dist/yanote.cjs report` against `examples/openapi/request-evidence-openapi.yaml`.
2. Retain additive request-semantics artifacts — filtered events, stdout, stderr, report JSON, and manifest/source-path notes — alongside the existing happy-path `out/yanote-report.json` and `semantic-red.*` files without changing the existing compose/service flow.
3. Update the bundle contract tests in `scripts/ci/run-v1-e2e.contract.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs` so the retained request sidecar inventory, primary semantic code, and source-path notes are pinned deterministically.
4. Keep the bundle secret-safe: only the filtered retained request artifacts may carry supported retained request values, while public stdout/stderr sidecars must continue to avoid raw secret leakage.

## Must-Haves

- [ ] `bash scripts/ci/run-v1-e2e.sh` exports additive request-semantics artifacts without regressing the existing happy-path and semantic-red bundle.
- [ ] The request sidecar is derived from the existing live `events.jsonl` plus `examples/openapi/request-evidence-openapi.yaml`, not from a new runtime harness.
- [ ] Contract tests pin the new artifact names, manifest/source-path notes, and expected `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` proof outcome.

## Verification

- Bundle contract tests pass with the additive request-semantics artifact inventory and source-note expectations.
- `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`

## Observability Impact

- Signals added/changed: additive request-semantics stdout/stderr/report JSON plus manifest/source-path note entries inside `.yanote-ci/v1-e2e/`.
- How a future agent inspects this: run `bash scripts/ci/run-v1-e2e.sh` and inspect `.yanote-ci/v1-e2e/` for the new request-semantics artifacts and manifest lines.
- Failure state exposed: contract tests and retained bundle artifacts show whether drift came from live-event filtering, analyzer exit/result shape, or collector inventory.

## Inputs

- `scripts/ci/run-v1-e2e.sh` — current public bundle exporter that only retains happy-path and payload semantic-red artifacts.
- `examples/docker-compose.yml` — existing compose path whose live events already include the request-evidence route.
- `examples/openapi/request-evidence-openapi.yaml` — focused request-semantics spec reused for the additive sidecar.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — current bundle contract test that must pin the widened retained artifact surface.
- `scripts/ci/collect-yanote-artifacts.sh` — collector script that exports `.yanote-ci/v1-e2e/` into the durable artifact bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector regression test that must reflect the additive request sidecar.

## Expected Output

- `scripts/ci/run-v1-e2e.sh` — public bundle exporter widened with additive request-semantics sidecars.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — contract assertions for the retained request-semantics artifact surface.
- `scripts/ci/collect-yanote-artifacts.sh` — collector behavior aligned with the widened `.yanote-ci/v1-e2e/` bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector regression coverage for the additive request sidecar.
