---
id: S01
parent: M014
milestone: M014
provides:
  - Canonical Kafka operation/message contracts now retain declared `correlationId` and `reply.address` metadata with inline-vs-trait parity and unchanged serialized operation keys.
  - Async JSON/HTML/CLI report surfaces now publish additive declared-semantics truth while preserving existing coverage numerators, diagnostic counts, and JSON-centered automation.
  - A concrete fixture-backed parity pattern for future async semantic widening in S02/S03/S04.
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/spec/asyncapi.parity.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
key_decisions:
  - Trust the AsyncAPI parser’s merged trait output as the authoritative source for supported declaration fields instead of inventing a custom trait merge layer.
  - Publish async declared semantics from canonical Kafka operation contracts (`operationContractsByKey`) as an additive report surface rather than deriving them from coverage arrays or changing legacy async numerators.
  - Keep `yanote async-report` JSON-centered: stdout may show sanitized per-operation declared-semantics details, but `YANOTE_ASYNC_SUMMARY` stays counts-only and `report=` continues to point at `yanote-async-report.json`.
patterns_established:
  - When widening AsyncAPI semantic breadth, store new declaration metadata beside the canonical `kafka <action> <channel>` identity and thread it additively into report/HTML/CLI layers without redefining channel/operation/message coverage math.
  - Use paired inline-vs-trait AsyncAPI fixtures across v2 and v3 to pin parser-resolved normalization parity for supported declaration fields.
  - Split human and machine delivery surfaces intentionally: human stdout/HTML can show sanitized declaration locations, while machine summaries keep stable count tokens and no retained header values.
observability_surfaces:
  - `yanote-async-report.json` top-level `declaredSemantics` summary and per-operation entries.
  - `yanote-async-report.html` Declared semantics section and operation table derived from the normalized async DTO.
  - `yanote async-report` stdout Declared Semantics block plus `YANOTE_ASYNC_SUMMARY` `declared_*` tokens.
  - Focused contract/parity/determinism coverage in `yanote-js/src/spec/asyncapi*.test.ts`, `yanote-js/src/report/asyncReport*.test.ts`, `yanote-js/src/report/writeAsyncReport.determinism.test.ts`, and `yanote-js/src/cli.async-report*.test.ts`.
drill_down_paths:
  - .gsd/milestones/M014/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M014/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M014/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T05:40:14.409Z
blocker_discovered: false
---

# S01: Trait-aware declared semantics on async-report

**Trait-applied AsyncAPI correlationId/reply declarations now normalize into the same Kafka contracts as inline declarations and flow additively through async JSON, HTML, and CLI report surfaces without changing canonical operation keys or legacy async coverage numerators.**

## What Happened

S01 closed the first M014 async semantic-breadth step by widening Yanote’s canonical Kafka AsyncAPI contract model instead of mutating existing coverage math. T01 extended the retained Kafka contract metadata with declared `correlationId` on messages and declared `reply.address` on operations, then taught the AsyncAPI v2/v3 extractor to read the parser-resolved document so inline and trait-applied declarations normalize to the same `KafkaOperationContract` shape. The slice pinned that parity with dedicated inline-vs-trait fixtures for AsyncAPI v2 and v3 and kept `serializeOperationKey()` fixed at `kafka <action> <channel>`. T02 then threaded those canonical declaration fields into a new additive `declaredSemantics` section on `yanote-async-report.json`, normalized it deterministically, extended the async report schema, and rendered the same truth in the async-only HTML artifact without introducing HTTP-only sections or changing existing channel/operation/message coverage summaries or diagnostic counts. T03 completed the delivery path by surfacing declared semantics in `yanote async-report` stdout and `YANOTE_ASYNC_SUMMARY`, including sanitized per-operation detail lines for humans and counts-only machine tokens for automation, while preserving the JSON-centered `report=` contract and keeping raw retained header values out of stdout, machine summaries, and HTML. A built-CLI probe against the inline and trait v3 fixtures confirmed that both declarations produce identical `declaredSemantics`, identical coverage summaries, and identical canonical `kafka send orders.command` identity on the assembled delivery path.

## Verification

