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
val distNodeAnalyzerBinDir = layout.projectDirectory.dir("dist/node-analyzer/bin")

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

tasks.register<Delete>("cleanDistNodeAnalyzer") {
    delete(distNodeAnalyzerBinDir)
}

tasks.register<Exec>("buildDistNodeAnalyzer") {
    group = "distribution"
    description = "Build Node analyzer bundle (yanote.cjs)"

    dependsOn("cleanDistNodeAnalyzer")

    workingDir = layout.projectDirectory.asFile
    commandLine(
        "bash",
        "-lc",
        listOf(
            "set -euo pipefail",
            "rm -rf yanote-js/node_modules",
            "npm -C yanote-js ci",
            "npm -C yanote-js run build",
            "rm -rf dist/node-analyzer/node_modules dist/node-analyzer/package.json dist/node-analyzer/package-lock.json",
            "mkdir -p dist/node-analyzer",
            "cp yanote-js/package.json dist/node-analyzer/package.json",
            "cp yanote-js/package-lock.json dist/node-analyzer/package-lock.json",
            "npm --prefix dist/node-analyzer ci --omit=dev"
        ).joinToString(" && ")
    )
}

tasks.register<Copy>("distNodeAnalyzer") {
    group = "distribution"
    description = "Copy Node analyzer bundle to dist/"

    dependsOn("buildDistNodeAnalyzer")

    into(distNodeAnalyzerBinDir)
    from(layout.projectDirectory.file("yanote-js/dist/yanote.cjs"))
    rename { "yanote.cjs" }
}

tasks.register("distAll") {
    group = "distribution"
    description = "Build all dist bundles (recorder + analyzer)"
    dependsOn("distFlatdirRecorder", "distNodeAnalyzer")
}

