# S04: Java Build And Ci Delivery Surfaces

**Goal:** Deliver the Java-native Gradle delivery surface for Yanote without changing analyzer semantics.
**Demo:** Deliver the Java-native Gradle delivery surface for Yanote without changing analyzer semantics.

## Must-Haves


## Tasks

- [x] **T01: Gradle delivery surface** `est:19 min`
  - Deliver the Java-native Gradle delivery surface for Yanote without changing analyzer semantics.

Purpose: Satisfy DELV-02 by exposing stable v1 Gradle tasks that wrap the deterministic CLI/governance contract with low-friction local defaults and explicit blocking checks.
Output: New `yanote-gradle-plugin` module with stable tasks, multi-module aggregate wiring, and contract tests.
- [x] **T02: GitHub CI delivery surface** `est:9 min`
  - Deliver the GitHub Actions channel for Yanote checks with deterministic PR feedback and artifact retention.

Purpose: Satisfy DELV-03 by exposing GitHub-native check/summarization/artifact surfaces that preserve existing CLI semantics and strict CI defaults.
Output: New workflow + summary/artifact helper scripts that create reliable merge-review feedback without PR-comment dependency.
- [x] **T03: Merge-blocking CI hardening** `est:30 min`
  - Harden merge-blocking CI behavior for Phase 4 with branch-aware workflows and Java 21 enforcement.

Purpose: Complete QUAL-02 and QUAL-03 by making required checks deterministic, actionable, and branch-protection ready while preserving PR speed.
Output: Updated CI workflow topology, Java 21 assertion tooling, and required-check contract documentation.
- [x] **T04: Gradle CI parity rewire** `est:3 min`
  - Close the Phase 4 blocker by wiring GitHub validation to the aggregate Gradle `yanoteCheck` path while preserving deterministic failure-triage behavior.

Purpose: Restore DELV-02/DELV-03 channel parity and keep QUAL-02/QUAL-03 merge-blocking CI guarantees intact.
Output: One focused CI wiring patch that replaces CLI-only validation execution with rooted Gradle check execution and keeps always-on summary/artifact retention.

## Files Likely Touched

- `settings.gradle.kts`
- `yanote-gradle-plugin/build.gradle.kts`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanoteExtension.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteTaskExecutionContractTest.kt`
- `.github/workflows/yanote-ci.yml`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `.github/workflows/yanote-ci.yml`
- `scripts/ci/assert-java21.sh`
- `scripts/ci/run-v1-e2e.sh`
- `.github/BRANCH_PROTECTION.md`
- `examples/docker-compose.yml`
- `.github/workflows/yanote-ci.yml`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
