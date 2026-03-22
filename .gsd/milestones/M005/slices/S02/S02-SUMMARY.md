---
id: S02
parent: M005
milestone: M005
provides:
  - CI-grade async acceptance, stable live-proof export, and first-class async artifact/summary diagnostics in the existing required workflow topology.
requires:
  - M005/S01 public async boundary contract
  - M004 live Kafka proof stack
affects:
  - M005 milestone closure
  - build-and-test / yanote-validation CI trust surfaces
key_files:
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/verify-m005-s02-async-acceptance.sh
  - scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs
  - .github/workflows/yanote-ci.yml
  - .github/BRANCH_PROTECTION.md
  - .gsd/milestones/M005/slices/S02/S02-SUMMARY.md
key_decisions:
  - Export the authoritative live Kafka proof into `.yanote-ci/live-kafka-proof` with `artifact-manifest.txt` plus `artifact-source-paths.txt`, then mirror that bundle under collected CI artifacts as `live-kafka-proof/`.
  - Keep async collect/render/upload/enforce inside `build-and-test` with saved exit-code restoration, while `yanote-validation` remains the HTTP-only validation job.
  - Keep the final M005 acceptance surface delegation-only by composing the S01 verifiers with the authoritative M004 proof scripts under stable stage labels instead of duplicating lower-level assertions.
patterns_established:
  - Proof-owned async diagnostics should be exported at the runtime source and copied forward deterministically instead of being reconstructed later from temp paths or stderr scraping.
  - Final acceptance runners should lock delegated stage order and labels with small contract tests before expensive live-proof runs start.
observability_surfaces:
  - bash scripts/ci/verify-m005-s02-async-acceptance.sh
  - .yanote-ci/live-kafka-proof/
  - .yanote-ci/artifacts/live-kafka-proof/
  - .yanote-ci/artifacts/build-and-test-async-summary.md
  - scripts/ci/render-yanote-summary.mjs
duration: 3h
verification_result: passed
completed_at: 2026-03-14 14:48:06 +0300
---

# S02: CI-Grade Async Acceptance And Diagnostics

**Shipped the final async acceptance layer: Yanote now reuses the authoritative Kafka proof stack end to end, exports stable async diagnostics, and renders first-class async CI artifacts and summaries without changing the required job names.**

## What Happened

