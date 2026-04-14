plugins {
    java
    id("org.springframework.boot") version "2.7.18"
    id("io.spring.dependency-management") version "1.0.15.RELEASE"
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
