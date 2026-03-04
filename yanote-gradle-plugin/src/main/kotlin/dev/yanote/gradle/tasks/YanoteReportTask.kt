package dev.yanote.gradle.tasks

import org.gradle.api.GradleException
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import java.io.File
import java.nio.charset.StandardCharsets
import java.nio.file.Files

abstract class YanoteReportTask : DefaultTask() {
    @get:Input
    @get:Optional
    abstract val specPath: Property<String>

    @get:Input
    @get:Optional
    abstract val eventsPath: Property<String>

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Input
    @get:Optional
    abstract val policyPath: Property<String>

    @get:Input
    @get:Optional
    abstract val profile: Property<String>

    @get:Input
    @get:Optional
    abstract val minCoverage: Property<Int>

    @get:Input
    @get:Optional
    abstract val minAggregate: Property<Int>

    @get:Input
    abstract val criticalOperations: ListProperty<String>

    @get:Input
    abstract val exclude: ListProperty<String>

    @get:Input
    abstract val defaultProfile: Property<String>

    @get:Input
    @get:Optional
    abstract val analyzerPath: Property<String>

    init {
        defaultProfile.convention("local")
        criticalOperations.convention(emptyList())
        exclude.convention(emptyList())
    }

    fun buildAnalyzerArguments(): List<String> {
        val policy = parsePolicyOverrides(policyPath.orNull)
        val effectiveProfile = profile.orNull?.takeUnless { it.isBlank() }
            ?: policy.profile
            ?: defaultProfile.get()
        val effectiveMinCoverage = minCoverage.orNull ?: policy.minCoverage
        val effectiveMinAggregate = minAggregate.orNull ?: policy.minAggregate

        val args = mutableListOf<String>()
        args += "report"

        specPath.orNull?.trim()?.takeIf { it.isNotEmpty() }?.let {
            args += "--spec"
            args += it
        }
        eventsPath.orNull?.trim()?.takeIf { it.isNotEmpty() }?.let {
            args += "--events"
            args += it
        }

        args += "--out"
        args += outputDir.get().asFile.absolutePath

        policyPath.orNull?.trim()?.takeIf { it.isNotEmpty() }?.let {
            args += "--policy"
            args += it
        }

        args += "--profile"
        args += effectiveProfile

        effectiveMinCoverage?.let {
            args += "--min-coverage"
            args += it.toString()
        }
        effectiveMinAggregate?.let {
            args += "--min-aggregate"
            args += it.toString()
        }

        criticalOperations.getOrElse(emptyList())
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach {
                args += "--critical-operation"
                args += it
            }

        exclude.getOrElse(emptyList())
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach {
                args += "--exclude"
                args += it
            }

        return args
    }

    @TaskAction
    fun runReport() {
        val outputDirectory = outputDir.get().asFile
        outputDirectory.mkdirs()

        val args = buildAnalyzerArguments()
        writeText(outputDirectory.resolve("yanote-report-command.args"), args.joinToString(" "))

        val missingInputs = mutableListOf<String>()
        if (specPath.orNull.isNullOrBlank()) missingInputs += "specPath"
        if (eventsPath.orNull.isNullOrBlank()) missingInputs += "eventsPath"

        if (missingInputs.isNotEmpty()) {
            writeDiagnostics(
                outputDirectory,
                "yanoteReport skipped analyzer execution because optional inputs were missing: ${missingInputs.joinToString(", ")}"
            )
            writeReportStub(outputDirectory, "missing optional inputs: ${missingInputs.joinToString(", ")}")
            return
        }

        val analyzer = analyzerFileOrNull()
        if (analyzer == null || !analyzer.exists()) {
            writeDiagnostics(
                outputDirectory,
                "yanoteReport analyzer runtime not found at ${analyzer?.absolutePath ?: "<unset>"}; run ./gradlew distNodeAnalyzer for full execution."
            )
            writeReportStub(outputDirectory, "analyzer runtime missing")
            return
        }

        val result = project.exec {
            commandLine(listOf("node", analyzer.absolutePath) + args)
            isIgnoreExitValue = true
        }

        if (result.exitValue != 0) {
            writeDiagnostics(
                outputDirectory,
                "yanoteReport analyzer exited with code ${result.exitValue}; diagnostics captured without failing the task."
            )
        }
    }

    private fun analyzerFileOrNull(): File? {
        val configured = analyzerPath.orNull?.trim()?.takeIf { it.isNotEmpty() } ?: return null
        return project.file(configured)
    }

    private fun parsePolicyOverrides(path: String?): ReportPolicyOverrides {
        val normalizedPath = path?.trim()?.takeIf { it.isNotEmpty() } ?: return ReportPolicyOverrides()
        val file = project.file(normalizedPath)
        if (!file.exists()) return ReportPolicyOverrides()

        val content = Files.readString(file.toPath(), StandardCharsets.UTF_8)
        val profile = Regex("(?m)^\\s*profile:\\s*(ci|local)\\s*$")
            .find(content)
            ?.groupValues
            ?.get(1)
        val minCoverage = Regex("(?m)^\\s*minCoverage:\\s*(\\d+)\\s*$")
            .find(content)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull()
        val minAggregate = Regex("(?m)^\\s*minAggregate:\\s*(\\d+)\\s*$")
            .find(content)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull()

        return ReportPolicyOverrides(
            profile = profile,
            minCoverage = minCoverage,
            minAggregate = minAggregate
        )
    }

    private fun writeDiagnostics(outputDirectory: File, message: String) {
        writeText(outputDirectory.resolve("yanote-report-diagnostics.txt"), message)
    }

    private fun writeReportStub(outputDirectory: File, reason: String) {
        val payload = """{"status":"report-only","reason":"$reason"}"""
        writeText(outputDirectory.resolve("yanote-report.json"), payload)
    }

    private fun writeText(target: File, content: String) {
        if (!target.parentFile.exists()) {
            target.parentFile.mkdirs()
        }
        target.writeText(content)
    }
}

private data class ReportPolicyOverrides(
    val profile: String? = null,
    val minCoverage: Int? = null,
    val minAggregate: Int? = null
)
