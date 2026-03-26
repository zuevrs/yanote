---
id: S02
parent: M014
milestone: M014
provides:
  - Truthful header-backed runtime proof for AsyncAPI `correlationId` and `reply.address` on canonical Kafka operations.
  - Typed fail-closed async gate/CLI behavior for missing, unavailable, unsupported, mismatched, and malformed header-backed semantics.
  - Deterministic async JSON/HTML/CLI runtime semantics contracts and proof fixtures that downstream S03/S04 can extend without redefining legacy coverage math.
  - Recorded decisions and knowledge about parser-invalid shells, JSONL header normalization, invalid-spec artifact boundaries, and worktree-safe verification.
requires:
  - slice: S01
    provides: Canonical Kafka operation contracts with trait-aware declared `correlationId` / `reply.address` metadata, unchanged operation keys, and the initial declared-semantics JSON/HTML/CLI/report scaffolding.
affects:
  - S03
  - S04
key_files:
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/coverage/asyncSemanticConformance.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/cli.ts
  - .gsd/KNOWLEDGE.md
  - .gsd/PROJECT.md
key_decisions:
  - D047: evaluate header-backed correlation and reply runtime truth in a dedicated `runtimeSemantics` seam instead of mutating legacy coverage math.
  - D049: map runtime semantic drift to dedicated `ASYNC_SEMANTIC_*` failure codes ranked ahead of generic async drift and gate failures.
  - D050: publish runtime truth additively under `report.runtimeSemantics` with deterministic JSON/HTML ordering and unchanged canonical Kafka keys.
  - D051: render sanitized runtime detail rows on stdout while keeping `YANOTE_ASYNC_SUMMARY` additive, counts-only, and JSON-report-centered.
  - D052: retain resolved reply-channel addresses additively under `declaredReply.channel.address` and fail closed on malformed header-backed declaration shells.
patterns_established:
  - Widen async semantics additively: preserve canonical `kafka <action> <channel>` identity and legacy `coverage.channels/operations/messages` numerators while publishing new truth on dedicated declaration/runtime surfaces.
  - Keep runtime proof narrow and honest by evaluating only supported `$message.header#/...` expressions against retained normalized `AsyncHeaderEvidence`, then promote those structured diagnostics through coverage → gates → report → CLI.
  - Separate evaluator-native ordering from report-contract ordering when necessary: preserve coverage/gate behavior, then normalize runtime diagnostics at the report layer for deterministic artifact output.
  - Use built `dist/yanote.cjs` CLI probes plus explicit redaction checks as the authoritative end-to-end proof for async runtime semantics in this repo.
observability_surfaces:
  - `coverage.runtimeSemantics` and `report.runtimeSemantics` with per-operation states, typed counts, and additive runtime coverage percentages.
  - Async HTML `Runtime Semantics` section mirroring the canonical JSON contract.
  - `yanote async-report` Runtime Semantics stdout block plus additive `runtime_*` fields in `YANOTE_ASYNC_SUMMARY`.
  - Typed stderr/runtime governance surfaces: `ASYNC_SEMANTIC_CORRELATION_ID_*`, `ASYNC_SEMANTIC_REPLY_ADDRESS_*`, `ASYNC_SEMANTIC_RUNTIME_FAIL_CLOSED`, and `ASYNC_SEMANTIC_SPEC_INVALID`.
  - Top-level async report `status=partial` when runtime semantic diagnostics exist, even if legacy coverage remains fully covered.
drill_down_paths:
  - .gsd/milestones/M014/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M014/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M014/slices/S02/tasks/T03-SUMMARY.md
  - .gsd/milestones/M014/slices/S02/tasks/T04-SUMMARY.md
  - .gsd/milestones/M014/slices/S02/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:47:26.612Z
blocker_discovered: false
---

# S02: Header-backed correlation and reply truth

**Closed the async runtime-truth slice by proving header-backed `correlationId` and `reply.address` semantics from retained Kafka headers, surfacing that truth additively through coverage/report/CLI/gate layers, and preserving fail-closed behavior when runtime proof is missing, unavailable, mismatched, malformed, or unsupported.**

## What Happened

## Delivered

