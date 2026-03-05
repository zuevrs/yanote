package dev.yanote.gradle

import dev.yanote.gradle.tasks.YanoteCheckTask
import dev.yanote.gradle.tasks.YanoteReportTask
import org.gradle.api.GradleException
import org.gradle.testfixtures.ProjectBuilder
import org.gradle.testkit.runner.BuildResult
import org.gradle.testkit.runner.GradleRunner
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.writeText

class YanoteTaskExecutionContractTest {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `yanoteReport defaults to local profile and remains non-blocking with missing optional inputs`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val task = project.tasks.create("contractReport", YanoteReportTask::class.java)
        task.defaultProfile.set("local")
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/report"))

        assertDoesNotThrow { task.runReport() }
        val args = task.buildAnalyzerArguments()
        assertTrue(args.contains("--profile"))
        assertTrue(args.contains("local"))
    }

    @Test
    fun `yanoteCheck defaults to ci profile and fails hard on missing required inputs`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val task = project.tasks.create("contractCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/check"))

        val error = org.junit.jupiter.api.assertThrows<GradleException> {
            task.runCheck()
        }
        assertTrue(error.message!!.contains("spec"))
        assertTrue(error.message!!.contains("events"))

        val args = task.buildAnalyzerArguments()
        assertTrue(args.contains("--profile"))
        assertTrue(args.contains("ci"))
    }

    @Test
    fun `effective policy precedence is override then policy file then defaults`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val policyFile = tempDir.resolve("yanote-policy.yml")
        policyFile.writeText(
            """
            profile: local
            thresholds:
              minCoverage: 70
              minAggregate: 60
            """.trimIndent()
        )

        val task = project.tasks.create("precedenceReport", YanoteReportTask::class.java)
        task.defaultProfile.set("local")
        task.policyPath.set(policyFile.toString())
        task.profile.set("ci")
        task.minCoverage.set(91)
        task.minAggregate.set(88)
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/report"))

        val args = task.buildAnalyzerArguments()
        assertEquals(
            listOf(
                "report",
                "--out", task.outputDir.get().asFile.absolutePath,
                "--policy", policyFile.toString(),
                "--profile", "ci",
                "--min-coverage", "91",
                "--min-aggregate", "88"
            ),
            args
        )
    }

    @Test
    fun `output contract includes per-module paths and aggregate report path`() {
        writeSettings(
            """
            rootProject.name = "execution-contract"
            include(":service")
            """.trimIndent()
        )

        writeBuildFile(
            """
            import dev.yanote.gradle.tasks.YanoteReportTask

            plugins {
                id("io.github.zuevrs.yanote.gradle")
            }

            project(":service") {
                apply(plugin = "java")
            }

            tasks.register("printOutputContracts") {
                doLast {
                    val rootReport = tasks.named("yanoteReport", YanoteReportTask::class.java).get()
                    val moduleReport = project(":service").tasks.named("yanoteReport", YanoteReportTask::class.java).get()
                    println("ROOT_REPORT_OUT=" + rootReport.outputDir.get().asFile.absolutePath)
                    println("MODULE_REPORT_OUT=" + moduleReport.outputDir.get().asFile.absolutePath)
                }
            }
            """.trimIndent()
        )

        val result = runGradle("printOutputContracts")
        assertTrue(result.output.contains("ROOT_REPORT_OUT="))
        assertTrue(result.output.contains("aggregate"))
        assertTrue(result.output.contains("MODULE_REPORT_OUT="))
        assertTrue(result.output.contains("/modules/service/"))
    }

    private fun runGradle(vararg args: String): BuildResult {
        return GradleRunner.create()
            .withProjectDir(tempDir.toFile())
            .withPluginClasspath()
            .withArguments(*args, "--stacktrace")
            .build()
    }

    private fun writeSettings(content: String) {
        tempDir.resolve("settings.gradle.kts").writeText(content)
    }

    private fun writeBuildFile(content: String) {
        tempDir.resolve("build.gradle.kts").writeText(content)
        tempDir.resolve("src/main/java").createDirectories()
    }
}
