---
id: T04
parent: S03
milestone: M011
key_files:
  - yanote-js/src/cli.report.test.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.failclosed.contract.test.ts
  - .gsd/STATE.md
key_decisions:
  - Use the shared S03 OpenAPI/events fixtures directly in CLI contract tests so stdout/stderr/`YANOTE_SUMMARY` assertions stay aligned with the analyzer/report fixtures instead of drifting onto synthetic-only cases.
  - Treat the missing `scripts/ci/verify-m011-s03-format-media.sh` as a known intermediate-task gap owned by T05, not a blocker for T04, while still recording its failing verification result explicitly.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T18:11:43.185Z
blocker_discovered: false
---

# T04: Add shared S03 CLI contract coverage for format/media semantics and summary dedupe

**Add shared S03 CLI contract coverage for format/media semantics and summary dedupe**

## What Happened

I verified the current CLI implementation against the S03 analyzer/report surfaces first and found the runtime behavior already correct for invalid email format, unsupported declared format, and media-specific matching. I then expanded the CLI contract layer to use the shared S03 fixtures directly: `cli.report.test.ts` now proves the combined valid-format, invalid-format, unsupported-format, and media-specificity fixture set flows through stdout, stderr, and `yanote-report.json` without regressing payload states or media selection; `cli.summary.contract.test.ts` now pins the deduped Top Issues output and confirms `YANOTE_SUMMARY` reuses the existing machine tokens while reporting the richer payload counts; and `cli.failclosed.contract.test.ts` now proves the unsupported-format fixture exits fail-closed with `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` on stderr. I also refreshed `.gsd/STATE.md` so the next action points at T05.

## Verification

Focused CLI Vitest coverage passed after the new shared-fixture assertions were added: `npm -C yanote-js test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` passed with all 25 CLI tests green. The broader slice Vitest stack also passed: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` passed with all 77 tests green, confirming the CLI contract remained aligned with analyzer/report semantics. The retained slice verifier command was also executed and failed honestly with exit 127 because `scripts/ci/verify-m011-s03-format-media.sh` is not present yet; that gap is recorded for T05 rather than treated as a blocker.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1000ms |
| 2 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 837ms |
| 3 | `bash scripts/ci/verify-m011-s03-format-media.sh` | 127 | ❌ fail | 3ms |


## Deviations

CLI runtime behavior already matched the S03 contract locally, so no production changes to `yanote-js/src/cli.ts` were necessary; I completed the task by adding shared-fixture contract coverage around the existing behavior. This is a local execution adaptation, not a plan change.

## Known Issues

`bash scripts/ci/verify-m011-s03-format-media.sh` still fails with exit 127 because the retained verifier script does not exist yet; that work is planned in T05.

## Files Created/Modified

- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `.gsd/STATE.md`
