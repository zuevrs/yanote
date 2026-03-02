# Stack

## Repository Shape
- Multi-module Gradle repo with a separate Node/TypeScript analyzer package.
- Root modules are declared in `settings.gradle.kts` (`yanote-core`, `yanote-recorder-spring-mvc`, `yanote-test-tags-restassured`, `yanote-test-tags-cucumber`, `examples:springmvc-service`, `examples:tests-restassured`).
- Node analyzer lives in `yanote-js/package.json` and builds to `yanote-js/dist/yanote.cjs`.

## Languages
- Java 21 for core libraries and Spring integration (`build.gradle.kts` toolchain `JavaLanguageVersion.of(21)`).
- TypeScript (strict) for CLI analyzer (`yanote-js/tsconfig.json`).
- Kotlin DSL for build configuration (`build.gradle.kts`, `settings.gradle.kts`, module `build.gradle.kts` files).
- YAML/JSON specs and Docker Compose for example orchestration (`examples/openapi/demo-openapi.yaml`, `examples/docker-compose.yml`).

## Runtime Targets
- JVM runtime for Java libraries and Spring Boot example service (`examples/springmvc-service/build.gradle.kts`).
- Node.js runtime for analyzer CLI (`yanote-js/package.json` engines `node >=20`; bundler target `node22` in `yanote-js/esbuild.config.mjs`).
- Containerized execution in examples (`examples/docker-compose.yml` uses `eclipse-temurin:21-jdk` and `node:22`).

## Java Frameworks and Libraries
- Spring Boot auto-configuration and MVC filter integration in recorder module (`yanote-recorder-spring-mvc/build.gradle.kts`, `YanoteRecorderAutoConfiguration.java`).
- Jackson for event JSON serialization/deserialization (`yanote-core/build.gradle.kts`, `EventJsonlWriter.java`, `EventJsonlReader.java`).
- Swagger/OpenAPI parser for operation extraction (`yanote-core/build.gradle.kts`, `OpenApiLoader.java`).
- RestAssured helper module for tagging test requests (`yanote-test-tags-restassured/build.gradle.kts`, `YanoteRestAssuredFilter.java`).
- Cucumber plugin module for suite naming (`yanote-test-tags-cucumber/build.gradle.kts`, `YanoteSuiteNamePlugin.java`).

## Node/TS Frameworks and Libraries
- CLI command framework: `commander` (`yanote-js/package.json`, `yanote-js/src/cli.ts`).
- OpenAPI parsing: `@apidevtools/swagger-parser` (`yanote-js/package.json`, `yanote-js/src/spec/openapi.ts`).
- AsyncAPI parsing: `@asyncapi/parser` (`yanote-js/package.json`, `yanote-js/src/spec/asyncapi.ts`).
- Build tooling: `esbuild` (`yanote-js/esbuild.config.mjs`).
- Tests: `vitest` (`yanote-js/package.json`, `yanote-js/src/*.test.ts`).

## Build and Test Tooling
- Gradle root tasks define distribution artifacts (`distFlatdirRecorder`, `distNodeAnalyzer`, `distAll`) in `build.gradle.kts`.
- Java tests run with JUnit 5 across modules (`tasks.withType<Test> { useJUnitPlatform() }` in module `build.gradle.kts` files).
- Node analyzer build and test scripts in `yanote-js/package.json` (`build`, `test`, `test:watch`).

## Packaging and Distribution
- Recorder flatDir bundle to `dist/flatdir-recorder/libs` from root Gradle task `distFlatdirRecorder` (`build.gradle.kts`).
- Node analyzer distribution copied to `dist/node-analyzer/bin/yanote.cjs` via root Gradle task `distNodeAnalyzer` (`build.gradle.kts`).
- CLI executable entrypoint is `yanote-js/src/bin.ts` bundled into `yanote-js/dist/yanote.cjs`.

## Key Configuration Entry Points
- Root Gradle config: `build.gradle.kts`, `gradle.properties`, `settings.gradle.kts`.
- Spring example app config: `examples/springmvc-service/src/main/resources/application.properties`.
- Node analyzer config: `yanote-js/package.json`, `yanote-js/tsconfig.json`, `yanote-js/esbuild.config.mjs`.
- Spring Boot auto-config import registration: `yanote-recorder-spring-mvc/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
