# M009: HTTP And Kafka Evidence Truth Hardening

**Vision:** Yanote keeps the current Kafka-only / HTTP-first product boundary but makes runtime evidence truthful enough that recorder omissions, payload/header retention limits, and real contract drift are distinguishable across recorder, JSONL, analyzer, reports, gates, and retained proof artifacts.

## Success Criteria

- Live Spring MVC and Spring Kafka recorder flows retain explicit payload/header evidence provenance so users can tell whether data was absent, intentionally omitted, unsupported, malformed, or filtered at capture time.
- Common Java record/POJO Kafka payloads survive recorder capture and JSONL ingestion without forcing teams to rewrite examples around `Map` payloads or raw JSON strings.
- AsyncAPI header contracts and multi-message Kafka operations are verifiable or fail closed with typed diagnostics instead of remaining mostly `unverifiable` or unsupported.
- HTTP/OpenAPI and Kafka/AsyncAPI report and gate surfaces keep observation separate from conformance while clearly distinguishing recorder-policy omission from true semantic drift.

## Key Risks / Unknowns

- Widening `HttpEvent` / `KafkaEvent` with provenance and headers can break JSONL round-trip, analyzer normalization, or retained artifact expectations if the schema changes are not strictly additive.
- Retaining Kafka headers can leak secrets or oversized values unless allowlisting, redaction, and size limits are defined before the evidence becomes first-class.
- Supporting AsyncAPI v3 multi-message operations can create ambiguous message selection on a stable `kafka <action> <channel>` identity unless discrimination is explicit and fail-closed.
- Spring Kafka instrumentation remains reflection-based, so deeper recorder truth may still be brittle across framework version drift even after logic changes.

## Proof Strategy

- Additive event-model provenance risk → retire in S01 by proving existing JSONL readers still accept additive fields while live recorder tests surface explicit provenance for captured, omitted, malformed, and oversized cases.
- Header leakage / verification risk → retire in S02 by proving redaction-safe retained headers feed AsyncAPI header validation and the existing Kafka metadata propagation proof remains green.
- Multi-message ambiguity risk → retire in S03 by proving fixture-backed AsyncAPI v3 multi-message contracts either resolve deterministically or fail with typed ambiguity diagnostics.
- Runtime-assembly and version-drift risk → retire in S05 by proving the upgraded recorder/analyzer paths still pass the retained live Kafka and HTTP proof stacks plus a version-sensitive recorder smoke boundary.

## Verification Classes

- Contract verification: `yanote-core` JSONL round-trip tests, `yanote-js` spec/coverage/report and gate suites, recorder seam tests, and fixture-backed ambiguity / omission matrices.
- Integration verification: `bash scripts/docs/verify-s01-recorder-path.sh`, `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `bash scripts/docs/verify-s02-analysis-path.sh`, `bash scripts/ci/verify-m005-s02-async-acceptance.sh`.
- Operational verification: retained `.yanote-ci/` artifact bundles plus a Spring Boot / Spring Kafka compatibility smoke boundary for the reflection-based recorder seam.
- UAT / human verification: inspect retained green/red HTTP and async artifacts plus docs wording to confirm the public boundary matches the stronger evidence truth without implying broader broker or schema-registry support.

## Milestone Definition of Done

This milestone is complete only when all are true:

- HTTP and Kafka event models carry additive provenance/header truth without breaking existing JSONL ingestion paths.
- The Spring MVC and Spring Kafka recorder paths are both exercised with the richer evidence boundary in live proof commands.
- AsyncAPI header validation and multi-message resolution work or fail closed with typed diagnostics on the shipped Kafka-only surface.
- HTTP/OpenAPI and Kafka/AsyncAPI report and gate outputs expose recorder-policy omission distinctly from semantic contract drift.
- The retained proof entrypoints and public docs are re-checked against live behavior and artifact truth, not just fixture-only behavior.

## Requirement Coverage

- Covers: proposed R068, proposed R069, proposed R070, proposed R071
- Partially covers: R063
- Leaves for later: R052, R050, R051, R053
- Orphan risks: none

## Slices

- [ ] **S01: Recorder provenance and additive event truth** `risk:high` `depends:[]`
  > After this: live Spring MVC and Spring Kafka recorder tests plus JSONL reader suites can show whether payload evidence was captured, omitted by policy, malformed, oversized, or unsupported, and common Kafka POJO payloads no longer disappear by default.
- [ ] **S02: Kafka header evidence and AsyncAPI header verification** `risk:high` `depends:[S01]`
  > After this: retained Kafka headers become a first-class, redaction-safe analyzer input and async proof paths can show real header-contract validation instead of broad `unverifiable-headers` limits.
- [ ] **S03: AsyncAPI multi-message contract resolution** `risk:medium` `depends:[S01,S02]`
  > After this: fixture-backed Kafka-only AsyncAPI v3 contracts with multiple messages either resolve deterministically or fail closed with typed ambiguity diagnostics while keeping canonical operation keys stable.
- [ ] **S04: HTTP and OpenAPI recorder-policy and schema fidelity hardening** `risk:medium` `depends:[S01]`
  > After this: the HTTP payload path can distinguish recorder-policy omission from semantic drift more cleanly and handles a broader set of real OpenAPI schema/media-type shapes without weakening fail-closed semantics.
- [ ] **S05: Retained proof and compatibility hardening** `risk:low` `depends:[S02,S03,S04]`
  > After this: the upgraded truth surfaces are re-proved through live Kafka/HTTP entrypoints, a version-sensitive recorder smoke boundary, and refreshed public docs/artifacts.

## Boundary Map

### S01 → S02

Produces:
- additive HTTP/Kafka event fields for payload capture provenance that survive JSONL round-trip and Node normalization;
- a Jackson-backed Kafka POJO capture seam with explicit unsupported/oversized failure reasons when capture still cannot proceed.

Consumes:
- nothing (first slice)

### S01 → S04

Produces:
- recorder-policy provenance vocabulary that the HTTP analyzer/report layer can interpret without guessing whether a missing payload was absent or dropped.

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- retained Kafka header evidence plus normalization/redaction rules that give multi-message async resolution one more stable discriminator alongside message hints.

Consumes:
- S01 additive event-model provenance and JSONL reader compatibility.

### S02 → S05

Produces:
- live async proof surfaces with header-validation truth that the final retained bundle and docs can point at.

Consumes:
- S01 recorder truth boundary.

### S03 → S05

Produces:
- stable typed ambiguity / selection diagnostics for multi-message AsyncAPI contracts that must appear consistently in retained proof and public wording.

Consumes:
- S02 retained header evidence and current async report and gate surfaces.

### S04 → S05

Produces:
- provenance-aware HTTP payload semantics and hardened OpenAPI schema/media-type behavior for the retained HTTP proof path.

Consumes:
- S01 recorder provenance and current M008 HTTP payload/report and gate surfaces.