S02 extended the richer AsyncAPI declaration work from S01 into truthful retained-header runtime proof. The slice hardened AsyncAPI extraction so malformed header-backed declaration shells fail closed, optional resolved reply-channel addresses are retained additively, and canonical `kafka <action> <channel>` keys remain unchanged. It then added a dedicated runtime semantic evaluator for `correlationId` and `reply.address` that only trusts the supported `$message.header#/...` subset against retained `AsyncHeaderEvidence`, threads that result into `coverage.runtimeSemantics` without changing legacy channel/operation/message numerators, promotes runtime drift into typed async gate failures, and publishes the same declared-vs-runtime split through `yanote-async-report.json`, async HTML, stdout/stderr, and `YANOTE_ASYNC_SUMMARY` machine tokens.

The assembled slice now behaves truthfully on all supported runtime states: satisfied semantics are proven from retained headers; missing, unavailable, mismatched, and unsupported states remain redaction-safe and fail closed; malformed declaration shells surface as `ASYNC_SEMANTIC_SPEC_INVALID`; and runtime semantic drift downgrades the async report to `partial` even when legacy routing/schema coverage stays green. End-to-end CLI probes confirmed both the green path (2/2 runtime semantics satisfied, exit 0) and the red path (typed semantic failures, exit 5, additive `runtime_*` tokens, partial report, no retained value leakage).

## Closeout correction

Slice closeout exposed one report-layer regression in the worktree: normalized runtime semantic diagnostics no longer matched the T04 contract ordering, and one report test still expected a reply-channel address on a declaration-only fixture that only declares a header location. I fixed that before closeout by keeping evaluator-layer ordering intact, adding report-local runtime-diagnostic normalization for deterministic state-first report ordering, and correcting the stale fixture expectation so the report contract matches the actual AsyncAPI declaration shape.

## Operational Readiness (Q8)

- **Health signal:** `yanote async-report` returns exit `0`, prints a Runtime Semantics block with satisfied counts, writes `yanote-async-report.json`/`.html`, and emits `YANOTE_ASYNC_SUMMARY` `runtime_*` tokens with `runtime_semantic_coverage=100.00` for the covered proof fixture.
- **Failure signal:** runtime proof drift now presents as exit `5`, `status=partial`, typed stderr codes (`ASYNC_SEMANTIC_CORRELATION_ID_*`, `ASYNC_SEMANTIC_REPLY_ADDRESS_*`, `ASYNC_SEMANTIC_SPEC_INVALID`), and additive runtime diagnostic counts while legacy coverage numerators can remain fully covered.
- **Recovery procedure:** retain the declared Kafka headers in normalized `{ state, value | reason }` form, keep runtime expressions inside the supported `$message.header#/...` subset, fix malformed declaration shells, rebuild the CLI, and rerun `yanote async-report` against the same fixtures or live proof bundle until runtime diagnostics clear.
- **Monitoring gaps:** runtime proof is still intentionally limited to retained header-backed semantics; broader AsyncAPI runtime-expression sources and Kafka binding semantics remain out of scope until S03/S04, and invalid-spec extraction failures stop before a JSON report artifact is written.

## Verification

Executed the full slice verifier stack from the M014 worktree with `bash` so every command resolved against `/Users/zuevrs/Projects/yanote/.gsd/worktrees/M014`:

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `npm -C yanote-js test -- src/coverage/asyncSemanticConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts`
- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts`
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts`
- `npm -C yanote-js run build`

Closeout also ran direct built-CLI probes:

- Covered runtime proof: `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml --events yanote-js/test/fixtures/async-events/header-runtime-covered.fixture.jsonl --out /tmp/yanote-m014-s02-proof/covered --profile local` returned exit `0`, wrote async JSON/HTML artifacts, and produced `runtime_satisfied_semantics=2`, `runtime_unsatisfied_semantics=0`, `runtime_semantic_coverage=100.00`.
- Runtime drift proof: the same command with `header-runtime-failures.fixture.jsonl` returned exit `5`, selected `ASYNC_SEMANTIC_CORRELATION_ID_MISSING` as the primary stderr failure, kept `coverage.channels/operations/messages` at `100%`, and wrote a partial report with runtime diagnostics `missing=2 unavailable=2 unsupported=0 mismatched=1`.
- Unsupported subset proof: the same command with `header-runtime-unsupported-v3.yaml` returned exit `5` and wrote a partial report whose runtime diagnostics were `unsupported=2` and zero for the other runtime states.
- Malformed declaration proof: the same command with `header-runtime-malformed-v3.yaml` returned exit `5` with `ASYNC_SEMANTIC_SPEC_INVALID`; extraction failed before `yanote-async-report.json` was written, which matches the fail-closed invalid-spec boundary.
- Redaction safety: the retained-value strings `corr-runtime-mismatch` and `orders.deadletter` were absent from stdout/stderr/report proof artifacts.

