---
estimated_steps: 4
estimated_files: 5
---

# T02: Promote async triage into `build-and-test` without changing required job names

**Slice:** S02 — CI-Grade Async Acceptance And Diagnostics
**Milestone:** M005

## Description

Move async failure visibility into the job where the live Kafka proof already runs. This task generalizes the existing summary surface for async data and rewires `build-and-test` so async summaries, artifacts, and final enforcement still happen when the proof fails, all while keeping the stable required-check topology intact.

## Steps

1. Update `scripts/ci/render-yanote-summary.mjs` so it can distinguish HTTP vs async report shapes and can render an async summary from `YANOTE_ASYNC_*` stderr/log data even when no report file exists.
2. Expand `scripts/ci/render-yanote-summary.test.mjs` with async-report, async-no-report, and HTTP non-regression fixtures so the renderer contract stays explicit and payload-safe.
3. Rewire `.github/workflows/yanote-ci.yml` so `build-and-test` captures the live Kafka proof exit code, then runs async collect/render/upload/enforce steps under `if: ${{ always() }}` before finally restoring the saved exit code; keep `yanote-validation` and its HTTP path intact.
4. Extend `scripts/ci/yanote-ci-workflow.contract.test.mjs` and `.github/BRANCH_PROTECTION.md` to lock the unchanged required job names plus the new build-and-test async triage placement and expectations.

## Must-Haves

- [ ] The summary renderer can produce concise async output from either `yanote-async-report.json` or stderr-only `YANOTE_ASYNC_*` signals.
- [ ] `build-and-test` runs async collect/render/upload/enforce after the live proof regardless of proof success, but still ends non-zero when the proof fails.
- [ ] `yanote-validation` remains the HTTP validation job and the stable required job names stay `build-and-test` / `yanote-validation`.
- [ ] The renderer and workflow contract tests fail on async-summary drift, early-no-report regressions, or required-job topology churn.

## Verification

- `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `rg -n 'build-and-test|YANOTE_ASYNC_|yanote-async-report\.json|always\(\)' .github/workflows/yanote-ci.yml .github/BRANCH_PROTECTION.md scripts/ci/render-yanote-summary.mjs`

## Observability Impact

- Signals added/changed: build-and-test GitHub step summary text, deterministic async artifact upload, async primary/secondary error parsing, and report/no-report fallback diagnostics.
- How a future agent inspects this: inspect the build-and-test uploaded artifact bundle, `GITHUB_STEP_SUMMARY` output, and `render-yanote-summary.mjs` test fixtures to localize whether failure happened before report creation or inside the analyzer/gate result.
- Failure state exposed: the proof exit code, primary async error line, and report presence/absence remain visible even when the live Kafka step itself fails.

## Inputs

- `scripts/ci/render-yanote-summary.mjs` — existing HTTP-only summary renderer that must stay backward-compatible while gaining async support.
- `.github/workflows/yanote-ci.yml` — current required-check topology where `build-and-test` runs the live proof but async triage does not yet survive failure.
- `.github/BRANCH_PROTECTION.md` — stable required-check contract that must remain true after the wiring change.
- `.gsd/milestones/M005/slices/S02/tasks/T01-PLAN.md` — exported async bundle contract that this task will publish and summarize.

## Expected Output

- `scripts/ci/render-yanote-summary.mjs` — async-aware summary renderer with graceful no-report fallback.
- `scripts/ci/render-yanote-summary.test.mjs` — explicit HTTP + async renderer contract coverage.
- `.github/workflows/yanote-ci.yml` — build-and-test job with always-on async triage and final exit-code enforcement.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — workflow contract tests locking placement and required-job stability.
- `.github/BRANCH_PROTECTION.md` — documented async triage expectations under the unchanged required job names.
