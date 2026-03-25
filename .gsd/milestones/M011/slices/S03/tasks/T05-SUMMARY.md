---
id: T05
parent: S03
milestone: M011
key_files:
  - scripts/ci/verify-m011-s03-format-media.sh
  - .gsd/KNOWLEDGE.md
key_decisions:
  - The retained S03 verifier should assert stdout, stderr, exit code, and `yanote-report.json` per scenario in isolated temp directories so analyzer-vs-report-vs-CLI drift is localized immediately on failure.
  - The verifier should enforce the slice redaction contract by rejecting raw fixture payload values in retained artifacts while still allowing schema paths, format names, and media types.
duration: ""
verification_result: passed
completed_at: 2026-03-25T18:19:51.186Z
blocker_discovered: false
---

# T05: Added a retained S03 shell verifier for format allowlist and media-specific payload semantics

**Added a retained S03 shell verifier for format allowlist and media-specific payload semantics**

## What Happened

Created `scripts/ci/verify-m011-s03-format-media.sh` as the retained S03 proof bundle for the real `yanote report` entrypoint. The script bootstraps `yanote-js` with `npm -C yanote-js ci` and `npm -C yanote-js run build`, then runs four fixture-backed scenarios independently against `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml`: the supported email green path, invalid email, unsupported/custom format, and media-specificity via `application/problem+json`. Each scenario writes stdout, stderr, exit code, and `yanote-report.json` into its own temp subdirectory, and inline Python assertions verify CLI/report/analyzer agreement on primary semantic code, payload diagnostic counts, observed media type, and redaction (raw fixture values are rejected if they appear in stdout, stderr, or the retained report JSON). The script keeps the temp bundle on failure and prints per-scenario artifact paths so drift can be localized quickly. I also appended a `.gsd/KNOWLEDGE.md` lesson noting that `async_bash` resolved the parent repo root instead of the active worktree for relative verification commands here, so authoritative verification for this task used `bash` in the worktree.

## Verification

Verified the new shell script with `bash -n` and by executing it directly; it built `yanote-js` and proved all four S03 scenarios with the expected exit codes and retained artifacts. For the slice gate, the worktree initially lacked a local `vitest` bin, so I bootstrapped `yanote-js` with `npm -C yanote-js ci` and reran the focused slice command successfully. Then I reran the retained verifier as part of the slice verification bar. Final authoritative results in the worktree: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` passed with 9 test files / 77 tests green, and `bash scripts/ci/verify-m011-s03-format-media.sh` passed all four retained format/media scenarios.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1879ms |
| 2 | `bash scripts/ci/verify-m011-s03-format-media.sh` | 0 | ✅ pass | 3150ms |


## Deviations

Bootstrapped the worktree package directory with `npm -C yanote-js ci` before the final Vitest gate because the local `vitest` bin was not initially present in `.gsd/worktrees/M011/yanote-js`. I also disregarded one failed `async_bash` verification attempt after confirming it had resolved the parent repo root instead of the active worktree; the authoritative gate was rerun with `bash` from the worktree.

## Known Issues

`async_bash` can resolve the parent repo root instead of the active `.gsd/worktrees/M011` checkout for relative verification commands in this environment. The product code and retained verifier are green; use `bash` for authoritative worktree-local verification until that harness behavior is addressed.

## Files Created/Modified

- `scripts/ci/verify-m011-s03-format-media.sh`
- `.gsd/KNOWLEDGE.md`
