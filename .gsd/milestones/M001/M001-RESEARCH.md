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

# Architecture Research

**Domain:** Java API specification coverage tooling (capture -> analyze -> quality gate)
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Runtime Capture Plane (inside service)                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Spring MVC Filter  →  Route Template Resolver  →  Event Serializer         │
│  (non-intrusive)       (spec operation key)        (JSONL contract)         │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ events.jsonl + run metadata
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Evidence + Analysis Plane (offline)                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Spec Loader (OpenAPI) → Normalizer/Matcher → Coverage Engine → Reporter    │
│                            (path/method)      (deterministic)   (JSON/SARIF)│
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ gate inputs (coverage %, regressions, missing operations)
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Policy + Delivery Plane (build/CI)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  CLI Surface  |  Gradle Plugin Surface  |  GitHub Action Surface            │
│  (local dev)  |  (build lifecycle)      |  (reusable CI integration)        │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ release artifacts + checks
               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Publication + Governance Plane (CD)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Maven Central (Java libs/plugin)  |  GitHub Releases (CLI bundles/action)  │
│  Branch rulesets + required checks |  Environment-gated release workflows    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Recorder starter | Capture HTTP request/response envelope without breaking app flow | Spring Boot auto-configuration + servlet filter with conditional enablement |
| Core contract model | Define canonical event and operation identity shared across surfaces | Java domain module (`HttpEvent`, `OperationKey`, coverage model) |
| Analyzer engine | Convert spec + events into deterministic coverage output | Pure compute pipeline (discover -> normalize -> match -> summarize) |
| Policy engine | Convert report into pass/fail semantics for CI quality gates | Threshold + regression checks (`min coverage`, `no regressions`) |
| Delivery adapters | Expose same engine/policy behavior via local and CI channels | CLI command, Gradle tasks, GitHub Action wrapper |
| Release orchestrator | Publish signed artifacts and enforce release controls | GitHub Actions release workflow + Maven publish/signing + Central Portal upload |

## Recommended Project Structure

```
.
├── yanote-core/                          # canonical event/coverage model + matching logic
├── yanote-recorder-spring-mvc/           # runtime capture starter (Spring filter/autoconfig)
├── yanote-test-tags-restassured/         # test-run metadata injection
├── yanote-js/                            # analyzer/report runtime (existing)
├── yanote-gradle-plugin/                 # new: build-time adapter around analyzer + gates
├── .github/actions/yanote-coverage/      # new: composite action for CI consumers
├── .github/workflows/
│   ├── ci.yml                            # verify + gate (required checks)
│   └── release.yml                       # publish signed artifacts + release assets
└── dist/                                 # produced bundles for offline/CI execution
```

### Structure Rationale

- **Core vs adapters:** Keep domain logic in `yanote-core`/analyzer, keep Gradle/Action as thin orchestration layers so one matching algorithm drives all delivery surfaces.
- **Runtime vs build-time isolation:** Recorder modules remain app-runtime dependencies; plugin/action stay build tooling only.
- **Contract-first boundary:** `events.jsonl` and report JSON are stable interfaces between runtime capture and offline analysis.
- **Release boundary:** Publication logic belongs in workflow/release modules, not inside analyzer or recorder runtime code.

## Architectural Patterns

### Pattern 1: Thin Adapters Over One Engine

**What:** CLI, Gradle plugin, and GitHub Action all call one analyzer + policy contract.
**When to use:** Multiple delivery channels must produce identical results.
**Trade-offs:** Strong consistency; requires discipline to avoid "just one feature" drift in adapters.

**Example:**
```kotlin
// Gradle task delegates to analyzer executable, not re-implementing matching logic.
tasks.register<Exec>("yanoteCoverageReport") {
    commandLine("node", "yanote-js/dist/bin.js", "report",
        "--spec", specFile.get().asFile.absolutePath,
        "--events", eventsFile.get().asFile.absolutePath,
        "--out", reportFile.get().asFile.absolutePath)
}
```

### Pattern 2: Explicit Capture Contract Boundary

**What:** Runtime capture emits append-only JSONL events with stable schema and test metadata.
**When to use:** Recorder lifecycle differs from analyzer lifecycle and language runtime.
**Trade-offs:** Strong decoupling and backward compatibility; requires schema versioning discipline.

**Example:**
```json
{"schemaVersion":"1","eventType":"http","method":"GET","routeTemplate":"/orders/{id}","status":200,"testRunId":"abc-123","suite":"contract"}
```

### Pattern 3: Fail-Closed Gate as First-Class Build Step

**What:** Quality gate runs as dedicated task/job and is the only status check marked required.
**When to use:** You need deterministic merge control and clear branch governance.
**Trade-offs:** Simple governance and auditable policy; stricter pipelines can initially increase red builds.

**Example:**
```yaml
jobs:
  coverage-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-java@v5
        with: { distribution: temurin, java-version: '21', cache: gradle }
      - run: ./gradlew yanoteCoverageCheck
```

## Data Flow

### Request Flow (Coverage Signal Path)

```
[Test executes API call]
    ↓
[Spring recorder filter captures request/response]
    ↓
[Event JSONL writer appends normalized event]
    ↓
[Analyzer loads OpenAPI + events]
    ↓
[Matcher maps event -> operation key]
    ↓
[Coverage report generated]
    ↓
[Policy engine evaluates thresholds/regressions]
    ↓
[Build/CI pass|fail status check]
```

### Control Flow (Delivery and Governance)

```
[Developer / CI trigger]
    ↓
[Gradle plugin or CLI task orchestration]
    ↓
[Analyzer invocation + report artifact creation]
    ↓
[Required status check in branch ruleset]
    ↓
[Merge allowed/blocked]
    ↓
[Release workflow (tag/main) publishes signed artifacts]
```

