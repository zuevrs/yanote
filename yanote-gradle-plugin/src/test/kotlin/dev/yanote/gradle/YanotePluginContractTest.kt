package dev.yanote.gradle

import org.gradle.testkit.runner.BuildResult
import org.gradle.testkit.runner.GradleRunner
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.writeText
import kotlin.reflect.full.memberProperties

class YanotePluginContractTest {
    @TempDir
    lateinit var projectDir: Path

    @Test
    fun `registers stable task names for v1`() {
        writeBuildFile(
            """
            plugins {
                id("java")
                id("dev.yanote.gradle")
            }
            """.trimIndent()
        )

        val result = runGradle("tasks", "--all")

        assertTrue(result.output.contains("yanoteReport"), "Expected yanoteReport task to be visible")
        assertTrue(result.output.contains("yanoteCheck"), "Expected yanoteCheck task to be visible")
    }

    @Test
    fun `exposes only the limited override extension surface`() {
        val propertyNames = YanoteExtension::class.memberProperties
            .map { it.name }
            .sorted()

        assertEquals(
            listOf(
                "criticalOperations",
                "exclude",
                "hookIntoCheck",
                "minAggregate",
                "minCoverage",
                "moduleExcludes",
                "policyPath",
                "profile"
            ),
            propertyNames,
            "Expected extension to expose only the locked override properties"
        )
    }

    @Test
    fun `does not modify check lifecycle unless explicitly enabled`() {
        writeBuildFile(
            """
            plugins {
                id("java")
                id("dev.yanote.gradle")
            }

            tasks.register("printCheckDependencies") {
                doLast {
                    val checkTask = tasks.named("check").get()
                    val deps = checkTask.taskDependencies.getDependencies(checkTask)
                        .map { it.name }
                        .sorted()
                    println("CHECK_DEPS=" + deps.joinToString(","))
                }
            }
            """.trimIndent()
        )

        val defaultResult = runGradle("printCheckDependencies")
        assertFalse(
            defaultResult.output.contains("yanoteCheck"),
            "check should not depend on yanoteCheck by default"
        )

        writeBuildFile(
            """
            plugins {
                id("java")
                id("dev.yanote.gradle")
            }

            yanote {
                hookIntoCheck.set(true)
            }

            tasks.register("printCheckDependencies") {
                doLast {
                    val checkTask = tasks.named("check").get()
                    val deps = checkTask.taskDependencies.getDependencies(checkTask)
                        .map { it.name }
                        .sorted()
                    println("CHECK_DEPS=" + deps.joinToString(","))
                }
            }
            """.trimIndent()
        )

        val optInResult = runGradle("printCheckDependencies")
        assertTrue(
            optInResult.output.contains("yanoteCheck"),
            "check should depend on yanoteCheck when explicitly enabled"
        )
    }

    private fun runGradle(vararg args: String): BuildResult {
        return GradleRunner.create()
            .withProjectDir(projectDir.toFile())
            .withPluginClasspath()
            .withArguments(*args, "--stacktrace")
            .build()
    }

    private fun writeBuildFile(buildScript: String) {
        projectDir.resolve("settings.gradle.kts").writeText("rootProject.name = \"plugin-contract-test\"")
        projectDir.resolve("build.gradle.kts").writeText(buildScript)
        projectDir.resolve("src/main/java").createDirectories()
    }
}
