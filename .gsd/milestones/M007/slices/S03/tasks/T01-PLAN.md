---
estimated_steps: 4
estimated_files: 8
---

# T01: Widen async coverage and report artifacts for schema diagnostics

**Slice:** S03 — Async Report And Gate Schema Truth
**Milestone:** M007

## Description

Load the `vitest` and `asyncapi-design` skills, then turn the S02 internal schema-conformance seam into the public async artifact contract. This task must widen `AsyncCoverageDiagnostic`, async report counts/schema/status, and normalization ordering so `yanote-async-report.json` exposes redacted schema-depth truth without changing routing coverage numerators or reusing HTTP report semantics.

## Steps

1. Update `yanote-js/src/coverage/asyncCoverage.ts` to compose public routing diagnostics plus redacted schema-depth diagnostics from `computeAsyncSchemaConformance()` while keeping channel/operation/message coverage percentages routing-first.
2. Widen `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, and `yanote-js/src/report/asyncNormalize.ts` so the async artifact validates, counts, sorts, and reports status for the full public async diagnostic union.
3. Rewrite `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, and `yanote-js/src/report/asyncReport.contract.test.ts` around the schema-invalid, missing-payload, unsupported-schema/content, and header-unverifiable fixtures, keeping all diagnostics redacted.
4. Re-run `yanote-js/src/coverage/asyncCoverage.parity.test.ts` as the explicit v2/v3 parity guard for the widened public contract.

## Must-Haves

- [ ] Public async diagnostics preserve routing `unmatched` / `mismatched` drift and add separate schema-depth kinds without changing routing-first coverage numerators.
- [ ] `yanote-async-report.json` serializes stable redacted typed diagnostics/counts/status and remains a distinct async report schema rather than an HTTP report variant.

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`
- `test -f yanote-js/src/report/asyncSchema.ts && test -f yanote-js/src/report/asyncNormalize.ts`

## Observability Impact

- Signals added/changed: `AsyncCoverageDiagnostic` and `yanote-async-report.json` now carry typed schema/routing diagnostics plus per-kind counts and status that reflect schema-depth truth.
- How a future agent inspects this: run the Vitest verifier above and inspect serialized report snapshots/contract assertions in `yanote-js/src/report/asyncReport*.test.ts`.
- Failure state exposed: diagnostic kind, operation key, schema id, JSON pointer, and redacted reason become visible on public async artifact failures without exposing payload bodies.

## Inputs

- `yanote-js/src/coverage/asyncSchemaConformance.ts` — authoritative internal schema-depth diagnostics from S02.
- `yanote-js/src/coverage/asyncCoverage.ts` — current public async coverage contract that still drops schema-depth truth.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — deterministic public diagnostic expectations that must be widened intentionally.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — current public parity guard for v2/v3 behavior.
- `yanote-js/src/report/asyncReport.ts` — current async report builder that only counts `unmatched` / `mismatched`.
- `yanote-js/src/report/asyncSchema.ts` — current async JSON schema that hard-codes the old two-kind diagnostics contract.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic async report ordering/count copy logic that must stay stable after widening.
- `yanote-js/src/report/asyncReport.contract.test.ts` — current contract test proving the separate async artifact schema.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` — v2 schema-depth parity fixture.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — v3 schema-depth parity fixture.
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl` — invalid payload fixture that should become a public async diagnostic.
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl` — missing-payload observation-gap fixture that should become a public async diagnostic.
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl` — unsupported schema/content fixture that should become a public async diagnostic.

## Expected Output

- `yanote-js/src/coverage/asyncCoverage.ts` — widened public async diagnostic/count contract composed from the internal schema seam.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — public async coverage assertions for routing-first coverage with schema diagnostics exposed.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — deterministic ordering assertions for widened public async diagnostics.
- `yanote-js/src/report/asyncReport.ts` — async report builder updated for typed schema/routing diagnostics and status.
- `yanote-js/src/report/asyncSchema.ts` — async JSON schema widened for the new diagnostic/count surface.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic sort/count normalization for the widened async artifact.
- `yanote-js/src/report/asyncReport.test.ts` — report behavior assertions for public schema-depth diagnostics.
- `yanote-js/src/report/asyncReport.contract.test.ts` — contract tests pinning the widened `yanote-async-report.json` shape.
