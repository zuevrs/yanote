---
id: T02
parent: S02
milestone: M005
provides:
  - Async-aware CI summary rendering plus always-on async triage inside `build-and-test` without changing the required job names.
key_files:
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - .github/workflows/yanote-ci.yml
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - .github/BRANCH_PROTECTION.md
  - .gsd/DECISIONS.md
key_decisions:
  - Keep async collect/render/upload/enforce in `build-and-test` with saved exit-code restoration, while `yanote-validation` remains the HTTP-only validation job.
  - Let the shared summary renderer fall back to typed `YANOTE_ASYNC_*` stdout/stderr signals when `yanote-async-report.json` is absent.
patterns_established:
  - Required-job CI drift is locked with one workflow contract file that inspects both workflow placement and branch-protection wording.
  - Async failure summaries should come from the exported bundle (`live-kafka-proof/`) rather than ad hoc temp-path scraping.
observability_surfaces:
  - `.github/workflows/yanote-ci.yml` build-and-test async collect/render/upload/enforce steps
  - `scripts/ci/render-yanote-summary.mjs` async report + no-report fallback contract
  - `.yanote-ci/artifacts/build-and-test-async-summary.md`
  - `.yanote-ci/artifacts/live-kafka-proof/`
duration: 45m
verification_result: passed
completed_at: 2026-03-14 14:26:40 +0300
blocker_discovered: false
---

# T02: Promote async triage into `build-and-test` without changing required job names

**Generalized the summary renderer for HTTP + async inputs, moved always-on async triage into `build-and-test`, and locked the unchanged required-check contract with explicit workflow/doc tests.**

## What Happened

I started from the active state/plan surfaces, then rewrote `scripts/ci/render-yanote-summary.mjs` so one entry point now handles three truthful cases: the existing HTTP `yanote-report.json` path, async summaries rendered from `yanote-async-report.json`, and async no-report fallback rendered from typed `YANOTE_ASYNC_SUMMARY` / `YANOTE_ASYNC_ERROR*` lines. The HTTP output stayed byte-stable for the existing contract, while async output now exposes status, channels/operations/messages, class counts, proof exit code, report presence/absence, summary source, and top issues without leaking payload bodies.

I replaced the renderer tests with explicit contract fixtures for HTTP non-regression, async report rendering, and async no-report fallback. Those fixtures pin the markdown text itself, payload-redaction behavior, primary/secondary async error parsing, and the missing-report failure path when no async fallback exists.

On the workflow side, I rewired `.github/workflows/yanote-ci.yml` so `build-and-test` now captures the live Kafka proof exit code in `run-live-kafka-proof`, then always runs async collect/render/upload/enforce steps before restoring the saved exit code. `yanote-validation` stayed the HTTP validation job and kept its existing helper-driven validation path, artifact upload, and summary/enforcement chain. I then expanded the workflow contract test to assert the new build-job async triage placement, the unchanged required job names/dependencies, and the branch-protection wording that now documents the split between build-job async diagnostics and HTTP validation.

Because that CI ownership split is downstream-relevant for T03, I appended it to `.gsd/DECISIONS.md` as the stable S02/T02 rule: async triage belongs to `build-and-test`, HTTP validation stays in `yanote-validation`, and no-report async summaries are recovered from typed machine lines instead of temp-path scraping.

## Verification

Passed task-level verification:

- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `rg -n 'build-and-test|YANOTE_ASYNC_|yanote-async-report\.json|always\(\)' .github/workflows/yanote-ci.yml .github/BRANCH_PROTECTION.md scripts/ci/render-yanote-summary.mjs`

Passed direct observability checks:

- `bash scripts/ci/collect-yanote-artifacts.sh .yanote-ci/artifacts`
- `node scripts/ci/render-yanote-summary.mjs --report .yanote-ci/artifacts/live-kafka-proof/yanote-async-report.json --stdout .yanote-ci/artifacts/live-kafka-proof/async-report.stdout --stderr .yanote-ci/artifacts/live-kafka-proof/async-report.stderr --artifacts-dir .yanote-ci/artifacts/live-kafka-proof --output .yanote-ci/artifacts/build-and-test-async-summary.md --exit-code 1`
  - observed summary output: `.yanote-ci/artifacts/build-and-test-async-summary.md`
  - observed key lines: `proof exit code: 1`, `report: yanote-async-report.json`, `summary source: report file`, `primary failure: ASYNC_GATE_MIN_COVERAGE ...`

Slice-level verification status after T02:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` — passed
- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` — passed for the files that exist today (`verify-m005-s02-async-acceptance.contract.test.mjs` is still absent until T03)
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — expected non-zero retained-failure proof; observed exit 1 with `async_bundle_exported: true` and a renderable async bundle under `.yanote-ci/live-kafka-proof`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh` — expected missing-file failure (`exit 127`) because T03 has not created the composed acceptance runner yet
- `git diff --check` — passed after the T02 code changes; rerun again after the plan/state updates below

## Diagnostics

Future inspection should start from the build-job async bundle and summary surfaces, not from raw temp-path scraping:

- workflow placement + enforcement contract: `.github/workflows/yanote-ci.yml`
- required-check/documentation contract: `.github/BRANCH_PROTECTION.md`
- shared renderer logic: `scripts/ci/render-yanote-summary.mjs`
- renderer contract fixtures: `scripts/ci/render-yanote-summary.test.mjs`
- workflow/doc topology guardrails: `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- collected async bundle: `.yanote-ci/artifacts/live-kafka-proof/`
- locally rendered build-style summary: `.yanote-ci/artifacts/build-and-test-async-summary.md`

The async summary now makes these failure-localization signals explicit: report file vs `YANOTE_ASYNC_*` fallback, proof exit code, primary async failure line, class counts, and artifact filenames only. Payload bodies and unrelated temp-directory contents remain redacted.

## Deviations

- None.

## Known Issues

- `scripts/ci/verify-m005-s02-async-acceptance.sh` and `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` still do not exist; that remaining slice-level verifier stack is owned by T03.

## Files Created/Modified

- `scripts/ci/render-yanote-summary.mjs` — generalized the summary renderer for HTTP, async report, and async no-report fallback paths.
- `scripts/ci/render-yanote-summary.test.mjs` — replaced the prior HTTP-only tests with explicit HTTP + async report + async no-report markdown contracts.
- `.github/workflows/yanote-ci.yml` — moved async collect/render/upload/enforce into `build-and-test` with saved exit-code restoration while keeping required job names unchanged.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — locked the new build-job async triage placement, unchanged required-job topology, and branch-protection wording.
- `.github/BRANCH_PROTECTION.md` — documented that `build-and-test` owns async diagnostics while `yanote-validation` remains the HTTP validation job.
- `.gsd/DECISIONS.md` — recorded the T02 workflow ownership split and no-report async-summary fallback rule.
