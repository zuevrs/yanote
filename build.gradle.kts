plugins {
    base
    id("org.jreleaser") version "1.23.0"
    id("org.cyclonedx.bom") version "3.2.0"
}

val releasePublicationModules = setOf(
    ":yanote-core",
    ":yanote-recorder-spring-mvc",
    ":yanote-recorder-spring-webflux",
    ":yanote-recorder-spring-kafka",
    ":yanote-recorder-spring-amqp",
    ":yanote-recorder-spring-activemq",
    ":yanote-test-tags-restassured",
    ":yanote-test-tags-cucumber",
    ":yanote-gradle-plugin"
)

val releasePublicationExcludedModules = setOf(
    ":examples:springmvc-service",
    ":examples:tests-restassured"
)

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    pluginManager.apply("java-library")
    pluginManager.apply("maven-publish")

    group = rootProject.group.toString()
    version = rootProject.version.toString()

    extensions.configure<JavaPluginExtension> {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }

    val releaseScopedModule = path in releasePublicationModules
    val explicitlyExcludedModule = path in releasePublicationExcludedModules

    plugins.withId("signing") {
        extensions.configure<org.gradle.plugins.signing.SigningExtension> {
            val releasePublishRequested = gradle.startParameter.taskNames.any { it.contains("publish", ignoreCase = true) }
            if (releasePublishRequested) {
                val rawSigningKey = (findProperty("signingKey") as String?)
                    ?: System.getenv("JRELEASER_GPG_SECRET_KEY")
                val signingPassword = (findProperty("signingPassword") as String?)
                    ?: System.getenv("JRELEASER_GPG_PASSPHRASE")
                if (!rawSigningKey.isNullOrBlank()) {
                    val keyMaterial = if (rawSigningKey.contains("BEGIN PGP PRIVATE KEY BLOCK")) {
                        rawSigningKey
                    } else {
                        val keyFile = file(rawSigningKey)
                        if (keyFile.exists()) keyFile.readText() else rawSigningKey
                    }
                    if (keyMaterial.contains("BEGIN PGP PRIVATE KEY BLOCK")) {
                        useInMemoryPgpKeys(keyMaterial, signingPassword)
                    }
                }
            }
        }
    }

    if (releaseScopedModule && !explicitlyExcludedModule) {
        extensions.configure<org.gradle.api.publish.PublishingExtension> {
            repositories {
                maven {
                    name = "stagingDeploy"
                    url = rootProject.layout.buildDirectory.dir("staging-deploy").get().asFile.toURI()
                }
            }
        }
    }

    tasks.matching { it.name == "cyclonedxDirectBom" }.configureEach {
        if (!releaseScopedModule || explicitlyExcludedModule) {
            enabled = false
        } else {
            // Make cross-project class outputs explicit to satisfy Gradle validation in CI.
            dependsOn(
                rootProject.subprojects.flatMap {
                    listOf("${it.path}:classes", "${it.path}:jar")
                }
            )
        }
    }

    if (!releaseScopedModule || explicitlyExcludedModule) {
        // Fail closed: only the v1 publication allowlist is permitted to publish externally.
        tasks.matching {
            it.name == "publish" ||
                it.name == "publishToMavenLocal" ||
                it.name.startsWith("publishAllPublicationsTo")
        }.configureEach {
            enabled = false
        }
    }
}

