---
id: T04
parent: S02
milestone: M011
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.requestEvidence.test.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.failclosed.contract.test.ts
key_decisions:
  - Deduplicate `httpRequestConformance` Top Issues rows whenever an equivalent typed request-semantic governance failure already exists so the CLI surfaces only the semantic failure for that drift.
  - Prioritize the selected primary governance failure at the top of CLI Top Issues so stdout, stderr, and `YANOTE_SUMMARY` all point at the same deterministic request-semantic primary.
  - Keep green-run request observation/truth rollups and machine-summary tokens unchanged; only fail-closed request-semantic cases alter the primary issue surfaces.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T16:47:53.481Z
blocker_discovered: false
---

# T04: Expose typed request-semantic failures on CLI summary surfaces without duplicate request issues

**Expose typed request-semantic failures on CLI summary surfaces without duplicate request issues**

## What Happened

Updated `yanote-js/src/cli.ts` so CLI summaries now treat request-semantic governance failures as the public primary issue surface instead of also repeating the same drift as medium request diagnostics in Top Issues. The CLI now imports request-semantic classification helpers, suppresses request-conformance issue rows when an equivalent semantic failure is already present, and reorders Top Issues so the selected primary failure is shown first deterministically. I then refreshed the CLI contract tests to match the fail-closed request-semantic behavior introduced in T03: `cli.requestEvidence.test.ts` now asserts exit 5, typed stderr/stdout semantic failures, deduped Top Issues, and redaction safety; `cli.summary.contract.test.ts` now verifies green-run request rollups and `YANOTE_SUMMARY` tokens against fully valid request evidence; and `cli.failclosed.contract.test.ts` now covers request-semantic precedence over payload semantics plus duplicate suppression. No blocker was discovered; the only slice-level mismatch was that the retained verifier script named in the slice plan is not present in this worktree yet, which aligns with the remaining T05 work rather than invalidating the plan.

## Verification

Ran the task-level CLI Vitest contract suite and it passed, confirming typed request-semantic failures appear in stderr/stdout primary surfaces, duplicated medium request diagnostics are removed from Top Issues, and green-run request rollups plus `YANOTE_SUMMARY` remain stable and secret-safe. Ran the broader S02 Vitest verification stack and it also passed. Attempted the slice-level retained verifier command from the plan, but the referenced script is not present yet in this worktree and exited 127; this was recorded as a local path/repo-reality mismatch for T04 rather than worked around with a substitute.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 933ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1399ms |
| 3 | `bash scripts/ci/verify-m011-s02-request-semantics.sh` | 127 | ❌ fail | 3ms |


## Deviations

Adjusted to local reality by recording the slice-level verifier command failure instead of fabricating a replacement: `scripts/ci/verify-m011-s02-request-semantics.sh` is not present in this worktree yet, so only the Vitest-based slice verification could run during T04.

## Known Issues

`scripts/ci/verify-m011-s02-request-semantics.sh` is not present in the worktree yet and still needs to be added in T05 before the full slice verifier stack can pass end to end.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