### Key Data Flows

1. **Capture flow:** Service runtime -> `events.jsonl` with route-template + test metadata.
2. **Analysis flow:** Spec files + event logs -> normalized operation map -> coverage report.
3. **Gate flow:** Coverage report -> policy thresholds -> CI check conclusion.
4. **Publication flow:** Versioned build outputs -> signed Maven artifacts + GitHub release assets.

## Suggested Build Order (Roadmap Implications)

1. **Stabilize contracts and deterministic engine**
   - Lock event schema versioning and operation matching semantics before new surfaces.
   - Ensures Gradle plugin and GitHub Action reuse stable behavior.
2. **Add Gradle plugin adapter**
   - Introduce `report` and `check` tasks that delegate to existing analyzer.
   - This is the canonical Java-first interface for local + CI.
3. **Add GitHub Action wrapper**
   - Wrap Gradle plugin/CLI invocation for cross-repo reuse.
   - Keep it thin (inputs/outputs only), no duplicated matching logic.
4. **Enforce quality gate wiring**
   - Make gate job the required status check in branch protection/rulesets.
   - Separate "informational reports" from "merge-blocking gate".
5. **Implement release automation**
   - Publish signed Java artifacts (Maven Central) and coverage tooling artifacts (GitHub Releases).
   - Add environment/reviewer controls for publish jobs.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 repos/services | File-based events + local analyzer runs are enough; single gate job per PR |
| 10-100 repos/services | Standardize reusable workflow/action; enforce shared gate policy and artifact retention |
| 100+ repos/services | Introduce shared evidence retention/indexing and policy-as-config overlays by org/domain |

### Scaling Priorities

1. **First bottleneck:** Inconsistent adapter behavior (CLI vs Gradle vs Action). Fix by enforcing one engine contract and golden compatibility tests.
2. **Second bottleneck:** CI throughput/artifact churn. Fix with Gradle/action caching strategy and report retention rules.

## Anti-Patterns

### Anti-Pattern 1: Re-implementing Matching Logic in Every Surface

**What people do:** Add slightly different operation matching in plugin/action to "optimize UX".
**Why it's wrong:** Produces contradictory coverage outcomes across local and CI contexts.
**Do this instead:** Keep one analyzer/matcher implementation; adapters only map inputs/outputs.

### Anti-Pattern 2: Mixing Runtime Capture with Build/Release Concerns

**What people do:** Recorder starter reaches into CI env/release settings or remote services directly.
**Why it's wrong:** Raises app runtime risk and couples service availability to tooling control plane.
**Do this instead:** Keep recorder runtime minimal and side-effect-safe; do policy/publication only in build/CI plane.

### Anti-Pattern 3: Non-blocking Gates in "Advisory Only" Mode Forever

**What people do:** Generate coverage reports but never make checks required.
**Why it's wrong:** Coverage drift continues; tooling gives visibility without governance value.
**Do this instead:** Phase in strict required checks by module/repo, with explicit thresholds and regression rules.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Actions | Reusable workflows (`workflow_call`) + composite action wrapper | Enables org-wide standardized CI and output propagation |
| GitHub Rulesets / Branch Protection | Required status checks for coverage gate job | Merge control must point to deterministic gate job name |
| Sonatype Central Portal | API or community Gradle plugin path for deployment bundles | No official Gradle plugin from Sonatype yet; keep release automation explicit |
| Maven Central | Signed artifact publication for Java modules/plugin | Use Gradle signing + maven-publish wiring |
| GitHub Releases | Publish CLI bundles/action metadata and changelog | Complements Maven distribution for non-JVM consumers |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Recorder module ↔ Core model | In-process Java API (`HttpEvent`, `OperationKey`) | Version together to avoid capture/schema drift |
| Runtime capture ↔ Analyzer | Filesystem contract (`events.jsonl`) | Language/runtime decoupling boundary |
| Gradle plugin ↔ Analyzer | Process boundary (CLI invocation + report files) | Keeps plugin thin and deterministic |
| GitHub Action ↔ Gradle plugin | Command invocation + workflow outputs/artifacts | Action should not duplicate policy logic |
| CI gate ↔ Repository governance | Required status checks/rulesets | Enforces fail-closed merge discipline |
| Release workflow ↔ publication targets | Signed artifacts + deployment API calls | Separate verify and publish stages with approvals |

## CI/CD and Publication Architecture

```
pull_request / push
    ↓
verify workflow (reusable)
    ├─ build + tests
    ├─ coverage report task
    └─ coverage gate task (required check)
           ↓
       merge allowed
           ↓
tag / release trigger
    ↓
release workflow
    ├─ re-verify + sign artifacts
    ├─ publish Java artifacts to Central
    └─ publish distribution assets to GitHub Releases
```

## Sources

- Gradle binary plugin development (plugin/extension/task boundaries, lazy configuration): https://docs.gradle.org/current/userguide/developing_binary_plugin_advanced.html (HIGH)
- Gradle signing/publishing wiring for publication tasks: https://docs.gradle.org/current/userguide/publishing_signing.html (HIGH)
- Gradle JaCoCo verification (build-failing quality gates): https://docs.gradle.org/current/userguide/jacoco_plugin.html (HIGH)
- Spring Boot auto-configuration/starter boundaries and imports file: https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html (HIGH)
- Spring Boot filter registration/order guidance: https://docs.spring.io/spring-boot/reference/web/servlet.html (HIGH)
- GitHub Actions reusable workflows and outputs: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows (HIGH)
- GitHub required status checks and rulesets semantics: https://docs.github.com/en/enterprise-cloud@latest/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks and https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets (HIGH)
- Sonatype Central Portal publication model and Gradle status: https://central.sonatype.org/publish/publish-portal-guide/, https://central.sonatype.org/publish/publish-portal-api/, https://central.sonatype.org/publish/publish-portal-gradle/ (HIGH)
- Ecosystem reference (coverage/dependency visualization and CI report publishing): https://docs.specmatic.io/documentation/insights.html (MEDIUM)
- Ecosystem reference (contract-testing deployment topology patterns): https://microcks.io/documentation/explanations/deployment-topologies/ and https://microcks.io/documentation/guides/automation/gitlab (MEDIUM)

