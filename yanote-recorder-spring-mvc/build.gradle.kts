plugins {
    `java-library`
    signing
}

java {
    withSourcesJar()
    withJavadocJar()
}

dependencies {
    implementation(project(":yanote-core"))
    implementation("org.springframework.boot:spring-boot-autoconfigure:3.2.2")
    implementation("org.springframework.boot:spring-boot-starter-web:3.2.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test:3.2.2")
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifactId = "yanote-recorder-spring-mvc"
            pom {
                name.set("Yanote Recorder Spring MVC")
                description.set("Spring MVC recorder integration for Yanote event capture.")
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
}

signing {
    val releasePublishRequested = gradle.startParameter.taskNames.any { it.contains("publish", ignoreCase = true) }
    setRequired { !version.toString().endsWith("SNAPSHOT") && releasePublishRequested }
    sign(publishing.publications["mavenJava"])
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

