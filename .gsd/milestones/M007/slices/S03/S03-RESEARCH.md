# M007/S03: Async Report And Gate Schema Truth — Research

## Summary

S03 is a targeted follow-through on S02, not a new validation engine. The authoritative schema-depth logic already exists in `yanote-js/src/coverage/asyncSchemaConformance.ts`: it routes first, validates payloads with Ajv, keeps schema ids/pointers/reasons redacted, and separates `matchedOperationKeys` from `validatedOperationKeys`. The current public async path simply discards that truth. `computeAsyncCoverage()` only preserves routing drift (`unmatched` / `mismatched`), `buildAsyncReport()` only serializes those two kinds, and `evaluateAsyncGateFailures()` only turns those two kinds into fail-closed semantic errors.

The biggest downstream surprise is how many consumers hard-code the old two-kind public contract. `asyncSchema.ts`, `asyncNormalize.ts`, `asyncReport.contract.test.ts`, `cli.async-report*.test.ts`, `scripts/ci/render-yanote-summary.mjs`, and both live-proof shell verifiers all assume `diagnostics.counts === { unmatched, mismatched }` and/or `kind in ["unmatched", "mismatched"]`. Widening the public report schema without updating those readers will break even happy-path proof flows.

Another important gap is the human-facing CLI summary. `collectAsyncIssues()` does not render async report diagnostics at all; it only shows uncovered channels/operations/messages plus emitted error failures. That means S03 must update both the machine/report surfaces and the human summary surface, or `yanote-async-report.json` will grow schema truth that stdout still hides.

## Recommendation

Reuse `computeAsyncSchemaConformance()` as the single source of schema-depth truth and widen the public async diagnostic model around it. The least risky path is to keep routing coverage numerators routing-first — channels/operations/messages stay covered when routing/message identity matched — and expose schema drift as a separate first-class diagnostic/gate layer instead of silently redefining coverage percentages. That matches the S02 boundary, preserves canonical `kafka <action> <channel>` identity, and keeps v2/v3 parity anchored on the existing fixture corpus.

Build in three passes. First, settle the public diagnostic/report contract: diagnostic union, count keys, deterministic ordering, and report status behavior. Second, map those public diagnostics to typed async semantic failures in `asyncEvaluator.ts` and `cli.ts` so `YANOTE_ASYNC_ERROR*` and `YANOTE_ASYNC_SUMMARY` become truthful and fail-closed. Third, update downstream consumers (`render-yanote-summary.mjs`, shell verifiers, report normalizers) so artifact readers stay in sync with the widened contract.

The only design call that still needs explicit handling is `unverifiable-headers`. The internal seam already reports it, but the public event boundary still cannot observe generic Kafka headers truthfully. If S03 turns that kind into a hard public error, any header-bearing AsyncAPI fixture will fail by capability boundary rather than by observed drift. Decide that policy before widening the schema/report enums, because it affects report counts, gate behavior, CLI wording, and proof-script expectations.

## Implementation Landscape

### Key Files

- `yanote-js/src/coverage/asyncSchemaConformance.ts` — authoritative internal schema-depth seam; already emits ordered redacted diagnostics for `missing-payload`, `invalid-payload`, `unsupported-content-type`, `unsupported-schema-format`, and `unverifiable-headers`.
- `yanote-js/src/coverage/asyncCoverage.ts` — current public async seam; uses `matchedOperationKeys` for operation coverage but drops internal schema diagnostics and only exposes routing `unmatched | mismatched`.
- `yanote-js/src/report/asyncReport.ts` — builds `AsyncYanoteReport`; counts/status logic currently knows only two diagnostic kinds.
- `yanote-js/src/report/asyncSchema.ts` — public async JSON schema; hard-codes `counts: { unmatched, mismatched }` and `items[].kind: ["unmatched", "mismatched"]`.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic serializer/normalizer; count copying and diagnostic sort order assume the two-kind contract.
- `yanote-js/src/report/writeAsyncReport.ts` — stable write boundary; no logic change likely, but it will immediately enforce any schema widening.
- `yanote-js/src/gates/asyncEvaluator.ts` — fail-closed async gate seam; currently converts only routing diagnostics into `ASYNC_SEMANTIC_MESSAGE_MISMATCH` / `ASYNC_SEMANTIC_UNMATCHED_EVIDENCE` and otherwise falls through to threshold/regression gates.
- `yanote-js/src/cli.ts` — `executeAsyncReportCommand()`, `formatAsyncSummaryOutput()`, `collectAsyncIssues()`, and stderr failure formatting control the user-visible `YANOTE_ASYNC_*` surface.
- `scripts/ci/render-yanote-summary.mjs` — CI artifact reader; currently assumes `mismatched => high`, everything else medium, and reads the old async report contract.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — happy-path verifier with exact zero-count assertion `{"unmatched": 0, "mismatched": 0}`.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — same exact zero-count assertion on the two-service proof artifact; any counts-shape change must be mirrored here.

### Test / Fixture Surfaces

