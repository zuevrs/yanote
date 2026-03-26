plugins {
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
}

dependencies {
    implementation(project(":yanote-recorder-spring-mvc"))
    implementation(project(":yanote-recorder-spring-kafka"))
    implementation(project(":yanote-recorder-spring-amqp"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.kafka:spring-kafka")

    testImplementation(project(":yanote-core"))
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:testcontainers:1.21.4")
    testImplementation("org.testcontainers:junit-jupiter:1.21.4")
    testImplementation("org.testcontainers:kafka:1.21.4")
    testImplementation("org.testcontainers:rabbitmq:1.21.4")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