Passed the full slice verifier stack on current HEAD: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`; `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`; `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts`; `npm -C yanote-js run build`; and `git diff --check`. Also ran a direct built-CLI artifact probe with `node yanote-js/dist/yanote.cjs async-report` against `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml` and `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml` using the same Kafka event, confirming equal `declaredSemantics`, unchanged coverage summaries, visible declared-semantics sections in JSON/HTML/stdout, and no leakage of `correlation_id` / `reply_to` values into stdout, HTML, or the canonical JSON report.

## Requirements Advanced

- R025 — Added truthful trait-aware declaration metadata for supported AsyncAPI `correlationId` and `reply.address` fields, then surfaced it additively through canonical async JSON/HTML/CLI outputs without changing Kafka operation identity or legacy async coverage numerators.
- R003 — Kept the richer async declaration surface available through the supported CLI/report delivery path, including local and remote-spec contract tests plus a built-CLI probe that preserved the JSON-centered `report=` contract.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

This slice only publishes declared async semantics; it does not yet evaluate declared `correlationId` or `reply.address` against retained Kafka headers, publish an explicit Kafka binding support matrix, or widen the live Spring Kafka/CI/docs proof path. Unsupported runtime-expression locations and non-header-backed reply/correlation semantics remain for later slices to handle fail-closed.

## Follow-ups

S02 must evaluate header-backed correlation and reply semantics against retained Kafka headers with explicit fail-closed diagnostics. S03 must publish the Kafka binding support matrix without synthetic green coverage. S04 must retain the widened async artifacts on the live Spring Kafka proof path and align CI/docs/support wording to the richer async surface.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — Extended Kafka contract types with declared correlationId and reply metadata while leaving `serializeOperationKey()` unchanged.
- `yanote-js/src/spec/asyncapi.ts` — Extracted declared correlationId and reply metadata from parser-resolved AsyncAPI v2/v3 documents and threaded it into canonical Kafka operation contracts.
- `yanote-js/src/spec/asyncapi.test.ts` — Added focused extractor assertions for declared semantic metadata on supported Kafka AsyncAPI contracts.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — Pinned inline-vs-trait parity for v2/v3 declaration fixtures and preserved canonical Kafka operation keys.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v2.yaml` — Added AsyncAPI v2 inline declaration fixture for correlationId parity proof.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v2.yaml` — Added AsyncAPI v2 trait-applied declaration fixture for parity proof against the inline fixture.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml` — Added AsyncAPI v3 inline declaration fixture covering supported declared semantics.
- `yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml` — Added AsyncAPI v3 trait-applied declaration fixture while keeping reply inline where the parser schema requires it.
- `yanote-js/src/report/asyncReport.ts` — Added the canonical `declaredSemantics` report builder and summary/operation DTOs sourced from Kafka operation contracts.
- `yanote-js/src/report/asyncSchema.ts` — Extended the async report schema contract to require the additive `declaredSemantics` section.
- `yanote-js/src/report/asyncNormalize.ts` — Normalized declared-semantics summary and operations deterministically alongside existing async report fields.
- `yanote-js/src/report/asyncReportHtml.ts` — Rendered the async-only Declared semantics HTML section and table without introducing HTTP-only wording.
- `yanote-js/src/report/asyncReport.test.ts` — Pinned deterministic report behavior and additive declared-semantics visibility without coverage-math regressions.
- `yanote-js/src/report/asyncReport.contract.test.ts` — Validated schema shape and HTML rendering for the widened async report contract.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — Kept remote/local spec-source provenance coverage green while the async report contract widened.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — Extended writer determinism proof to the widened async report artifacts.
- `yanote-js/src/cli.ts` — Added declared-semantics stdout sections and machine-summary tokens while keeping report delivery JSON-centered and redaction-safe.
- `yanote-js/src/cli.async-report.contract.test.ts` — Pinned section ordering, machine-summary tokens, and no-leakage behavior for declared semantics on `async-report`.
- `yanote-js/src/cli.async-report.test.ts` — Verified end-to-end async CLI behavior for declared semantics and preserved async-only output boundaries.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — Preserved async remote-spec CLI contract behavior while adding declared-semantics summary fields.
