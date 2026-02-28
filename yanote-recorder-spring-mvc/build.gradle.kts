plugins {
    `java-library`
}

dependencies {
    implementation(project(":yanote-core"))
    implementation("org.springframework.boot:spring-boot-autoconfigure:3.2.2")
    implementation("org.springframework.boot:spring-boot-starter-web:3.2.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test:3.2.2")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

