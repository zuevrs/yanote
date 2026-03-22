# M004: Kafka Evidence Capture And Java Integration

**Vision:** Extend Yanote’s Java runtime so Spring Kafka services emit truthful normalized Kafka evidence, preserve test attribution through Kafka headers, and prove the end-to-end async analyzer path against a real broker in both single-service and two-service flows.

## Success Criteria

- A Spring Kafka service can emit separate normalized `kafka send` and `kafka receive` facts on a real Kafka broker, and the existing `yanote async-report` command accepts them without translation.
- Producer evidence reflects broker-acknowledged send success/failure and consumer evidence reflects listener success/failure, so a service that both publishes and consumes shows both directions honestly.
- Suite/run metadata injected through the existing HTTP tagging path or through inbound Kafka headers survives onto outbound Kafka headers and appears in normalized async evidence.
- The repo contains a reproducible single-service proof and a reproducible two-service proof that collect per-service evidence, merge it deterministically, and feed the async analyzer path.
- The Kafka recorder path is protected by unit, integration, example, and CI-grade verifiers that keep the async rollout at the project’s fail-closed quality bar.

## Key Risks / Unknowns

- Spring Kafka offers several producer and consumer seams, and the wrong seam would record send attempts or container delivery instead of the broker/listener outcome Yanote actually wants.
- Test metadata can easily stop at HTTP ingress or first consume unless Yanote defines a shared context plus a narrow Kafka header contract instead of relying on broad Spring header mapping.
- A real-broker two-service proof can become flaky or misleading if services share evidence files, collect evidence nondeterministically, or hide analyzer handoff assumptions in ad hoc test glue.

## Proof Strategy

- producer/consumer seam ambiguity → retire in S01 by proving one Spring Kafka service can publish and consume on a real broker while emitting distinct broker-acknowledged `send` and listener-outcome `receive` facts
- metadata propagation drift → retire in S02 by proving existing suite/run metadata survives HTTP → Kafka and Kafka → Kafka republish flows via explicit Yanote headers and lands in normalized evidence
- multi-service runtime/harness complexity → retire in S03 by proving single-service and two-service examples produce deterministic per-service JSONL that the existing async analyzer can consume in CI-grade automation

## Verification Classes

- Contract verification: JVM event-shape tests, Spring Kafka recorder auto-configuration/unit tests, metadata-header contract tests, and async analyzer non-regression checks against produced Kafka JSONL
- Integration verification: Testcontainers-backed Spring Boot tests for single-service send/receive, metadata republish, and two-service producer-to-consumer flows with `yanote async-report` run over the captured evidence
- Operational verification: real Kafka broker orchestration, per-service evidence collection and deterministic merge, and shell/CI wrappers that rerun the live async proof path end to end
- UAT / human verification: none required for milestone completeness

## Milestone Definition of Done

This milestone is complete only when all are true:

- all M004 slices are complete and every M004-relevant active requirement is still truthfully mapped
- the JVM async event contract, Spring Kafka recorder module, and example services are wired so live Kafka evidence reaches the existing async analyzer without translation gaps
- a single service that both publishes and consumes produces truthful producer and consumer evidence on a real broker
- suite/run metadata survives the supported HTTP and Kafka header paths and remains attributable in recorded async evidence
- single-service and two-service live proof scenarios pass with deterministic evidence collection and analyzer output
- the milestone leaves M005-scoped onboarding and release hardening explicit rather than implied

## Requirement Coverage

- Covers: R042, R043, R044, R045, R046
- Partially covers: R048
- Leaves for later: R047, remaining R048, R049, R050, R051, R052, R053
- Orphan risks: none

## Slices

- [x] **S01: Truthful Spring Kafka Recorder Path** `risk:high` `depends:[]`
  > After this: one Spring Kafka service can publish and consume against a real Kafka broker while emitting normalized producer and consumer JSONL evidence that the existing async analyzer accepts.

- [x] **S02: Metadata Propagation And Republish Attribution** `risk:medium` `depends:[S01]`
  > After this: existing test run/suite metadata survives HTTP-triggered publish and listener-triggered republish flows via explicit Kafka headers and lands in normalized async evidence without broad header leakage.

- [x] **S03: Live Multi-Service Kafka Proof Stack** `risk:medium` `depends:[S01,S02]`
  > After this: the repo has reproducible single-service and two-service Kafka scenarios that collect per-service evidence, merge it deterministically, and prove the async analyzer path in CI-grade automation.

## Boundary Map

### S01 → S02

Produces:
- a generalized JVM async event model and JSONL write path for normalized `kind:"kafka"` evidence aligned with the M003 analyzer contract
- a Spring Kafka recorder module/auto-configuration that records producer ack/failure and consumer listener success/failure as separate facts
- a single-service real-broker example/integration surface that proves one application can both send and receive truthfully
- the invariant that `message` remains optional unless the application provides an explicit Yanote message hint, avoiding payload-class heuristics

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- a shared JVM test-metadata context that bridges Spring MVC ingress and Kafka listener scopes into outbound Kafka sends
- an explicit Yanote Kafka header contract for suite/run propagation with narrow mutation/read rules instead of blanket Spring header mapping
- a single-service republish flow proving metadata survives HTTP → Kafka → Kafka and lands in recorded async evidence
- verifier surfaces for metadata propagation, recorder fail-safety, and evidence attribution

Consumes from S01:
- the generalized Kafka event model, recorder auto-configuration, and real-broker single-service harness

### S01/S02 → S03

Produces:
- a two-service Kafka example topology with per-service JSONL outputs and deterministic merge/analyzer handoff
- final live proof scripts/tests covering both single-service and cross-service flows against a real Kafka runtime
- milestone-level acceptance surfaces that exercise `yanote async-report` on live Spring Kafka evidence and feed the existing async diagnostics/report path without translation

Consumes:
- recorder/event outputs from S01 and metadata/header propagation outputs from S02
