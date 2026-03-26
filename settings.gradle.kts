pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }

    resolutionStrategy {
        eachPlugin {
            when (requested.id.id) {
                "org.jreleaser" -> useModule("org.jreleaser:jreleaser-gradle-plugin:${requested.version}")
                "org.cyclonedx.bom" -> useModule("org.cyclonedx:cyclonedx-gradle-plugin:${requested.version}")
                "org.springframework.boot" -> useModule("org.springframework.boot:spring-boot-gradle-plugin:${requested.version}")
                "io.spring.dependency-management" -> useModule("io.spring.gradle:dependency-management-plugin:${requested.version}")
            }
        }
    }
}

rootProject.name = "yanote"

include(
    "yanote-core",
    "yanote-recorder-spring-mvc",
    "yanote-recorder-spring-kafka",
    "yanote-recorder-spring-amqp",
    "yanote-test-tags-restassured",
    "yanote-test-tags-cucumber",
    "yanote-gradle-plugin",
    "examples:springmvc-service",
    "examples:tests-restassured"
)