---
*Architecture research for: Java API spec-coverage tooling*
*Researched: 2026-03-04*

# Stack Research

**Domain:** Java-first API specification-vs-test coverage tooling (OSS)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Java (Temurin) | 21 LTS baseline, test matrix on 25 | Runtime + compilation target for tool, plugin, and CI | Matches current repo constraints (`Java 21+`) while testing on 25 catches forward-compat issues early for OSS users. |
| Gradle Wrapper + Kotlin DSL | 9.3.x | Single build/release/test orchestrator for multi-module Java + plugin workflows | Current Gradle docs are on 9.3.1; modern test-suite, publishing, and plugin authoring support are strongest here. |
| Gradle Plugin Dev Stack (`java-gradle-plugin` + `com.gradle.plugin-publish`) | `com.gradle.plugin-publish` 2.0.0 | Productized Gradle plugin channel for Java teams | `plugin-publish` auto-wires plugin development + Maven publish behavior and is the standard way to ship discoverable Gradle plugins. |
| Release Automation (`maven-publish` + `signing` + `org.jreleaser`) | `org.jreleaser` 1.23.x | Signed Maven Central publication + GitHub release automation | Sonatype officially points Gradle users to community plugins and explicitly highlights JReleaser for Central Portal publishing. |
| Maven Central Target | Sonatype Central Publisher Portal API (post-OSSRH) | Canonical OSS Java artifact distribution | OSSRH reached EOL (2025-06-30); Portal tokens/API are the forward path for reliable publishing. |
| CI/CD Runtime | `actions/checkout@v6`, `actions/setup-java@v5`, `gradle/actions/setup-gradle@v5` | Reproducible GitHub builds, caching, wrapper validation, and release jobs | These are the actively maintained major lines shown in action READMEs; good defaults for 2026 Java OSS maintenance. |
| Test Framework Baseline | JUnit BOM 5.13.4 + Jupiter | Deterministic test platform and dependency alignment | JUnit current docs explicitly show BOM 5.13.4 for version alignment in Gradle. |
| Coverage Gate Baseline | JaCoCo 0.8.14 + `jacocoTestCoverageVerification` | Hard fail builds below coverage thresholds | Official Gradle JaCoCo docs on current line show verification tasks and 0.8.14 configuration. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Gradle TestKit (`gradleTestKit()`) | Included with Gradle 9.3.x | Functional tests for the Gradle plugin via `GradleRunner` | Required for production-grade plugin behavior checks (real build execution, not unit-only). |
| `info.solidsoft.pitest` | 1.19.0-rc.3 available (prefer latest stable in production branches) | Mutation testing gate for test quality depth | Use for strict quality bars after baseline unit/integration pass rates are stable. |
| Testcontainers | 2.0.x line | Black-box integration tests against real dependencies | Use for E2E correctness of recorder/analyzer flows when mocks hide failure modes. |
| `picocli` (if Java CLI becomes primary) | 4.7.x line | Java-native CLI ergonomics (commands, help, exit codes) | Use when replacing/wrapping Node-first CLI to make Java the first-class UX surface. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Dependabot or Renovate | Keep action/plugin/library versions current | Essential for long-lived OSS maintenance and security patches. |
| `gradle/actions/wrapper-validation` (or setup-gradle built-in validation) | Detect compromised Gradle wrapper binaries | Keep enabled in CI for supply-chain safety. |
| GitHub Actions artifact + release pipeline | Publish reports/binaries and create release evidence | Pair with JReleaser outputs/log upload for debuggable releases. |

## Installation

```bash
# Gradle wrapper baseline (repo-wide)
./gradlew wrapper --gradle-version 9.3.1

# Build + strict quality gates
./gradlew test jacocoTestReport jacocoTestCoverageVerification

# Release orchestration
./gradlew publish jreleaserFullRelease
```

