---
id: T02
parent: S04
milestone: M013
key_files:
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - .github/BRANCH_PROTECTION.md
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - scripts/ci/run-yanote-gradle-check.sh
key_decisions:
  - GitHub step summaries now derive displayed provenance from canonical report JSON but sanitize remote URL credentials, query strings, and fragments before publishing them.
  - HTTP and async summaries now publish explicit report-artifact truth via expected JSON/HTML filename status lines instead of relying on the generic top-level artifact listing alone.
  - The Gradle parity helper now materializes literal rooted `./gradlew ... yanoteCheck|yanoteReport` command arrays so the workflow contract test can verify the real execution path without changing runtime behavior.
duration: ""
verification_result: passed
completed_at: 2026-03-26T03:50:26.133Z
blocker_discovered: false
---

# T02: Publish truthful CI summaries and branch-protection wording for widened HTTP and async artifacts

**Publish truthful CI summaries and branch-protection wording for widened HTTP and async artifacts**

## What Happened

Updated `scripts/ci/render-yanote-summary.mjs` so HTTP and async GitHub step summaries now publish sanitized `specSource` provenance, explicit JSON/HTML artifact names from the collected artifact directories, and additive deprecated-operation truth for HTTP reports. The renderer now strips URL credentials, queries, and fragments before printing remote provenance, reports present/missing status for the expected report artifacts, and keeps async-only companion artifacts separate from HTTP wording. Refreshed `scripts/ci/render-yanote-summary.test.mjs` to pin the new ordering and wording for HTTP, async, and fallback summaries, including secret-safe remote provenance behavior and widened async companion artifacts. Updated `.github/BRANCH_PROTECTION.md` plus `scripts/ci/yanote-ci-workflow.contract.test.mjs` so the stable required-job contract now explicitly documents the widened summary/artifact surfaces without renaming jobs. While validating the workflow-contract suite, I also made a small behavior-preserving fix in `scripts/ci/run-yanote-gradle-check.sh` so the helper still runs rooted `./gradlew` commands but now spells out the concrete `yanoteCheck` / `yanoteReport` task in the command array, satisfying the already-pinned contract test in this worktree.

## Verification

Focused task verification passed with `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, confirming the rendered markdown now exposes sanitized provenance plus explicit HTTP/async JSON+HTML artifact lines in the expected order. I then ran the slice-wide non-git verification stack: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh`; all passed. Finally, `bash -n scripts/ci/run-yanote-gradle-check.sh` passed after the helper adjustment. These checks verify the observability impact directly: fixture-backed `GITHUB_STEP_SUMMARY` rendering now shows `specSource`, deprecated counts, and explicit report artifact names, and the branch-protection contract documents the same widened surfaces while preserving the required job topology.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 375ms |
| 2 | `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 422ms |
| 3 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 120ms |
| 4 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 231ms |
| 5 | `bash -n scripts/ci/run-yanote-gradle-check.sh` | 0 | ✅ pass | 4ms |


## Deviations

Did not run `git diff --check` because this auto-mode contract explicitly forbids git commands. Minor local adaptation: fixed the existing `scripts/ci/run-yanote-gradle-check.sh` command-array literal so the already-required workflow contract suite passed without changing the helper's job or topology behavior.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `.github/BRANCH_PROTECTION.md`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `scripts/ci/run-yanote-gradle-check.sh`
