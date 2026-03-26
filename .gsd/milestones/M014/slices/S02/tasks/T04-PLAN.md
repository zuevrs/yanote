---
estimated_steps: 3
estimated_files: 8
skills_used:
  - debug-like-expert
  - vitest
---

# T04: Publish runtime semantics in async JSON and HTML artifacts

**Slice:** S02 — Header-backed correlation and reply truth
**Milestone:** M014

## Description

Make the runtime truth durable and machine-readable once coverage and gates know it. Add an additive `runtimeSemantics` section to the canonical async report and mirror it in HTML while keeping declared truth separate, preserving strict JSON schema validation, deterministic ordering, and unchanged coverage numerators.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Runtime-semantic coverage DTO plus async report schema validation | Reject invalid report shape immediately and keep `runtimeSemantics` additive instead of mutating legacy coverage/declared sections. | Treat report generation as failed and rely on focused report tests rather than emitting partially normalized runtime truth. | Schema/normalization drift must produce deterministic test failures and never leak retained header values while trying to serialize bad data. |

## Load Profile

- **Shared resources**: Report DTO assembly, JSON schema validation, HTML rendering, and deterministic sort order.
- **Per-operation cost**: Emit one runtime-semantic row per declared operation plus bounded diagnostics and summary counts; normalization work is dominated by sorting operations/diagnostics.
- **10x breakpoint**: Artifact size and sorting cost grow before serialization format changes do; determinism tests should catch ordering drift and schema regressions before performance becomes a concern.

## Negative Tests

- **Malformed inputs**: Missing runtime-semantic sections, unknown states, and schema-invalid rows must fail report validation.
- **Error paths**: Local-file, local-directory, and remote-url spec modes must render the same additive runtime truth without leaking header values.
- **Boundary conditions**: Coverage summaries, canonical operation keys, and declared-semantics sections must remain byte-stable outside the new `runtimeSemantics` surface.

## Steps

1. Extend `yanote-js/src/report/asyncReport.ts` so the async report carries additive runtime-semantic summary/operation rows/diagnostics sourced from coverage truth without collapsing them into legacy coverage or declared semantics.
2. Update `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/report/asyncNormalize.ts`, and `yanote-js/src/report/asyncReportHtml.ts` so the widened contract stays schema-valid, deterministically ordered, async-only, and redaction-safe.
3. Expand report contract, remote-spec, and determinism tests to pin `runtimeSemantics` shape, unchanged coverage summaries, and the absence of raw correlation/reply header values.

## Must-Haves

- [ ] `yanote-async-report.json` exposes runtime semantics separately from coverage and declared truth.
- [ ] `yanote-async-report.html` mirrors the same runtime states/counts while staying async-only and self-contained.
- [ ] The async report schema keeps `additionalProperties: false` discipline on the widened contract.

## Verification

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- Report assertions prove schema-valid `runtimeSemantics`, deterministic ordering, unchanged legacy coverage summaries, and no retained header-value leakage in JSON/HTML artifacts.

## Observability Impact

- Signals added/changed: `yanote-async-report.json` and `yanote-async-report.html` gain additive runtime semantic summary/operation/diagnostic sections.
- How a future agent inspects this: open the written async report artifacts or rerun `yanote-js/src/report/asyncReport*.test.ts` and `yanote-js/src/report/writeAsyncReport.determinism.test.ts`.
- Failure state exposed: schema drift, HTML drift, or leakage of retained correlation/reply values fails focused report contract tests with exact field names.

## Inputs

- `yanote-js/src/coverage/asyncCoverage.ts` — additive runtime-truth data produced by T02.
- `yanote-js/src/gates/asyncEvaluator.ts` — typed runtime semantic failures from T03 that the report summary must remain consistent with.
- `yanote-js/src/report/asyncReport.ts` — canonical async report builder to widen additively.
- `yanote-js/src/report/asyncSchema.ts` — strict async JSON schema contract.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering/rounding surface for async artifacts.
- `yanote-js/src/report/asyncReportHtml.ts` — async-only HTML renderer that must stay aligned with the JSON contract.
- `yanote-js/src/report/asyncReport.test.ts` — behavior assertions for the canonical async report DTO.
- `yanote-js/src/report/asyncReport.contract.test.ts` — schema/HTML contract guard for the async report surface.

## Expected Output

- `yanote-js/src/report/asyncReport.ts` — widened async report builder with additive `runtimeSemantics` data.
- `yanote-js/src/report/asyncSchema.ts` — strict schema contract updated for the new runtime semantics section.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering for the widened async report shape.
- `yanote-js/src/report/asyncReportHtml.ts` — HTML renderer updated to show runtime semantics without HTTP leakage or retained header values.
- `yanote-js/src/report/asyncReport.test.ts` — report-level assertions covering runtime semantic summary and diagnostics.
- `yanote-js/src/report/asyncReport.contract.test.ts` — schema/HTML contract assertions for the widened async artifact.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — remote/local spec coverage proving the widened report stays deterministic across supported spec-source modes.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — writer determinism coverage for JSON/HTML bytes with the additive runtime semantics section.
