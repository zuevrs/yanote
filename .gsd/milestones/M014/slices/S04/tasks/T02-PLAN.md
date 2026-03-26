---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T02: Preserve the widened live proof bundle through exported artifacts and CI summaries

**Slice:** S04 — Live Kafka proof and support-surface closeout
**Milestone:** M014

## Description

Carry the widened live Kafka proof bundle through the durable delivery path that CI and downstream operators actually use. The exporter, collector, and summary renderer should all preserve the richer async semantics truth from the authoritative bundle, remain redaction-safe, and keep machine-facing contracts centered on `yanote-async-report.json`.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Exported live-proof artifacts + summary renderer + workflow contract tests | Fail the contract tests and keep the artifact family deterministic rather than silently dropping files or counts. | Treat the script/test run as failed and require a focused rerun; do not fall back to stale copied artifacts. | Missing or malformed async report fields must surface as explicit missing-artifact / invalid-summary failures instead of being rendered as implied success. |

## Load Profile

- **Shared resources**: `.yanote-ci/live-kafka-proof/`, collected `build-and-test-artifacts/`, GitHub step summary output, and machine summary token parsing.
- **Per-operation cost**: Copy one deterministic bundle, derive summary counts from one live async report, and validate with Node contract tests.
- **10x breakpoint**: Artifact fan-out and summary noise grow first; accidental duplication or stale-copy behavior will become expensive and confusing before raw compute does.

## Negative Tests

- **Malformed inputs**: Missing happy-path HTML/JSON siblings, malformed async report JSON, or absent companion artifacts must fail the exporter/collector/summary tests explicitly.
- **Error paths**: The summary renderer must still explain failure states from report-only, stderr-only, or no-report fallback paths without leaking raw retained values.
- **Boundary conditions**: `report=` stays pointed at `yanote-async-report.json`, retained companions remain additive, and summary counts stay counts-only even when richer semantics sections become non-zero.

## Steps

1. Update `scripts/ci/export-async-proof-artifacts.sh` and `scripts/ci/collect-yanote-artifacts.sh` so the widened live Kafka proof family remains deterministic, replaces stale copies, and preserves manifest/source-path breadcrumbs.
2. Extend the exporter/collector contract tests to pin the richer happy-path bundle plus runtime-selected / schema-failure companions under success and failure conditions.
3. Teach `scripts/ci/render-yanote-summary.mjs` and its tests to surface richer async semantics counts and bundle state from the authoritative live report while keeping output redaction-safe and JSON-centered.
4. Keep the workflow contract aligned so `build-and-test` still uploads one authoritative async artifact family and renders the async summary from the collected live bundle.

## Must-Haves

- [ ] Exported and collected `live-kafka-proof/` artifacts retain the widened happy-path report pair plus focused companions without inventing stale files.
- [ ] The async summary renderer explains the richer semantics from the live bundle, stays redaction-safe, and preserves `report=.../yanote-async-report.json` plus counts-only machine tokens.
- [ ] Workflow contract tests keep build-and-test tied to the same deterministic async artifact family and summary path.

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- Re-run the collected-summary path locally after a live proof to confirm `build-and-test-artifacts/live-kafka-proof/` and rendered async summary both reflect the widened semantics surface.

## Observability Impact

- Signals added/changed: `build-and-test-artifacts/live-kafka-proof/` manifests, copied async JSON/HTML companions, and GitHub summary lines gain additive richer-semantics counts.
- How a future agent inspects this: Run the Node contract suite above, then inspect `artifact-manifest.txt`, `artifact-source-paths.txt`, and rendered async summary markdown.
- Failure state exposed: Missing artifact siblings, malformed async summary inputs, or report-contract drift fail with deterministic file lists and explicit missing/invalid reason text.

## Inputs

- `scripts/ci/export-async-proof-artifacts.sh` — allowlisted async proof exporter.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exporter contract tests for success/failure bundles.
- `scripts/ci/collect-yanote-artifacts.sh` — CI artifact collector that republishes the async bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector contract tests for copied artifact families.
- `scripts/ci/render-yanote-summary.mjs` — GitHub summary renderer for async artifacts.
- `scripts/ci/render-yanote-summary.test.mjs` — renderer contract tests, including fallback paths.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — workflow contract test guarding build-and-test async publishing.

## Expected Output

- `scripts/ci/export-async-proof-artifacts.sh` — exporter retains the widened live proof bundle deterministically.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exporter tests pin the widened artifact family and fail-closed cases.
- `scripts/ci/collect-yanote-artifacts.sh` — collector republishes the widened live proof bundle into CI artifacts.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector tests verify deterministic copied async artifact families.
- `scripts/ci/render-yanote-summary.mjs` — async summary rendering surfaces richer live semantics counts while staying redaction-safe.
- `scripts/ci/render-yanote-summary.test.mjs` — summary tests pin richer semantics, fallback, and no-leak behavior.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — workflow contract tests lock the build-and-test async artifact / summary route.
