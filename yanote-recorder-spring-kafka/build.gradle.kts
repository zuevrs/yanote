plugins {
    `java-library`
    signing
    id("io.spring.dependency-management") version "1.1.4"
}

java {
    withSourcesJar()
    withJavadocJar()
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:3.2.2")
    }
}

dependencies {
    implementation(project(":yanote-core"))
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    implementation("org.springframework.kafka:spring-kafka")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.kafka:spring-kafka-test")
    testImplementation("org.testcontainers:testcontainers:1.21.4")
    testImplementation("org.testcontainers:junit-jupiter:1.21.4")
    testImplementation("org.testcontainers:kafka:1.21.4")
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifactId = "yanote-recorder-spring-kafka"
            pom {
                name.set("Yanote Recorder Spring Kafka")
                description.set("Spring Kafka recorder integration for Yanote event capture.")
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
