---
estimated_steps: 4
estimated_files: 8
skills_used:
  - debug-like-expert
  - vitest
---

# T01: Add the combined report schema, normalized DTO, and HTML writer

**Slice:** S03 — Combined HTTP+async report/gate from canonical subreports
**Milestone:** M015

## Description

Create the canonical combined-report DTO, schema, normalization, HTML rendering, and deterministic writer so the new surface can summarize child HTTP and async truth without duplicating or flattening their internal denominators.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Canonical HTTP/async child DTO extracts | Reject invalid or mixed-shape child data before serialization; no best-effort coercion | N/A | Escape unexpected strings and fail schema validation before write |
| Combined JSON/HTML serialization | Throw deterministic validation or write errors instead of emitting partial artifacts | N/A | Identify the offending child section before writing `yanote-combined-report.json` |

## Load Profile

- **Shared resources**: two nested child summary objects, one combined HTML document, and deterministic JSON serialization.
- **Per-operation cost**: pure formatting over already-built child report summaries; no spec or event re-analysis.
- **10x breakpoint**: HTML/detail size grows with copied issue excerpts or child path metadata before CPU becomes meaningful.

## Negative Tests

- **Malformed inputs**: missing child status, summary, or provenance fields; unknown child states; or absent child report path references.
- **Error paths**: schema validation failure, duplicated/blended coverage summary fields, or unescaped child provenance text in HTML.
- **Boundary conditions**: green HTTP + green AMQP child pair, partial HTTP + green async pair, and async AMQP child summaries with zero Kafka binding rows plus zero runtime semantics.

## Steps

1. Define `CombinedYanoteReport` around child-attributed overview/provenance/summary sections, explicit child report path references, and no synthesized blended coverage percentage.
2. Add schema and normalize helpers that validate both child extracts, round numeric fields deterministically, sort child issue and path lists, and fail if unknown child states appear.
3. Render `yanote-combined-report.html` from the combined DTO using the existing HTML document helpers, keeping HTTP and async sections visually separate and preserving drill-down references to child artifacts.
4. Add report-layer tests that build combined reports from canonical HTTP and async fixtures, assert explicit child attribution/path preservation/AMQP protocol visibility, and prove deterministic JSON and HTML writes.

## Must-Haves

- [ ] `yanote-combined-report.json` and `.html` expose overall status, per-child status/provenance/path references, and key HTTP-vs-async summary metrics without duplicating full child report bodies or inventing a blended denominator.
- [ ] AMQP additive async facts (`protocols`, declared semantics, zero Kafka binding/runtime-semantics sections when applicable) stay explicit inside the combined child summary instead of being collapsed into HTTP wording.

## Verification

- `npm -C yanote-js test -- src/report/combinedReport.test.ts src/report/combinedReport.contract.test.ts src/report/writeCombinedReport.determinism.test.ts`
- Expect the combined artifact contract to stay deterministic, schema-valid, and explicitly attributed to separate HTTP and async child reports.

## Inputs

- `yanote-js/src/report/report.ts` — canonical HTTP child report surface to summarize without flattening.
- `yanote-js/src/report/asyncReport.ts` — canonical async child report surface to summarize with explicit protocol attribution.
- `yanote-js/src/report/reportHtml.ts` — existing HTML rendering patterns to mirror for the combined surface.
- `yanote-js/src/report/asyncReportHtml.ts` — async-specific HTML section patterns and wording to preserve.
- `yanote-js/src/report/schema.ts` — HTTP child schema validator reused for canonical input expectations.
- `yanote-js/src/report/asyncSchema.ts` — async child schema validator reused for canonical input expectations.
- `yanote-js/src/report/writeReport.ts` — deterministic HTTP write contract to mirror.
- `yanote-js/src/report/writeAsyncReport.ts` — deterministic async write contract to mirror.

## Expected Output

- `yanote-js/src/report/combinedReport.ts` — combined DTO and builder over child summary extracts.
- `yanote-js/src/report/combinedSchema.ts` — schema validator for the combined artifact.
- `yanote-js/src/report/combinedNormalize.ts` — deterministic ordering and numeric normalization for combined reports.
- `yanote-js/src/report/combinedReportHtml.ts` — HTML renderer that keeps HTTP and async sections distinct.
- `yanote-js/src/report/writeCombinedReport.ts` — deterministic combined JSON/HTML writer.
- `yanote-js/src/report/combinedReport.test.ts` — builder behavior coverage for child attribution and status derivation.
- `yanote-js/src/report/combinedReport.contract.test.ts` — contract coverage for canonical shape, AMQP attribution, and HTML expectations.
- `yanote-js/src/report/writeCombinedReport.determinism.test.ts` — deterministic writer coverage for stable combined artifacts.