val distFlatdirRecorderLibsDir = layout.projectDirectory.dir("dist/flatdir-recorder/libs")
val distNodeAnalyzerDir = layout.projectDirectory.dir("dist/node-analyzer")
val distNodeAnalyzerBinDir = distNodeAnalyzerDir.dir("bin")
val distStandaloneAnalyzerDir = layout.projectDirectory.dir("dist/standalone-analyzer")
val distStandaloneAnalyzerBinDir = distStandaloneAnalyzerDir.dir("bin")
val distStandaloneAnalyzerLibDir = distStandaloneAnalyzerDir.dir("lib")
val distStandaloneAnalyzerArchive = layout.buildDirectory.file("distributions/yanote-analyzer.zip")
val yanoteJsDir = layout.projectDirectory.dir("yanote-js")
val yanoteJsPackageJson = yanoteJsDir.file("package.json")
val yanoteJsPackageLockJson = yanoteJsDir.file("package-lock.json")
val yanoteJsEsbuildConfig = yanoteJsDir.file("esbuild.config.mjs")
val yanoteJsBinLauncher = yanoteJsDir.file("bin/yanote")
val yanoteJsSourceDir = yanoteJsDir.dir("src")
val yanoteJsNodeModulesDir = yanoteJsDir.dir("node_modules")
val yanoteJsBuiltAnalyzer = yanoteJsDir.file("dist/yanote.cjs")

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
    delete(distNodeAnalyzerDir)
}

tasks.register<Delete>("cleanDistStandaloneAnalyzer") {
    delete(distStandaloneAnalyzerDir)
}

tasks.register<Delete>("cleanDistStandaloneAnalyzerArchive") {
    delete(distStandaloneAnalyzerArchive)
}

tasks.register<Exec>("installYanoteJsDependencies") {
    group = "distribution"
    description = "Install yanote-js dependencies deterministically"

    inputs.files(yanoteJsPackageJson, yanoteJsPackageLockJson)
    outputs.dir(yanoteJsNodeModulesDir)

    commandLine("npm", "-C", "yanote-js", "ci")
}

tasks.register<Exec>("buildYanoteJsAnalyzer") {
    group = "distribution"
    description = "Build the yanote-js analyzer runtime"

    dependsOn("installYanoteJsDependencies")

    inputs.files(yanoteJsPackageJson, yanoteJsEsbuildConfig)
    inputs.dir(yanoteJsSourceDir)
    outputs.file(yanoteJsBuiltAnalyzer)

    commandLine("npm", "-C", "yanote-js", "run", "build")
}

