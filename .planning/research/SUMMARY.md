# Project Research Summary

**Project:** Yanote Coverage Platform
**Domain:** Java-first OpenAPI specification-vs-test coverage tooling
**Researched:** 2026-03-04
**Confidence:** MEDIUM

## Executive Summary

Yanote is best positioned as a contract-governance product for Java teams: capture real HTTP evidence in Spring services, normalize it against OpenAPI operations, and enforce deterministic quality gates in CI. The research consistently supports a four-plane model (runtime capture, offline analysis, policy delivery, publication/governance) with a strict contract boundary (`events.jsonl` + stable report schema) and thin adapters across CLI, Gradle plugin, and GitHub Action.

The recommended approach is to lock coverage semantics before adding surface area. Specifically, define one canonical operation identity algorithm across Java and Node, harden matching fixtures for path-template edge cases, then productize P1 capabilities (operation/status/parameter coverage, deterministic JSON output, and fail-closed CI gates with exclusions). This sequencing minimizes contradictory results across channels and keeps the product credible as merge-blocking governance tooling rather than an advisory report generator.

Key risks are semantic drift (Java vs Node parser behavior), inflated "endpoint-hit" metrics, and silent recorder data loss under concurrency. Mitigation should be front-loaded: conformance tests across runtimes, behavior-level coverage dimensions beyond endpoint presence, recorder integrity checks with dropped-event SLOs, and release hardening (dependency locking, supply-chain policy, Central preflight). The core conclusion: prioritize correctness contracts and deterministic gates first; defer multi-protocol and native test-generation ambitions until post-v1.

## Key Findings

### Recommended Stack

Research strongly supports a Java 21 + Gradle 9.3.x baseline with modern OSS distribution practices. The build/release path should standardize on `java-gradle-plugin`, `com.gradle.plugin-publish` 2.x, `maven-publish` + `signing`, and `org.jreleaser` for Central/GitHub release automation. CI defaults should use current maintained action majors and reproducible execution (`npm ci`, wrapper validation, version pinning).

**Core technologies:**
- Java 21 (test matrix includes 25): runtime/toolchain baseline aligned with repo constraints and forward-compat safety.
- Gradle Wrapper 9.3.x + Kotlin DSL: canonical multi-module orchestration for build/test/publish/release.
- Gradle plugin stack (`java-gradle-plugin`, `com.gradle.plugin-publish` 2.x): primary Java delivery channel.
- Maven Central via Central Portal + `org.jreleaser`: modern signed OSS publication path after OSSRH sunset.
- JUnit BOM 5.13.4 + JaCoCo 0.8.14: deterministic tests plus enforceable coverage verification.
- GitHub Actions (`checkout@v6`, `setup-java@v5`, `setup-gradle@v5`): maintained CI baseline with caching and wrapper hygiene.

### Expected Features

The MVP is not a dashboard product; it is a deterministic governance engine. Table-stakes are OpenAPI ingestion/normalization, runtime evidence capture, operation+status+parameter coverage, and CI quality gates with reliable exit behavior. Differentiation should focus on drift detection and actionable traceability after baseline trust is established.

**Must have (table stakes):**
- OpenAPI ingestion + canonical operation normalization.
- Recorded request/response evidence mapped to operation keys.
- Operation, status, and parameter coverage reporting.
- Deterministic JSON report + clear CLI summary + stable exit codes.
- CI governance thresholds and exclusion/rule configuration.

**Should have (competitive):**
- Spec-implementation drift detection in both mismatch directions.
- Suite/run-level attribution with endpoint call counts.
- PR-focused changed-operation messaging and incremental gating.
- Actionable remediation output for uncovered requirements.

**Defer (v2+):**
- Multi-protocol coverage (AsyncAPI, gRPC, GraphQL).
- Native fuzzing/stateful test generation engine.
- Mandatory hosted dashboard/backend as core product surface.

### Architecture Approach

The architecture should keep one coverage engine and policy contract while exposing thin adapters for developer/CI surfaces. Runtime capture remains side-effect-safe in service processes, analysis remains offline and deterministic, and governance/publication remain CI/CD concerns. Stable file contracts (`events.jsonl`, versioned report JSON) are the key boundary that enables safe iteration.

**Major components:**
1. Recorder starter (Spring MVC filter + auto-config) - captures HTTP evidence without breaking app flow.
2. Core model + matcher - canonical `OperationKey` and event schema used across runtimes.
3. Analyzer engine - deterministic discover/normalize/match/summarize pipeline.
4. Policy engine - thresholds/regression semantics converted to pass/fail gates.
5. Delivery adapters - CLI, Gradle tasks, and GitHub Action wrappers over the same engine.
6. Release orchestrator - signed publication to Maven Central + GitHub Releases.

### Critical Pitfalls

1. **Naive URL matching creates false coverage** - match on canonical method + normalized route template with golden path fixtures and ambiguity linting.
2. **Java/Node parser drift breaks trust** - enforce one operation-key algorithm and CI conformance diffs across both parser stacks.
3. **Endpoint-only coverage inflates confidence** - split metrics into operation presence and behavior coverage (status/media/variant depth).
4. **Fail-open recorder can hide data loss** - keep request safety but gate on dropped-event SLOs and strict JSONL integrity validation.
5. **Release and CI hardening done too late** - automate Central preflight, reproducibility checks, SHA-pinned actions, and least-privilege workflow permissions early.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Coverage Semantics Contract
**Rationale:** Every downstream metric and gate depends on trustworthy matching; this is the highest-risk dependency.
**Delivers:** Canonical operation identity spec, parser option pinning, cross-runtime conformance tests, ambiguity lint fixtures.
**Addresses:** OpenAPI normalization, operation-level baseline from table stakes.
**Avoids:** False coverage and Java/Node identity drift pitfalls.

