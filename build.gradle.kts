plugins {
    base
}

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java-library")
    apply(plugin = "maven-publish")

    group = "dev.yanote"
    version = rootProject.version.toString()

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(21)
        }
    }

    dependencies {
        testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
        testImplementation("org.junit.jupiter:junit-jupiter-params:5.10.2")
        testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }
}

