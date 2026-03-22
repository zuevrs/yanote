# M004: Kafka Evidence Capture And Java Integration — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

## Project Description

This milestone adds the first real Kafka runtime path for Yanote. Building on the async contract and coverage semantics from M003, it introduces Spring Kafka producer and consumer evidence capture, propagates test metadata through Kafka headers/evidence, and proves the end-to-end async evidence path against a real Kafka runtime in both single-service and two-service scenarios.

## Why This Milestone

Async contract support without real evidence capture would still leave Java/Spring teams unable to use Yanote on existing Kafka services. The user explicitly wants the first target audience to be a Java/Spring team with an already-running Kafka-backed service, and wants Yanote to distinguish producer and consumer behavior honestly.

This milestone therefore turns async semantics into live runtime facts. It must be grounded in one strong path — Kafka-only, Spring Kafka-first — rather than trying to be broker-agnostic before the first evidence contract is proven.

## User-Visible Outcome

### When this milestone is complete, the user can:

- instrument a Spring Kafka application so Yanote captures producer and consumer evidence as separate, normalized async facts
- preserve suite/run metadata through Kafka headers/evidence so async coverage is diagnosable and attributable
- run live proof scenarios where one service both sends and receives, and where one service publishes to another consumer service, with Kafka evidence that feeds the async analyzer path

### Entry point / environment

- Entry point: Spring Kafka integration modules, example applications, async evidence fixtures, verifier/test surfaces
- Environment: local development, CI, and real Kafka runtime in containers or equivalent test harness
- Live dependencies involved: Spring Kafka, Kafka broker runtime, example Java services, analyzer/report surface from M003

## Completion Class

- Contract complete means: producer and consumer evidence share one normalized async fact shape and one metadata propagation story that matches the canonical async identities from M003
- Integration complete means: Spring Kafka apps can emit producer and consumer evidence that the analyzer accepts without translation gaps
- Operational complete means: the live proof scenarios run against a real Kafka runtime and remain reproducible in CI-grade automation

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a Spring Kafka service that both publishes and consumes can generate truthful normalized async evidence for both directions
- a two-service Kafka flow can preserve enough evidence to show producer-side and consumer-side async coverage in a real runtime
- suite/run metadata can survive Kafka headers/evidence flow well enough to support diagnostics and downstream async coverage attribution

## Risks and Unknowns

- Spring Kafka offers several interception points; choosing the wrong one may lose metadata, blur direction semantics, or create brittle runtime coupling
- Producer and consumer evidence may require different runtime hooks even if they normalize into one output model
- Kafka headers are the natural metadata bridge, but header propagation can drift if the contract is not explicit and tested
- Live Kafka proofs can be slow or flaky if the runtime harness is not designed as a real product-grade verifier rather than a demo script

## Existing Codebase / Prior Art

- `yanote-recorder-spring-mvc` — current HTTP recorder pattern that proves how Yanote wants runtime facts emitted on the Java side
- `yanote-test-tags-restassured` and `yanote-test-tags-cucumber` — current metadata propagation surfaces whose async analog must stay equally diagnosable
- `examples/springmvc-service` and `examples/tests-restassured` — current runnable proof assets and conventions for example-backed verification
- `docs/guides/test-tagging.md` — current explanation of how metadata flows from tests into evidence and then into reports
- M003 outputs — canonical async identities, async evidence expectations, and separate async report surfaces that live Kafka capture must satisfy

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R042 — Spring Kafka producer evidence capture
- R043 — Spring Kafka consumer evidence capture
- R044 — Kafka test metadata propagation via headers
- R045 — real Kafka integration proof for single-service and two-service scenarios
- R046 — async verification stack at OpenAPI-quality depth
- R048 — CI-ready end-to-end async proof and release-grade trust surface (runtime foundation)

## Scope

### In Scope

- Spring Kafka producer and consumer evidence capture
- normalized async evidence shape aligned with M003 semantics
- Kafka-header-based metadata propagation for suite/run diagnostics
- live single-service and two-service proof scenarios against a real Kafka runtime
- integration and end-to-end verifier foundations for async CI

### Out of Scope / Non-Goals

- broker-agnostic async instrumentation beyond Kafka
- payload-schema validation against AsyncAPI message schemas
- Schema Registry integration
- DLQ/retry/partition/lag-aware coverage semantics
- final public docs/support productization for async users (owned by M005)

## Technical Constraints

- Build on the async identities and diagnostics from M003 instead of inventing a second runtime-specific contract.
- Distinguish producer and consumer evidence explicitly even when the same service does both.
- Keep Kafka-only and Spring Kafka-first scope for the first live async path.
- The proof stack must include both CI/integration-level automation and a live Kafka-runtime scenario.

## Integration Points

- future or new Spring Kafka integration module(s)
- existing Java module and example-service patterns in the monorepo
- Kafka broker runtime used in integration tests and end-to-end proofs
- analyzer/report surfaces from M003 that consume normalized async evidence
- existing metadata and evidence conventions already proven in the HTTP path

## Open Questions

- Which Spring Kafka interception seam gives the cleanest producer and consumer evidence without distorting runtime behavior?
- Should the first live proof lean on Testcontainers, Docker Compose, or a split between local and CI harnesses?
- How much metadata belongs directly in the normalized async evidence versus remaining only in raw headers?
