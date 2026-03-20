# Requirements: Yanote Coverage Platform

> Audience: **public requirements owner surface**. Этот файл остаётся каноническим inventory требований, deferred scope и out-of-scope границ. Если вы пришли сюда напрямую и ищете карту всей пользовательской документации, вернитесь в [`docs/README.md`](README.md).

**Defined:** 2026-03-04
**Core Value:** Any Java service team can reliably prove that every supported v1 HTTP and first-wave async contract surface is covered by executable tests before shipping.

## v1 Requirements

Requirements for the current public product surface. Each maps to shipped or actively supported roadmap phases.

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

- [x] **RELS-01**: Maintainer can publish signed Java artifacts to Maven Central
- [x] **RELS-02**: Maintainer can publish versioned GitHub Releases with changelog and usage notes
- [x] **RELS-03**: Maintainer can run a reproducible CI release pipeline from tagged versions

### Quality and Verification

- [x] **QUAL-01**: Team has automated tests that trace to all v1 requirements (100% requirement coverage)
- [x] **QUAL-02**: CI runs unit, integration, and end-to-end checks for v1 workflow and blocks merges on failure
- [x] **QUAL-03**: Team verifies Java 21 baseline compatibility in automated checks

### AsyncAPI / Kafka — первая волна

Текущая async surface уже входит в поддерживаемую публичную границу, но остаётся намеренно узкой. Эти клаузы нужно читать буквально:

- **Kafka-only**
- **Spring Kafka-first**
- **separate async report/gate**
- **payload-schema drift surfaced on the proven Kafka path**
- **routing percentages remain routing-first**
- **retained Kafka headers remain unverifiable**
- **broker-agnostic promise нет**

Поддерживаемая evidence/support surface для этой первой волны тоже зафиксирована явно: `raw или merged async JSONL`, `yanote-async-report.json`, analyzer/proof `stderr` и retained `schema-failure-async-report.stderr` / `schema-failure-yanote-async-report.json` для proven Kafka payload drift.

Практически это означает поддержанный путь через `async-report` и `yanote-async-report.json` для AsyncAPI/Kafka coverage, при этом HTTP `report` / `yanote-report.json` остаются отдельной поверхностью и не маскируются под один обязательный combined report. Happy-path coverage проценты остаются routing-first, а payload drift публично считается доказанным только для того Kafka evidence path, который экспортирует `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Coverage Intelligence

- **DRFT-01**: Team can detect drift between specification and implementation in both directions
- **TRCE-01**: Team can attribute coverage evidence to suite/run identities with richer traceability analytics
- **INCR-01**: Team can enforce changed-operation-focused PR gating instead of only global percentage
- **DEEP-01**: Team can evaluate deeper behavior coverage dimensions (examples, media variants, schema-keyword depth)

### Async Follow-ons

- **ASYNC-01**: Team can extend the proven Kafka payload-drift proof to deeper AsyncAPI schema-keyword coverage and retained header validation
- **ASYNC-02**: Team can produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`
- **ASYNC-03**: Team can support non-Kafka brokers or make a broker-agnostic async runtime promise

## Out of Scope

Explicitly excluded from the current public surface. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Async deeper schema-keyword coverage and retained header validation beyond the current Kafka payload-drift proof | Deferred follow-on; current public async surface proves payload drift only for the retained Kafka path and still treats headers as unverifiable |
| Combined HTTP + async report/gate in the current first wave | Deferred follow-on; current product keeps a `separate async report/gate` |
| Broker-agnostic or non-Kafka async coverage (RabbitMQ/AMQP/other brokers) | Deferred follow-on; current public boundary is `Kafka-only` and `broker-agnostic promise нет` |
| Non-Java service ecosystem support | Explicitly deferred until Java-first workflow is stable |
| Web dashboard/report UI | Not required for v1 value; CLI + file reports are sufficient |
| Built-in autonomous test generation/fuzzing | High complexity, lower priority than deterministic coverage governance |

## Traceability

Which phases cover which v1 requirements. Updated during roadmap creation.

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
| RELS-01 | Phase 5 | Complete |
| RELS-02 | Phase 5 | Complete |
| RELS-03 | Phase 5 | Complete |
| QUAL-01 | Phase 5 | Complete |
| QUAL-02 | Phase 4 | Complete |
| QUAL-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-20 after M007 S04 T03 async boundary refresh*
