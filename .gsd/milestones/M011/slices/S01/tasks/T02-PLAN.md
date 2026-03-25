---
estimated_steps: 4
estimated_files: 8
skills_used:
  - openapi-specification-v3.2
  - json-schema-validator
  - vitest
---

# T02: Normalize request evidence and compute first scalar request conformance

**Slice:** S01 — Safe Request Evidence And First Scalar Truth
**Milestone:** M011

## Description

Teach the Node side to understand the new event shape and compute the first truthful scalar semantics from retained evidence. This closes the analyzer half of the recorder → JSONL → analyzer boundary without redefining legacy coverage numbers.

## Steps

1. Extend the TypeScript HTTP event model and JSONL reader to normalize the new request-evidence maps and derive legacy `queryKeys` / `headerKeys` from captured evidence when those arrays are missing.
2. Expand the supported OpenAPI parameter contract just far enough for S01: include `cookie` parameters plus the scalar schema/style metadata needed for single-value `path=simple`, `query=form`, `header=simple`, and `cookie=form` evaluation.
3. Add `httpRequestConformance` analysis that matches observed events to operations, reads retained path/query/header/cookie evidence, and classifies first scalar truth without guessing when evidence is redacted, omitted, multi-valued, or unsupported.
4. Pin compatibility and scalar truth in focused Vitest fixtures before report/CLI wiring begins.

## Must-Haves

- [ ] Old fixtures without request-evidence maps still load and keep the legacy coverage baseline.
- [ ] Cookie parameters and the S01 scalar schema subset are extracted explicitly instead of being silently ignored.
- [ ] First scalar truth distinguishes captured-valid, captured-invalid, redacted, omitted, and unsupported evidence paths without changing `coverage.parameters`.

## Verification

- Focused Vitest coverage proves backward-compatible ingestion plus first scalar truth for retained path/query/header/cookie evidence.
- `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts`

## Observability Impact

- Signals added/changed: normalized Node events now carry retained request evidence, and `httpRequestConformance` emits deterministic scalar-truth states and diagnostics without changing legacy coverage math.
- How a future agent inspects this: run the focused Vitest files and inspect the normalized event fixtures plus per-operation request-conformance output.
- Failure state exposed: tests surface the affected `operationKey`, parameter location/name, captured values, or redaction/omission reason when normalization or scalar evaluation drifts.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — widened HTTP event contract emitted by T01.
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java` — request-evidence model that defines captured/redacted/omitted provenance.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java` — recorder capture semantics the Node side must ingest honestly.
- `yanote-js/src/model/httpEvent.ts` — current TypeScript HTTP event surface without request-evidence maps.
- `yanote-js/src/events/readJsonl.ts` — current JSONL reader that only understands legacy key arrays.
- `yanote-js/src/spec/openapi.ts` — current OpenAPI extractor that still ignores cookies and scalar-style metadata.

## Expected Output

- `yanote-js/src/model/httpEvent.ts` — widened TypeScript HTTP event surface for retained request evidence.
- `yanote-js/src/events/readJsonl.ts` — backward-compatible JSONL normalization that derives legacy key arrays from captured evidence when needed.
- `yanote-js/src/events/readJsonl.requestEvidence.test.ts` — focused ingestion tests for old and new request-evidence shapes.
- `yanote-js/src/coverage/dimensions.ts` — parameter contract types widened just enough for S01 scalar and cookie semantics.
- `yanote-js/src/spec/openapi.ts` — cookie-aware scalar parameter extraction for the S01 supported subset.
- `yanote-js/src/spec/openapi.test.ts` — extraction assertions for cookie and first-scalar contract metadata.
- `yanote-js/src/coverage/httpRequestConformance.ts` — first request-conformance analyzer for retained scalar evidence.
- `yanote-js/src/coverage/httpRequestConformance.test.ts` — focused per-operation scalar truth coverage for captured, redacted, omitted, and unsupported paths.
