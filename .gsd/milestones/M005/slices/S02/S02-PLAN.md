# S02: CI-Grade Async Acceptance And Diagnostics

**Goal:** Turn the already-real AsyncAPI/Kafka proof stack into one CI-grade acceptance surface that keeps async failures inspectable in the existing required workflow topology and proves the public S01 contract against live Kafka evidence without duplicating runtime logic.
**Demo:** A maintainer can run one stage-labeled M005 acceptance command, watch it compose the S01 async verifiers with the authoritative M004 single-service and two-service Kafka proofs, and inspect build-and-test async artifacts/summaries that still appear even when the live Kafka proof fails.

## Decomposition Rationale

- Start with the artifact-export seam, because the main S02 risk is not missing Kafka proof logic but losing the truthful retained files inside `mktemp` directories. If that seam stays implicit, any workflow wiring would still depend on brittle log scraping.
- Promote async triage into `build-and-test` next, because that is where the live Kafka proof already fails today. Wiring summaries or uploads only in `yanote-validation` would leave the highest-value async failures invisible.
- Finish with the composed acceptance runner and requirement closure once the export and CI triage seams are real, so the final M005 proof command exercises the same first-class diagnostics it claims to provide.

## Must-Haves

- [R048] The authoritative live Kafka proof path exports a deterministic async artifact bundle into repo-local storage, and the existing collector can publish that bundle without scraping temporary-path logs.
- [R048] `build-and-test` captures the live Kafka proof exit code, still blocks merges on failure, and always renders/uploads async diagnostics (`yanote-async-report.json` when present, retained proof files, structured `YANOTE_ASYNC_*` signals) without renaming `build-and-test` or `yanote-validation`.
- [R047-support, R048] The summary and workflow contracts stay HTTP-safe while adding async-aware report handling, stderr-only fallback behavior, and documented required-check expectations.
- [R047-support, R048] One stage-labeled M005 acceptance command composes `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` instead of duplicating proof logic.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: exported async-bundle manifest and retained proof files under `.yanote-ci/`, `YANOTE_ASYNC_*` summary/error lines, build-and-test artifact upload + step summary output, and stable stage labels from the composed M005 runner.
- Inspection surfaces: `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/render-yanote-summary.mjs`, `.github/workflows/yanote-ci.yml`, uploaded CI artifacts, and `bash scripts/ci/verify-m005-s02-async-acceptance.sh`.
- Failure visibility: the failing phase should remain localizable as raw-evidence, merge, analyzer/no-report, or workflow-enforcement drift, with primary async error lines and report-presence/absence visible without re-running the whole stack blindly.
- Redaction constraints: summaries and manifests must stay on filenames, counts, stages, and typed `YANOTE_ASYNC_*` diagnostics only; do not leak payload bodies, secrets, or unrelated temp-directory contents.

## Integration Closure

- Upstream surfaces consumed: `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/render-yanote-summary.mjs`, `.github/workflows/yanote-ci.yml`, and `.github/BRANCH_PROTECTION.md`.
- New wiring introduced in this slice: a stable async proof-export bundle, async-aware collector/summary helpers, always-on async triage inside `build-and-test`, and one stage-labeled M005 acceptance runner.
- What remains before the milestone is truly usable end-to-end: Nothing inside M005 once this slice passes; deferred R049-R053 remain intentionally outside the first async release boundary.

## Tasks

- [x] **T01: Export authoritative live Kafka proof artifacts through a stable async bundle** `est:1h`
  - Why: Without a proof-owned export seam, CI promotion would still depend on brittle temp-path scraping and would lose the exact retained files that make async failures diagnosable.
  - Files: `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.test.mjs`, `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/collect-yanote-artifacts.test.mjs`
  - Do: Add one allowlisted exporter that copies the live-proof logs, JSONL evidence, merge output, async stdout/stderr, optional `yanote-async-report.json`, and manifest/source-path notes into a stable repo-local bundle, call it from `verify-m004-s03-live-kafka-proof.sh` on success and failure without changing the raw-evidence-first assertions, and extend the existing collector/tests to preserve the async bundle alongside the HTTP artifacts.
  - Verify: `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
  - Done when: the authoritative live Kafka proof always owns a deterministic async artifact bundle and the collector still passes its HTTP contract while copying the async bundle too.
- [x] **T02: Promote async triage into `build-and-test` without changing required job names** `est:1h`
  - Why: Async failures currently happen inside `build-and-test`, but the always-on summary/artifact/upload chain only exists downstream, so CI still drops the most important async diagnostics.
  - Files: `.github/workflows/yanote-ci.yml`, `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`, `scripts/ci/yanote-ci-workflow.contract.test.mjs`, `.github/BRANCH_PROTECTION.md`
  - Do: Generalize the summary renderer so it can distinguish HTTP vs async reports and fall back to stderr-only async summaries when no report exists, then rewire `build-and-test` to capture the live-proof exit code and run collect/render/upload/enforce steps under `always()` while keeping `build-and-test` and `yanote-validation` stable and preserving the current HTTP validation path.
  - Verify: `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - Done when: `build-and-test` always publishes async triage artifacts and a concise summary before enforcing the saved exit code, the renderer handles async report/no-report cases without leaking raw payloads, and the required-check contract remains unchanged.
- [x] **T03: Compose the final M005 async acceptance runner and close R048** `est:45m`
  - Why: S02 is only complete when one rerunnable command proves the S01 public contract, the authoritative M004 runtime proofs, and the new CI-grade diagnostics together instead of as separate maintainer-only steps.
  - Files: `scripts/ci/verify-m005-s02-async-acceptance.sh`, `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`, `.gsd/REQUIREMENTS.md`, `.gsd/milestones/M005/M005-ROADMAP.md`
  - Do: Add a stage-labeled acceptance runner that composes the two S01 verifiers with the two authoritative M004 proof scripts using the existing `run_stage()` pattern, lock its stage order with a contract test instead of re-implementing runtime checks, and then update the roadmap/requirements surfaces once the composed proof and async CI diagnostics are green.
  - Verify: `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs && bash scripts/ci/verify-m005-s02-async-acceptance.sh && git diff --check`
  - Done when: one command reruns the full M005 async acceptance stack with stage-localized failures, and the roadmap/requirements surfaces stop presenting S02/R048 as unfinished.

## Files Likely Touched

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
- `.github/workflows/yanote-ci.yml`
- `.github/BRANCH_PROTECTION.md`
- `.gsd/REQUIREMENTS.md`
- `.gsd/milestones/M005/M005-ROADMAP.md`
