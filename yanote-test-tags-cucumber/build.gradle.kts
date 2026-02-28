plugins {
    `java-library`
}

dependencies {
    implementation("io.cucumber:cucumber-java:7.18.0")
    implementation("io.cucumber:cucumber-picocontainer:7.18.0")
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
