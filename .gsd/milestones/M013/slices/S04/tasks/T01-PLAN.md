---
estimated_steps: 3
estimated_files: 6
skills_used:
  - github-workflows
  - bash-scripting
  - test
---

# T01: Widen retained CI artifact bundles for HTML and delivery metadata

**Slice:** S04 — CI, Docs, And Support Truth For Delivery Surfaces
**Milestone:** M013

## Description

Implement the retained artifact plumbing first so every downstream summary and doc surface can point at files that CI actually uploads instead of inferred behavior.

## Steps

1. Update the top-level HTTP collector so it copies sibling `yanote-report.html`, records deterministic JSON+HTML presence, and captures report-derived delivery facts such as sanitized `specSource` and additive deprecated counts in bundle metadata.
2. Extend the async proof exporter so happy-path, runtime-selected, and schema-failure bundles preserve `yanote-async-report.html` siblings and still fail success exports when required HTML artifacts are missing.
3. Widen the `run-v1-e2e.sh` bundle notes so the public demo bundle acknowledges happy-path HTML while keeping the existing compose-copy, provenance, and redaction boundaries deterministic.

## Must-Haves

- [ ] Top-level collected artifacts expose separate HTTP JSON and HTML files with deterministic manifest/source-note metadata.
- [ ] The async proof bundle exports separate async HTML siblings wherever JSON is already retained and remains fail-closed on missing success-path HTML.
- [ ] The public v1 demo bundle documents the widened retained artifact set without leaking fixture secrets or inventing a combined dashboard surface.

## Verification

- `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs`
- Inspect the seeded bundle fixtures used by the contract tests to confirm `artifact-manifest.txt` / `artifact-source-paths.txt` now mention the widened JSON+HTML surfaces.

## Observability Impact

- Signals added/changed: top-level and nested `artifact-manifest.txt` / `artifact-source-paths.txt` entries now surface JSON+HTML presence plus report-derived delivery metadata.
- How a future agent inspects this: rerun the focused node contract tests or inspect collected bundles under `.yanote-ci/artifacts/`, `.yanote-ci/v1-e2e/`, and `.yanote-ci/live-kafka-proof/`.
- Failure state exposed: missing sibling HTML, missing manifest facts, or secret leakage fails the collector/exporter contract tests with the exact artifact path.

## Inputs

- `scripts/ci/collect-yanote-artifacts.sh` — current top-level HTTP artifact collector that still centers the JSON-only contract.
- `scripts/ci/export-async-proof-artifacts.sh` — async proof exporter that currently omits HTML siblings.
- `scripts/ci/run-v1-e2e.sh` — retained public demo proof whose metadata needs the widened artifact set.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — deterministic collector contract coverage for top-level and nested artifact bundles.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — deterministic async proof-export coverage for happy-path and failure bundles.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — retained public bundle contract coverage for the v1 demo proof.

## Expected Output

- `scripts/ci/collect-yanote-artifacts.sh` — collector updated to publish separate HTTP JSON+HTML files plus deterministic bundle metadata.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — contract coverage widened for HTML-aware top-level and nested bundles.
- `scripts/ci/export-async-proof-artifacts.sh` — async exporter updated to retain HTML siblings and fail closed on missing success-path HTML.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — async proof export tests pinned to the widened artifact set.
- `scripts/ci/run-v1-e2e.sh` — public demo proof metadata updated to acknowledge happy-path HTML.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — contract coverage pinned to the widened v1 retained bundle layout.