## Requirements Advanced

- R025 — Added truthful header-backed AsyncAPI runtime proof for `correlationId` and `reply.address`, including additive JSON/HTML/CLI surfaces and fail-closed unsupported/malformed handling without changing canonical Kafka identities or legacy async coverage numerators.
- R002 — Promoted header-backed runtime drift into typed async semantic failures and partial-report states so missing, unavailable, mismatched, unsupported, and malformed semantics cannot silently pass.
- R003 — Delivered the new async runtime-semantics truth through the real standalone CLI path, machine summary tokens, stderr diagnostics, and generated report artifacts rather than keeping it test-only.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Closeout needed one unplanned correction before the slice could be accepted: async report normalization was not preserving the T04 runtime diagnostic ordering contract, and one report test expected `replyChannelAddress` on a declaration-only fixture that does not declare a reply channel address. I fixed both in the worktree (`yanote-js/src/report/asyncNormalize.ts` and `yanote-js/src/report/asyncReport.test.ts`) and reran the full verifier stack. No product-scope expansion was introduced.

## Known Limitations

Supported runtime proof is still deliberately narrow: Yanote only proves header-backed `correlationId` and `reply.address` semantics from retained Kafka header evidence using the `$message.header#/...` subset. Broader AsyncAPI runtime-expression locations, Kafka binding semantics, and live-proof/docs/CI closeout remain for S03-S04. Invalid semantic extraction failures also stop before a JSON report artifact exists, so operators must use stderr + exit code for that class of failure.

## Follow-ups

S03 should publish the explicit Kafka binding support matrix without creating false green semantics. S04 should carry S02 runtime-semantics truth into the authoritative Spring Kafka proof/docs/CI surfaces and preserve the now-documented invalid-spec-no-report boundary in retained proof bundles and public docs.

## Files Created/Modified

- `yanote-js/src/spec/asyncapi.ts` — Retained optional reply-channel address metadata and turned malformed header-backed declaration shells into explicit invalid diagnostics.
- `yanote-js/src/coverage/asyncSemanticConformance.ts` — Added the dedicated evaluator for header-backed `correlationId` and `reply.address` runtime proof and redaction-safe runtime diagnostics.
- `yanote-js/src/coverage/asyncCoverage.ts` — Threaded additive `runtimeSemantics` through async coverage without changing existing coverage summaries.
- `yanote-js/src/gates/asyncEvaluator.ts` — Mapped runtime semantic diagnostics to typed async semantic gate failures and fail-closed selection behavior.
- `yanote-js/src/gates/failureOrder.ts` — Ranked the new runtime semantic failures ahead of generic async drift/gate failures.
- `yanote-js/src/report/asyncReport.ts` — Published additive runtime semantics in the canonical async report and marked runtime-drift reports as partial.
- `yanote-js/src/report/asyncNormalize.ts` — Normalized runtime semantic diagnostics deterministically at the report layer during closeout without disturbing evaluator ordering.
- `yanote-js/src/report/asyncReportHtml.ts` — Rendered the async HTML Runtime Semantics section from the canonical report DTO.
- `yanote-js/src/cli.ts` — Surfaced runtime semantics, runtime summary tokens, and typed stderr ordering on `yanote async-report`.
- `yanote-js/src/report/asyncReport.test.ts` — Corrected the declaration-only reply expectation so report tests match the actual AsyncAPI fixture shape.
- `.gsd/KNOWLEDGE.md` — Recorded async invalid-spec/report-artifact and runtime-proof fixture gotchas for future agents.
- `.gsd/PROJECT.md` — Updated current project state to show M014 S02 complete and S03-S04 remaining.
