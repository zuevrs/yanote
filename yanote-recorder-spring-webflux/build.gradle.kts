plugins {
    `java-library`
    signing
}

val springBootBaselineVersion = "2.7.18"
val springFrameworkBaselineVersion = "5.3.31"
val springBootTestVersion = "3.2.2"

java {
    withSourcesJar()
    withJavadocJar()
}

dependencies {
    implementation(project(":yanote-core"))

    // This module must not drag a reactive runtime into consumers.
    // It only needs Spring Boot autoconfigure and WebFlux APIs at compile time;
    // the host app supplies the actual runtime stack.
    compileOnly("org.springframework.boot:spring-boot-autoconfigure:$springBootBaselineVersion")
    compileOnly("org.springframework:spring-webflux:$springFrameworkBaselineVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-webflux:$springBootTestVersion")
    testImplementation("org.springframework.boot:spring-boot-starter-web:$springBootTestVersion")
    testImplementation("org.springframework.boot:spring-boot-starter-test:$springBootTestVersion")
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifactId = "yanote-recorder-spring-webflux"
            pom {
                name.set("Yanote Recorder Spring WebFlux")
                description.set("Spring WebFlux recorder integration for Yanote event capture.")
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
