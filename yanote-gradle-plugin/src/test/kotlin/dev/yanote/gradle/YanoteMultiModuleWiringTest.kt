package dev.yanote.gradle

import org.gradle.testkit.runner.BuildResult
import org.gradle.testkit.runner.GradleRunner
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.writeText

class YanoteMultiModuleWiringTest {
    @TempDir
    lateinit var projectDir: Path

    @Test
    fun `auto-discovers java modules and wires aggregate tasks`() {
        writeSettings(
            """
            rootProject.name = "multi-module-test"
            include(":service", ":api", ":docs")
            """.trimIndent()
        )

        writeBuildFile(
            """
            plugins {
                id("dev.yanote.gradle")
            }

            project(":service") {
                apply(plugin = "java")
            }

            project(":api") {
                apply(plugin = "java")
            }

            tasks.register("printYanoteWiring") {
                doLast {
                    val moduleReports = subprojects
                        .filter { it.tasks.findByName("yanoteReport") != null }
                        .map { "${'$'}{it.path}:yanoteReport" }
                        .sorted()
                    val moduleChecks = subprojects
                        .filter { it.tasks.findByName("yanoteCheck") != null }
                        .map { "${'$'}{it.path}:yanoteCheck" }
                        .sorted()

                    val rootReport = tasks.named("yanoteReport").get()
                    val rootCheck = tasks.named("yanoteCheck").get()
                    val reportDepsSorted = rootReport.taskDependencies.getDependencies(rootReport)
                        .map { it.path }
                        .sorted()
                    val checkDepsSorted = rootCheck.taskDependencies.getDependencies(rootCheck)
                        .map { it.path }
                        .sorted()

                    println("MODULE_REPORT_TASKS=" + moduleReports.joinToString(","))
                    println("MODULE_CHECK_TASKS=" + moduleChecks.joinToString(","))
                    println("ROOT_REPORT_DEPS_SORTED=" + reportDepsSorted.joinToString(","))
                    println("ROOT_CHECK_DEPS_SORTED=" + checkDepsSorted.joinToString(","))
                }
            }
            """.trimIndent()
        )

        val result = runGradle("printYanoteWiring")

        assertTrue(result.output.contains("MODULE_REPORT_TASKS=:api:yanoteReport,:service:yanoteReport"))
        assertTrue(result.output.contains("MODULE_CHECK_TASKS=:api:yanoteCheck,:service:yanoteCheck"))
        assertTrue(result.output.contains("ROOT_REPORT_DEPS_SORTED=:api:yanoteReport,:service:yanoteReport"))
        assertTrue(result.output.contains("ROOT_CHECK_DEPS_SORTED=:api:yanoteCheck,:service:yanoteCheck"))
        assertFalse(result.output.contains(":docs:yanoteReport"))
        assertFalse(result.output.contains(":docs:yanoteCheck"))
    }

    @Test
    fun `exclude list removes modules from per-module and aggregate scope`() {
        writeSettings(
            """
            rootProject.name = "multi-module-test"
            include(":service", ":api", ":docs")
            """.trimIndent()
        )

        writeBuildFile(
            """
            plugins {
                id("dev.yanote.gradle")
            }

            yanote {
                moduleExcludes.set(listOf(":service"))
            }

            project(":service") {
                apply(plugin = "java")
            }

            project(":api") {
                apply(plugin = "java")
            }

            tasks.register("printYanoteWiring") {
                doLast {
                    val moduleReports = subprojects
                        .filter { it.tasks.findByName("yanoteReport") != null }
                        .map { "${'$'}{it.path}:yanoteReport" }
                        .sorted()
                    val rootReport = tasks.named("yanoteReport").get()
                    val reportDepsSorted = rootReport.taskDependencies.getDependencies(rootReport)
                        .map { it.path }
                        .sorted()

                    println("MODULE_REPORT_TASKS=" + moduleReports.joinToString(","))
                    println("ROOT_REPORT_DEPS_SORTED=" + reportDepsSorted.joinToString(","))
                }
            }
            """.trimIndent()
        )

        val result = runGradle("printYanoteWiring")

        assertTrue(result.output.contains("MODULE_REPORT_TASKS=:api:yanoteReport"))
        assertTrue(result.output.contains("ROOT_REPORT_DEPS_SORTED=:api:yanoteReport"))
        assertFalse(result.output.contains(":service:yanoteReport"))
    }

    @Test
    fun `aggregate dependencies are attached in deterministic project path order`() {
        writeSettings(
            """
            rootProject.name = "multi-module-test"
            include(":zeta", ":alpha", ":middle")
            """.trimIndent()
        )

        writeBuildFile(
            """
            plugins {
                id("dev.yanote.gradle")
            }

            project(":zeta") {
                apply(plugin = "java")
            }

            project(":alpha") {
                apply(plugin = "java")
            }

            project(":middle") {
                apply(plugin = "java")
            }

            tasks.register("printYanoteDependencyOrder") {
                doLast {
                    val rootReport = tasks.named("yanoteReport").get()
                    val orderedDependencies = rootReport.dependsOn
                        .mapNotNull { dep ->
                            when (dep) {
                                is org.gradle.api.Task -> dep.path
                                is org.gradle.api.tasks.TaskProvider<*> -> dep.get().path
                                else -> null
                            }
                        }
                        .filter { it.endsWith(":yanoteReport") }
                    println("ROOT_REPORT_DEPS_ORDER=" + orderedDependencies.joinToString(","))
                }
            }
            """.trimIndent()
        )

        val result = runGradle("printYanoteDependencyOrder")

        assertTrue(
            result.output.contains("ROOT_REPORT_DEPS_ORDER=:alpha:yanoteReport,:middle:yanoteReport,:zeta:yanoteReport"),
            "Expected aggregate dependencies to be wired in sorted project-path order"
        )
    }

    private fun runGradle(vararg args: String): BuildResult {
        return GradleRunner.create()
            .withProjectDir(projectDir.toFile())
            .withPluginClasspath()
            .withArguments(*args, "--stacktrace")
            .build()
    }

    private fun writeSettings(content: String) {
        projectDir.resolve("settings.gradle.kts").writeText(content)
    }

    private fun writeBuildFile(content: String) {
        projectDir.resolve("build.gradle.kts").writeText(content)
        projectDir.resolve("src/main/java").createDirectories()
    }
}