- `yanote-js/src/coverage/asyncCoverage.test.ts` — currently pins that schema-invalid and missing-payload fixtures still look publicly covered; this is the best place to widen the public contract deliberately.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — currently proves public diagnostics stay limited to `unmatched | mismatched`; this becomes the main regression suite for the new public diagnostic union and ordering.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — protects v2/v3 parity for the public async surface.
- `yanote-js/src/report/asyncReport.test.ts` — currently asserts schema-invalid fixtures still produce `status: "ok"` with empty diagnostics; this is the clearest report-contract delta for S03.
- `yanote-js/src/report/asyncReport.contract.test.ts` — hard-codes schemaVersion/phase and the current async diagnostics schema; update here first when widening the artifact contract.
- `yanote-js/src/gates/asyncEvaluator.test.ts` — currently asserts schema-depth failures stay out of public gate semantics; rewrite this around the final `ASYNC_SEMANTIC_*` schema codes.
- `yanote-js/src/cli.async-report.test.ts` — covers artifact writing, exit codes, stderr ordering, and the current schema-invalid happy path.
- `yanote-js/src/cli.async-report.contract.test.ts` — covers section order, one final machine-summary line, and deterministic primary/secondary stderr lines.
- `scripts/ci/render-yanote-summary.test.mjs` — protects the async artifact consumer; update once report/CLI codes are final.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml`
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml`
- `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl`

### Natural Seams

1. **Public diagnostic model + report artifact**
   - Likely files: `asyncCoverage.ts`, `asyncReport.ts`, `asyncSchema.ts`, `asyncNormalize.ts`
   - Goal: compose schema diagnostics into the public async result/report while preserving routing-first coverage percentages and deterministic ordering.

2. **Gate / CLI fail-closed semantics**
   - Likely files: `asyncEvaluator.ts`, `cli.ts`
   - Goal: introduce stable `ASYNC_SEMANTIC_*` codes, reasons, hints, and primary/secondary ordering for schema-depth failures.

3. **Downstream artifact readers / proof helpers**
   - Likely files: `render-yanote-summary.mjs`, `render-yanote-summary.test.mjs`, `verify-m004-s02-metadata-propagation.sh`, `verify-m004-s03-live-kafka-proof.sh`
   - Goal: keep readers/verifiers aligned with the widened `yanote-async-report.json` contract, especially zero-count happy paths.

### Build Order

1. **Define the public async diagnostic contract first.**
   Update `asyncCoverage.ts` / `asyncReport.ts` / `asyncSchema.ts` / `asyncNormalize.ts` together, because every later surface reads that shape. Reuse the schema-invalid and schema-missing-payload fixtures so the new public behavior is explicit instead of inferred.

2. **Wire gate semantics second.**
   Once the report-level kinds/counts/order are stable, map them in `asyncEvaluator.ts` and `cli.ts` to deterministic `ASYNC_SEMANTIC_*` failures. This is the point where `YANOTE_ASYNC_ERROR*` and the machine-summary `primary=` field become truthful.

3. **Update artifact consumers last.**
   After report schema and stderr codes are stable, patch `render-yanote-summary.mjs` and the shell verifiers that compare exact counts. Doing this earlier risks locking tests to transient code names/order.

### Verification Approach

Current baseline checks were green before planning:

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`

After S03 implementation, rerun at minimum:

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`

If the report counts schema or async artifact expectations change in-slice, also rerun the shell verifiers whose happy-path assertions currently hard-code the old counts object:

- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Constraints

- Preserve canonical routing identity. `serializeOperationKey()` remains routing-only; S03 should not widen `kafka <action> <channel>` keys to encode schema ids.
- Keep routing coverage and schema conformance distinct. `computeAsyncSchemaConformance()` already separates routed matches from validated payloads; public work should expose that distinction, not collapse it.
- Do not leak payload bodies. The internal conformance seam is already redacted to `schemaId`, `pointer`, `reason`, and stable message text; public report/CLI/CI surfaces should serialize only that redacted subset.
- Keep the async report separate from the HTTP report surface. `asyncReport.contract.test.ts` already proves the async artifact is not the HTTP schema with extra fields.
- Parser-resolved schema identity is `x-parser-schema-id`, not raw `$ref`. Any public schema/reference wording has to use retained schema ids rather than reconstructed references.

## Common Pitfalls

- **Updating only `asyncReport.ts`** — `asyncSchema.ts`, `asyncNormalize.ts`, shell verifiers, and the CI summary reader all assume the old counts/items shape and will fail even on zero-diagnostic happy paths.
- **Letting CLI stdout lag behind the artifact** — `collectAsyncIssues()` currently ignores async report diagnostics, so schema truth can appear in JSON while `Summary -> Top Issues` still omits it.
- **Accidentally changing coverage percentages instead of diagnostics** — the existing model already separates routed coverage from schema conformance; if S03 marks routed operations/messages uncovered for schema-invalid payloads, many tests and user-facing percentages change at once.
- **Turning `unverifiable-headers` into a hard public failure without a policy decision** — header-bearing specs will fail by current evidence-boundary limitation rather than by observed contract drift.
- **Choosing failure codes without considering sort order** — primary/secondary stderr ordering is deterministic and `sortFailuresByPrecedence()` falls back to code lexicographic order inside the same class/severity.

## Open Risks

- `unverifiable-headers` is the remaining semantics call. The code can expose it now, but current evidence cannot prove or disprove header conformance.
- If S03 wants explicit “reference-level” wording, there is no raw reference object left after normalization; the public contract can only speak in terms of retained schema ids / unsupported schema material.
- `render-yanote-summary.mjs` currently derives async diagnostic severity from `kind === "mismatched"`; once new kinds exist, that severity policy must be made explicit or CI summaries will flatten important distinctions.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI | `asyncapi-design` | available |
| Vitest | `vitest` | available |
| Ajv | none found via `npx skills find "ajv"` | none found |
