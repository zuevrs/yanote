---
estimated_steps: 4
estimated_files: 6
---

# T01: Retain schema-depth AsyncAPI contract metadata and parity fixtures

**Slice:** S02 — AsyncAPI Schema Validation And Drift Semantics
**Milestone:** M007

## Description

Load the `asyncapi-design` and `vitest` skills, then extend the AsyncAPI normalization seam so schema-depth metadata needed by S02 is retained beside the existing canonical Kafka routing key. This task must keep `kafka <action> <channel>` unchanged while adding stable payload-schema/reference identifiers and explicit header-validation capability metadata that later analyzer code can consume truthfully.

## Steps

1. Extend `yanote-js/src/model/operationKey.ts` so `KafkaMessageContract` can carry the schema-depth metadata S02 needs without folding it into routing identity.
2. Update `yanote-js/src/spec/asyncapi.ts` to retain parser-resolved payload schema/reference identifiers plus explicit header-validation capability metadata when building message contracts.
3. Add a v2/v3 AsyncAPI fixture pair with required payload structure and message headers in `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` and `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml`.
4. Expand `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts` to pin the retained schema-depth metadata and unchanged routing-key parity.

## Must-Haves

- [ ] Schema-depth metadata is retained on `KafkaMessageContract` without changing canonical `kafka <action> <channel>` operation keys.
- [ ] The new v2/v3 fixtures prove identical routing identity plus equivalent retained schema/header metadata across AsyncAPI versions.

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- `test -f yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml && test -f yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml`

## Inputs

- `yanote-js/src/model/operationKey.ts` — current `KafkaMessageContract` shape that only retains payload schema/content type/schema format.
- `yanote-js/src/spec/asyncapi.ts` — existing AsyncAPI normalization seam that builds Kafka message contracts from parser output.
- `yanote-js/src/spec/asyncapi.test.ts` — current spec contract coverage to extend with schema-depth assertions.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — existing v2/v3 parity guard that must stay green after metadata expansion.
- `yanote-js/test/fixtures/asyncapi/v2.yaml` — current v2 fixture pattern to mirror for schema-depth cases.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` — current v3 fixture pattern to mirror for schema-depth cases.

## Expected Output

- `yanote-js/src/model/operationKey.ts` — updated `KafkaMessageContract` metadata shape for schema-depth analysis.
- `yanote-js/src/spec/asyncapi.ts` — retained schema/reference/header-validation capability metadata beside canonical Kafka keys.
- `yanote-js/src/spec/asyncapi.test.ts` — spec assertions for retained schema-depth metadata.
- `yanote-js/src/spec/asyncapi.parity.test.ts` — parity assertions proving v2/v3 equivalence for schema-depth fixtures.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml` — deterministic AsyncAPI v2 schema-depth fixture.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — deterministic AsyncAPI v3 schema-depth fixture.

## Observability Impact

- Signals changed: normalized `KafkaMessageContract` entries now retain stable payload schema/reference identifiers plus explicit header-validation capability metadata beside the canonical Kafka routing key.
- Inspection surfaces: inspect `operationContractsByKey` via `loadAsyncApiSemanticsBundle()` and the pinned expectations in `yanote-js/src/spec/asyncapi.test.ts` and `yanote-js/src/spec/asyncapi.parity.test.ts`.
- Failure visibility: future schema-conformance code can distinguish routing matches from missing schema ids, unsupported schema/content metadata, and header-unverifiable contracts without reading payload bodies or reopening operation-key serialization.
