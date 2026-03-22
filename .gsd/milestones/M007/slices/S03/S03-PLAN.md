# S03: Async Report And Gate Schema Truth

**Goal:** Surface the internal routing-first async schema conformance truth through Yanote’s public async coverage/report/gate/CLI/CI boundaries, keeping routing coverage percentages unchanged while making schema-, header-, and schema-material failures first-class diagnostics.
**Demo:** Running `async-report` on the schema-depth fixtures produces a written `yanote-async-report.json` with typed redacted async diagnostics and deterministic counts, `YANOTE_ASYNC_*` stderr/stdout surfaces fail closed with typed `ASYNC_SEMANTIC_*` codes, and the CI summary/live-proof readers still pass on current zero-diagnostic Kafka happy paths.

## Must-Haves

- Public async coverage/report artifacts expose redacted schema-depth diagnostics (`invalid-payload`, `missing-payload`, `unsupported-content-type`, `unsupported-schema-format`, `unverifiable-headers`) separately from routing `unmatched` / `mismatched` drift while preserving routing-first channel/operation/message coverage percentages, directly advancing R049 and R065.
- Async gate and CLI surfaces fail closed on public schema-depth diagnostics with deterministic typed `ASYNC_SEMANTIC_*` errors, summary issues, and machine-readable `YANOTE_ASYNC_*` output that stay distinct from routing drift and never leak payload bodies, directly advancing R049 and R065.
- Downstream async artifact readers and live-proof verifiers understand the widened async diagnostic/count contract so current happy-path Kafka proofs still stay green while future schema-depth failures remain inspectable.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`
- `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: typed async schema/routing diagnostics in `yanote-async-report.json`, typed `YANOTE_ASYNC_ERROR*` lines, and one final `YANOTE_ASYNC_SUMMARY` line carrying primary failure and class counts.
- Inspection surfaces: `yanote-js/src/report/asyncReport*.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.async-report*.test.ts`, `scripts/ci/render-yanote-summary.test.mjs`, and the two live-proof shell verifiers.
- Failure visibility: diagnostic kind, semantic code, operation key, schema id, JSON pointer/reason, primary/secondary ordering, and report path stay inspectable on failures.
- Redaction constraints: never serialize or print observed payload bodies or raw Kafka headers; keep public async failures limited to routing identity, schema ids, pointers, and redacted reason text.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/cli.ts`, `scripts/ci/render-yanote-summary.mjs`, and the current live-proof shell verifiers.
- New wiring introduced in this slice: public async schema-depth diagnostic/count plumbing from analyzer -> async report schema/normalizer -> gate/CLI -> CI summary renderer/verifiers.
- What remains before the milestone is truly usable end-to-end: S04 must exercise the stronger schema-depth contract intentionally on the live Spring Kafka proof path and refresh public docs/support wording to match the runtime truth.

## Tasks

- [x] **T01: Widen async coverage and report artifacts for schema diagnostics** `est:1h15m`
  - Why: The S02 schema-depth seam already knows the truth, but the public async artifact contract still discards it; until the report schema widens, R049 and R065 cannot advance on user-facing surfaces.
  - Files: `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/report/asyncNormalize.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`
  - Do: Load the `vitest` and `asyncapi-design` skills, widen the public async diagnostic/count contract around `computeAsyncSchemaConformance()` so routing coverage stays routing-first while report diagnostics include redacted schema-depth kinds and deterministic ordering, update the async JSON schema/status/normalization logic for the widened separate report surface, and rewrite coverage/report tests around the schema-invalid, missing-payload, unsupported-schema/content, and header-unverifiable fixtures without leaking payload bodies.
  - Verify: `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts`
  - Done when: schema-depth fixtures make `yanote-async-report.json` go `partial` with typed redacted async diagnostics/counts while channel/operation/message percentages remain routing-first and zero-diagnostic happy-path fixtures still serialize deterministically.
- [x] **T02: Fail async gates and CLI summaries on typed schema truth** `est:1h`
  - Why: Once schema diagnostics are public, the gate and CLI surfaces must stop hiding them and must fail closed with typed semantic errors instead of reporting a false-green async summary.
  - Files: `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`
  - Do: Load the `vitest` skill, map each public async routing/schema diagnostic kind to a stable typed `ASYNC_SEMANTIC_*` failure path with deterministic ordering, apply D004 so `unverifiable-headers` fails closed as a typed semantic capability gap, update `collectAsyncIssues()` / summary output / stderr formatting so Top Issues and `YANOTE_ASYNC_*` machine lines surface the same redacted primary failure, and extend the gate/CLI contract suites across invalid-payload, missing-payload, unsupported-schema/content, and header-unverifiable fixtures.
  - Verify: `npm -C yanote-js test -- src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
  - Done when: schema-depth async failures exit with typed semantic codes, stdout/stderr agree on the primary failure, and zero-diagnostic local flows still behave like the current happy path.
- [x] **T03: Align CI summary readers and live proof verifiers with the widened async contract** `est:50m`
  - Why: `render-yanote-summary.mjs` and the live Kafka proof scripts still hard-code the old two-kind async report shape; leaving them untouched would break artifact consumers even when implementation work is correct.
  - Files: `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Do: Load the `bash-scripting` skill, teach the CI summary renderer to classify the widened async diagnostics/counts and `YANOTE_ASYNC_*` fallback output explicitly, update the summary test to pin the new severity/ordering without payload leaks, and revise both live-proof shell verifiers so they assert the full widened zero-diagnostic async counts contract instead of hard-coding only `{ unmatched, mismatched }`.
  - Verify: `node --test scripts/ci/render-yanote-summary.test.mjs && bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: the CI summary and both live-proof verifiers pass against the widened async artifact contract, still show zero diagnostics on current happy paths, and preserve actionable retained-failure breadcrumbs.

## Files Likely Touched

- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
