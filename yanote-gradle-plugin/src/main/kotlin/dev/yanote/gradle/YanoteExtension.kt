package dev.yanote.gradle

import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property

abstract class YanoteExtension {
    abstract val policyPath: Property<String>
    abstract val profile: Property<String>
    abstract val minCoverage: Property<Int>
    abstract val minAggregate: Property<Int>
    abstract val criticalOperations: ListProperty<String>
    abstract val exclude: ListProperty<String>
    abstract val hookIntoCheck: Property<Boolean>
    abstract val moduleExcludes: ListProperty<String>
}
