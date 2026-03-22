# M007/S02 — Research

**Date:** 2026-03-20

## Summary

This slice primarily owns **R065** and supports **R049**. The codebase is already set up for truthful payload validation work: S01 added `AsyncEvent.payload`, kept `KafkaMessageContract.payloadSchema` beside the canonical `kafka <action> <channel>` key, and proved that `@asyncapi/parser` resolves payload schema objects into `document.json()` with stable parser metadata such as `x-parser-schema-id`. The missing piece is entirely in the Node analyzer path: `computeAsyncCoverage()` still only distinguishes routing drift (`unmatched`) from message-name drift (`mismatched`), and every async consumer downstream of that type hard-codes those two diagnostic kinds.

The safest S02 shape is **not** to widen the current report/gate contract in place. `async-report`, `asyncSchema`, `asyncNormalize`, `asyncEvaluator`, and the CLI all currently import `AsyncCoverageDiagnostic` directly and assume only `unmatched`/`mismatched`. If S02 mutates that public shape immediately, it effectively pulls S03 forward. A better seam is to add a new internal async conformance layer (in `asyncCoverage.ts` or a sibling module) that computes routing first, then schema validation second, and keeps routing drift separate from schema/reference drift. `computeAsyncCoverage()` can stay backward-compatible or be derived from that richer result until S03 serializes the stronger truth.

The loaded AsyncAPI and JSON Schema skills reinforce the same approach: use the parser-resolved AsyncAPI document instead of hand-rolling reference resolution, and use a real JSON Schema validator instead of custom payload walkers. The Vitest skill also matches the existing repo pattern: add deterministic parity fixtures and assert exact diagnostic ordering rather than broad "contains" checks.

## Recommendation

Implement S02 as a **bounded analyzer-only layer** with three explicit rules:

1. **Match routing before validating schema.** Only attempt schema work after `action + channel` matched a canonical Kafka operation and the observed message name still aligns with the expected message contract. Unmatched/action drift and message-name drift should remain routing diagnostics, not schema diagnostics.
2. **Validate payloads with Ajv against parser-resolved schema objects.** Reuse retained `payloadSchema`, `contentType`, and `schemaFormat` from `KafkaMessageContract`, but strip or whitelist parser-added extensions like `x-parser-schema-id` before compiling because Ajv strict schema mode rejects unknown keywords.
3. **Keep header-value validation out of this slice unless the boundary is reopened intentionally.** The current event model has no generic observed Kafka headers — only `message`, `test.run_id`, and `test.suite` survive. That means true runtime header conformance is not available on the current S01 boundary. If S02 wants header semantics at all, it should be metadata-only/deferred, not claimed as live validation.

Concretely, the planner should prefer a new internal result such as `AsyncConformanceResult` / `AsyncSchemaDiagnostic[]` and leave the existing report/gate schema untouched until S03. That preserves the milestone boundary promised in the roadmap: S02 settles analyzer semantics and parity; S03 exposes them through CLI/report/gate truth.

## Implementation Landscape

### Key Files

- `yanote-js/src/coverage/asyncCoverage.ts` — current async analyzer seam. It builds channel/operation/message coverage, matches operations by `action + channel`, and emits only `unmatched` / `mismatched` diagnostics. This is the natural place to add a richer internal conformance pass or to host a sibling export that leaves `computeAsyncCoverage()` backward-compatible.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI normalization seam. It already retains `payloadSchema`, `contentType`, and `schemaFormat` on `KafkaMessageContract` via `buildMessageContract()`. It does **not** retain header schema metadata yet. If S02 needs schema/reference identifiers or deferred header metadata, this is the file to extend.
- `yanote-js/src/model/operationKey.ts` — owns `KafkaMessageContract`. Any new schema-reference identity (`schemaId`), optional `headersSchema`, or explicit validation-capability metadata belongs here because downstream analyzer/report code reads contracts from this type.
- `yanote-js/src/model/asyncEvent.ts` — defines the observable async boundary. It includes `payload?: JsonValue` but no generic `headers` field. This is the hard limit that blocks truthful runtime header validation in S02 unless the event contract is widened again.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — JSONL reader for async evidence. It preserves `payload` via `normalizeJsonValue()` and ignores everything else not already modeled. If S02 keeps header work out of scope, this file likely stays unchanged.
- `yanote-js/src/report/asyncReport.ts` — currently copies `AsyncCoverageDiagnostic[]` into the public async report and counts only `unmatched` / `mismatched`. Touching this file means pulling S03 work forward.
- `yanote-js/src/report/asyncSchema.ts` — JSON Schema for `yanote-async-report.json`. It hard-codes `diagnostics.counts.{unmatched,mismatched}` and `items.kind ∈ {unmatched,mismatched}`. Same boundary warning as above.
- `yanote-js/src/report/asyncNormalize.ts` — normalizes/sorts async diagnostics with a two-kind ranking (`mismatched` before `unmatched`). Any direct widening of `AsyncCoverageDiagnostic` ripples here.
- `yanote-js/src/gates/asyncEvaluator.ts` — maps only `mismatched` and `unmatched` into semantic failures. If S02 keeps schema diagnostics internal, this file can remain S03 work.
- `yanote-js/src/cli.ts` — `async-report` currently calls `computeAsyncCoverage()`, feeds the result straight into gates and report generation, and prints summary/failure output. This is downstream of the seam decision.
- `yanote-js/src/coverage/asyncCoverage.test.ts` — current routing/non-regression coverage contract. Good place to keep existing routing truths stable while adding separate schema-depth assertions.
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts` — pins deterministic ordering and known-channel action drift. Extend or mirror it for schema-diagnostic determinism.
- `yanote-js/src/coverage/asyncCoverage.parity.test.ts` — v2/v3 parity guard. This should gain schema-valid and schema-invalid parity cases once S02 lands.
- `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` — existing proof that payload schema metadata survives normalization and that `x-parser-schema-id` is stable enough to use as schema-reference identity.
- `yanote-js/test/fixtures/async-events/payload-bearing.fixture.jsonl` — existing payload-bearing evidence corpus from S01. Reuse it for reader-level non-regression, but add dedicated schema-depth fixtures for valid payload, invalid payload, and missing/omitted payload behavior.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` and `yanote-js/test/fixtures/asyncapi/v3.yaml` — current parity fixtures. They are too shallow for schema-depth semantics; S02 likely needs a new v2/v3 fixture pair with required fields / nested structure / maybe schema-format coverage.

