# M001: Migration

**Vision:** Yanote is a developer toolchain for analyzing how well service specifications are covered by tests, with immediate focus on Java services and OpenAPI-driven HTTP contracts.

## Success Criteria


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
