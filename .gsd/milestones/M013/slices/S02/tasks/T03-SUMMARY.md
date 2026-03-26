---
id: T03
parent: S02
milestone: M013
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.report.test.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - yanote-js/src/report/report.remote-spec.contract.test.ts
  - yanote-js/src/report/report.requestEvidence.contract.test.ts
  - yanote-js/src/report/report.security.contract.test.ts
  - .gsd/DECISIONS.md
key_decisions:
  - Publish deprecated HTTP CLI truth additively via a dedicated `- deprecated operations:` summary line plus `YANOTE_SUMMARY` `deprecated_operations`, `deprecated_total`, `deprecated_covered`, and `deprecated_uncovered` tokens instead of overloading existing `operations` or `covered` fields.
  - Label only uncovered deprecated HTTP operations explicitly in Top Issues and keep `YANOTE_ASYNC_SUMMARY` plus async-report output unchanged so the HTTP/async boundary remains intact.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T01:17:31.057Z
blocker_discovered: false
---

# T03: Expose deprecated HTTP summary tokens and issue wording without changing async output

**Expose deprecated HTTP summary tokens and issue wording without changing async output**

## What Happened

I updated `yanote-js/src/cli.ts` so the real HTTP `report` summary now publishes deprecated-operation truth additively instead of overloading the existing legacy coverage numerators. The human summary gained a dedicated `- deprecated operations:` line sourced directly from `report.summary.deprecatedOperations`, the machine summary gained stable `deprecated_operations`, `deprecated_total`, `deprecated_covered`, and `deprecated_uncovered` tokens, and uncovered deprecated operations now render in Top Issues as `deprecated operation is uncovered` while covered deprecated operations remain summary-only truth. I left `formatAsyncSummaryOutput` untouched so `YANOTE_ASYNC_SUMMARY` and async report surfaces stay exactly on their existing boundary.

I then updated the focused contract stack around that behavior. `cli.summary.contract.test.ts` now pins the deprecated summary line, machine tokens, and uncovered-deprecated wording on the dedicated deprecated fixture. `cli.report.test.ts` now proves the same truth reaches stdout and the written `yanote-report.json` together without changing the legacy `2/3` HTTP denominator. `cli.remote-spec.contract.test.ts` and `report.remote-spec.contract.test.ts` now assert that the additive deprecated report shape remains present and deterministic for local-file, local-directory, and remote-URL spec sources. `report.requestEvidence.contract.test.ts` and `report.security.contract.test.ts` now pin the default zero-valued deprecated summary and explicit `deprecated: false` report rows for those downstream report consumers, and `cli.async-report.contract.test.ts` now explicitly proves the new HTTP deprecated line/tokens do not leak into async output.

For observability verification, I built the real CLI and ran `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml --events yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl --out .tmp/m013-t03-cli --profile local`. That runtime output showed `- deprecated operations: covered=0/1 uncovered=1 (0.00%)`, explicit uncovered-deprecated Top Issues wording, and the new `YANOTE_SUMMARY` deprecated tokens, while the emitted `.tmp/m013-t03-cli/yanote-report.json` still preserved the additive `summary.deprecatedOperations` block and per-operation `deprecated` booleans from T01/T02.

I also recorded decision D031 so downstream T04 proof work has stable token names and the explicit rule that only the HTTP summary path changes while async summaries remain untouched.

## Verification

Focused T03 verification passed with `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/cli.async-report.contract.test.ts`, proving the HTTP CLI summary, remote-spec consumers, and downstream report contracts all accept the additive deprecated truth while the async summary contract stays unchanged. I also built the real CLI with `npm -C yanote-js run build` and verified the operator-facing surface directly by running `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml --events yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl --out .tmp/m013-t03-cli --profile local`, which showed the deprecated summary line, `YANOTE_SUMMARY` deprecated tokens, and explicit uncovered-deprecated wording on the real runtime path. The slice-level Vitest verification stack passed end to end. As expected for an intermediate task, the two retained-proof commands still fail because their T04-owned script/test files are not present yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2005ms |
| 2 | `npm -C yanote-js run build` | 0 | ✅ pass | 230ms |
| 3 | `rm -rf .tmp/m013-t03-cli && mkdir -p .tmp/m013-t03-cli && node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml --events yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl --out .tmp/m013-t03-cli --profile local` | 0 | ✅ pass | 272ms |
| 4 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 1928ms |
| 5 | `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` | 127 | ❌ fail | 5ms |
| 6 | `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` | 1 | ❌ fail | 82ms |


## Deviations

None.

## Known Issues

The slice-level retained proof commands `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` and `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` still fail because those T04-owned proof files do not exist yet.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/report.security.contract.test.ts`
- `.gsd/DECISIONS.md`