tasks.register<Exec>("buildDistNodeAnalyzer") {
    group = "distribution"
    description = "Build Node analyzer bundle (yanote.cjs)"

    dependsOn("cleanDistNodeAnalyzer", "installYanoteJsDependencies", "buildYanoteJsAnalyzer")

    inputs.files(yanoteJsPackageJson, yanoteJsPackageLockJson, yanoteJsBuiltAnalyzer)
    outputs.dir(distNodeAnalyzerDir)

    workingDir = layout.projectDirectory.asFile
    commandLine(
        "bash",
        "-lc",
        listOf(
            "set -euo pipefail",
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
    from(yanoteJsBuiltAnalyzer)
    rename { "yanote.cjs" }
}

tasks.register<Exec>("stageStandaloneAnalyzer") {
    group = "distribution"
    description = "Stage the versioned standalone analyzer bundle with stable launcher"

    dependsOn("cleanDistStandaloneAnalyzer", "installYanoteJsDependencies", "buildYanoteJsAnalyzer")

    inputs.files(yanoteJsPackageJson, yanoteJsPackageLockJson, yanoteJsBinLauncher, yanoteJsBuiltAnalyzer)
    outputs.dir(distStandaloneAnalyzerDir)

    environment("YANOTE_STANDALONE_VERSION", rootProject.version.toString())
    workingDir = layout.projectDirectory.asFile
    commandLine(
        "bash",
        "-lc",
        listOf(
            "set -euo pipefail",
            "standalone_dir=dist/standalone-analyzer",
            "standalone_version=\"${'$'}{YANOTE_STANDALONE_VERSION:-}\"",
            "if [[ -z \"${'$'}standalone_version\" ]]; then echo \"distStandaloneAnalyzer requires a non-empty YANOTE_STANDALONE_VERSION.\" >&2; exit 1; fi",
            "if [[ \"${'$'}standalone_version\" == \"0.0.0\" ]]; then echo \"distStandaloneAnalyzer refuses to stage the default 0.0.0 analyzer version.\" >&2; exit 1; fi",
            "rm -rf \"${'$'}standalone_dir\"",
            "mkdir -p \"${'$'}standalone_dir/bin\" \"${'$'}standalone_dir/lib\"",
            "cp yanote-js/bin/yanote \"${'$'}standalone_dir/bin/yanote\"",
            "chmod 755 \"${'$'}standalone_dir/bin/yanote\"",
            "cp yanote-js/dist/yanote.cjs \"${'$'}standalone_dir/lib/yanote.cjs\"",
            "printf '%s\\n' \"${'$'}standalone_version\" > \"${'$'}standalone_dir/VERSION\"",
            "node -e 'const fs=require(\"node:fs\"); const path=require(\"node:path\"); const standaloneDir=process.argv[1]; const standaloneVersion=process.argv[2]; const packageJson=JSON.parse(fs.readFileSync(\"yanote-js/package.json\", \"utf8\")); packageJson.version=standaloneVersion; fs.writeFileSync(path.join(standaloneDir, \"package.json\"), JSON.stringify(packageJson, null, 2) + \"\\n\"); const packageLockJson=JSON.parse(fs.readFileSync(\"yanote-js/package-lock.json\", \"utf8\")); packageLockJson.version=standaloneVersion; if (packageLockJson.packages && packageLockJson.packages[\"\"]) { packageLockJson.packages[\"\"].version = standaloneVersion; } fs.writeFileSync(path.join(standaloneDir, \"package-lock.json\"), JSON.stringify(packageLockJson, null, 2) + \"\\n\");' \"${'$'}standalone_dir\" \"${'$'}standalone_version\"",
            "npm --prefix \"${'$'}standalone_dir\" ci --omit=dev"
        ).joinToString(" && ")
    )
}

tasks.register<Zip>("packageStandaloneAnalyzer") {
    group = "distribution"
    description = "Package the staged standalone analyzer bundle as the official release archive"

    dependsOn("cleanDistStandaloneAnalyzerArchive", "stageStandaloneAnalyzer")

    inputs.dir(distStandaloneAnalyzerDir)
    outputs.file(distStandaloneAnalyzerArchive)

    archiveFileName.set("yanote-analyzer.zip")
    destinationDirectory.set(layout.buildDirectory.dir("distributions"))
    isPreserveFileTimestamps = false
    isReproducibleFileOrder = true

    doFirst {
        val requiredEntries = listOf(
            "bin/yanote",
            "lib/yanote.cjs",
            "VERSION",
            "package.json",
            "package-lock.json"
        )
        val missingEntries = requiredEntries.filterNot { distStandaloneAnalyzerDir.file(it).asFile.exists() }
        if (missingEntries.isNotEmpty()) {
            val missingMessage = missingEntries.joinToString(separator = ", ")
            throw org.gradle.api.GradleException("distStandaloneAnalyzer expected a complete staged bundle before packaging; missing: $missingMessage")
        }
    }

    from(distStandaloneAnalyzerDir) {
        into("yanote-analyzer")
    }
}

tasks.register("distStandaloneAnalyzer") {
    group = "distribution"
    description = "Build the standalone analyzer bundle and deterministic release archive"
    dependsOn("packageStandaloneAnalyzer")
}

tasks.register("distAll") {
    group = "distribution"
    description = "Build all dist bundles (recorder + analyzer)"
    dependsOn("distFlatdirRecorder", "distNodeAnalyzer")
}

jreleaser {
    configFile.set(layout.projectDirectory.file("jreleaser.yml"))
    gitRootSearch.set(false)
}

tasks.named("jreleaserConfig").configure {
    doFirst {
        val hasEnvToken = !System.getenv("JRELEASER_GITHUB_TOKEN").isNullOrBlank()
        val hasPropertyToken = !System.getProperty("jreleaser.github.token").isNullOrBlank()
        if (!hasEnvToken && !hasPropertyToken) {
            // Phase 05-01 validates Central wiring only; GitHub token wiring lands in the release workflow plan.
            System.setProperty("jreleaser.github.token", "disabled-until-phase-05-02")
        }
    }
}