### Phase 2: MVP Coverage + Deterministic Governance
**Rationale:** Once semantics are stable, deliver immediate user value with enforceable CI outcomes.
**Delivers:** Operation/status/parameter coverage computation, deterministic JSON/CLI output, exclusion rules, threshold and regression gates.
**Uses:** JaCoCo + JUnit + Gradle quality gate primitives.
**Implements:** Analyzer + policy engine contracts shared by all adapters.
**Avoids:** Endpoint-hit inflation and non-actionable reporting.

### Phase 3: Java-First Delivery Surfaces
**Rationale:** Product adoption requires first-class Java developer ergonomics, not only a standalone analyzer.
**Delivers:** Gradle plugin tasks (`report`, `check`), thin GitHub Action wrapper, reusable workflow wiring, required status check integration.
**Addresses:** CI integration and machine-readable artifact expectations.
**Avoids:** Adapter logic drift via thin-surface discipline.

### Phase 4: Coverage Intelligence Differentiators
**Rationale:** Differentiation should be added after baseline trust to avoid compounding early complexity.
**Delivers:** Spec-implementation drift detection, suite/run traceability, changed-operation-focused PR gating.
**Addresses:** P2 competitive features.
**Avoids:** Governance blind spots where overall percentage masks critical misses.

### Phase 5: Reliability, Security, and OSS Release Hardening
**Rationale:** Before broad OSS adoption, releases and gates must be reproducible, secure, and contract-stable.
**Delivers:** Recorder integrity SLOs, deterministic test harness controls, dependency locking, supply-chain policy checks, Central preflight automation, report/CLI SemVer governance.
**Addresses:** Release trust and long-term maintainability.
**Avoids:** Late publish failures, flaky gates, and downstream contract breakage.

### Phase Ordering Rationale

- Semantics before surfaces: incorrect matching would invalidate all plugin/action UX and governance.
- Governance before differentiation: table-stakes gates produce immediate value and operational trust.
- Thin adapters after core contracts: ensures one engine, one truth across CLI/Gradle/Action.
- Hardening before scale: reproducibility, supply-chain controls, and compatibility policy reduce OSS adoption risk.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** canonical cross-runtime path/operation matching rules and parser option parity need focused specification decisions.
- **Phase 4:** incremental diff heuristics (changed-operation gating), traceability schema design, and remediation UX need focused design research.
- **Phase 5:** organization-specific OIDC/Central publication mechanics and provenance policy details may require environment-specific validation.

Phases with standard patterns (skip research-phase):
- **Phase 2:** deterministic report/gate implementation is well documented in existing coverage and Gradle/JaCoCo practices.
- **Phase 3:** Gradle plugin/task wiring, GitHub reusable workflows, and required status checks follow established patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Mostly official Gradle/Sonatype/JUnit/GitHub docs with clear current-version guidance. |
| Features | MEDIUM | Strong market pattern agreement, but differentiator ROI depends on Yanote user adoption context. |
| Architecture | MEDIUM | Patterns are sound and documented, but real repo constraints may force adapter/runtime trade-offs. |
| Pitfalls | HIGH | Critical correctness/release risks are well supported by specs and official platform guidance. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Behavior coverage granularity:** exact denominator design (status/media/parameter variants) needs explicit v1 policy calibration and sample corpora.
- **Incremental gating algorithm:** changed-operation detection and failure messaging strategy need empirical validation on real PR history.
- **Scale breakpoints:** event volume thresholds and memory/performance envelopes need load testing in representative service sizes.
- **Parser migration strategy:** long-term Java-first analyzer direction vs Node compatibility shim needs explicit product decision during roadmap planning.

## Sources

### Primary (HIGH confidence)
- OpenAPI Specification 3.1.0 - operation/path/parameter semantics and coverage denominator rules.
- Gradle official docs - plugin development, JaCoCo verification, signing/publishing, dependency locking.
- Spring Framework/Boot official docs - route matching behavior, filter/auto-configuration boundaries.
- GitHub Actions official docs - reusable workflows, required checks/rulesets, secure workflow guidance.
- Sonatype Central official docs - publishing requirements, Portal model, current Gradle publication posture.
- JUnit official docs - parallel execution controls and deterministic isolation mechanisms.

### Secondary (MEDIUM confidence)
- Specmatic documentation and demos - CI governance patterns and spec-vs-implementation mismatch framing.
- Schemathesis CLI/docs/workbench examples - deeper schema coverage dimensions and reporting practices.
- Reqover and Dredd project docs - evidence-capture and contract-testing workflow references.
- Microcks topology/automation guides - ecosystem deployment and CI integration patterns.

### Tertiary (LOW confidence)
- None identified as sole decision drivers; medium-confidence ecosystem references are used only to shape prioritization, not core contract decisions.

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