```kotlin
// build.gradle.kts (plugin/release modules)
plugins {
    `java-gradle-plugin`
    id("com.gradle.plugin-publish") version "2.0.0"
    id("org.jreleaser") version "1.23.0"
    jacoco
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:5.13.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation(gradleTestKit())
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `org.jreleaser` + Portal API publishing | `vanniktech/gradle-maven-publish-plugin` or other community Central plugins | Use if your release model is Maven-Central-only and you do not need GitHub release orchestration. |
| `gradle/actions/setup-gradle@v5` | `actions/setup-java` cache-only mode | Use cache-only mode for very small projects that do not need advanced Gradle caching/insights. |
| JaCoCo + optional PIT | JaCoCo-only | Use JaCoCo-only initially if mutation testing runtime is too expensive for every PR. |
| Java-first CLI surface (`picocli`) | Keep Node CLI as primary UX | Use Node-primary only as a transitional step to avoid immediate analyzer rewrite risk. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| OSSRH-only release flow (`s01.oss.sonatype.org`) as primary | OSSRH is sunset; new publication model is Central Portal/token-driven | Sonatype Central Publisher Portal API via JReleaser or another Portal-compatible plugin. |
| Legacy `gradle/gradle-build-action` patterns | Gradle now recommends `gradle/actions/setup-gradle` | `gradle/actions/setup-gradle@v5`. |
| Floating, unpinned third-party action refs in release workflows | Supply-chain risk from mutable tags | Pin third-party actions to commit SHA while tracking major line updates. |
| Plugin publish <1.0 conventions/manual marker wiring | Older behavior required more manual setup and has weaker modern compatibility expectations | `com.gradle.plugin-publish` 2.x. |
| Treating JaCoCo line coverage as the only gate | High line coverage can still miss behavioral gaps | Combine JaCoCo with spec-coverage gates (existing Yanote threshold checks) and optional mutation testing. |

## Stack Patterns by Variant

**If you prioritize fastest productization with minimal rewrite:**
- Keep analyzer internals as-is for now, but expose Java-first UX through Gradle plugin + Java CLI facade.
- Because this delivers immediate adoption in Java teams while deferring full engine migration risk.

**If you prioritize long-term Java purity:**
- Move analyzer core logic into shared JVM modules and keep Node CLI as compatibility shim.
- Because one runtime simplifies distribution, debugging, and OSS contributor onboarding over time.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `Gradle 9.3.x` | Java 21 and Java 25 toolchains | Aligns with current docs line and Java-first roadmap constraints. |
| `com.gradle.plugin-publish:2.0.0` | Gradle >= 7.4 (best on 9.x) | Plugin portal page states min 7.4; use on 9.x for modern behavior. |
| `org.junit:junit-bom:5.13.4` | JUnit Jupiter + Gradle test task | Recommended version alignment pattern from JUnit current guide. |
| `jacoco toolVersion 0.8.14` | Gradle JaCoCo plugin (`jacocoTestCoverageVerification`) | Explicitly supported in current Gradle docs examples. |
| `actions/setup-java@v5` | Actions runner >= v2.327.1 | Stated in setup-java README breaking changes section. |
| `actions/checkout@v6` | Actions runner >= v2.329.0 for container-action auth scenarios | Stated in checkout README. |

## Confidence by Major Recommendation

| Recommendation | Confidence | Reason |
|----------------|------------|--------|
| Gradle 9.3.x + Java 21 baseline | HIGH | Directly supported by current Gradle docs and project constraints. |
| Plugin publish stack (`java-gradle-plugin` + `plugin-publish` 2.0.0) | HIGH | Official Gradle docs + plugin portal latest metadata. |
| Maven Central via Central Portal + JReleaser | HIGH | Sonatype official docs and plugin metadata show this as practical current path. |
| GitHub Actions major lines (`checkout@v6`, `setup-java@v5`, `setup-gradle@v5`) | HIGH | Maintainer READMEs indicate current major usage and runner requirements. |
| Mutation testing with PIT in default PR gate | MEDIUM | Ecosystem-valid but latest plugin line is RC; rollout strategy should be staged. |
| Java-first CLI via `picocli` | MEDIUM | Strong ecosystem norm, but adoption depends on migration choice from existing Node CLI. |

## Sources

- `Context7 /gradle/gradle/v9_0_0` — plugin authoring/publishing primitives (`java-gradle-plugin`, `maven-publish`, TestKit context).
- `Context7 /websites/junit_current` — JUnit BOM 5.13.4 and Gradle usage pattern.
- `Context7 /websites/jreleaser_guide` — Maven Central portal publishing model + signing flow concepts.
- https://docs.gradle.org/current/userguide/publishing_gradle_plugins.html — current docs line (9.3.1), `com.gradle.plugin-publish` 2.0.0 usage.
- https://plugins.gradle.org/plugin/com.gradle.plugin-publish — latest plugin metadata/version details.
- https://plugins.gradle.org/plugin/org.jreleaser — latest `org.jreleaser` version metadata (1.23.0).
- https://central.sonatype.org/news/20250326_ossrh_sunset/ — OSSRH EOL policy direction.
- https://central.sonatype.org/publish/publish-portal-gradle/ — no official first-party Gradle plugin; community plugin guidance.
- https://central.sonatype.org/publish/requirements/ — Maven Central signing/metadata requirements.
- https://docs.gradle.org/current/userguide/jacoco_plugin.html — JaCoCo verification tasks and toolVersion example (0.8.14).
- https://docs.gradle.org/current/userguide/test_kit.html — Gradle TestKit + `GradleRunner` guidance.
- https://raw.githubusercontent.com/actions/setup-java/main/README.md — v5 line and runner requirement.
- https://raw.githubusercontent.com/gradle/actions/main/README.md — `setup-gradle` v5 usage.
- https://raw.githubusercontent.com/actions/checkout/main/README.md — checkout v6/v5 runner requirements.
- https://plugins.gradle.org/plugin/info.solidsoft.pitest — PIT Gradle plugin current line metadata.

---
*Stack research for: Java-first specification-vs-test coverage OSS tooling*
*Researched: 2026-03-04*

# Feature Research

**Domain:** Java API specification coverage tooling (OpenAPI + test evidence)
**Researched:** 2026-03-04
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OpenAPI ingestion and normalization (file + URL) | Every mature tool starts from the spec as source of truth | MEDIUM | `swagger-coverage` CLI accepts local/remote spec; Schemathesis `st run` accepts file/URL schema. |
| Runtime evidence capture from real tests | Coverage requires observed calls, not static guesses | MEDIUM | `swagger-coverage` and Reqover record request evidence through filter/proxy patterns. |
| Operation-level coverage (method + templated path) | Teams first ask "which endpoints are covered?" | MEDIUM | Mature reports center on endpoint coverage counts and uncovered operations. |
| Response code conformance coverage | Status mismatches are high-impact API regressions | MEDIUM | `swagger-coverage` has explicit status rules and undeclared-status checks. |
| Parameter/request-body condition coverage | Endpoint-only coverage is too shallow for contract confidence | HIGH | `swagger-coverage` supports parameter-oriented conditions; Schemathesis reports parameter validity coverage depth. |
| CI quality gates with deterministic exit behavior | Tool must fail fast in PR/CI when thresholds are missed | MEDIUM | Specmatic governance exposes `minCoveragePercentage`, `maxMissedOperationsInSpec`, and enforcement. |
| Noise control via exclusions and rule config | Real services need to ignore health/deprecated/non-critical paths | MEDIUM | Specmatic supports excluded endpoints; `swagger-coverage` supports rule toggles and `exclude-deprecated`. |
| Machine-readable output for automation | Teams need artifacts for bots, trend jobs, and custom checks | MEDIUM | Mature tools produce HTML/text and/or structured outputs (JSON, JUnit, NDJSON, CTRF). |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Spec-implementation drift detection | Catches endpoints in app-but-not-spec and spec-but-not-app early | HIGH | Specmatic API coverage report explicitly highlights both mismatch directions. |
| Coverage depth beyond endpoints (keywords/examples, valid vs invalid) | Moves from "was hit" to "was meaningfully validated" | HIGH | Schemathesis coverage reports include operations, parameters, schema keywords, examples, and responses. |
| Traceability by suite/run with call counts | Shows which test suite provides evidence and where gaps remain | HIGH | Mature reports expose per-endpoint call counts; suite/run attribution is high-value for large Java repos. |
| Java-native adapter ecosystem (Spring MVC recorder + RestAssured/Cucumber/Karate tagging) | Lowers adoption friction in existing Java test stacks | MEDIUM | `swagger-coverage` ships RestAssured and Karate integrations; this domain rewards adapter breadth. |
| Incremental/PR-focused gating (changed operations first) | Reduces CI noise and accelerates rollout in legacy services | HIGH | Not standard in most OSS tools today; strong practical differentiator for enterprise adoption. |
| Actionable remediation output (missing operation, missing status, suggested next test) | Converts report from dashboard artifact into engineering action list | MEDIUM | Differentiator is workflow quality, not just more metrics. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Mandatory web dashboard/backend in v1 | Stakeholders want "pretty charts" | Adds hosting/state/auth complexity; conflicts with CLI-first delivery and slows OSS adoption | Ship CLI + JSON/HTML artifacts first; let teams plug into existing dashboards |
| Multi-protocol expansion in v1 (AsyncAPI, gRPC, GraphQL) | "One tool for all API styles" sounds strategic | Explodes matching logic and quality surface; risks weakening OpenAPI/Java core value | Keep v1 OpenAPI HTTP focused, design extension points for v2 |
| Built-in autonomous test generation as core scope | Promises quick coverage gains | Fuzzing/stateful generation is a separate product surface with high false-positive risk | Integrate with external generators (e.g., Schemathesis) via report ingestion |
| Single global percentage as only success metric | Easy to communicate | Hides critical gaps (e.g., unimplemented endpoint with high overall percent) | Enforce multi-dimensional gates (coverage %, missed ops in spec, undeclared statuses) |
| Recorder that can break request flow on IO/report errors | "Strictness" is mistaken for reliability | Violates service safety expectations in test/staging; creates flaky pipelines | Fail-open recording with explicit warnings and post-run hard gates |

## Feature Dependencies

```text
[OpenAPI ingestion + normalization]
    └──requires──> [Operation identity matching (method + route template)]
                       └──requires──> [Operation-level coverage report]
                                          └──requires──> [CI quality gates]

