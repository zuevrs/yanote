---
id: T02
parent: S03
milestone: M007
provides:
  - Async gate and CLI surfaces now fail closed on every public async routing/schema diagnostic kind with deterministic typed semantic ordering and a shared redacted primary failure across Top Issues, `YANOTE_ASYNC_ERROR*`, and `YANOTE_ASYNC_SUMMARY`.
key_files:
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
key_decisions:
  - Keep async semantic code names human-readable, then enforce deterministic primary/secondary ordering with an explicit semantic precedence map in `failureOrder.ts` instead of relying on alphabetical code order.
patterns_established:
  - Derive async gate failures directly from the public async diagnostic union, reuse that same failure ordering for CLI primary/secondary output, and expose the identical primary reason again on `YANOTE_ASYNC_SUMMARY` so human and machine surfaces stay aligned.
observability_surfaces:
  - yanote-js/src/gates/asyncEvaluator.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - built `yanote-js/dist/yanote.cjs async-report` stderr/stdout (`YANOTE_ASYNC_ERROR*`, `YANOTE_ASYNC_SUMMARY`, and `yanote-async-report.json`)
duration: PT1H20M
verification_result: passed
completed_at: 2026-03-20T18:30:00+0300
blocker_discovered: false
---

# T02: Fail async gates and CLI summaries on typed schema truth

**Failed async-report on typed schema diagnostics and aligned gate, Top Issues, and machine output around one redacted primary failure.**

## What Happened

I loaded the `vitest` skill, then rewired `yanote-js/src/gates/asyncEvaluator.ts` so every public async diagnostic kind now maps to one stable semantic failure path instead of falling through to `ASYNC_SEMANTIC_UNMATCHED_EVIDENCE`. The new mapping covers `unsupported-content-type`, `unsupported-schema-format`, `missing-payload`, `invalid-payload`, `unverifiable-headers`, `mismatched`, and `unmatched`, and each failure reason now carries the redacted operation/schema/pointer context needed to inspect the failure without leaking payload bodies or raw headers.

While implementing, I noticed that the shared failure sorter would otherwise pick primary async semantic failures by alphabetical code order. That would make the CLI’s primary failure unstable relative to the public async diagnostic ordering introduced in T01. I fixed that in `yanote-js/src/gates/failureOrder.ts` by adding an explicit async semantic precedence map, so primary/secondary ordering now matches the widened public async contract instead of incidental string sorting.

On the CLI side, I updated `yanote-js/src/cli.ts` so `collectAsyncIssues()` now includes widened async report diagnostics, `Top Issues` always leads with the same typed semantic failure that stderr emits, and the final `YANOTE_ASYNC_SUMMARY` line now repeats the same redacted `primary_reason` beside the existing primary code and class counts. That keeps human output, stderr machine lines, and the final summary line in sync whenever public async diagnostics exist.

I then rewrote the async gate and CLI suites around the schema-depth fixtures. The tests now prove fail-closed behavior for: combined missing-payload + invalid-payload + unverifiable-headers, unsupported content types, unsupported schema formats, and the existing routing mismatch/unmatched drift path. I also kept the local happy path stable: zero-diagnostic uncovered local flows still exit 0 with a partial report, and the input/no-report fallback contract still produces one primary error line with deterministic secondaries.

During CLI verification I hit one real parser gotcha: the AsyncAPI parser rejected message-level `schemaFormat` in a real v3 YAML fixture even though the extracted runtime contract supports `schemaFormat`. I verified that `buildMessageContract()` also reads `schemaFormat` from the resolved payload schema object, switched the runtime fixture to set it on the payload component schema instead, and recorded that rule in `.gsd/KNOWLEDGE.md`.

I also marked T02 complete in `.gsd/milestones/M007/slices/S03/S03-PLAN.md` and advanced `.gsd/STATE.md` to T03.

## Verification

I first ran the task-level async gate/CLI Vitest verifier and the task’s file-existence check; both passed. I then built `yanote-js` and ran the real compiled `async-report` CLI against a combined schema-invalid + schema-missing-payload input to verify the changed observability signals directly: it exited 5, emitted `ASYNC_SEMANTIC_MISSING_PAYLOAD` as the primary error, kept `ASYNC_SEMANTIC_INVALID_PAYLOAD` and `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS` as deterministic secondaries, and repeated the same redacted primary reason on `YANOTE_ASYNC_SUMMARY`.

