---
id: T01
parent: S02
milestone: M005
provides:
  - Stable repo-local async proof export and collector mirroring for the authoritative live Kafka verifier.
key_files:
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
key_decisions:
  - Export the authoritative live Kafka proof into `.yanote-ci/live-kafka-proof` with `artifact-manifest.txt` plus `artifact-source-paths.txt`, then mirror that bundle under collector output as `live-kafka-proof/`.
patterns_established:
  - Proof-owned async diagnostics should be exported at the runtime source and copied forward deterministically, not rediscovered later from stderr or temp-path scraping.
observability_surfaces:
  - `.yanote-ci/live-kafka-proof/artifact-manifest.txt`, `.yanote-ci/live-kafka-proof/artifact-source-paths.txt`, and `.yanote-ci/artifacts/live-kafka-proof/`
duration: 1h20m
verification_result: passed
completed_at: 2026-03-14 14:06:35 +0300
blocker_discovered: false
---

# T01: Export authoritative live Kafka proof artifacts through a stable async bundle

**Added one allowlisted async-proof export seam under `.yanote-ci/`, taught the authoritative live Kafka proof to publish it on success and failure, and extended the collector/tests to preserve that bundle without regressing the existing HTTP artifact contract.**

## What Happened

I started from the active state/plan surfaces, applied the required pre-flight fix to `S02-PLAN.md`, and added an explicit retained-failure verification step (`bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`) so the slice now checks inspectable async failure state rather than only happy-path composition.

Runtime-wise, I added `scripts/ci/export-async-proof-artifacts.sh` as the proof-owned export seam. It wipes and recreates `.yanote-ci/live-kafka-proof` deterministically, copies only the allowlisted async proof files, writes `artifact-manifest.txt`, and records temp/source provenance in `artifact-source-paths.txt`. On success it requires the expected files; on failure it still succeeds with a partial bundle and notes missing allowlisted artifacts instead of inventing placeholder files.

I then updated `scripts/ci/verify-m004-s03-live-kafka-proof.sh` to call that exporter from the proof itself on both success and failure. The raw-evidence-first ordering did not change: the script still proves single-service raw evidence, two-service raw evidence, deterministic merge behavior, and only then runs `async-report`. The only new behavior is durable export after those assertions, plus one extra retained-failure diagnostic line naming the stable exported bundle path.

Finally, I extended `scripts/ci/collect-yanote-artifacts.sh` so it keeps the existing HTTP artifact filenames at the root of the collected artifact set while also copying the exported async bundle into `live-kafka-proof/`. Its root manifest now records whether the async bundle was present and where it came from. I added a new exporter contract test file and expanded the collector contract tests so async filename/layout, manifest fields, source-path notes, missing-report behavior, and HTTP non-regression are all pinned.

I also recorded the new `.yanote-ci/live-kafka-proof` observability seam in `.gsd/DECISIONS.md` because T02/T03 will build on that exact path and bundle shape.

## Verification

Passed task-level verification:

- `bash -n scripts/ci/export-async-proof-artifacts.sh scripts/ci/verify-m004-s03-live-kafka-proof.sh scripts/ci/collect-yanote-artifacts.sh`
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `rg -n 'yanote-async-report|async-report\.stderr|merged-two-service\.events\.jsonl|artifact-manifest' scripts/ci/export-async-proof-artifacts.sh scripts/ci/collect-yanote-artifacts.sh`

Direct observability/failure-path verification passed:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - expected result: non-zero after raw-evidence and deterministic-merge checks complete
  - observed result: exit 1 with `async_bundle_exported: true`
  - observed exported bundle signals before cleanup:
    - `.yanote-ci/live-kafka-proof/artifact-manifest.txt` showed `proof_status=failure`, `report_found=true`, `artifact_count=9`, `missing_artifacts=none`
    - `.yanote-ci/live-kafka-proof/artifact-source-paths.txt` retained the temp dir plus truthful source paths for the single-service log, two-service log, producer/consumer JSONL, merge log, merged JSONL, async stdout/stderr, and `yanote-async-report.json`
- `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/artifacts`
  - observed result before cleanup: `.yanote-ci/artifacts/live-kafka-proof/` contained the exported async bundle and the root collector manifest showed `async_bundle_found=true`

Slice-level verification status after T01:

- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — passed in the current tree
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` — fails with `No such file or directory` because T03 has not created the composed acceptance runner yet
- `git diff --check` — passed during T01 verification; rerun again after the final summary/state updates below

## Diagnostics

Future inspection should start from the exported async bundle, not temp-path scraping:

- proof-owned export surface: `.yanote-ci/live-kafka-proof/`
- proof manifest: `.yanote-ci/live-kafka-proof/artifact-manifest.txt`
- proof source-path note: `.yanote-ci/live-kafka-proof/artifact-source-paths.txt`
- collected CI-style mirror: `.yanote-ci/artifacts/live-kafka-proof/`
- collector manifest: `.yanote-ci/artifacts/artifact-manifest.txt`

On retained failure, the live Kafka proof still prints the raw temp paths and now also prints `exported_async_bundle: ...` plus `async_bundle_exported: true|false`, so a future agent can tell immediately whether the stable export succeeded.

## Deviations

- None.

## Known Issues

- `scripts/ci/verify-m005-s02-async-acceptance.sh` does not exist yet; that remaining slice-level verifier is owned by T03.
- Async GitHub summary rendering and workflow always-on async triage are still HTTP-only/partial and remain owned by T02.

## Files Created/Modified

- `scripts/ci/export-async-proof-artifacts.sh` — added the allowlisted async proof exporter with manifest and source-path notes.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — now exports the stable async bundle on success and failure without changing proof ordering.
- `scripts/ci/collect-yanote-artifacts.sh` — now mirrors the exported async bundle as `live-kafka-proof/` alongside the existing HTTP artifact files.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — added exporter contract coverage for deterministic filenames, manifest fields, and missing-report failure behavior.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — expanded collector contract coverage for async bundle copying plus HTTP non-regression.
- `.gsd/milestones/M005/slices/S02/S02-PLAN.md` — added the retained-failure verification line and marked T01 complete.
- `.gsd/DECISIONS.md` — recorded the stable `.yanote-ci/live-kafka-proof` export/collector seam for downstream tasks.
