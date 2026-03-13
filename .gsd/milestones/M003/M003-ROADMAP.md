# M003: AsyncAPI Coverage Foundations

**Vision:** Extend Yanote’s analyzer and report model so Kafka-oriented AsyncAPI contracts become a first-class coverage domain with canonical async identities, explicit diagnostics, and a separate async report/gate path.

## Success Criteria

- Yanote can load supported Kafka-oriented AsyncAPI contracts and normalize them into canonical async operation identities without leaking raw spec-version differences into downstream logic.
- Yanote can compute async coverage that distinguishes channel coverage, send/receive operation coverage, and message-contract identity coverage.
- Yanote can surface unmatched and mismatched async evidence explicitly instead of silently treating it as covered.
- Yanote can emit a separate deterministic async report and gate result alongside the existing HTTP path.
- The new async semantics are protected by fixture, unit, and contract-proof tests that match the product’s existing fail-closed quality posture.

## Key Risks / Unknowns

- AsyncAPI v2 and v3 may differ enough that a naive shared model will break direction semantics or leak version-specific behavior downstream.
- Async coverage could collapse into a shallow topic-hit counter if the operation/message-contract model is not explicit.
- Report and gate surfaces may become confusing if async semantics are bolted onto the HTTP path instead of given a clear separate surface.
- Payload-schema validation is attractive, but trying to ship it here could destabilize the first trustworthy async capability.

## Proof Strategy

- AsyncAPI version-shape ambiguity → retire in S01 by proving supported contracts normalize into one canonical async identity model with explicit diagnostics
- shallow or misleading async coverage semantics → retire in S02 by proving deterministic async coverage and unmatched/mismatched diagnostics against fixture evidence
- report/gate integration ambiguity → retire in S03 by proving a separate async report/gate path that preserves deterministic output and fail-closed behavior

## Verification Classes

- Contract verification: AsyncAPI fixtures, canonical identity checks, deterministic diagnostics, and schema/report shape assertions
- Integration verification: analyzer consumes normalized async evidence and produces separate async report/gate outputs without breaking the HTTP path
- Operational verification: deterministic CLI/report behavior suitable for CI use; no live Kafka runtime required in this milestone
- UAT / human verification: none required for milestone completeness

## Milestone Definition of Done

This milestone is complete only when all are true:

- all slice deliverables are complete and mapped requirements remain covered truthfully
- supported AsyncAPI contracts normalize into one canonical async identity surface
- async coverage semantics distinguish channels, operations, and message-contract identity explicitly
- unmatched and mismatched async evidence produce first-class diagnostics instead of silent best-effort matches
- a separate async report/gate surface exists and is exercised through deterministic proof
- the async foundation is protected by fixture/unit/contract tests at the expected quality bar

## Requirement Coverage

- Covers: R037, R038, R039, R040, R041
- Partially covers: R046
- Leaves for later: R042, R043, R044, R045, R047, R048, R049, R050, R051, R052, R053
- Orphan risks: none

## Slices

- [ ] **S01: AsyncAPI Contract Ingestion And Canonical Identity** `risk:high` `depends:[]`
  > After this: Yanote can validate supported AsyncAPI contracts and turn them into canonical Kafka-oriented async operation identities with explicit diagnostics.

- [ ] **S02: Async Coverage And Diagnostics Semantics** `risk:high` `depends:[S01]`
  > After this: Yanote can compute deterministic async coverage across channels, send/receive operations, and message-contract identity while surfacing unmatched/mismatched evidence clearly.

- [ ] **S03: Separate Async Report And Gate Surface** `risk:medium` `depends:[S02]`
  > After this: Yanote can emit a separate async report and gate result alongside HTTP, with deterministic output and fail-closed behavior proven by tests.

## Boundary Map

### S01 → S02

Produces:
- canonical async operation identity model for Kafka-oriented AsyncAPI contracts
- supported-version normalization strategy and explicit unsupported-version diagnostics
- AsyncAPI contract bundle with channel, direction, and message-contract references available to the coverage engine
- fixture corpus for AsyncAPI parsing and identity proof

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- async coverage semantics for channels, operations, and message-contract identity
- unmatched and mismatched async evidence diagnostics
- deterministic async coverage result model ready for report serialization and gate enforcement
- fixture and unit proof for async semantics and diagnostic ordering

Consumes from S01:
- canonical async contract bundle and identity model

### S01/S02 → S03

Produces:
- separate async report schema/output surface
- separate async CLI/gate path and failure-policy contract
- milestone-level proof that async report/gate behavior is deterministic and CI-ready

Consumes:
- canonical async identities, coverage semantics, and diagnostics from the prior slices
