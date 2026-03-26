---
estimated_steps: 3
estimated_files: 8
skills_used:
  - vitest
---

# T02: Publish declared async semantics in canonical JSON and HTML reports

**Slice:** S01 — Trait-aware declared semantics on async-report
**Milestone:** M014

## Description

Turn the richer contract metadata into a stable user-facing async artifact. The JSON report remains canonical while the HTML sibling mirrors the same normalized declared-semantics truth without changing existing coverage or diagnostics numerators.

## Steps

1. Extend `yanote-js/src/report/asyncReport.ts` so the async report can carry an additive `declaredSemantics` section with per-operation `correlationId` / `reply` declarations and summary counts derived from canonical async truth.
2. Update `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/report/asyncNormalize.ts`, and `yanote-js/src/report/asyncReportHtml.ts` so the new section is schema-valid, deterministically ordered, and rendered in async-only HTML without HTTP wording or raw parser trait blobs.
3. Expand report, writer, and remote-spec contract tests to pin the widened JSON/HTML shape, deterministic ordering, sanitized declaration locations, provenance behavior, and unchanged coverage numerators.

## Must-Haves

- [ ] `yanote-async-report.json` adds a schema-valid declared semantics section derived from canonical async truth.
- [ ] `yanote-async-report.html` renders the same declared semantics additively and stays async-only, self-contained, and provenance-aware.
- [ ] Existing channel/operation/message coverage numerators and diagnostic counts remain stable outside the new additive section.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- Focused assertions prove deterministic ordering, schema validity, and unchanged coverage numerators alongside the new declared semantics fields.

## Observability Impact

- Signals added/changed: `yanote-async-report.json` and `yanote-async-report.html` expose declared `correlationId` / `reply` metadata and summary counts.
- How a future agent inspects this: open the generated async report artifacts or rerun the focused report/writer contract tests.
- Failure state exposed: schema drift, missing HTML sections, or numerator regressions fail targeted report/writer tests with exact report field names.

## Inputs

- `yanote-js/src/model/operationKey.ts` — widened Kafka contract types produced by T01.
- `yanote-js/src/spec/asyncapi.ts` — trait-aware semantics bundle that now retains richer declared metadata.
- `yanote-js/src/spec/asyncapi.test.ts` — spec assertions from T01 that define the retained contract truth.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity guard ensuring inline-vs-trait equivalence before report serialization.
- `yanote-js/src/report/asyncReport.ts` — current canonical async report DTO builder.
- `yanote-js/src/report/asyncSchema.ts` — JSON schema for `yanote-async-report.json`.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering/rounding contract for the async artifact.
- `yanote-js/src/report/asyncReportHtml.ts` — async HTML renderer that must stay HTTP-separate.

## Expected Output

- `yanote-js/src/report/asyncReport.ts` — async report builder widened with additive declared semantics.
- `yanote-js/src/report/asyncSchema.ts` — schema contract updated for the new declared semantics section.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering for the widened async report shape.
- `yanote-js/src/report/asyncReportHtml.ts` — async HTML renderer updated to show declared semantics without HTTP leakage.
- `yanote-js/src/report/asyncReport.test.ts` — behavior assertions for the new declared semantics DTO.
- `yanote-js/src/report/asyncReport.contract.test.ts` — schema/HTML contract assertions for the widened async artifact.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — provenance coverage proving the widened report stays stable for local and remote spec inputs.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — deterministic writer coverage for JSON/HTML bytes with the additive declared semantics section.