[Request/response evidence capture]
    └──requires──> [Status + parameter coverage]
                       └──enables──> [Coverage depth (keywords/examples)]

[Endpoint discovery from running app]
    └──requires──> [Spec-implementation drift detection]
                       └──enables──> [Missed-ops governance rules]

[Structured report schema]
    └──requires──> [Gradle plugin + GitHub Action integrations]

[Spec diff capability]
    └──enables──> [PR-focused incremental gating]
```

### Dependency Notes

- **Operation coverage requires canonical matching:** without stable method/path normalization, all downstream metrics are noisy.
- **Depth metrics depend on capture fidelity:** parameter/keyword coverage is only credible if requests and responses are recorded consistently.
- **Drift detection needs two inventories:** you need both spec operations and discovered runtime endpoints to classify gaps correctly.
- **CI integration depends on deterministic outputs:** stable schemas + exit codes are prerequisites for Gradle and GitHub workflow adoption.
- **Incremental gating depends on diffing:** changed-operation gating is impossible without reliable spec diff and mapping logic.

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate the concept.

- [ ] OpenAPI-first ingestion + operation normalization for Java HTTP services
- [ ] Operation + status + parameter coverage from recorded test traffic
- [ ] Deterministic JSON report + clear CLI summary with uncovered items
- [ ] CI governance gates (minimum coverage, missed operation thresholds)
- [ ] Exclusion/config rules (deprecated ops, health endpoints, status ignore lists)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Spec-implementation drift detection with explicit mismatch categories
- [ ] Suite/run-level traceability and endpoint call counts in report output
- [ ] PR annotation / changed-endpoint-focused failure messaging

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Schema keyword/example positive-vs-negative coverage scoring
- [ ] Native fuzzing/stateful sequence generation engine
- [ ] Multi-protocol coverage (AsyncAPI/gRPC/GraphQL)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| OpenAPI ingestion + normalization | HIGH | MEDIUM | P1 |
| Operation + status + parameter coverage | HIGH | HIGH | P1 |
| CI governance thresholds + deterministic exit codes | HIGH | MEDIUM | P1 |
| Exclusions/rules configuration | HIGH | MEDIUM | P1 |
| Drift detection (spec vs implementation) | HIGH | HIGH | P2 |
| Suite/run traceability | MEDIUM | HIGH | P2 |
| PR-focused incremental gating | MEDIUM | HIGH | P2 |
| Keyword/example depth metrics | MEDIUM | HIGH | P3 |
| Native fuzzing engine | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Swagger Coverage | Specmatic | Schemathesis | Our Approach |
|---------|------------------|-----------|--------------|--------------|
| Endpoint/operation coverage | Strong (core) | Strong | Strong | P1 baseline |
| Status/parameter condition coverage | Strong (rules-driven) | Medium | Strong (deep) | P1 baseline |
| Spec-implementation mismatch detection | Limited | Strong (core value) | Limited | P2 differentiator |
| CI governance thresholds | Medium | Strong | Medium | P1 baseline |
| Java-first integration ergonomics | Strong | Strong | Limited (language-agnostic runner) | Strong and explicit |
| Schema depth (keywords/examples, positive/negative) | Limited | Limited | Strong | P3 / optional integration |

## Sources

- Swagger Coverage README (official): https://raw.githubusercontent.com/viclovsky/swagger-coverage/master/README.md (HIGH)
- Specmatic reports configuration docs (official): https://docs.specmatic.io/references/configuration/reports (HIGH)
- Specmatic complete configuration examples (official): https://docs.specmatic.io/references/configuration/complete-examples.html (HIGH)
- Specmatic API coverage walkthrough (official blog/demo): https://specmatic.io/demonstration/detect-mismatches-between-your-api-specifications-and-implementation-specmatic-api-coverage-report (MEDIUM)
- Schemathesis CLI reference (official): https://schemathesis.readthedocs.io/en/latest/reference/cli/ (HIGH)
- Schemathesis coverage report example (official workbench artifact): https://workbench.schemathesis.io/coverage/mealie-baseline/schema-coverage.html (MEDIUM)
- Reqover docs README (official repository docs): https://raw.githubusercontent.com/reqover/docs/main/README.md (MEDIUM)
- Dredd "How it works" docs (official, OpenAPI 2 era baseline): https://dredd.org/en/latest/how-it-works.html (MEDIUM)

---
*Feature research for: Java API specification coverage tooling*
*Researched: 2026-03-04*

# Pitfalls Research

**Domain:** Java API specification coverage tooling (Spring MVC recorder + OpenAPI analyzer + CLI/Gradle/GitHub delivery)
**Researched:** 2026-03-04
**Confidence:** HIGH for spec/release requirements, MEDIUM for scale thresholds

## Critical Pitfalls

### Pitfall 1: Naive URL Matching Causes False Coverage

**What goes wrong:**
Coverage matching uses raw request URLs (or partially decoded paths) and marks operations incorrectly. Teams see false positives ("covered but not really") and false negatives ("uncovered despite tests").

**Why it happens:**
OpenAPI path templating and Spring MVC lookup-path semantics are more nuanced than string equality. Concrete paths must win over templated paths, and ambiguous or identical templates are easy to mishandle.

**How to avoid:**
- Canonicalize operation identity to `method + normalized route template + server base normalization`.
- Resolve Spring route templates from framework metadata, not only raw `requestURI`.
- Add a preflight lint that fails on ambiguous/invalid OpenAPI paths.
- Maintain golden matching fixtures (encoded chars, templated paths, concrete-vs-template collisions).

**Warning signs:**
- Same request appears under multiple operations in reports.
- "100% covered" while known endpoints remain untested.
- Frequent mismatch between framework route mapping and analyzer operation key.

**Phase to address:**
Phase 1 - Coverage Semantics Contract

---

### Pitfall 2: Operation Identity Drift Across Java and Node Parsers

**What goes wrong:**
Java and Node paths/operations extracted from the same spec do not match exactly, causing inconsistent coverage outcomes by runtime.

**Why it happens:**
The project currently uses separate parser stacks (`swagger-parser` in Java and `@apidevtools/swagger-parser` in Node). Also, `operationId` can be missing (optional) and must be unique when present; over-reliance on it causes collisions or gaps.

**How to avoid:**
- Define one canonical operation key algorithm and test both runtimes against the same corpus.
- Treat `operationId` as metadata, not sole identity.
- Add contract tests that diff extracted operation sets between Java and Node in CI.
- Fix parser options explicitly (`resolve`, `resolveFully`, flatten behavior) and version-pin parser libs.

**Warning signs:**
- Operation counts differ by runtime for identical input spec.
- Same endpoint appears with different keys across reports.
- Coverage changes after parser dependency bumps without source changes.

**Phase to address:**
Phase 1 - Coverage Semantics Contract

---

### Pitfall 3: "Endpoint Hit Once" Metrics Inflate Coverage

**What goes wrong:**
Tools report strong coverage while only happy-path variants are exercised. Response status classes, media types, and parameter serialization variants remain untested.

**Why it happens:**
Coverage denominator is modeled too coarsely at operation level. OpenAPI defines richer behavior space (status codes/ranges, request/response content types, parameter style/explode behavior).

**How to avoid:**
- Split requirement units into: operation presence, status outcome, media type, and key request variants.
- Report both operation coverage and behavior coverage (separate metrics).
- Track an explicit "risk-weighted uncovered list" for failing paths (e.g., auth, error codes).
- Include negative-path tests in quality gates, not only 2xx.

**Warning signs:**
- 100% operation coverage with zero 4xx/5xx assertions.
- Tests pass while API consumers report behavior mismatches.
- Regressions appear only after production traffic includes unsupported content types.

**Phase to address:**
Phase 2 - Coverage Model Expansion

---

### Pitfall 4: Recorder Fail-Open Design Hides Data Loss

**What goes wrong:**
Telemetry write failures do not break request flow (good), but dropped events silently reduce coverage fidelity (bad). Corrupted or incomplete `events.jsonl` then skews reports.

**Why it happens:**
Product teams prioritize request safety but do not add hard observability and integrity checks for recorder output. Concurrent file append and post-chain write points increase edge-case loss risk.

**How to avoid:**
- Keep fail-open request behavior, but add explicit recorder health counters and dropped-event metrics.
- Emit structured diagnostics and fail coverage gate when dropped events exceed threshold.
- Add JSONL integrity validation before analysis and require strict parsing success.
- Use deterministic write strategy (single-writer queue/flush policy) under concurrency.

**Warning signs:**
- Malformed JSONL lines or parse errors in analyzer logs.
- Event count drops under load tests.
- Frequent recorder warnings while coverage still "passes."

**Phase to address:**
Phase 2 - Recorder Correctness and Data Integrity

---

### Pitfall 5: Test Flakiness from Shared State and Parallelism

**What goes wrong:**
CI becomes non-deterministic: reruns pass, first runs fail. Shared files, global JVM properties, and cross-test contamination break confidence in gates.

**Why it happens:**
Parallel execution and mutable shared resources are introduced without isolation controls (`@ResourceLock`, `@Isolated`, unique temp resources). Integration tests also rely on sleep/poll and assumptions that can mask failures.

**How to avoid:**
- Assign unique run IDs and event paths per test execution.
- Use JUnit resource locks/isolation for shared JVM/system resources.
- Replace timing sleeps with deterministic readiness probes + bounded retries.
- Ban "silent skip" patterns in CI-critical suites.

**Warning signs:**
- Failures disappear on rerun without code change.
- Flakes concentrate around filesystem/system-property tests.
- Parallel test mode produces different coverage from sequential mode.

**Phase to address:**
Phase 3 - Deterministic Test Harness

---

### Pitfall 6: Non-Reproducible Builds Undermine Release Trust

**What goes wrong:**
The same commit produces different artifacts or dependency graphs across days/runners, causing hard-to-diagnose release and gate regressions.

**Why it happens:**
Dynamic/changing dependencies, missing lock discipline, and mixed toolchain pipelines introduce hidden variability.

**How to avoid:**
- Enable Gradle dependency locking and commit lockfiles.
- Publish resolved dependency versions for released artifacts.
- Enforce `npm ci` (not `npm install`) in CI packaging paths.
- Add artifact reproducibility checks (hash compare across reruns).

**Warning signs:**
- Dependency graph changes without `build.gradle`/`package-lock` changes.
- Release candidate hashes differ between reruns.
- "Works locally, fails in CI" increases after dependency updates.

**Phase to address:**
Phase 4 - Release Engineering Hardening

---

### Pitfall 7: OSS Publishing Fails Late (Central/Signing/Metadata)

**What goes wrong:**
Publishing fails near release cut due to missing signatures, sources/javadocs, invalid POM metadata, or outdated publishing protocol assumptions.

**Why it happens:**
Teams validate publication requirements only at final release time. Maven Central requirements are strict, and process changes (for example Central protocol updates) can invalidate old automation.

**How to avoid:**
- Add a publish-preflight workflow that validates Central requirements on every release candidate.
- Enforce sources/javadocs/signing/POM metadata checks before tag creation.
- Keep publishing plugins and workflows aligned with current Central guidance.
- Verify release pipeline in a dry-run repository step before official publish.

**Warning signs:**
- Release branch blocked by missing `.asc` or missing `-sources`/`-javadoc` artifacts.
- POM metadata validation errors (SCM/license/developers).
- Last-minute manual edits to publishing configs during release day.

**Phase to address:**
Phase 4 and Phase 5 - Release Engineering + OSS Publishing

---

### Pitfall 8: Supply-Chain Exposure in CI/CD Workflows

**What goes wrong:**
Compromised third-party action/tag or over-privileged token impacts release artifacts, credentials, or repository state.

**Why it happens:**
Workflows use mutable action tags, broad `GITHUB_TOKEN` permissions, and long-lived secrets without policy enforcement.

**How to avoid:**
- Pin third-party actions to full-length commit SHAs.
- Minimize `GITHUB_TOKEN` permissions per job.
- Prefer OIDC short-lived credentials for cloud publishing.
- Protect workflow changes with `CODEOWNERS` and dependency review.

**Warning signs:**
- Workflow files reference floating tags (`@vX`) for critical release jobs.
- Release jobs require broad write permissions not tied to specific steps.
- Security review repeatedly flags workflow dependency drift.

**Phase to address:**
Phase 4 - CI/CD Supply-Chain Hardening

---

### Pitfall 9: Report/CLI Contract Breakage Without Version Governance

**What goes wrong:**
Downstream Gradle plugins, GitHub Actions, and CI gates break when report JSON shape or CLI semantics change unexpectedly.

**Why it happens:**
Public API surface of the tooling is not explicitly versioned/tested as a compatibility contract.

**How to avoid:**
- Define report schema version and compatibility policy.
- Add golden contract tests for CLI exit codes, flags, and JSON report.
- Apply SemVer to all externally consumed artifacts and document deprecations.
- Provide migration notes and compatibility windows before removals.

**Warning signs:**
- Minor releases require downstream hotfixes.
- Consumers pin exact patch versions to avoid breakage.
- Breaking changes appear without explicit major release notes.

**Phase to address:**
Phase 5 - OSS API Governance

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep separate Java/Node coverage semantics without conformance tests | Fast iteration per runtime | Drift, conflicting coverage outputs | Only before Phase 1 completion |
| Treat any single hit as "covered" | Simple reporting and demos | Blind spots in error/media-path behavior | Never for release gates |
| Fail-open recorder without integrity metrics | No request disruption | Silent data loss and false confidence | Acceptable only with explicit dropped-event SLO + gates |
| Manual release checklist only | Fewer automation tasks initially | Human error at release cut | MVP only, must be automated by Phase 4 |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Spring MVC request mapping | Match on raw URI and ignore framework lookup/template rules | Match on normalized framework route template and method |
| OpenAPI parsing (Java + Node) | Assume parser defaults are equivalent | Lock parser versions/options and conformance-test extracted operations |
| Maven Central publishing | Keep legacy OSSRH/old protocol assumptions | Use current Central publishing flow and validate requirements continuously |
| GitHub Actions | Use mutable tags and broad token permissions | Pin SHAs, scope permissions minimally, enforce policy |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-request synchronous file I/O for event writes | Latency spikes, warning storms | Buffered/single-writer architecture with backpressure metrics | Often visible at sustained high request rates (validate with load tests) |
| Full in-memory event ingestion | Analyzer OOM or GC thrash | Stream processing and chunked aggregation | Typically with very large event files (project-specific threshold) |
| Full spec dereference by default | Slow startup/high memory on large specs | Configurable parse mode + pre-validated specs + caching | Large multi-file OpenAPI documents |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recording sensitive headers/body fields in events | Credential/PII leakage via artifacts/logs | Default denylist/redaction + tests proving no secret fields persist |
| Long-lived publish credentials in CI | Credential compromise, repository takeover | OIDC short-lived credentials + secret scoping/review gates |
| Unpinned third-party release actions | Supply-chain compromise of build/release path | SHA pinning + dependency review + action source audits |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Single "coverage %" headline without reason codes | Teams cannot act on failures quickly | Provide uncovered requirements grouped by endpoint/status/media-type with suggested tests |
| Non-deterministic gate outcomes | Trust in tool collapses | Stable, reproducible reports with deterministic ordering and clear diffs |
| Opaque failure messages | Slower adoption and false bug reports | Emit remediation-oriented diagnostics (what failed, why, next step) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Coverage engine:** Operation matching passes happy path but lacks ambiguity/path-template regression suite.
- [ ] **Recorder:** Writes events in normal flow but has no dropped-event SLO or integrity gate.
- [ ] **CI gate:** Threshold check exists but no contract test for CLI exit codes/report schema.
- [ ] **Release pipeline:** Publishes snapshots but not fully signed + metadata-complete Central-compatible artifacts.
- [ ] **Security posture:** Workflows run green but third-party actions are not SHA-pinned.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Incorrect operation matching in released report | HIGH | Freeze release, patch canonical matching, regenerate reports, publish corrected release notes with impact scope |
| Flaky CI gates | MEDIUM | Quarantine flaky suites, enforce isolation/resource locks, rebaseline with deterministic seeds/fixtures |
| Central publishing failure at cut | MEDIUM | Run preflight publish workflow, fix missing metadata/signatures, cut new release candidate |
| Workflow supply-chain incident | HIGH | Rotate credentials, invalidate release artifacts, pin SHAs, audit action graph and rerun trusted build |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Naive URL matching | Phase 1 - Coverage Semantics Contract | Golden fixture suite proving correct mapping for concrete/template/encoded paths |
| Parser drift across runtimes | Phase 1 - Coverage Semantics Contract | CI diff test: Java vs Node extracted operation set must match |
| Inflated endpoint-only metrics | Phase 2 - Coverage Model Expansion | Report includes operation + behavior coverage dimensions with failing examples |
| Recorder hidden data loss | Phase 2 - Recorder Correctness and Data Integrity | Dropped-event metric and JSONL integrity check enforced in gates |
| Flaky tests from shared state | Phase 3 - Deterministic Test Harness | Repeated CI runs yield identical outcomes under parallel execution |
| Non-reproducible builds | Phase 4 - Release Engineering Hardening | Same commit produces identical dependency lock state and artifact hashes |
| Late OSS publish failures | Phase 4/5 - Release Engineering + OSS Publishing | Publish-preflight job passes on every release candidate |
| CI/CD supply-chain exposure | Phase 4 - CI/CD Supply-Chain Hardening | Policy check enforces SHA-pinned actions and least-privilege tokens |
| Contract breakage in reports/CLI | Phase 5 - OSS API Governance | Backward-compat contract tests + SemVer release checks |

## Sources

- OpenAPI Specification 3.1.0 - operation/path/parameter/response rules (HIGH): https://spec.openapis.org/oas/v3.1.0
- Swagger Parser README - parse option semantics (`resolve`, `resolveFully`, `flatten`) (HIGH): https://github.com/swagger-api/swagger-parser/blob/master/README.md
- Spring Framework path matching reference (HIGH): https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-path.html
- JUnit parallel execution and synchronization (`@ResourceLock`, `@Isolated`) (HIGH): https://docs.junit.org/5.14.2/writing-tests/parallel-execution
- Gradle dependency locking and reproducible build guidance (HIGH): https://docs.gradle.org/current/userguide/dependency_locking.html
- Gradle Maven Publish plugin and Central publishing notes (HIGH): https://docs.gradle.org/current/userguide/publishing_maven.html
- Sonatype Central publishing requirements (HIGH): https://central.sonatype.org/publish/requirements/
- GitHub Actions secure use reference (pinning, permissions, secret handling) (HIGH): https://docs.github.com/en/actions/reference/secure-use-reference
- Semantic Versioning 2.0.0 (HIGH): https://semver.org/
- Project context files (HIGH): `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONCERNS.md`

---
*Pitfalls research for: Java API specification coverage tooling*
*Researched: 2026-03-04*