# M010: Core Contract Coverage Completeness For HTTP And Kafka

**Vision:** Yanote keeps the current supported HTTP/OpenAPI and Kafka/AsyncAPI boundaries but upgrades them from strong core coverage into a more complete core-contract truth surface, so teams can trust the main method/status/parameter/header/payload checks on real services without pretending the product already covers every construct in either specification.

## Success Criteria

- `yanote report` can surface explicit truth for method/route coverage, declared-status coverage, observed-but-undeclared HTTP statuses, supported parameter-value drift, response-header drift, and JSON request/response payload conformance on the live Spring MVC proof path.
- `yanote async-report` can surface channel/send/receive/message coverage plus payload and header diagnostics on the live Spring Kafka proof path as a supported Kafka-only user-facing contract surface.
- Public docs and proof verifiers state the richer supported core surfaces accurately and explicitly defer broader OpenAPI/AsyncAPI constructs instead of implying full spec coverage.

## Key Risks / Unknowns

- HTTP evidence does not yet retain enough value-bearing query/header/response-header detail to make value-level conformance truthful. — Without additive recorder/event changes, the new checks would be inference rather than proof.
- Parameter/header value retention can leak secrets or create high-cardinality artifacts. — Redaction and allowlisting have to be settled before the analyzer can safely depend on richer evidence.
- Async Kafka header diagnostics already exist in code while the public docs/boundary still under-claim them. — Proof, report, and wording have to align before we can trust the stronger public surface.
- Scope creep toward full OpenAPI/AsyncAPI coverage would swallow the milestone. — The plan must stay pinned to supported core surfaces rather than every spec feature.

## Proof Strategy

- HTTP evidence-shape risk → retire in S01 by proving live Spring MVC capture emits redaction-safe undeclared-status and value-bearing parameter/response-header evidence without regressing current proof artifacts.
- HTTP conformance-semantics risk → retire in S02 by proving `yanote report` can fail closed on undeclared-status, supported parameter-value, and response-header drift while preserving existing operation/status/payload truth.
- Async public-surface risk → retire in S03 by proving missing/invalid/unavailable/unverifiable Kafka header diagnostics end to end in `async-report` and live Kafka proof bundles.
- Scope/assembly risk → retire in S04 by proving the docs + proof stack expose one truthful core completeness boundary without implying full-spec or broker breadth.

## Verification Classes

- Contract verification: `yanote-core` event-model tests, `yanote-js` status/parameter/header/payload/report/gate suites, async report contract tests, and fixture-backed drift matrices.
- Integration verification: `bash scripts/docs/verify-s02-analysis-path.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, plus any new milestone-specific verifier composed from those paths.
- Operational verification: retained `.yanote-ci/` bundles and the existing CI workflow path continue to publish truthful artifacts for the richer surfaces.
- UAT / human verification: inspect HTTP and async reports plus guide wording to confirm the supported core-surface boundary is truthful and that broader spec features remain explicitly deferred.

## Milestone Definition of Done

This milestone is complete only when all are true:

- the HTTP path can prove core contract drift for undeclared statuses, supported parameter values, response headers, and JSON payloads through the real recorder path
- the Kafka path can prove channel/operation/message/payload/header truth through the real Spring Kafka proof path without widening beyond Kafka-only support
- the richer drift signals are wired into deterministic report/gate/CLI surfaces instead of living only in fixture tests or internal helpers
- the public docs and proof verifiers state the supported core surfaces accurately and explicitly defer broader OpenAPI/AsyncAPI constructs
- the final integrated acceptance scenarios pass against live behavior, not only fixture artifacts

## Requirement Coverage

- Covers: `R031`, `R032`, `R033`, `R034`
- Partially covers: `R001`, `R002`, `R003`, `R005`
- Leaves for later: `R020`, `R021`, `R022`, `R023`, `R024`, `R025`, `R030`
- Orphan risks: none

## Slices

- [x] **S01: HTTP evidence depth for undeclared statuses, parameter values, and response headers** `risk:high` `depends:[]`
  > After this: the live Spring MVC recorder/evidence path can retain redaction-safe status, parameter-value, and response-header facts needed for real HTTP conformance checks instead of only key-presence hints.
- [x] **S02: HTTP core contract completeness in report and gates** `risk:high` `depends:[S01]`
  > After this: `yanote report` can fail closed on undeclared statuses, invalid supported parameter values, and response-header drift while preserving the existing operation/status/payload truth already proven in the repo.
  > Closeout note (2026-03-25): shared evidence + additive report groundwork landed, but live CLI/gate/proof wiring is still payload-era; see `.gsd/milestones/M010/slices/S02/S02-SUMMARY.md` before treating this slice as done.
- [x] **S03: Async Kafka header validation as a supported core surface** `risk:medium` `depends:[]`
  > After this: `yanote async-report` and the live Kafka proof bundle treat missing/invalid/unavailable/unverifiable header diagnostics as supported Kafka-only user-facing truth rather than hidden implementation behavior or stale-doc caveats.
- [x] **S04: Final boundary assembly and docs hardening** `risk:low` `depends:[S02,S03]`
  > After this: the public HTTP and Kafka guides, proof scripts, and retained artifacts describe one truthful core completeness boundary that teams can rerun end to end.

## Boundary Map

### S01 → S02

Produces:
- additive HTTP evidence shape for observed undeclared statuses, retained query/header values, and retained response-header evidence
- recorder-side redaction/omission vocabulary that distinguishes captured, unavailable, and intentionally omitted HTTP conformance inputs

Consumes:
- nothing (first slice)

### S02 → S04

Produces:
- deterministic HTTP report/gate/CLI surfaces for undeclared-status drift, supported parameter-value drift, and response-header drift
- updated HTTP proof artifacts whose new diagnostics can be pinned by docs and verifier scripts

Consumes:
- S01 additive HTTP evidence shape and recorder semantics

### S03 → S04

Produces:
- stable async report/gate/CLI/public-proof treatment of missing/invalid/unavailable/unverifiable Kafka header diagnostics
- updated Kafka proof bundle expectations and public wording for the supported header-validation boundary

Consumes:
- existing Kafka-only async routing/payload/message surfaces already proven through M004/M009
