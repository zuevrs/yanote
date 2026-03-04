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
