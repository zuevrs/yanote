plugins {
    `java-library`
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.17.2")
    implementation("io.swagger.parser.v3:swagger-parser:2.1.22")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