After that, I ran the slice-level verifier stack that is available at T02. The widened async coverage/report suite passed, the async gate/CLI suite passed, and the CI summary renderer test passed. The two live-proof shell verifiers still failed for the expected T03 reason: both scripts are still hard-coded to the old zero-diagnostic async counts object and treat the widened all-zero count shape as drift even though the runtime artifact is healthy.

I attempted LSP diagnostics on the edited TypeScript files, but no language server was available in this worktree, so the static check remained test-driven.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 1.46s |
| 2 | `test -f yanote-js/src/cli.ts && test -f yanote-js/src/gates/asyncEvaluator.ts` | 0 | ✅ pass | 0.00s |
| 3 | `bash -lc 'cp schema-depth-v3.yaml to temp, combine schema-invalid + schema-missing-payload fixtures, run dist/yanote.cjs async-report, grep typed YANOTE_ASYNC_* signals'` | 0 | ✅ pass | 0.54s |
| 4 | `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts` | 0 | ✅ pass | 1.34s |
| 5 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 0.25s |
| 6 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 1 | ❌ fail | 47.45s |
| 7 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 1 | ❌ fail | 41.48s |

## Diagnostics

Future agents can inspect the shipped T02 behavior with:

- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `node yanote-js/dist/yanote.cjs async-report --spec <schema-depth asyncapi> --events <schema-invalid+schema-missing jsonl> --out <dir> --profile local`

The stable public async failure signals now expose:

- semantic codes: `ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE`, `ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT`, `ASYNC_SEMANTIC_MISSING_PAYLOAD`, `ASYNC_SEMANTIC_INVALID_PAYLOAD`, `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`, `ASYNC_SEMANTIC_MESSAGE_MISMATCH`, `ASYNC_SEMANTIC_UNMATCHED_EVIDENCE`
- one primary `YANOTE_ASYNC_ERROR` line plus ordered `YANOTE_ASYNC_ERROR_SECONDARY` lines
- one final `YANOTE_ASYNC_SUMMARY` line with `primary=...`, `primary_reason="..."`, and `class_counts=...`
- widened `Top Issues` entries for both the primary typed failure and the underlying redacted async diagnostics

No emitted surface includes observed payload bodies or raw Kafka headers.

## Deviations

- I did not run `git diff --check` even though it is listed in the slice verifier stack, because this auto-mode prompt explicitly forbade running git commands.

## Known Issues

- `scripts/ci/verify-m004-s02-metadata-propagation.sh` still expects the pre-S03 zero-diagnostic async counts object and fails when `yanote-async-report.json` now includes all public async kinds at zero. T03 needs to update that reader.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` inherits the same stale async-count expectation from the older metadata propagation verifier and still fails until T03 refreshes the live-proof readers around the widened async contract.
- LSP diagnostics were unavailable in this worktree (`No language server found`), so TypeScript validation for this task came from the Vitest/runtime verifiers rather than editor diagnostics.

## Files Created/Modified

- `yanote-js/src/gates/asyncEvaluator.ts` — mapped every public async routing/schema diagnostic kind to a typed semantic failure with redacted operation/schema/pointer context and fail-closed behavior.
- `yanote-js/src/gates/failureOrder.ts` — added explicit async semantic precedence so primary/secondary ordering matches the public async diagnostic order.
- `yanote-js/src/cli.ts` — widened `collectAsyncIssues()`, aligned `Top Issues` with the semantic primary failure, and added `primary_reason` to `YANOTE_ASYNC_SUMMARY`.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — pinned typed semantic codes and ordering across missing/invalid payloads, unsupported content/schema material, headers, and routing drift.
- `yanote-js/src/cli.async-report.test.ts` — proved real CLI fail-closed behavior for schema-depth diagnostics while keeping the local uncovered happy path stable.
- `yanote-js/src/cli.async-report.contract.test.ts` — pinned the updated async machine summary contract and deterministic secondary error ordering.
- `.gsd/KNOWLEDGE.md` — recorded the parser-accepted placement rule for real `unsupported-schema-format` CLI fixtures.
- `.gsd/milestones/M007/slices/S03/S03-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the slice handoff to T03.
