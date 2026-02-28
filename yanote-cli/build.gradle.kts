plugins {
    `java-library`
    application
}

dependencies {
    implementation(project(":yanote-core"))
    implementation("info.picocli:picocli:4.7.6")
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.17.2")
    runtimeOnly("org.slf4j:slf4j-simple:2.0.16")

    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

application {
    mainClass = "dev.yanote.cli.Main"
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
