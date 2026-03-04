plugins {
    `java-library`
    signing
}

java {
    withSourcesJar()
    withJavadocJar()
}

dependencies {
    implementation("io.rest-assured:rest-assured:5.3.2")
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifactId = "yanote-test-tags-restassured"
            pom {
                name.set("Yanote Test Tags RestAssured")
                description.set("REST Assured test-tag adapter for Yanote requirement traceability.")
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
