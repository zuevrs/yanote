# Requirements: Yanote Coverage Platform

**Defined:** 2026-03-04
**Core Value:** Any Java service team can reliably prove that every v1 API requirement is covered by executable tests before shipping.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Specification Semantics

- [x] **SPEC-01**: Maintainer can load OpenAPI HTTP specifications and resolve operations into canonical operation keys
- [x] **SPEC-02**: Maintainer can detect and review unmatched or ambiguous spec operations with actionable diagnostics
- [x] **SPEC-03**: Maintainer can map recorded HTTP events to canonical operation keys using deterministic matching rules

### Coverage Engine

- [x] **COVR-01**: Maintainer can compute operation-level coverage for all scoped v1 endpoints
- [x] **COVR-02**: Maintainer can compute status-code coverage per operation
- [x] **COVR-03**: Maintainer can compute parameter coverage (path/query/header where defined)
- [x] **COVR-04**: Maintainer can generate deterministic versioned JSON report output for the same inputs
- [x] **COVR-05**: Maintainer can read a concise CLI summary showing uncovered operations and coverage percentages

### Governance Gates

- [x] **GATE-01**: Maintainer can configure minimum coverage threshold and fail checks when result is below target
- [x] **GATE-02**: Maintainer can fail checks on coverage regression against a baseline report
- [x] **GATE-03**: Maintainer can configure explicit coverage exclusions with rationale captured in output
- [x] **GATE-04**: Maintainer gets fail-closed behavior when input evidence is invalid or incomplete

### Delivery Surfaces

- [x] **DELV-01**: Developer can run coverage analysis via standalone CLI in local and CI environments
- [x] **DELV-02**: Developer can run coverage analysis via Gradle plugin tasks integrated into Java build lifecycle
- [x] **DELV-03**: Team can run coverage analysis via GitHub Action and consume resulting artifacts/check outcomes

### Release and Distribution

- [ ] **RELS-01**: Maintainer can publish signed Java artifacts to Maven Central
- [ ] **RELS-02**: Maintainer can publish versioned GitHub Releases with changelog and usage notes
- [ ] **RELS-03**: Maintainer can run a reproducible CI release pipeline from tagged versions

### Quality and Verification

- [ ] **QUAL-01**: Team has automated tests that trace to all v1 requirements (100% requirement coverage)
- [ ] **QUAL-02**: CI runs unit, integration, and end-to-end checks for v1 workflow and blocks merges on failure
- [x] **QUAL-03**: Team verifies Java 21 baseline compatibility in automated checks

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Coverage Intelligence

- **DRFT-01**: Team can detect drift between specification and implementation in both directions
- **TRCE-01**: Team can attribute coverage evidence to suite/run identities with richer traceability analytics
- **INCR-01**: Team can enforce changed-operation-focused PR gating instead of only global percentage
- **DEEP-01**: Team can evaluate deeper behavior coverage dimensions (examples, media variants, schema-keyword depth)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AsyncAPI coverage (Kafka, RabbitMQ) | Explicitly deferred by project owner to keep v1 focused on Java HTTP/OpenAPI |
| Non-Java service ecosystem support | Explicitly deferred until Java-first workflow is stable |
| Web dashboard/report UI | Not required for v1 value; CLI + file reports are sufficient |
| Built-in autonomous test generation/fuzzing | High complexity, lower priority than deterministic coverage governance |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPEC-01 | Phase 1 | Complete |
| SPEC-02 | Phase 1 | Complete |
| SPEC-03 | Phase 1 | Complete |
| COVR-01 | Phase 2 | Complete |
| COVR-02 | Phase 2 | Complete |
| COVR-03 | Phase 2 | Complete |
| COVR-04 | Phase 2 | Complete |
| COVR-05 | Phase 2 | Complete |
| GATE-01 | Phase 3 | Complete |
| GATE-02 | Phase 3 | Complete |
| GATE-03 | Phase 3 | Complete |
| GATE-04 | Phase 3 | Complete |
| DELV-01 | Phase 2 | Complete |
| DELV-02 | Phase 4 | Complete |
| DELV-03 | Phase 4 | Complete |
| RELS-01 | Phase 5 | Pending |
| RELS-02 | Phase 5 | Pending |
| RELS-03 | Phase 5 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after Phase 3 execution*
