plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
}

gradlePlugin {
    plugins {
        create("yanoteGradlePlugin") {
            id = "dev.yanote.gradle"
            implementationClass = "dev.yanote.gradle.YanotePlugin"
            displayName = "Yanote Gradle Plugin"
            description = "Gradle delivery surface for Yanote analyzer tasks."
        }
    }
}

dependencies {
    testImplementation(gradleTestKit())
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
