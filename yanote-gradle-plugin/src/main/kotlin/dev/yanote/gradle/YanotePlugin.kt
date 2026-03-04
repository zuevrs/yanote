package dev.yanote.gradle

import dev.yanote.gradle.tasks.YanoteCheckTask
import dev.yanote.gradle.tasks.YanoteReportTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.tasks.TaskProvider
import org.gradle.language.base.plugins.LifecycleBasePlugin

class YanotePlugin : Plugin<Project> {
    override fun apply(target: Project) {
        val extension = target.extensions.create("yanote", YanoteExtension::class.java)
        extension.criticalOperations.convention(emptyList())
        extension.exclude.convention(emptyList())
        extension.moduleExcludes.convention(emptyList())
        extension.hookIntoCheck.convention(false)

        val rootTasks = registerYanoteTasks(target, extension)

        target.afterEvaluate {
            if (extension.hookIntoCheck.getOrElse(false)) {
                target.tasks.matching { task -> task.name == LifecycleBasePlugin.CHECK_TASK_NAME }
                    .configureEach {
                        dependsOn(rootTasks.check)
                    }
            }
        }

        if (target == target.rootProject) {
            target.gradle.projectsEvaluated {
                val excludedModules = extension.moduleExcludes.getOrElse(emptyList()).toSet()
                val participatingModules = target.subprojects
                    .filter { module ->
                        module.plugins.hasPlugin("java") &&
                            !isModuleExcluded(module, excludedModules)
                    }
                    .sortedBy { it.path }

                val reportDependencies = mutableListOf<TaskProvider<out Task>>()
                val checkDependencies = mutableListOf<TaskProvider<out Task>>()

                participatingModules.forEach { module ->
                    val moduleTasks = registerYanoteTasks(module, extension)
                    reportDependencies += moduleTasks.report
                    checkDependencies += moduleTasks.check
                }

                rootTasks.report.configure {
                    dependsOn(reportDependencies)
                }
                rootTasks.check.configure {
                    dependsOn(checkDependencies)
                }
            }
        }
    }

    private fun registerYanoteTasks(project: Project, extension: YanoteExtension): YanoteTaskPair {
        val outputSegment = if (project == project.rootProject) {
            "aggregate"
        } else {
            "modules/${project.path.removePrefix(":").replace(':', '/')}"
        }

        val reportTask = project.tasks.findByName("yanoteReport")
            ?.let { project.tasks.named("yanoteReport", YanoteReportTask::class.java) }
            ?: project.tasks.register("yanoteReport", YanoteReportTask::class.java) {
                group = LifecycleBasePlugin.VERIFICATION_GROUP
                description = "Runs Yanote report generation for this project."
                defaultProfile.convention("local")
                outputDir.convention(project.layout.buildDirectory.dir("yanote/$outputSegment/report"))
                analyzerPath.convention(
                    project.rootProject.layout.projectDirectory
                        .file("dist/node-analyzer/bin/yanote.cjs")
                        .asFile
                        .absolutePath
                )
                policyPath.convention(extension.policyPath)
                profile.convention(extension.profile)
                minCoverage.convention(extension.minCoverage)
                minAggregate.convention(extension.minAggregate)
                criticalOperations.convention(extension.criticalOperations)
                exclude.convention(extension.exclude)
            }

        val checkTask = project.tasks.findByName("yanoteCheck")
            ?.let { project.tasks.named("yanoteCheck", YanoteCheckTask::class.java) }
            ?: project.tasks.register("yanoteCheck", YanoteCheckTask::class.java) {
                group = LifecycleBasePlugin.VERIFICATION_GROUP
                description = "Runs Yanote blocking checks for this project."
                defaultProfile.convention("ci")
                outputDir.convention(project.layout.buildDirectory.dir("yanote/$outputSegment/check"))
                analyzerPath.convention(
                    project.rootProject.layout.projectDirectory
                        .file("dist/node-analyzer/bin/yanote.cjs")
                        .asFile
                        .absolutePath
                )
                policyPath.convention(extension.policyPath)
                profile.convention(extension.profile)
                minCoverage.convention(extension.minCoverage)
                minAggregate.convention(extension.minAggregate)
                criticalOperations.convention(extension.criticalOperations)
                exclude.convention(extension.exclude)
            }

        return YanoteTaskPair(report = reportTask, check = checkTask)
    }

    private fun isModuleExcluded(module: Project, excludedModules: Set<String>): Boolean {
        return excludedModules.contains(module.path) || excludedModules.contains(module.name)
    }
}

private data class YanoteTaskPair(
    val report: TaskProvider<out Task>,
    val check: TaskProvider<out Task>
)
