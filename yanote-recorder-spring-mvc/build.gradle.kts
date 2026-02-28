plugins {
    `java-library`
}

dependencies {
    implementation(project(":yanote-core"))
    implementation("org.springframework.boot:spring-boot-autoconfigure:3.2.2")
    compileOnly("org.springframework.boot:spring-boot-starter-web:3.2.2")
    implementation("org.springframework.boot:spring-boot")
}

