# S01: AsyncAPI Contract Ingestion And Canonical Identity

**Goal:** Turn supported Kafka-oriented AsyncAPI contracts into one deterministic internal async semantics surface that downstream coverage, report, and recorder work can trust.
**Demo:** Running the slice proof tests shows that equivalent AsyncAPI v2 and v3 Kafka contracts normalize into the same canonical async identities, invalid/unsupported contracts emit explicit diagnostics, and spec discovery still classifies AsyncAPI inputs correctly without regressing OpenAPI behavior.

## Must-Haves

- Supported Kafka-oriented AsyncAPI contracts normalize into a canonical async identity surface that is framed around the runtime domain rather than the source document label.
- The slice fixture corpus proves equivalent AsyncAPI v2/v3 happy paths plus explicit invalid and unsupported boundaries.
- Async diagnostics carry enough structured context to localize version/protocol/channel/action/message failures without payload dumps.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`

## Observability / Diagnostics

- Runtime signals: deterministic async semantic diagnostics carrying version/protocol/channel/action/message context and stable canonical key serialization for fixture proofs.
- Inspection surfaces: `yanote-js/src/spec/asyncapi*.test.ts`, `yanote-js/src/spec/discover.test.ts`, `yanote-js/src/spec/semantics.diagnostics.test.ts`, `yanote-js/test/fixtures/asyncapi/*`, and the async semantics bundle produced by the loader.
- Failure visibility: test failures localize parser/normalization drift, unsupported protocol/version handling, malformed or unresolved refs, canonical ordering drift, or HTTP compatibility regressions without requiring a live Kafka runtime.
- Redaction constraints: fixtures and diagnostics stay contract-focused; do not introduce payload dumps, secrets, or broker credentials into test surfaces.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/discover.ts`, `yanote-js/src/spec/semantics.ts`, and `yanote-js/test/fixtures/asyncapi/*`.
- New wiring introduced in this slice: AsyncAPI fixtures, canonical async key serialization, parity tests, and generalized semantic diagnostics that will anchor the loader implementation.
- What remains before the milestone is truly usable end-to-end: S01 is now closed on a single repeatable proof command; the milestone moves next to S02 async coverage and diagnostics semantics work on top of this canonical contract surface.

## Tasks

- [x] **T01: Define the Kafka-oriented async identity and fixture contract** `est:45m`
  - Why: The milestone cannot trust coverage or recorder work until AsyncAPI v2/v3 and invalid/unsupported cases are pinned to one runtime-oriented contract.
  - Files: `yanote-js/src/model/operationKey.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/test/fixtures/asyncapi/*`
  - Do: Replace the shallow AsyncAPI identity assumption with a Kafka-oriented key/contract vocabulary, add structured async diagnostic context, and expand the fixture/test corpus so invalid and unsupported inputs fail closed instead of disappearing.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/semantics.diagnostics.test.ts`
  - Done when: The contract and fixture corpus are pinned in code, HTTP diagnostics remain green, and the remaining async test failures point directly at the shallow loader gaps that T02 must close.
- [x] **T02: Implement AsyncAPI normalization and fail-closed diagnostics** `est:1h`
  - Why: T01 only defines the contract; the slice still needs a real loader that turns supported AsyncAPI inputs into the canonical Kafka surface and rejects unsupported/invalid cases explicitly.
  - Files: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/diagnostics.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`
  - Do: Replace the shallow extractor with Kafka-scoped AsyncAPI normalization for supported v2/v3 documents, surface deterministic invalid/unsupported diagnostics with async context, and preserve stable ordering/dedupe behavior.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/semantics.diagnostics.test.ts`
  - Done when: The new async contract tests pass and failures carry actionable async context instead of silent drops.
- [x] **T03: Add parity and failure-path proof for canonical async identity** `est:45m`
  - Why: The slice is only complete when equivalent v2/v3 contracts, explicit async failure paths, discovery classification, and the existing OpenAPI path all stay green under one repeatable proof command.
  - Files: `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/src/spec/discover.test.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/test/fixtures/asyncapi/*`, `.gsd/STATE.md`
  - Do: Tighten the parity and failure-path fixtures/tests, rerun the full slice verifier stack, and refresh the living state to reflect the now-proven slice.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/spec/discover.test.ts src/spec/semantics.diagnostics.test.ts src/spec/openapi.test.ts`
  - Done when: The single slice proof command passes with explicit parity, diagnostics, discovery, and OpenAPI non-regression coverage, and the GSD state no longer presents S01 as active work.

## Files Likely Touched

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/diagnostics.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/src/spec/semantics.diagnostics.test.ts`
- `yanote-js/test/fixtures/asyncapi/*`
- `.gsd/STATE.md`
