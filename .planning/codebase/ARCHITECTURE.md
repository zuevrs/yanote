# Architecture

## System Shape
- Monorepo with Gradle-managed Java modules plus a separate Node CLI package.
- Root multi-project wiring is declared in `settings.gradle.kts`.
- Shared Java build conventions (Java 21 toolchain, publishing) live in `build.gradle.kts`.
- Node analyzer lives in `yanote-js/` with its own `package.json` and TypeScript source in `yanote-js/src/`.

## Primary Layers
- Capture layer (runtime instrumentation): `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/`.
- Core domain layer (shared models + coverage logic): `yanote-core/src/main/java/dev/yanote/core/`.
- Test tagging layer: `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/` and `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/`.
- Analysis/report layer (CLI): `yanote-js/src/cli.ts`, `yanote-js/src/spec/`, `yanote-js/src/coverage/`, `yanote-js/src/report/`.
- Example integration layer: `examples/springmvc-service/`, `examples/tests-restassured/`, `examples/docker-compose.yml`.

## Entry Points
- Java runtime entry (example app): `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`.
- Spring Boot auto-config entry: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java` and registration file `yanote-recorder-spring-mvc/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- Node CLI entry wrapper: `yanote-js/src/bin.ts`.
- Node CLI command composition: `yanote-js/src/cli.ts` (`report` command).

## Data Flow
- Request metadata is injected by `YanoteRestAssuredFilter` in `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java` (`X-Test-Run-Id`, `X-Test-Suite`).
- Recorder filter intercepts responses in `HttpEventRecordingFilter` at `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`.
- Route templating is resolved by `RouteTemplateResolver` in `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java`.
- Events are serialized as JSONL via `EventJsonlWriter` in `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`.
- Analyzer reads JSONL in `yanote-js/src/events/readJsonl.ts`.
- Spec operations are loaded from OpenAPI/AsyncAPI by `yanote-js/src/spec/openapi.ts` and `yanote-js/src/spec/asyncapi.ts` after discovery in `yanote-js/src/spec/discover.ts`.
- Coverage is computed in `yanote-js/src/coverage/coverage.ts` and rendered in `yanote-js/src/report/report.ts`.
- Final artifact is written by `yanote-js/src/report/writeReport.ts` as `yanote-report.json`.

## Abstractions and Patterns
- Canonical event contract is a sealed interface (`YanoteEvent`) with HTTP implementation (`HttpEvent`) in `yanote-core/src/main/java/dev/yanote/core/events/`.
- Canonical operation identity uses value objects/types (`OperationKey`): Java record in `yanote-core/src/main/java/dev/yanote/core/openapi/OperationKey.java`, TypeScript union in `yanote-js/src/model/operationKey.ts`.
- Coverage pipeline follows normalize -> filter -> match -> summarize pattern in both Java (`CoverageCalculator`) and TypeScript (`computeCoverage`).
- Auto-configuration safety pattern: recorder disabled by default via `@ConditionalOnProperty` in `YanoteRecorderAutoConfiguration`.
- Failure isolation pattern: recorder swallows write failures and logs warnings (`HttpEventRecordingFilter`) to avoid breaking requests.
- Distribution pattern: Gradle builds offline bundles into `dist/flatdir-recorder/` and `dist/node-analyzer/` from root tasks in `build.gradle.kts`.

## Boundaries and Dependencies
- `yanote-recorder-spring-mvc` depends on `yanote-core` (declared in `yanote-recorder-spring-mvc/build.gradle.kts`).
- Example tests depend on both tagging and core modules (`examples/tests-restassured/build.gradle.kts`).
- Node analyzer is independent from Java runtime modules; integration happens through filesystem exchange (`events.jsonl`).
- OpenAPI parsing differs by runtime: Java core uses `io.swagger.parser` (`yanote-core/build.gradle.kts`), Node uses `@apidevtools/swagger-parser` (`yanote-js/package.json`).

## Operational Topology
- End-to-end orchestration is documented and scripted in `examples/docker-compose.yml`: API container writes events, test container generates traffic, report container runs Node CLI.
- Offline distribution docs for external environments are in `dist/flatdir-recorder/README.md` and `dist/node-analyzer/README.md`.
