package dev.yanote.gradle.tasks

import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

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

    fun buildAnalyzerArguments(): List<String> = emptyList()

    @TaskAction
    fun runReport() {
        // Intentionally empty in RED phase.
    }
}
