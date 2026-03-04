package dev.yanote.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.tasks.TaskProvider
import org.gradle.language.base.plugins.LifecycleBasePlugin

class YanotePlugin : Plugin<Project> {
    override fun apply(target: Project) {
        val extension = target.extensions.create("yanote", YanoteExtension::class.java)
        extension.profile.convention("local")
        extension.minCoverage.convention(0)
        extension.minAggregate.convention(0)
        extension.policyPath.convention("")
        extension.criticalOperations.convention(emptyList())
        extension.exclude.convention(emptyList())
        extension.moduleExcludes.convention(emptyList())
        extension.hookIntoCheck.convention(false)

        val rootTasks = registerYanoteTasks(target)

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

                participatingModules.forEach { module ->
                    val moduleTasks = registerYanoteTasks(module)
                    rootTasks.report.configure {
                        dependsOn(moduleTasks.report)
                    }
                    rootTasks.check.configure {
                        dependsOn(moduleTasks.check)
                    }
                }
            }
        }
    }

    private fun registerYanoteTasks(project: Project): YanoteTaskPair {
        val reportTask = project.tasks.findByName("yanoteReport")
            ?.let { project.tasks.named("yanoteReport") }
            ?: project.tasks.register("yanoteReport", DefaultTask::class.java) {
                group = LifecycleBasePlugin.VERIFICATION_GROUP
                description = "Runs Yanote report generation for this project."
            }

        val checkTask = project.tasks.findByName("yanoteCheck")
            ?.let { project.tasks.named("yanoteCheck") }
            ?: project.tasks.register("yanoteCheck", DefaultTask::class.java) {
                group = LifecycleBasePlugin.VERIFICATION_GROUP
                description = "Runs Yanote blocking checks for this project."
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
