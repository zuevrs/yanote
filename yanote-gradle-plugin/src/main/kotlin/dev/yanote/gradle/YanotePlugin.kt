package dev.yanote.gradle

import org.gradle.api.Plugin
import org.gradle.api.Project

class YanotePlugin : Plugin<Project> {
    override fun apply(target: Project) {
        target.extensions.create("yanote", YanoteExtension::class.java)
    }
}
