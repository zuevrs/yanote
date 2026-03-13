rootProject.name = "yanote"

include(
    "yanote-core",
    "yanote-recorder-spring-mvc",
    "yanote-recorder-spring-kafka",
    "yanote-test-tags-restassured",
    "yanote-test-tags-cucumber",
    "yanote-gradle-plugin",
    "examples:springmvc-service",
    "examples:tests-restassured"
)
