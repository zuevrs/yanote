package dev.yanote.gradle

import dev.yanote.gradle.tasks.YanoteCheckTask
import dev.yanote.gradle.tasks.YanoteReportTask
import org.gradle.api.GradleException
import org.gradle.testfixtures.ProjectBuilder
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

class YanoteRemoteSpecContractTest {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `yanoteCheck accepts supported remote spec urls and persists sanitized command args`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val eventsFile = writeEventsFixture()
        val analyzerLauncher = writeAnalyzerFixture()
        val outputDir = project.layout.buildDirectory.dir("yanote/modules/app/check")
        val remoteSpecUrl = "http://127.0.0.1:18080/specs/simple.yaml"

        val task = project.tasks.create("remoteCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.specPath.set(remoteSpecUrl)
        task.eventsPath.set(eventsFile.toString())
        task.analyzerPath.set(analyzerLauncher.toString())
        task.outputDir.set(outputDir)

        assertDoesNotThrow { task.runCheck() }

        val argsPath = outputDir.get().asFile.toPath().resolve("yanote-check-command.args")
        val argsSurface = argsPath.readText()
        assertTrue(argsSurface.contains("report --spec <remote-url>"))
        assertTrue(argsSurface.contains("analyzer_path=${analyzerLauncher.toAbsolutePath()}"))
        assertTrue(argsSurface.contains("analyzer_contract=standalone-launcher"))
        assertTrue(argsSurface.contains("spec_source_kind=remote-url"))
        assertTrue(argsSurface.contains("spec_source_ref=$remoteSpecUrl"))
        assertFalse(argsSurface.contains("--spec $remoteSpecUrl"))

        val invokedArgs = outputDir.get().asFile.toPath().resolve("analyzer-invoked.txt").readText()
        assertTrue(invokedArgs.contains(remoteSpecUrl))
    }

    @Test
    fun `yanoteCheck keeps local-path validation fail-closed`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val eventsFile = writeEventsFixture()
        val analyzerLauncher = writeAnalyzerFixture()

        val task = project.tasks.create("localMissingCheck", YanoteCheckTask::class.java)
        task.defaultProfile.set("ci")
        task.specPath.set(tempDir.resolve("missing.yaml").toString())
        task.eventsPath.set(eventsFile.toString())
        task.analyzerPath.set(analyzerLauncher.toString())
        task.outputDir.set(project.layout.buildDirectory.dir("yanote/modules/app/check-missing"))

        val error = assertThrows<GradleException> {
            task.runCheck()
        }

        assertTrue(error.message!!.contains("spec exists=false"))
        assertTrue(error.message!!.contains("events exists=true"))
    }

    @Test
    fun `yanoteReport accepts supported remote spec urls and persists sanitized command args`() {
        val project = ProjectBuilder.builder().withProjectDir(tempDir.toFile()).build()
        val eventsFile = writeEventsFixture()
        val analyzerLauncher = writeAnalyzerFixture()
        val outputDir = project.layout.buildDirectory.dir("yanote/modules/app/report")
        val remoteSpecUrl = "http://127.0.0.1:18080/specs/simple.yaml"

        val task = project.tasks.create("remoteReport", YanoteReportTask::class.java)
        task.defaultProfile.set("local")
        task.specPath.set(remoteSpecUrl)
        task.eventsPath.set(eventsFile.toString())
        task.analyzerPath.set(analyzerLauncher.toString())
        task.outputDir.set(outputDir)

        assertDoesNotThrow { task.runReport() }

        val argsPath = outputDir.get().asFile.toPath().resolve("yanote-report-command.args")
        val argsSurface = argsPath.readText()
        assertTrue(argsSurface.contains("report --spec <remote-url>"))
        assertTrue(argsSurface.contains("analyzer_path=${analyzerLauncher.toAbsolutePath()}"))
        assertTrue(argsSurface.contains("analyzer_contract=standalone-launcher"))
        assertTrue(argsSurface.contains("spec_source_kind=remote-url"))
        assertTrue(argsSurface.contains("spec_source_ref=$remoteSpecUrl"))
        assertFalse(argsSurface.contains("--spec $remoteSpecUrl"))

        val invokedPath = outputDir.get().asFile.toPath().resolve("analyzer-invoked.txt")
        val htmlPath = outputDir.get().asFile.toPath().resolve("yanote-report.html")
        assertTrue(invokedPath.exists())
        assertTrue(invokedPath.readText().contains(remoteSpecUrl))
        assertTrue(htmlPath.exists())
        assertTrue(htmlPath.readText().contains("analyzer-html-pass-through"))
        assertTrue(htmlPath.readText().contains(remoteSpecUrl))
    }

    private fun writeEventsFixture(): Path {
        val eventsFile = tempDir.resolve("events.ci.fixture.jsonl")
        eventsFile.writeText("{\"kind\":\"http\",\"method\":\"GET\"}\n")
        return eventsFile
    }

    private fun writeAnalyzerFixture(): Path {
        val runtimeFile = tempDir.resolve("fake-analyzer-runtime.cjs")
        runtimeFile.parent.createDirectories()
        runtimeFile.writeText(
            """
            const fs = require('node:fs');
            const path = require('node:path');

            const args = process.argv.slice(2);
            const outIndex = args.indexOf('--out');
            if (outIndex >= 0 && outIndex + 1 < args.length) {
              const outDir = args[outIndex + 1];
              fs.mkdirSync(outDir, { recursive: true });
              fs.writeFileSync(path.join(outDir, 'analyzer-invoked.txt'), JSON.stringify(args), 'utf8');
              const specRef = args[args.indexOf('--spec') + 1];
              fs.writeFileSync(
                path.join(outDir, 'yanote-report.json'),
                JSON.stringify({ status: 'ok', specSource: { kind: 'remote-url', reference: specRef } }),
                'utf8'
              );
              fs.writeFileSync(
                path.join(outDir, 'yanote-report.html'),
                `<html><body>analyzer-html-pass-through spec=${'$'}{specRef}</body></html>`,
                'utf8'
              );
            }
            process.exit(0);
            """.trimIndent()
        )

        val launcherFile = tempDir.resolve("yanote")
        launcherFile.writeText(
            """
            #!/usr/bin/env bash
            set -euo pipefail
            SCRIPT_DIR="$(cd -- "$(dirname -- "${'$'}{BASH_SOURCE[0]}")" && pwd)"
            exec node "${'$'}{SCRIPT_DIR}/fake-analyzer-runtime.cjs" "${'$'}@"
            """.trimIndent() + "\n"
        )
        launcherFile.toFile().setExecutable(true)
        return launcherFile
    }
}
