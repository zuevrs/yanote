plugins {
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
}

dependencies {
    implementation(project(":yanote-recorder-spring-mvc"))
    implementation("org.springframework.boot:spring-boot-starter-web")
}
