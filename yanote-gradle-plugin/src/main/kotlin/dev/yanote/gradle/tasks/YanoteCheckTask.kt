package dev.yanote.gradle.tasks

import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
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

abstract class YanoteCheckTask : DefaultTask() {
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
        defaultProfile.convention("ci")
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
    fun runCheck() {
        val spec = specPath.orNull?.trim().orEmpty()
        val events = eventsPath.orNull?.trim().orEmpty()
        if (spec.isEmpty() || events.isEmpty()) {
            throw GradleException(
                "yanoteCheck requires specPath and eventsPath inputs. " +
                    "Set them so the task can pass --spec and --events to the analyzer."
            )
        }

        val specFile = project.file(spec)
        val eventsFile = project.file(events)
        if (!specFile.exists() || !eventsFile.exists()) {
            throw GradleException(
                "yanoteCheck requires existing specPath/eventsPath files. " +
                    "spec exists=${specFile.exists()} events exists=${eventsFile.exists()}."
            )
        }

        val analyzer = analyzerFileOrNull()
            ?: throw GradleException(
                "yanoteCheck requires analyzer runtime path. " +
                    "Run ./gradlew distNodeAnalyzer and set analyzerPath if non-standard."
            )
        if (!analyzer.exists()) {
            throw GradleException(
                "yanoteCheck analyzer runtime not found at ${analyzer.absolutePath}. " +
                    "Run ./gradlew distNodeAnalyzer before invoking yanoteCheck."
            )
        }

        val outputDirectory = outputDir.get().asFile
        outputDirectory.mkdirs()

        val args = buildAnalyzerArguments()
        writeText(outputDirectory.resolve("yanote-check-command.args"), args.joinToString(" "))

        val result = project.exec {
            commandLine(listOf("node", analyzer.absolutePath) + args)
            isIgnoreExitValue = true
        }
        if (result.exitValue != 0) {
            throw GradleException(
                "yanoteCheck failed with analyzer exit code ${result.exitValue}. " +
                    "Review ${outputDirectory.resolve("yanote-check-command.args").absolutePath} for invocation details."
            )
        }
    }

    private fun analyzerFileOrNull(): File? {
        val configured = analyzerPath.orNull?.trim()?.takeIf { it.isNotEmpty() } ?: return null
        return project.file(configured)
    }

    private fun parsePolicyOverrides(path: String?): CheckPolicyOverrides {
        val normalizedPath = path?.trim()?.takeIf { it.isNotEmpty() } ?: return CheckPolicyOverrides()
        val file = project.file(normalizedPath)
        if (!file.exists()) return CheckPolicyOverrides()

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

        return CheckPolicyOverrides(
            profile = profile,
            minCoverage = minCoverage,
            minAggregate = minAggregate
        )
    }

    private fun writeText(target: File, content: String) {
        if (!target.parentFile.exists()) {
            target.parentFile.mkdirs()
        }
        target.writeText(content)
    }
}

private data class CheckPolicyOverrides(
    val profile: String? = null,
    val minCoverage: Int? = null,
    val minAggregate: Int? = null
)
