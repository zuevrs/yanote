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
