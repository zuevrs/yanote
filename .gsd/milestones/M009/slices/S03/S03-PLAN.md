# S03: AsyncAPI Multi-Message Contract Resolution

**Goal:** Expand the Kafka-only AsyncAPI semantic surface to handle v3 operations with multiple declared messages, using deterministic message discrimination when enough evidence exists and fail-closed ambiguity diagnostics when it does not.
**Demo:** Running the AsyncAPI parser/coverage/report suites against new multi-message fixtures shows stable canonical operation keys, deterministic message selection when hints/headers identify one contract, and typed ambiguity diagnostics when the runtime evidence is insufficient to choose safely.

## Must-Haves

- AsyncAPI v3 operations with multiple messages are normalized instead of rejected outright when the Kafka-only surface can discriminate one message contract safely.
- Message discrimination rules are explicit, deterministic, and fail closed when hints/headers/contracts leave multiple valid candidates.
- Async coverage, conformance, report, and gate surfaces keep the current canonical `kafka <action> <channel>` identity while surfacing selected-message or ambiguity truth clearly.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.parity.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`

## Observability / Diagnostics

- Runtime signals: selected-message metadata, typed ambiguity diagnostics, and fail-closed async semantic failures when one operation key maps to more than one viable message contract.
- Inspection surfaces: multi-message AsyncAPI fixtures, parser/conformance/report/gate tests, and the async boundary verifier.
- Failure visibility: unsupported multi-message contracts, ambiguous message selection, and mismatched hints/headers surface as explicit diagnostics instead of generic invalid-parser failures.
- Redaction constraints: diagnostics should name contract identities and reasons, not echo raw payloads or sensitive header values.

## Integration Closure

- Upstream surfaces consumed: S01 provenance and S02 retained header/message-hint evidence, `loadAsyncApiSemanticsBundle()`, async coverage/conformance logic, async report/CLI surfaces, and current failure-order semantics.
- New wiring introduced in this slice: multi-message contract selection becomes a first-class async analyzer seam while canonical operation identity remains unchanged.
- What remains before the milestone is truly usable end-to-end: S05 still needs live retained proof and compatibility/doc hardening around the stronger async semantics.

## Tasks

- [ ] **T01: Add deterministic multi-message AsyncAPI parsing and selection rules** `est:1h35m`
  - Why: the current parser rejects a realistic Kafka-only AsyncAPI shape wholesale; the milestone needs one explicit selection model before coverage and gates can use it safely.
  - Files: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/spec/asyncapi.parity.test.ts`, `yanote-js/test/fixtures/asyncapi/v3.yaml`, `yanote-js/test/fixtures/asyncapi/invalid.yaml`
  - Do: Extend AsyncAPI v3 parsing to accept operations with multiple declared messages, define deterministic selection precedence using explicit message identity plus retained runtime hints where available, and add fixtures/tests that pin both resolvable and ambiguous shapes.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
  - Done when: parser tests prove supported multi-message contracts load successfully, unsupported/ambiguous shapes fail with typed diagnostics, and the canonical `kafka <action> <channel>` operation key remains stable.
- [ ] **T02: Flow multi-message selection and ambiguity into async coverage, reports, and gates** `est:1h25m`
  - Why: parsing support alone is not enough; users need the rest of the async analyzer stack to explain which message contract matched or why the analyzer refused to choose one.
  - Files: `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncCoverage.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/gates/asyncEvaluator.test.ts`, `yanote-js/src/gates/failureOrder.test.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`, `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Do: Teach async coverage/conformance/report/gate layers how to consume selected-message metadata or ambiguity failures, keep deterministic operation/message counts, and refresh the async boundary verifier to show the supported-vs-ambiguous story clearly.
  - Verify: `npm -C yanote-js test -- src/coverage/asyncCoverage.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/gates/asyncEvaluator.test.ts src/gates/failureOrder.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Done when: async report/gate surfaces stay truthful on multi-message contracts, ambiguity is fail-closed and typed, and no existing single-message Kafka path regresses.

## Files Likely Touched

- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/test/fixtures/asyncapi/v3.yaml`
- `yanote-js/test/fixtures/asyncapi/invalid.yaml`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`
- `yanote-js/src/gates/asyncEvaluator.test.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
