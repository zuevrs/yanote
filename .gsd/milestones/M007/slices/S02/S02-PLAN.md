# S02: AsyncAPI Schema Validation And Drift Semantics

**Goal:** Add an internal async schema-conformance layer that validates observed Kafka payloads against retained AsyncAPI message schemas after routing match, keeps schema/reference/header contract metadata separate from canonical Kafka identity, and proves deterministic v2/v3 parity without widening the public async report/gate contract yet.
**Demo:** The `yanote-js` async analyzer test stack can show routing drift versus schema-depth drift on deterministic fixtures (valid payload, invalid payload, missing payload, unsupported schema/header validation) while existing `async-report` / gate / CLI tests still pass unchanged.

## Must-Haves

- `KafkaMessageContract` and AsyncAPI semantics retain stable payload-schema/reference metadata plus truthful header-validation capability metadata without changing canonical `kafka <action> <channel>` identity, advancing R065 without reopening routing keys.
- A routing-first internal conformance pass validates only routing-aligned Kafka events with Ajv, strips parser-only keywords, and emits deterministic schema-depth diagnostics for invalid payloads, missing payload observation gaps, unsupported schema formats/content types, and header-unverifiable cases instead of collapsing them into `unmatched` / `mismatched`, directly advancing R049.
- Existing public async coverage/report/gate/CLI surfaces remain backward-compatible in S02, with regression tests proving richer schema truth stays internal until S03 exposes it publicly.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
- `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: typed internal async schema diagnostics that carry operation key, message name, schema/reference id, validation kind, and JSON pointer/reason without dumping payload bodies.
- Inspection surfaces: Vitest suites in `yanote-js/src/coverage/asyncSchemaConformance*.test.ts` plus deterministic fixtures under `yanote-js/test/fixtures/asyncapi/` and `yanote-js/test/fixtures/async-events/`.
- Failure visibility: invalid payload, missing payload, unsupported schema-format/content-type, and header-unverifiable cases fail with stable ordered diagnostics separate from routing drift.
- Redaction constraints: do not print full observed payloads or Kafka headers in stable diagnostics; keep failure output to schema ids, field paths, message names, and operation keys.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncCoverage.ts`, and the current async report/gate/CLI contracts.
- New wiring introduced in this slice: an internal schema-conformance analyzer seam plus compatibility plumbing so `computeAsyncCoverage()` can keep the current public unmatched/mismatched contract while richer schema truth is tested in parallel.
- What remains before the milestone is truly usable end-to-end: S03 must serialize and enforce schema-depth diagnostics through `async-report`, `yanote-async-report.json`, and async gate semantics; S04 must prove the stronger contract on the live Spring Kafka path and refresh public boundary docs.

## Tasks

- [x] **T01: Retain schema-depth AsyncAPI contract metadata and parity fixtures** `est:45m`
  - Why: S02 cannot classify schema/reference drift truthfully until the spec seam retains stable schema-depth metadata separate from routing identity.
  - Files: `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml`, `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml`
  - Do: Load the `asyncapi-design` and `vitest` skills, extend `KafkaMessageContract` and AsyncAPI normalization to retain stable payload-schema/reference identifiers and explicit header-validation capability metadata beside the existing canonical Kafka key, add a v2/v3 fixture pair with required payload fields and message headers, and pin exact retained metadata in spec/parity tests without changing operation-key serialization.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
  - Done when: the new fixtures normalize to the same Kafka routing keys across v2/v3 while exposing schema-depth metadata that downstream analyzer code can consume without reopening the event boundary.
- [x] **T02: Add routing-first async schema conformance diagnostics** `est:1h15m`
  - Why: This closes the core slice demo by actually validating payload evidence and separating schema-depth failures from routing drift.
  - Files: `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.parity.test.ts`, `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl`, `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl`, `yanote-js/test/fixtures/async-events/schema-missing-payload.fixture.jsonl`, `yanote-js/test/fixtures/async-events/schema-unsupported-format.fixture.jsonl`
  - Do: Load the `vitest` skill, introduce a new internal conformance result that matches routing first, validates only matched payload-bearing operations with Ajv, strips parser-added keywords like `x-parser-schema-id` before compilation, and emits deterministic diagnostics for invalid payload, missing payload observation gaps, unsupported schema formats/content types, and header-unverifiable contracts; prove exact diagnostic ordering and v2/v3 parity with the new fixture corpus.
  - Verify: `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/coverage/asyncSchemaConformance.parity.test.ts`
  - Done when: valid fixtures pass cleanly, invalid/missing/unsupported cases fail with stable schema-depth diagnostics, and equivalent v2/v3 fixtures produce identical conformance snapshots.
- [x] **T03: Preserve public async coverage/report/gate compatibility while schema semantics stay internal** `est:50m`
  - Why: S02 must not accidentally pull S03 forward or break the current `async-report` / gate contract while landing the richer analyzer seam.
  - Files: `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/coverage/asyncCoverage.parity.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`
  - Do: Load the `vitest` skill, compose `computeAsyncCoverage()` from the new internal conformance layer so routing coverage remains truthful and backward-compatible, explicitly prevent schema-depth diagnostics from leaking into public report/gate types in this slice, and extend regression tests across coverage/report/gate/CLI surfaces to prove the unchanged S03 boundary.
  - Verify: `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncCoverage.parity.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/gates/asyncEvaluator.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts && git diff --check`
  - Done when: the public async coverage/report/gate/CLI suites stay green with only `unmatched` / `mismatched` public diagnostics, while the richer internal conformance tests from T02 still pass.

## Files Likely Touched

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/test/fixtures/asyncapi/schema-depth-v2.yaml`
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml`
- `yanote-js/test/fixtures/async-events/schema-valid.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/schema-invalid.fixture.jsonl`
