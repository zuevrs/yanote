# Roadmap: Yanote Coverage Platform

## Overview

Deliver a Java-first OpenAPI coverage governance workflow that teams can trust in local development and CI through CLI, Gradle plugin, and GitHub Action channels. The roadmap prioritizes deterministic specification semantics and enforceable gates before adapter delivery, then closes with OSS-grade release outcomes to GitHub and Maven Central. AsyncAPI, non-Java ecosystems, and web report UI remain out of scope for v1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Specification Semantics Contract** - Canonicalize OpenAPI operations and deterministic event-to-operation mapping.
- [x] **Phase 2: Coverage Metrics and CLI Reporting** - Deliver operation/status/parameter coverage with deterministic report output through the standalone CLI.
- [x] **Phase 3: Governance Gates** - Enforce threshold, regression, exclusion, and fail-closed policy behavior.
- [ ] **Phase 4: Java Build and CI Delivery Surfaces** - Deliver Gradle plugin and GitHub Action channels with merge-blocking CI checks on Java 21.
- [ ] **Phase 5: OSS Release and Traceable Verification** - Ship signed Maven Central and GitHub releases with full v1 requirement-to-test traceability.

## Phase Details

### Phase 1: Specification Semantics Contract
**Goal**: Maintainers can trust canonical operation identities and deterministic event-to-operation matching for all v1 OpenAPI endpoints.
**Depends on**: Nothing (first phase)
**Requirements**: SPEC-01, SPEC-02, SPEC-03
**Success Criteria** (what must be TRUE):
  1. Maintainer can load OpenAPI specs and obtain stable canonical operation keys for all scoped v1 operations.
  2. Maintainer can review actionable diagnostics for unmatched or ambiguous operations before accepting coverage output.
  3. Recorded HTTP events map to canonical operation keys deterministically when inputs are unchanged.
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md - Implement TypeScript canonical extraction and invalid diagnostics contract.
- [x] 01-02-PLAN.md - Implement Java canonical extraction and invalid diagnostics contract.
- [x] 01-03-PLAN.md - Implement TypeScript deterministic matcher and fail-closed CLI semantics.
- [x] 01-04-PLAN.md - Implement Java deterministic matcher and coverage diagnostics integration.
- [x] 01-05-PLAN.md - Enforce cross-runtime parity with shared semantic fixtures and adapter tests.

### Phase 2: Coverage Metrics and CLI Reporting
**Goal**: Developers can compute deterministic operation-level coverage results from evidence using the standalone CLI in local and CI workflows.
**Depends on**: Phase 1
**Requirements**: COVR-01, COVR-02, COVR-03, COVR-04, COVR-05, DELV-01
**Success Criteria** (what must be TRUE):
  1. Developer can run the standalone CLI locally or in CI to compute operation coverage for all scoped v1 endpoints.
  2. Developer can inspect status-code and parameter coverage per operation in generated report output.
  3. Running the CLI repeatedly with identical inputs produces byte-equivalent versioned JSON reports.
  4. Developer can read a concise terminal summary of uncovered operations and aggregate coverage percentages.
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md (Wave 1) - Define status/parameter dimension contracts and parameter-evidence ingestion.
- [x] 02-02-PLAN.md (Wave 1) - Add strict versioned schema and deterministic JSON write boundary.
- [x] 02-03-PLAN.md (Wave 2, depends on 02-01 + 02-02) - Integrate layered coverage into deterministic standalone CLI output contract.

### Phase 3: Governance Gates
**Goal**: Teams can enforce coverage policy as deterministic pass/fail governance in automated checks.
**Depends on**: Phase 2
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04
**Success Criteria** (what must be TRUE):
  1. Maintainer can configure a minimum coverage threshold and the check fails when coverage drops below target.
  2. Maintainer can compare current coverage to a baseline report and fail checks on regressions.
  3. Maintainer can configure explicit coverage exclusions with rationale, and exclusions appear in output artifacts.
  4. Invalid or incomplete evidence causes fail-closed behavior with actionable diagnostics instead of a passing result.
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md (Wave 1) - Implement deterministic policy resolution and auditable exclusion rule foundations.
- [x] 03-02-PLAN.md (Wave 2, depends on 03-01) - Deliver baseline v2 regression evaluator, precedence engine, and fail-closed evidence checks.
- [x] 03-03-PLAN.md (Wave 3, depends on 03-01 + 03-02) - Integrate governance output contract and exclusion transparency across CLI/report surfaces.

### Phase 4: Java Build and CI Delivery Surfaces
**Goal**: Teams can run the same analyzer and governance behavior through Gradle and GitHub Action channels with merge-blocking CI validation on Java 21.
**Depends on**: Phase 3
**Requirements**: DELV-02, DELV-03, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Java developers can execute Gradle plugin tasks in the build lifecycle and get the same coverage outputs and gate outcomes as the CLI.
  2. Teams can run a GitHub Action that executes coverage checks and exposes artifacts plus check outcomes in pull requests.
  3. CI runs unit, integration, and end-to-end v1 workflow checks and blocks merges when failures occur.
  4. Automated checks verify Java 21 baseline compatibility for scoped v1 modules and delivery channels.
**Plans**: TBD

### Phase 5: OSS Release and Traceable Verification
**Goal**: Maintainers can publish trusted public releases and prove complete v1 requirement coverage through automated tests.
**Depends on**: Phase 4
**Requirements**: RELS-01, RELS-02, RELS-03, QUAL-01
**Success Criteria** (what must be TRUE):
  1. Maintainer can publish signed Java artifacts to Maven Central from tagged release workflow runs.
  2. Tagged versions produce GitHub Releases with changelog, usage notes, and versioned release assets.
  3. Release pipelines execute reproducibly from tags and fail deterministically when signing or publishing prerequisites are missing.
  4. Team can trace every v1 requirement to automated tests with 100% requirement coverage accountability.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Specification Semantics Contract | 5/5 | Complete | 2026-03-04 |
| 2. Coverage Metrics and CLI Reporting | 3/3 | Complete | 2026-03-04 |
| 3. Governance Gates | 3/3 | Complete | 2026-03-04 |
| 4. Java Build and CI Delivery Surfaces | 0/TBD | Not started | - |
| 5. OSS Release and Traceable Verification | 0/TBD | Not started | - |
