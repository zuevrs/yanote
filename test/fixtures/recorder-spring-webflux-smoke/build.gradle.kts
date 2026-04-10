plugins {
    java
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
}

val yanoteVersion = providers.gradleProperty("yanoteVersion")
    .orElse("0.1.0-SNAPSHOT")

repositories {
    mavenLocal()
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencies {
    implementation("io.github.zuevrs:yanote-recorder-spring-webflux:${yanoteVersion.get()}")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
}
