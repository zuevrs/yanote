# M001: Yanote v1 Delivery

**Vision:** Yanote is a developer toolchain for analyzing how well service specifications are covered by tests, with immediate focus on Java services and OpenAPI-driven HTTP contracts.

## Success Criteria

- Java teams can run deterministic OpenAPI coverage analysis through the standalone CLI, Gradle plugin, and GitHub Action delivery surfaces.
- Coverage semantics, reporting, and governance remain fail-closed, deterministic, and auditable across Node and Java workflows.
- Signed Maven Central and GitHub release pipelines publish reproducible v1 artifacts from semver tags with explicit approval gates.
- All 21 scoped v1 requirements are validated with traceability artifacts and successful release-proof evidence.

## Slices

- [x] **S01: Specification Semantics Contract** `risk:medium` `depends:[]`
  > After this: Implement the TypeScript semantic extraction contract for canonical OpenAPI identity and invalid-state diagnostics.
- [x] **S02: Coverage Metrics And Cli Reporting** `risk:medium` `depends:[S01]`
  > After this: Define deterministic status and parameter coverage primitives so Phase 2 can compute layered coverage with explicit evidence semantics.
- [x] **S03: Governance Gates** `risk:medium` `depends:[S02]`
  > After this: Establish deterministic governance policy inputs and exclusion policy mechanics for Phase 3 gate enforcement.
- [x] **S04: Java Build And Ci Delivery Surfaces** `risk:medium` `depends:[S03]`
  > After this: Deliver the Java-native Gradle delivery surface for Yanote without changing analyzer semantics.
- [x] **S05: Oss Release And Traceable Verification** `risk:medium` `depends:[S04]`
  > After this: Establish the Maven Central release foundation for v1 with deterministic fail-closed preflight behavior.

## Boundary Map

### S01 → S02

Produces:
- canonical OpenAPI semantic extraction, operation identity, and deterministic invalid/ambiguous diagnostics
- shared Java/Node parity fixtures for the semantic contract

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- deterministic operation/status/parameter coverage primitives
- stable report schema and CLI summary/error contracts

Consumes:
- S01 canonical operation identity and matcher semantics

### S03 → S04

Produces:
- governance policy resolution, exclusion handling, baseline regression, and fail-closed evidence behavior
- deterministic report/CLI diagnostics suitable for automated gates

Consumes:
- S02 coverage result and report contract

### S04 → S05

Produces:
- Gradle plugin, CI workflow contracts, required-check topology, and Java 21 enforcement
- stable delivery surfaces wrapping the existing analyzer/governance engine

Consumes:
- S03 governance/report contract
