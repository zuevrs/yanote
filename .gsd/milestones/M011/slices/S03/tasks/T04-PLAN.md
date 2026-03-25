---
estimated_steps: 3
estimated_files: 4
skills_used:
  - vitest
---

# T04: Expose format and media truth through CLI summaries

**Slice:** S03 — Format Policy And Media Specificity Truth
**Milestone:** M011

## Description

Publish S03 through the CLI path teams already use. This task ensures the new payload semantics appear on stdout/stderr and `YANOTE_SUMMARY` without duplicated raw-diagnostic noise.

## Steps

1. Update `yanote-js/src/cli.ts` as needed so invalid supported formats, unsupported formats, and specificity-driven outcomes participate correctly in primary-failure selection, Top Issues dedupe, and secret-safe summary text.
2. Expand CLI contract tests to cover valid-format, invalid-format, unsupported-format, and media-specificity scenarios using the shared S03 fixtures.
3. Keep machine-summary compatibility by reusing existing payload/request count tokens unless a genuinely new token is required by the richer semantics.

## Must-Haves

- [ ] CLI stderr exposes `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` for unsupported declared formats.
- [ ] Top Issues shows the new payload semantic failures without duplicating the underlying raw payload diagnostic lines.
- [ ] `YANOTE_SUMMARY` remains backward-compatible while reflecting the richer payload diagnostic counts.

## Verification

- CLI Vitest suites prove primary failure selection, Top Issues dedupe, and machine-summary compatibility for S03 scenarios.
- `npm -C yanote-js test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`

## Observability Impact

- Signals added/changed: CLI stdout/stderr and `YANOTE_SUMMARY` now distinguish unsupported-schema-format failures from generic unsupported schema/media failures.
- How a future agent inspects this: run the focused CLI Vitest files and compare stderr primary codes with the generated report JSON for the same fixture.
- Failure state exposed: primary semantic code, Top Issues text, and machine-summary counts identify whether the CLI is lagging the analyzer/report contract.

## Inputs

- `yanote-js/src/cli.ts` — current CLI summary and failure-selection logic.
- `yanote-js/src/gates/httpPayloadSemantics.ts` — payload semantic classifier updated by T03.
- `yanote-js/src/report/report.ts` — report contract surface updated by T03.
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — shared S03 OpenAPI fixture bundle.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — green supported-format evidence.
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl` — invalid email evidence.
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl` — unsupported/custom format evidence.
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` — most-specific media selection evidence.

## Expected Output

- `yanote-js/src/cli.ts` — CLI summary logic aligned with S03 payload semantics.
- `yanote-js/src/cli.report.test.ts` — CLI report regression coverage for S03 scenarios.
- `yanote-js/src/cli.summary.contract.test.ts` — Top Issues and human-summary coverage for S03 payload semantics.
- `yanote-js/src/cli.failclosed.contract.test.ts` — fail-closed CLI contract coverage for the new primary semantic code.
