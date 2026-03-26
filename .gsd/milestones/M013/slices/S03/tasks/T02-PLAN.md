---
estimated_steps: 3
estimated_files: 6
skills_used:
  - accessibility
  - vitest
---

# T02: Mirror the static HTML contract on async reports

**Slice:** S03 — Static HTML Reports From Canonical HTTP And Async Truth
**Milestone:** M013

## Description

Reuse the shared shell for the smaller async surface while keeping HTTP-only language and combined-report temptations out of the retained artifact.

## Steps

1. Add a dedicated async HTML renderer that reuses the shared shell/helpers from T01 but renders only async summary, channel/operation/message coverage, diagnostics, and sanitized `specSource`.
2. Update `writeAsyncYanoteReport()` to emit `yanote-async-report.html` beside `yanote-async-report.json`, preserving normalized ordering and keeping the async writer return value JSON-centered.
3. Add the missing writer-focused async determinism test and extend async report contracts so HTML stays schema-aligned, provenance-aware, and free of HTTP-only sections or secret-bearing content.

## Must-Haves

- [ ] Async HTML remains a separate artifact with async-native section names and no deprecated/security/request HTTP wording.
- [ ] The async writer emits sibling JSON + HTML from the same normalized DTO and keeps return semantics stable.
- [ ] Provenance, offline/self-contained rules, and secret-safe rendering match the HTTP contract without introducing combined-report behavior.

## Verification

- `npm -C yanote-js test -- src/report/writeAsyncReport.determinism.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`
- Focused assertions prove `yanote-async-report.html` contains async counts plus `specSource`, omits HTTP-only sections, and contains no external asset references or sentinel secret strings.

## Observability Impact

- Signals added/changed: sibling `yanote-async-report.html` file and async-only section headings/tables.
- How a future agent inspects this: open generated async HTML beside `yanote-async-report.json` or rerun the async writer/contract tests.
- Failure state exposed: HTTP-only leakage, missing async counts, or external-asset drift fails deterministic async HTML assertions.

## Inputs

- `yanote-js/src/report/writeAsyncReport.ts` — current async writer that emits only JSON.
- `yanote-js/src/report/asyncReport.ts` — canonical async report model whose fields must drive the human artifact.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic async ordering/rounding contract reused by the writer.
- `yanote-js/src/report/htmlDocument.ts` — shared shell/helpers created in T01 that async rendering should reuse without external assets.
- `yanote-js/src/report/asyncReport.contract.test.ts` — existing async contract coverage that must stay HTTP-separate.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — async provenance contract coverage to extend with HTML assertions.

## Expected Output

- `yanote-js/src/report/asyncReportHtml.ts` — async HTML renderer derived from canonical async report truth.
- `yanote-js/src/report/writeAsyncReport.ts` — async writer that emits sibling JSON and HTML artifacts while returning the JSON path.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — new async writer determinism coverage for HTML bytes and self-contained rendering.
- `yanote-js/src/report/asyncReport.contract.test.ts` — async report contract tests updated to keep the async surface separate from HTTP.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — provenance tests proving sanitized `specSource` is rendered in async HTML.
- `yanote-js/src/report/htmlDocument.ts` — shared shell/helpers adjusted only as needed for both HTTP and async report pages.
