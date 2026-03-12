# T01: 04-java-build-and-ci-delivery-surfaces 01

**Slice:** S04 — **Milestone:** M001

## Description

Deliver the Java-native Gradle delivery surface for Yanote without changing analyzer semantics.

Purpose: Satisfy DELV-02 by exposing stable v1 Gradle tasks that wrap the deterministic CLI/governance contract with low-friction local defaults and explicit blocking checks.
Output: New `yanote-gradle-plugin` module with stable tasks, multi-module aggregate wiring, and contract tests.

## Files

- `settings.gradle.kts`
- `yanote-gradle-plugin/build.gradle.kts`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanoteExtension.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanotePluginContractTest.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteMultiModuleWiringTest.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteTaskExecutionContractTest.kt`
