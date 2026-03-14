---
estimated_steps: 4
estimated_files: 5
---

# T01: Export authoritative live Kafka proof artifacts through a stable async bundle

**Slice:** S02 — CI-Grade Async Acceptance And Diagnostics
**Milestone:** M005

## Description

Stabilize the async proof handoff before touching the workflow. This task creates one proof-owned export seam for the authoritative live Kafka verifier so async diagnostics survive outside `mktemp` directories and the existing collector can publish them deterministically without scraping logs.

## Steps

1. Add `scripts/ci/export-async-proof-artifacts.sh` as an allowlisted exporter that copies the live-proof logs, JSONL evidence files, merge output, async stdout/stderr, optional `yanote-async-report.json`, and manifest/source-path notes into a stable repo-local bundle under `.yanote-ci/`.
2. Update `scripts/ci/verify-m004-s03-live-kafka-proof.sh` to invoke that exporter on both success and failure while preserving the current raw-evidence-first assertions and failure output.
3. Extend `scripts/ci/collect-yanote-artifacts.sh` so it copies the exported async bundle alongside the existing HTTP validation artifacts instead of trying to rediscover temp paths from stderr.
4. Add or expand contract tests in `scripts/ci/export-async-proof-artifacts.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs` to lock deterministic async filenames, manifest/source-path behavior, optional-report handling, and HTTP non-regression.

## Must-Haves

- [ ] The exported async bundle is allowlisted and deterministic, with retained proof logs/JSONL plus `yanote-async-report.json` only when it truly exists.
- [ ] `verify-m004-s03-live-kafka-proof.sh` still fails on raw-evidence or merge drift before any analyzer/report interpretation changes.
- [ ] `collect-yanote-artifacts.sh` preserves current HTTP artifact behavior while also copying the async proof bundle.
- [ ] The new tests fail if async artifact names, manifest fields, or missing-report behavior drift.

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `rg -n 'yanote-async-report|async-report\.stderr|merged-two-service\.events\.jsonl|artifact-manifest' scripts/ci/export-async-proof-artifacts.sh scripts/ci/collect-yanote-artifacts.sh`

## Observability Impact

- Signals added/changed: a stable async proof bundle and manifest under `.yanote-ci/`, including whether an async report was present and which source paths were exported.
- How a future agent inspects this: inspect the exported manifest and copied files via `.yanote-ci/` or the collector output rather than re-running the live proof just to find temp directories.
- Failure state exposed: raw-evidence, merge, or analyzer-stage failures remain inspectable through retained stdout/stderr and JSONL artifacts even when the analyzer never writes a report.

## Inputs

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative live Kafka proof that already knows the truthful retained files.
- `scripts/ci/collect-yanote-artifacts.sh` — existing deterministic collector that needs async awareness without regressing HTTP behavior.
- `.gsd/milestones/M005/slices/S01/S01-SUMMARY.md` — forward-intelligence note that the retained-failure live-proof run is the best existing evidence for what async CI diagnostics must preserve.

## Expected Output

- `scripts/ci/export-async-proof-artifacts.sh` — shared exporter for the authoritative async proof bundle.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live proof script that writes the stable async bundle on success and failure.
- `scripts/ci/collect-yanote-artifacts.sh` — collector extended to preserve async proof artifacts deterministically.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — contract tests for the export bundle layout and manifest behavior.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — expanded collector contract covering async + HTTP artifacts.
