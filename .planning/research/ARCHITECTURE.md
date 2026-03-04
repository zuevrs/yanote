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
