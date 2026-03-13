# S01: AsyncAPI Contract Ingestion And Canonical Identity

**Goal:** Turn supported Kafka-oriented AsyncAPI contracts into one deterministic internal async semantics surface that downstream coverage, report, and recorder work can trust.
**Demo:** Running the slice proof tests shows that equivalent AsyncAPI v2 and v3 Kafka contracts normalize into the same canonical async identities, invalid/unsupported contracts emit explicit diagnostics, and spec discovery still classifies AsyncAPI inputs correctly without regressing OpenAPI behavior.

## Must-Haves

- A Kafka-oriented canonical async identity exists for supported AsyncAPI contracts and distinguishes `send` vs `receive` without leaking raw AsyncAPI version differences into downstream logic.
- The async semantics layer preserves message-contract references alongside the base async operation identity, so S02 can reason about message-contract coverage without fragmenting the primary key prematurely.
- Invalid, unsupported, or structurally ambiguous AsyncAPI inputs fail closed through deterministic diagnostics with async-relevant context instead of raw thrown parser strings or silent skipping.
- Equivalent v2 and v3 fixture contracts normalize to the same canonical identities in deterministic order, and OpenAPI-only discovery behavior remains green.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts`
- `npm -C yanote-js test -- src/spec/openapi.test.ts src/spec/semantics.diagnostics.test.ts`

## Observability / Diagnostics

- Runtime signals: deterministic async semantic diagnostics carrying version/protocol/channel/action/message context and stable canonical key serialization for fixture proofs.
- Inspection surfaces: `yanote-js/src/spec/asyncapi*.test.ts`, `yanote-js/src/spec/discover.test.ts`, `yanote-js/test/fixtures/asyncapi/*`, and the async semantics bundle produced by the loader.
- Failure visibility: test failures localize parser/normalization drift, unsupported-version handling, unresolved refs, or ordering/dedupe regressions without requiring a live Kafka runtime.
- Redaction constraints: fixtures and diagnostics should stay contract-focused; do not introduce payload dumps, secrets, or broker credentials into test surfaces.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/spec/semantics.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/discover.ts`, current AsyncAPI fixtures, and the existing deterministic test stack.
- New wiring introduced in this slice: a canonical async semantics bundle and Kafka-oriented identity contract that future coverage/report code (S02/S03) and Spring Kafka evidence capture (M004) can target directly.
- What remains before the milestone is truly usable end-to-end: async coverage semantics and diagnostics over evidence in S02, then separate async report/gate surfaces in S03.

## Tasks

- [x] **T01: Define the Kafka-oriented async identity and fixture contract** `est:75m`
  - Why: The slice needs one stable target for both parser normalization and future runtime evidence before implementation details spread through the analyzer.
  - Files: `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/test/fixtures/asyncapi/v2.yaml`, `yanote-js/test/fixtures/asyncapi/v3.yaml`, `yanote-js/test/fixtures/asyncapi/invalid.yaml`, `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml`
  - Do: Replace the shallow `kind:"asyncapi"` identity assumption with a Kafka-oriented async contract shape, decide what belongs in the primary key versus associated message-contract metadata, generalize diagnostics to carry async context, and expand the fixture corpus to cover equivalent v2/v3 operations plus invalid/unsupported cases.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/semantics.diagnostics.test.ts`
  - Done when: the type/fixture surface can express the same canonical Kafka operation across v2 and v3, plus deterministic invalid/unsupported diagnostics, without depending on ad hoc string parsing downstream.

- [x] **T02: Implement deterministic AsyncAPI semantics loading and discovery normalization** `est:90m`
  - Why: A strong type contract is useless until the real parser/discovery path produces it deterministically from supported AsyncAPI inputs.
  - Files: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/discover.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/discover.test.ts`
  - Do: Replace the raw operation list/throwing loader with an async semantics bundle that uses `@asyncapi/parser`, normalizes v2 `publish/subscribe` and v3 `action: send|receive` into one canonical Kafka identity surface, preserves message-contract references, translates parser problems into structured diagnostics, and tightens AsyncAPI discovery while keeping OpenAPI behavior green.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/discover.test.ts`
  - Done when: supported v2/v3 fixtures yield deterministic canonical bundles, invalid/unsupported fixtures return structured diagnostics instead of raw thrown strings, and spec discovery still classifies OpenAPI vs AsyncAPI inputs correctly.

- [ ] **T03: Add parity and failure-path proof for canonical async identity** `est:60m`
  - Why: S01 only becomes trustworthy when normalization, dedupe, and failure behavior are locked into repeatable proofs rather than inferred from implementation.
  - Files: `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/src/spec/semantics.diagnostics.test.ts`, `yanote-js/test/fixtures/asyncapi/v2.yaml`, `yanote-js/test/fixtures/asyncapi/v3.yaml`, `yanote-js/test/fixtures/asyncapi/invalid.yaml`, `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml`
  - Do: Add fixture-driven parity tests that prove equivalent v2/v3 contracts normalize to identical canonical keys and stable order, cover failure paths such as unsupported protocol/version or unresolved refs, and keep the existing HTTP semantic tests green after the async model changes.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
  - Done when: one proof command exercises both happy-path normalization and fail-closed async diagnostics, and the HTTP semantic baseline still passes after the async contract changes.

## Files Likely Touched

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/diagnostics.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/discover.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/src/spec/discover.test.ts`
- `yanote-js/src/spec/semantics.diagnostics.test.ts`
- `yanote-js/test/fixtures/asyncapi/v2.yaml`
- `yanote-js/test/fixtures/asyncapi/v3.yaml`
- `yanote-js/test/fixtures/asyncapi/invalid.yaml`
- `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml`
