package dev.yanote.gradle

import org.gradle.api.provider.Property

abstract class YanoteExtension {
    abstract val hookIntoCheck: Property<Boolean>
}
