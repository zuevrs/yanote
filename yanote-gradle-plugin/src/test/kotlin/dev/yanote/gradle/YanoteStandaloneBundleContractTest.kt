package dev.yanote.gradle

import dev.yanote.gradle.tasks.YanoteCheckTask
import dev.yanote.gradle.tasks.YanoteReportTask
import org.gradle.api.GradleException
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.readText
import kotlin.io.path.writeText

class YanoteStandaloneBundleContractTest {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `plugin defaults analyzer tasks to the standalone launcher path`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        project.plugins.apply(YanotePlugin::class.java)

        val expectedPath = standaloneLauncherPath().toFile().absolutePath
        val reportTask = project.tasks.named("yanoteReport", YanoteReportTask::class.java).get()
        val checkTask = project.tasks.named("yanoteCheck", YanoteCheckTask::class.java).get()

        assertEquals(expectedPath, reportTask.analyzerPath.get())
        assertEquals(expectedPath, checkTask.analyzerPath.get())
    }

    @Test
    fun `yanoteCheck fails with standalone launcher guidance when bundle is missing`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val task = project.tasks.create("missingLauncherCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.specPath.set(writeSpecFixture().toString())
        task.eventsPath.set(writeEventsFixture().toString())
        task.analyzerPath.set(standaloneLauncherPath().toString())
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/check"))

        val error = assertThrows<GradleException> {
            task.runCheck()
        }

        assertTrue(error.message!!.contains("dist/standalone-analyzer/bin/yanote"))
        assertTrue(error.message!!.contains("./gradlew distStandaloneAnalyzer"))
    }

    @Test
    fun `yanoteReport writes stub diagnostics when standalone launcher is missing`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val outputDir = project.layout.buildDirectory.dir("yanote/modules/app/report")
        val task = project.tasks.create("missingLauncherReport", YanoteReportTask::class.java)
        task.defaultProfile.set("local")
        task.specPath.set(writeSpecFixture().toString())
        task.eventsPath.set(writeEventsFixture().toString())
        task.analyzerPath.set(standaloneLauncherPath().toString())
        task.outputDir.set(outputDir)

        assertDoesNotThrow { task.runReport() }

        val diagnostics = outputDir.get().asFile.toPath().resolve("yanote-report-diagnostics.txt").readText()
        val stub = outputDir.get().asFile.toPath().resolve("yanote-report.json").readText()
        val argsSurface = outputDir.get().asFile.toPath().resolve("yanote-report-command.args").readText()

        assertTrue(diagnostics.contains("dist/standalone-analyzer/bin/yanote"))
        assertTrue(diagnostics.contains("./gradlew distStandaloneAnalyzer"))
        assertTrue(stub.contains("analyzer launcher missing"))
        assertTrue(argsSurface.contains("analyzer_contract=standalone-launcher"))
        assertTrue(argsSurface.contains("analyzer_path=${standaloneLauncherPath().toAbsolutePath()}"))
    }

    @Test
    fun `yanoteCheck rejects analyzerPath directory overrides`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val launcherDir = tempDir.resolve("dist/standalone-analyzer/bin")
        launcherDir.createDirectories()

        val task = project.tasks.create("directoryOverrideCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.specPath.set(writeSpecFixture().toString())
        task.eventsPath.set(writeEventsFixture().toString())
        task.analyzerPath.set(launcherDir.toString())
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/check-directory"))

        val error = assertThrows<GradleException> {
            task.runCheck()
        }

        assertTrue(error.message!!.contains("must point to a launcher file, not a directory"))
    }

    @Test
    fun `yanoteCheck rejects raw cjs analyzer overrides`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()

        val task = project.tasks.create("rawCjsOverrideCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.specPath.set(writeSpecFixture().toString())
        task.eventsPath.set(writeEventsFixture().toString())
        task.analyzerPath.set(tempDir.resolve("dist/node-analyzer/bin/yanote.cjs").toString())
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/check-raw-cjs"))

        val error = assertThrows<GradleException> {
            task.runCheck()
        }

        assertTrue(error.message!!.contains("standalone launcher contract"))
        assertTrue(error.message!!.contains("raw yanote.cjs runtime"))
    }

    private fun standaloneLauncherPath(): Path {
        return tempDir.toRealPath().resolve("dist/standalone-analyzer/bin/yanote")
    }

    private fun writeSpecFixture(): Path {
        val specFile = tempDir.resolve("simple.yaml")
        specFile.writeText(
            """
            openapi: 3.0.0
            info:
              title: Fixture
              version: 1.0.0
            paths: {}
            """.trimIndent() + "\n"
        )
        return specFile
    }

    private fun writeEventsFixture(): Path {
        val eventsFile = tempDir.resolve("events.ci.fixture.jsonl")
        eventsFile.writeText("{\"kind\":\"http\",\"method\":\"GET\"}\n")
        return eventsFile
    }
}
