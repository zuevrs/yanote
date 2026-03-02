plugins {
    base
}

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    pluginManager.apply("java-library")
    pluginManager.apply("maven-publish")

    group = "dev.yanote"
    version = rootProject.version.toString()

    extensions.configure<JavaPluginExtension> {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }
}

val distFlatdirRecorderLibsDir = layout.projectDirectory.dir("dist/flatdir-recorder/libs")

tasks.register<Delete>("cleanDistFlatdirRecorder") {
    delete(distFlatdirRecorderLibsDir)
}

tasks.register<Copy>("distFlatdirRecorder") {
    group = "distribution"
    description = "Build flatDir JAR bundle for yanote recorder"

    dependsOn(
        "cleanDistFlatdirRecorder",
        ":yanote-recorder-spring-mvc:jar",
        ":yanote-core:jar"
    )

    into(distFlatdirRecorderLibsDir)

    val recorderProject = project(":yanote-recorder-spring-mvc")
    val coreProject = project(":yanote-core")

    from(recorderProject.tasks.named<Jar>("jar").flatMap { it.archiveFile })
    from(coreProject.tasks.named<Jar>("jar").flatMap { it.archiveFile })

    // Keep the bundle minimal to reduce dependency/version conflicts in the target service.
    // The target Spring Boot service already provides Spring/Boot/Servlet/logging deps.
    val includedRuntimePrefixes = listOf(
        "jackson-annotations-",
        "jackson-core-",
        "jackson-databind-"
    )

    from({
        recorderProject.configurations.getByName("runtimeClasspath")
            .resolvedConfiguration
            .resolvedArtifacts
            .map { it.file }
            .filter { it.name.endsWith(".jar") }
            .filter { jar ->
                val name = jar.name.lowercase()
                includedRuntimePrefixes.any { name.startsWith(it) }
            }
    })
}

