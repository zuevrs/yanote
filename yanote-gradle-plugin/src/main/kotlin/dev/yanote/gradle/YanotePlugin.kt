package dev.yanote.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
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

        target.tasks.register("yanoteReport", DefaultTask::class.java) {
            group = LifecycleBasePlugin.VERIFICATION_GROUP
            description = "Runs Yanote report generation for this project."
        }

        val yanoteCheck = target.tasks.register("yanoteCheck", DefaultTask::class.java) {
            group = LifecycleBasePlugin.VERIFICATION_GROUP
            description = "Runs Yanote blocking checks for this project."
        }

        target.afterEvaluate {
            if (extension.hookIntoCheck.getOrElse(false)) {
                target.tasks.matching { task -> task.name == LifecycleBasePlugin.CHECK_TASK_NAME }
                    .configureEach {
                        dependsOn(yanoteCheck)
                    }
            }
        }
    }
}
