plugins {
    `java-library`
    signing
}

val springBootVersion = "3.2.2"
val springFrameworkVersion = "6.1.3"
val servletApiVersion = "6.0.0"

java {
    withSourcesJar()
    withJavadocJar()
}

dependencies {
    implementation(project(":yanote-core"))

    // This module must not drag a full servlet web stack into consumers.
    // It only needs Spring MVC / servlet APIs at compile time; the host app supplies the runtime.
    compileOnly("org.springframework.boot:spring-boot-autoconfigure:$springBootVersion")
    compileOnly("org.springframework:spring-webmvc:$springFrameworkVersion")
    compileOnly("jakarta.servlet:jakarta.servlet-api:$servletApiVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-web:$springBootVersion")
    testImplementation("org.springframework.boot:spring-boot-starter-test:$springBootVersion")
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifactId = "yanote-recorder-spring-mvc"
            pom {
                name.set("Yanote Recorder Spring MVC")
                description.set("Spring MVC recorder integration for Yanote event capture.")
                url.set("https://github.com/zuevrs/yanote")
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
                    connection.set("scm:git:https://github.com/zuevrs/yanote.git")
                    developerConnection.set("scm:git:ssh://git@github.com/zuevrs/yanote.git")
                    url.set("https://github.com/zuevrs/yanote")
                }
            }
        }
    }
}

signing {
    val releasePublishRequested = gradle.startParameter.taskNames.any { it.contains("publish", ignoreCase = true) }
    setRequired { !version.toString().endsWith("SNAPSHOT") && releasePublishRequested }
    sign(publishing.publications["mavenJava"])
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

