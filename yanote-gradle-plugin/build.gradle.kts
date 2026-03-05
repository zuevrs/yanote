plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
    `maven-publish`
    signing
}

gradlePlugin {
    plugins {
        create("yanoteGradlePlugin") {
            id = "io.github.zuevrs.yanote.gradle"
            implementationClass = "dev.yanote.gradle.YanotePlugin"
            displayName = "Yanote Gradle Plugin"
            description = "Gradle delivery surface for Yanote analyzer tasks."
        }
    }
}

java {
    withSourcesJar()
    withJavadocJar()
}

dependencies {
    testImplementation(gradleTestKit())
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

publishing {
    publications.withType<MavenPublication>().configureEach {
        if (name == "pluginMaven") {
            artifactId = "yanote-gradle-plugin"
        }
        pom {
            name.set("Yanote Gradle Plugin")
            description.set("Gradle plugin delivery surface for deterministic Yanote validation.")
            url.set("https://github.com/yanote/yanote")
            licenses {
                license {
                    name.set("Apache License, Version 2.0")
                    url.set("https://www.apache.org/licenses/LICENSE-2.0.txt")
                }
            }
            developers {
                developer {
                    id.set("yanote-maintainers")
                    name.set("Yanote Maintainers")
                }
            }
            scm {
                connection.set("scm:git:https://github.com/yanote/yanote.git")
                developerConnection.set("scm:git:ssh://git@github.com/yanote/yanote.git")
                url.set("https://github.com/yanote/yanote")
            }
        }
    }
}

signing {
    val releasePublishRequested = gradle.startParameter.taskNames.any { it.contains("publish", ignoreCase = true) }
    setRequired { !version.toString().endsWith("SNAPSHOT") && releasePublishRequested }
    sign(publishing.publications)
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