T01 created the durable async diagnostics seam that the rest of the slice depends on. `scripts/ci/export-async-proof-artifacts.sh` now exports an allowlisted bundle into `.yanote-ci/live-kafka-proof`, including `artifact-manifest.txt` and `artifact-source-paths.txt`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` publishes that bundle on both success and retained failure without changing the raw-evidence-first proof order. `scripts/ci/collect-yanote-artifacts.sh` mirrors the exported bundle as `live-kafka-proof/` inside collected artifacts while preserving the existing HTTP artifact layout.

T02 promoted async diagnostics into the required workflow topology instead of treating them as side-channel logs. `scripts/ci/render-yanote-summary.mjs` now renders three truthful cases from one entry point — the existing HTTP report path, async summaries from `yanote-async-report.json`, and async no-report fallback from typed `YANOTE_ASYNC_*` lines. `.github/workflows/yanote-ci.yml` now keeps async collect/render/upload/enforce inside `build-and-test` with saved exit-code restoration, while `yanote-validation` remains the HTTP validation job. The workflow and renderer contract tests pin that split along with the unchanged required job names.

T03 closed the slice with a delegation-only acceptance surface. `scripts/ci/verify-m005-s02-async-acceptance.sh` composes the S01 async landing/boundary verifiers with the authoritative M004 single-service and live two-service Kafka proofs under stable stage labels, while `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` locks the exact stage order and rejects proof-logic inlining. After the composed runner passed, the slice’s requirement/roadmap/state surfaces were refreshed so `R048` now closes with explicit proof instead of implied confidence.

## Verification

The completed slice passed the full slice-level verification stack:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `git diff --check`

The direct observability surfaces also behaved as intended:

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Expected result: non-zero after raw-evidence and deterministic-merge assertions complete.
  - Observed diagnostic signals: exported `.yanote-ci/live-kafka-proof/`, `YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR`, retained raw JSONL/log/stdout/stderr/report file paths, and `async_bundle_exported: true`.
- `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/artifacts`
  - Observed result: `.yanote-ci/artifacts/live-kafka-proof/` mirrored the exported proof bundle and the collector manifest marked `async_bundle_found=true`.
- `node scripts/ci/render-yanote-summary.mjs --report .yanote-ci/artifacts/live-kafka-proof/yanote-async-report.json --stdout .yanote-ci/artifacts/live-kafka-proof/async-report.stdout --stderr .yanote-ci/artifacts/live-kafka-proof/async-report.stderr --artifacts-dir .yanote-ci/artifacts/live-kafka-proof --output .yanote-ci/artifacts/build-and-test-async-summary.md --exit-code 1`
  - Observed summary lines: `proof exit code: 1`, `report: yanote-async-report.json`, `summary source: report file`, and `primary failure: ASYNC_GATE_MIN_COVERAGE ...`.

## Requirements Advanced

- none

## Requirements Validated

- R048 — Validated by the composed `scripts/ci/verify-m005-s02-async-acceptance.sh` runner, its delegation-order contract test, the stable `.yanote-ci/live-kafka-proof/` export seam, and the async-aware workflow/summary contracts that preserve the required job names while publishing first-class async diagnostics.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- None.

## Known Limitations

- Payload validation against AsyncAPI message schemas remains deferred and is still intentionally out of the first async acceptance contract.
- HTTP and async reporting remain separate by design in the first async release; S02 does not unify them into one mandatory report surface.
- The first async rollout remains Kafka-only and Spring Kafka-first; broader broker support stays deferred.

## Follow-ups

- Reuse `bash scripts/ci/verify-m005-s02-async-acceptance.sh` as the top-level async acceptance command for future milestone or release checks instead of adding another composed proof surface.
- Inspect `.yanote-ci/live-kafka-proof/` before temp directories whenever async CI failures need triage.
- Preserve the `build-and-test` async triage / `yanote-validation` HTTP validation split unless branch-protection strategy changes deliberately.

## Files Created/Modified

- `scripts/ci/export-async-proof-artifacts.sh` — added the stable allowlisted async proof exporter.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — now exports the async bundle on success and retained failure without changing proof ordering.
- `scripts/ci/collect-yanote-artifacts.sh` — now mirrors the exported async bundle as `live-kafka-proof/`.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — added exporter contract coverage.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — expanded collector coverage for async bundle mirroring plus HTTP non-regression.
- `scripts/ci/render-yanote-summary.mjs` — generalized summary rendering for HTTP, async report, and async no-report fallback paths.
- `scripts/ci/render-yanote-summary.test.mjs` — pinned the renderer’s HTTP + async markdown contracts.
- `.github/workflows/yanote-ci.yml` — moved async collect/render/upload/enforce into `build-and-test` with saved exit-code restoration.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — locked workflow placement, job-name stability, and branch-protection wording.
- `.github/BRANCH_PROTECTION.md` — documented the split between build-job async diagnostics and HTTP validation.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — added the final stage-labeled M005 acceptance runner.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — locked delegation order and delegation-only behavior.
- `.gsd/milestones/M005/slices/S02/S02-SUMMARY.md` — captured the slice-level closure, proof, and diagnostics surfaces.

## Forward Intelligence

### What the next slice should know
- The authoritative async proof surfaces are now layered cleanly: S01 keeps the public contract honest, M004 owns raw-evidence-first Kafka proof, and `verify-m005-s02-async-acceptance.sh` is the only composed top-level acceptance command.
- Async CI diagnostics are most trustworthy when read from the exported bundle and rendered summary, not from the temporary directories printed during failure.
- Deferred async follow-ons should treat payload validation, unified reporting, and broker expansion as separate scope decisions, not as incidental tweaks to the current acceptance path.

### What's fragile
- The required job names and build-vs-validation ownership split are now part of the machine-checked contract — changing them casually will break both workflow tests and branch-protection expectations.
- The acceptance runner is intentionally delegation-only — adding inline proof logic there would recreate the drift surface this slice removed.
- The exported async bundle is allowlisted on purpose; renaming or relocating proof-owned files without updating the exporter, collector, and renderer together will break diagnostics.

### Authoritative diagnostics
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` — trustworthy top-level rerunnable proof because the failing stage label localizes which layer drifted.
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — trustworthy for composition drift because it locks stage order, labels, delegated commands, and delegation-only behavior before slow live runs start.
- `.yanote-ci/live-kafka-proof/` — trustworthy retained async bundle because it is exported by the authoritative live Kafka verifier itself on both success and failure.
- `scripts/ci/render-yanote-summary.mjs` plus `.yanote-ci/artifacts/build-and-test-async-summary.md` — trustworthy CI-facing async failure view because it is driven from the exported bundle and typed `YANOTE_ASYNC_*` lines.

### What assumptions changed
- Earlier in the milestone, async CI visibility looked like it might require a new job or a duplicated acceptance path — in practice the required job names stayed stable once async triage moved into `build-and-test` and the composed runner delegated to existing proofs.
- It looked like async failure summaries would always need a report file — in practice typed `YANOTE_ASYNC_*` fallbacks were necessary so no-report analyzer failures still produce actionable summaries.
