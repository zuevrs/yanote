plugins {
    `java-library`
}

dependencies {
    implementation(project(":yanote-test-tags-restassured"))
    implementation(project(":yanote-core"))
    implementation("io.rest-assured:rest-assured:5.3.2")

    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

val resolveTestRuntimeClasspath by tasks.registering {
    group = "verification"
    description = "Resolve test runtime classpath for offline demo and CI container runs."

    val runtimeClasspath = configurations.named("testRuntimeClasspath")
    val markerFile = layout.buildDirectory.file("tmp/resolve-test-runtime-classpath.marker")

    inputs.files(runtimeClasspath)
    outputs.file(markerFile)

    doLast {
        runtimeClasspath.get().files.sortedBy { it.name }.forEach { it.length() }
        val marker = markerFile.get().asFile
        marker.parentFile.mkdirs()
        marker.writeText("resolved\n")
    }
}
