# M005: Async Productization And End-to-End Proof

**Vision:** Turn Yanote’s Kafka/AsyncAPI capability into a trustworthy product surface: a fresh engineer can discover the async path, understand its honest first-wave boundaries, and follow a CI-grade proof chain from docs through live Kafka evidence to separate async reporting.

## Success Criteria

- A fresh engineer can discover the AsyncAPI/Kafka capability from `README.md`, `docs/README.md`, and the support/release surfaces, then follow one canonical path to `yanote async-report` and the live Kafka proof without maintainer-only context.
- Public landing, guide, requirements, support, and release-boundary surfaces all tell the same first-wave async story: Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise.
- The repo has a composed async acceptance command that reuses the authoritative M004 raw-evidence-first Kafka proofs and passes in CI-grade environments without inventing duplicate proof logic.
- Existing required CI job names stay stable while async failures surface actionable artifacts and summaries, including `yanote-async-report.json`, structured `YANOTE_ASYNC_*` lines, and retained live-proof diagnostics.

## Key Risks / Unknowns

- Public async truth currently contradicts itself across requirements, support, landing, and release surfaces, and partial docs-only updates would still leave engineers unsure whether async is actually supported.
- A final M005 acceptance path could become a second drift surface if it re-implements the M004 Kafka proofs instead of composing the authoritative scripts that already assert raw evidence before analysis.
- Async may remain second-class in CI even after docs land if artifact collection, GitHub summaries, and workflow tests stay hard-wired to HTTP `yanote-report.json` diagnostics.

## Proof Strategy

- public boundary contradiction and oversell risk → retire in S01 by proving the root/docs/support/release/requirements surfaces all expose the same machine-checked async contract and a discoverable path to `yanote async-report`
- acceptance-surface drift → retire in S02 by proving one stage-labeled M005 runner composes the authoritative boundary verifiers with the existing M004 single-service and two-service live Kafka proofs
- async CI invisibility → retire in S02 by proving the existing required workflow topology can publish async artifacts and render async-aware summaries without changing `build-and-test` or `yanote-validation` job names

## Verification Classes

- Contract verification: async landing/boundary/support shell verifiers, requirements wording checks, artifact/summary/workflow contract tests, and non-regression checks for the existing HTTP validation surfaces.
- Integration verification: `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, and the final M005 stage runner that composes docs/boundary proof with live Kafka analyzer proof.
- Operational verification: CI job topology tests for stable required job names, `always()` artifact/summary handling, and retained async proof diagnostics on failure.
- UAT / human verification: none required for milestone completeness.

## Milestone Definition of Done

This milestone is complete only when all are true:

- all M005 slices are complete and R047/R048 are validated or explicitly remapped with rationale
- public async onboarding, support intake, requirements, and release-boundary owner surfaces are aligned and machine-checked
- the first-wave async story stays explicit: Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise
- a final async acceptance surface composes the S01 doc/boundary verifiers with the authoritative M004 live Kafka proofs instead of duplicating them
- existing required CI job names remain stable while async artifacts and GitHub summaries become first-class failure diagnostics
- success criteria are re-checked against live proof commands and CI-visible artifacts, not only prose review

## Requirement Coverage

- Covers: R047, R048
- Partially covers: none
- Leaves for later: R049, R050, R051, R052, R053
- Orphan risks: none

## Slices

- [x] **S01: Async Onboarding And Boundary Truth** `risk:high` `depends:[]`
  > After this: a new engineer can discover the supported Kafka/AsyncAPI path and its honest limitations from repo landings, guides, support intake, and release/requirements owner surfaces without reverse-engineering maintainer notes.
- [ ] **S02: CI-Grade Async Acceptance And Diagnostics** `risk:medium` `depends:[S01]`
  > After this: the repo has a CI-grade async acceptance surface that reuses the real Kafka proof stack and makes async failures visible through first-class artifacts and summaries in the existing required workflow topology.

## Boundary Map

### S01 → S02

Produces:
- a canonical Russian-first async onboarding path on the root/docs landings and `docs/guides/*` that routes engineers to `yanote async-report` and the supported Kafka proof path
- an authoritative async boundary contract across `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` that names Kafka-only, Spring Kafka-first, separate async report/gate, and no payload-schema enforcement
- support-intake rules for async artifacts: raw or merged async JSONL, `yanote-async-report.json`, and analyzer/proof stderr logs
- machine-checked verifier coverage for async landing/boundary/support wording so public product truth cannot silently drift

Consumes:
- nothing (first slice)

### S01 + existing M004 async proofs → S02

Produces:
- a stage-labeled M005 acceptance runner that composes the async doc/boundary verifiers with `scripts/ci/verify-m004-s02-metadata-propagation.sh` and `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- async-aware CI artifact collection and GitHub summary surfaces that can publish `yanote-async-report.json`, retained live-proof files, and structured `YANOTE_ASYNC_*` failures without introducing new required job names
- workflow, summary, and artifact-collector contract tests that keep HTTP validation behavior intact while promoting async diagnostics to first-class CI output

Consumes:
- the async public boundary contract and verifier outputs from S01
- the existing `yanote async-report` CLI/report/gate contract plus authoritative M004 live Kafka proof scripts and retained failure artifacts