### Build Order

1. **Lock the analyzer seam first.** Decide whether S02 adds a sibling result (recommended) or widens `AsyncCoverageResult` directly. This choice determines whether report/gate/CLI files stay untouched.
2. **Implement routing-first conformance logic.** Keep the current order: route by `action + channel`, then check message name, then run schema validation only for events that are routing-aligned. This prevents one event from emitting both routing and schema drift for the same root cause.
3. **Add schema validation with Ajv.** Compile parser-resolved payload schemas after sanitizing parser-only extensions such as `x-parser-schema-id`. Keep the schema/reference identity available for diagnostics, but do not feed raw parser extensions into strict Ajv.
4. **Decide header handling explicitly.** Either (a) retain optional header schema metadata for later without validating it, or (b) defer headers entirely and document that the S01 event boundary cannot support truthful runtime header drift yet. Do not silently imply header validation.
5. **Add deterministic fixture/parity proof last.** Introduce dedicated schema-valid / schema-invalid / payload-missing JSONL fixtures and a v2/v3 AsyncAPI pair that normalize to the same schema semantics. Then re-run existing routing tests unchanged to prove non-regression.

### Verification Approach

Start with the analyzer/spec stack that should be authoritative for S02:

- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`

If the chosen seam leaks into current consumers, extend the verifier stack to include the current async public surfaces as non-regression guards:

- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`

Finish with:

- `git diff --check`

Observable success signals for S02:

- routing-only fixtures still emit only `unmatched` / `mismatched` drift;
- matched operations with invalid payloads emit **schema/reference diagnostics**, not routing drift;
- payload-bearing valid fixtures pass with no schema diagnostics;
- missing/omitted payloads on schema-bearing contracts do **not** count as silent conformance;
- equivalent v2/v3 fixtures produce identical schema-validation outcomes.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| AsyncAPI `$ref` and message normalization | `@asyncapi/parser` + `document.json()` via `yanote-js/src/spec/asyncapi.ts` | S01 already proved the parser resolves payload schema objects and preserves schema IDs; a second custom resolver layer would duplicate fragile work. |
| Payload schema validation | `ajv` (already a direct `yanote-js` dependency) | It is already in the repo, supports strict deterministic validation, and can produce structured path-level errors for later S03 report/gate serialization. |

## Constraints

- The current async evidence boundary captures **payload** but not generic observed Kafka headers. Only `message`, `test.run_id`, and `test.suite` survive from headers today.
- `AsyncCoverageDiagnostic` is imported directly by `asyncReport`, `asyncSchema`, `asyncNormalize`, `asyncEvaluator`, and CLI tests. Changing its union in place is a cross-slice decision.
- Ajv strict schema compilation rejects unknown keywords by default, and current retained schemas include parser-added `x-parser-schema-id` markers.
- `schemaFormat` and `contentType` are retained, but the current `yanote-js` analyzer has no extra non-JSON schema parser wiring. Unsupported formats need explicit semantics, not silent pass-through.

## Common Pitfalls

- **Compiling raw parser schemas into strict Ajv** — `x-parser-schema-id` will trip strict-schema validation unless it is stripped or explicitly allowed.
- **Treating missing payload as success** — recorder omissions and empty payload observations must surface as explicit non-conformance / observation-gap diagnostics when a contract expects a schema-bearing payload.
- **Running schema validation before routing is settled** — this causes duplicate or misleading drift (for example, action drift plus schema drift for the same event).
- **Pulling S03 into S02 accidentally** — once the existing report/gate diagnostic contract changes, `asyncReport`, `asyncSchema`, `asyncNormalize`, `asyncEvaluator`, and CLI contract tests all become mandatory same-slice work.

## Open Risks

- If the slice is interpreted as requiring **actual header-value validation now**, the current S01 boundary is insufficient and the work expands back into recorder/event-model changes.
- Some AsyncAPI message schemas may carry non-default or custom `schemaFormat` values. Ajv’s default export is draft-07-first, so S02 needs an explicit supported/unsupported rule instead of optimistic validation.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI | `asyncapi-design` | available |
| JSON Schema validation | `dkyazzentwatwa/chatgpt-skills@json-schema-validator` | installed |
| Vitest | `vitest` | available |

## Sources

- AsyncAPI Parser JS documents that resolved schema objects can include `x-parser-schema-id`, which gives S02 a stable schema-reference identity without writing a second resolver layer. (source: [AsyncAPI Parser JS README](https://github.com/asyncapi/parser-js/blob/master/README.md), [Parser migration docs](https://github.com/asyncapi/parser-js/blob/master/packages/parser/docs/migrations/v1-to-v2.md))
- Ajv strict mode documents that unknown keywords fail schema compilation unless explicitly allowed, which directly affects parser-added fields like `x-parser-schema-id`. (source: [Ajv strict mode](https://github.com/ajv-validator/ajv/blob/master/docs/strict-mode.md), [Ajv JSON Schema guide](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md))
