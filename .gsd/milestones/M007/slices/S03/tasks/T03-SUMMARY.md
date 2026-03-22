---
id: T03
parent: S03
milestone: M007
provides:
  - CI async markdown summaries and live Kafka proof verifiers now understand the widened async diagnostic/count contract, preserve typed failure ordering, and keep zero-diagnostic happy paths green.
key_files:
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - scripts/ci/verify-m004-s02-metadata-propagation.sh
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
key_decisions:
  - Prefer report-first async summary fallback: synthesize the primary typed failure from `yanote-async-report.json` diagnostics in semantic precedence order, and use `YANOTE_ASYNC_SUMMARY primary_reason` only when the report is missing.
patterns_established:
  - Keep CI artifact readers aligned with runtime async truth by reusing semantic precedence for markdown summaries, deriving report-only fallback failures from redacted diagnostics, and asserting the full widened zero-count object in happy-path shell verifiers.
observability_surfaces:
  - scripts/ci/render-yanote-summary.test.mjs
  - scripts/ci/verify-m004-s02-metadata-propagation.sh
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - exported live proof bundle at .yanote-ci/live-kafka-proof
  - .gsd/KNOWLEDGE.md
duration: PT40M
verification_result: passed
completed_at: 2026-03-20T18:50:00+0300
blocker_discovered: false
---

# T03: Align CI summary readers and live proof verifiers with the widened async contract

**Aligned CI async summaries and live Kafka proof verifiers with the widened redacted async contract, including report-first fallback failures and full zero-count happy-path assertions.**

## What Happened

I loaded the `bash-scripting` skill, then updated `scripts/ci/render-yanote-summary.mjs` so async markdown summaries no longer assume `mismatched` is the only high-severity report diagnostic. The renderer now understands the full widened async diagnostic union, applies the same semantic precedence used by the gate/CLI layer, synthesizes a typed primary failure from `yanote-async-report.json` when stderr failure lines are missing, derives truthful async class counts from report diagnostics on that fallback path, and uses `YANOTE_ASYNC_SUMMARY primary_reason` when the report itself is absent.

I rewrote `scripts/ci/render-yanote-summary.test.mjs` to pin three widened contracts: the happy-path zero-count report shape, report-only schema/routing diagnostic fallback ordering without payload leakage, and summary-only missing-report fallback via `primary_reason`. The new report-only fixture proves the summary stays redacted while surfacing explicit typed async failures in deterministic precedence order.

I then updated both authoritative shell verifiers so their happy-path artifact assertions validate the full widened zero-diagnostic async count object instead of the old `{ unmatched, mismatched }` subset. That keeps the single-service metadata proof and the two-service live Kafka proof aligned with the public report schema widened in T01.

Finally, I recorded the new report-first CI fallback rule in `.gsd/KNOWLEDGE.md`, because it is easy for downstream readers to miss that async proof truth may survive only in the report artifact when stderr machine lines are absent.

## Verification

I first ran the task-level CI summary test and then the exact task-plan combined proof command; both passed. After that, because T03 is the final task in S03, I ran the full remaining slice verification stack: both async Vitest suites, both live-proof shell verifiers individually, `git diff --check`, and the task-plan file-existence check. Every slice verifier passed.

I also attempted LSP diagnostics for the edited `.mjs` files, but no language server was available in this worktree; runtime and test verification covered the edited surfaces instead.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/render-yanote-summary.test.mjs && bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 113.60s |
| 2 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 0.17s |
| 3 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 0 | ✅ pass | 38.50s |
| 4 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 74.00s |
| 5 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts` | 0 | ✅ pass | 24.90s |
| 6 | `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 17.30s |
| 7 | `git diff --check` | 0 | ✅ pass | 0.00s |
| 8 | `test -f scripts/ci/render-yanote-summary.mjs && test -f scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 0.00s |

## Diagnostics

Future agents can inspect the shipped T03 behavior with:

- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

The CI summary surface now makes three async failure sources inspectable without leaking payload bodies or raw Kafka headers:

- report-backed typed semantic fallback synthesized from `yanote-async-report.json`
- `YANOTE_ASYNC_ERROR*` / `YANOTE_ASYNC_SUMMARY` fallback when the report is missing
- verifier-side widened zero-count contract mismatches on the happy path

The two-service proof continues exporting retained artifacts to `.yanote-ci/live-kafka-proof` for post-failure inspection.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/render-yanote-summary.mjs` — widened async summary classification, added report-first semantic fallback synthesis, and made class counts/primary failure resolution truthful on missing-report and missing-stderr paths.
- `scripts/ci/render-yanote-summary.test.mjs` — pinned widened async summary wording, semantic precedence, redaction, and `primary_reason` fallback behavior.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — widened the happy-path async report assertion to the full zeroed async counts object.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — widened the two-service happy-path async report assertion to the full zeroed async counts object.
- `.gsd/KNOWLEDGE.md` — recorded the report-first async CI fallback rule for future artifact-reader work.
- `.gsd/milestones/M007/slices/S03/S03-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — refreshed the repository handoff state after completing S03.
