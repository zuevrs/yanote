# M007: AsyncAPI Schema Conformance And Contract Depth

**Vision:** Turn Yanote’s first-wave AsyncAPI/Kafka path into a strong async contract surface by carrying payload-bearing evidence through the recorder pipeline, validating observed Kafka payloads against AsyncAPI schemas, and exposing schema-level drift as first-class async report/gate truth.

## Success Criteria

- Engineers can run `async-report` against supported Kafka evidence and see payload-conformance failures, not only channel/message identity coverage.
- Async failures distinguish routing drift from schema/header drift in both CLI/stderr and `yanote-async-report.json`.
- The live Spring Kafka proof path exercises the stronger async contract end to end and leaves inspectable failure artifacts.
- Public async docs/support surfaces describe the stronger contract truth without overclaiming broker scope or combined-report behavior.

## Key Risks / Unknowns

- Current async evidence is metadata-only — without a payload-bearing event contract, schema validation would be synthetic.
- AsyncAPI schema/reference/header shapes may not map cleanly onto the current v2/v3 normalization seam.
- Report/gate semantics can become muddy if schema drift is not separated from existing unmatched/mismatched routing drift.
- Live proof can become flaky if payload capture or validation relies on non-deterministic serialization details.

## Proof Strategy

- Metadata-only async evidence gap → retire in S01 by proving one stable payload-bearing Kafka JSONL contract and analyzer reader seam.
- AsyncAPI schema/reference/header mapping ambiguity → retire in S02 by proving deterministic fixture and parity behavior for valid and invalid schema-level inputs.
- Report/gate truth ambiguity → retire in S03 by proving typed async schema diagnostics, report serialization, and fail-closed CLI/gate behavior.
- Real runtime trust gap → retire in S04 by proving the stronger async contract through the live Kafka proof stack and updated public boundary docs.

## Verification Classes

- Contract verification: `yanote-js` async fixture/unit/contract tests, event-model round-trip tests, report schema tests, CLI contract tests
- Integration verification: Spring Kafka recorder tests plus the authoritative async proof scripts under `scripts/ci/`
- Operational verification: live Kafka proof commands and retained failure artifacts for async-report/gate failures
- UAT / human verification: review that public async docs/support wording matches the real stronger boundary and does not imply broker-agnostic support

## Milestone Definition of Done

This milestone is complete only when all are true:

- payload-bearing async evidence exists as a stable, test-proven boundary across recorder, JSONL, and analyzer surfaces
- AsyncAPI schema validation works through the real async report path, not just isolated fixtures
- async report/gate surfaces distinguish routing drift from schema drift with deterministic diagnostics and artifacts
- the live Kafka proof stack exercises the stronger async contract end to end
- async docs/support surfaces are re-checked against the new runtime truth

## Requirement Coverage

- Covers: R049, R065
- Partially covers: R040, R041, R045, R046, R048
- Leaves for later: R050, R051, R052, R053, R066, R067
- Orphan risks: none

## Slices

- [x] **S01: Payload-Bearing Async Evidence Contract** `risk:high` `depends:[]`
  > After this: fixture and round-trip proof show one stable Kafka evidence shape that can carry payload/schema-relevant async facts into the analyzer.
- [x] **S02: AsyncAPI Schema Validation And Drift Semantics** `risk:high` `depends:[S01]`
  > After this: the analyzer can distinguish async routing drift from async schema/reference/header drift on deterministic fixtures and parity cases.
- [x] **S03: Async Report And Gate Schema Truth** `risk:medium` `depends:[S01,S02]`
  > After this: `async-report`, `YANOTE_ASYNC_*`, and `yanote-async-report.json` expose schema-level failures as first-class contract truth.
- [x] **S04: Live Kafka Proof And Boundary Refresh** `risk:medium` `depends:[S03]`
  > After this: the real Spring Kafka proof stack exercises schema-depth async validation end to end and the public boundary docs match what the runtime actually proves.

## Boundary Map

### S01 → S02

Produces:
- payload-bearing `KafkaEvent` / `AsyncEvent` contract and JSONL reader boundary
- deterministic fixture corpus for valid/invalid payload-bearing async evidence
- recorder-facing rules for what async payload/header facts are persisted

Consumes:
- existing Kafka-only, Spring Kafka-first async identity and evidence path from M003–M005

### S01 → S03

Produces:
- normalized async conformance result surface that can feed report/gate serialization
- explicit separation between routing match facts and schema-validation facts

Consumes:
- existing separate async report/gate model and deterministic CLI/report conventions
