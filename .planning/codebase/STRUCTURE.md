# Structure

## Top-Level Directory Map
- `build.gradle.kts`: root Gradle conventions and distribution tasks.
- `settings.gradle.kts`: includes Java subprojects (`yanote-core`, `yanote-recorder-spring-mvc`, `yanote-test-tags-*`, `examples:*`).
- `yanote-core/`: shared Java domain model, OpenAPI extraction, coverage calculation.
- `yanote-recorder-spring-mvc/`: Spring MVC recorder starter (autoconfiguration + filter).
- `yanote-test-tags-restassured/`: RestAssured request tagging utility.
- `yanote-test-tags-cucumber/`: Cucumber plugin for suite naming.
- `yanote-js/`: Node/TypeScript CLI for spec discovery, coverage, and reporting.
- `examples/`: runnable service + tests + compose workflow + demo OpenAPI spec.
- `dist/`: generated distribution bundles (`flatdir-recorder`, `node-analyzer`).
- `docs/plans/`: planning/design notes.
- `.planning/codebase/`: generated codebase analysis docs.

## Key Java Module Layouts
- `yanote-core/src/main/java/dev/yanote/core/events/`: event contracts and JSONL IO (`HttpEvent`, `YanoteEvent`, `EventJsonlWriter`, `EventJsonlReader`).
- `yanote-core/src/main/java/dev/yanote/core/openapi/`: OpenAPI loading and operation extraction (`OpenApiLoader`, `OpenApiOperations`, `OperationKey`).
- `yanote-core/src/main/java/dev/yanote/core/coverage/`: coverage domain (`CoverageCalculator`, `CoverageReport`, `CoverageSummary`).
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/`: properties, autoconfiguration, route resolver, request filter.
- `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/`: single filter class `YanoteRestAssuredFilter`.
- `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/`: single plugin class `YanoteSuiteNamePlugin`.

## Key Node Module Layout
- `yanote-js/src/bin.ts`: process-level entry wrapper.
- `yanote-js/src/cli.ts`: command definition and orchestration.
- `yanote-js/src/spec/`: spec discovery and loaders (`discover.ts`, `openapi.ts`, `asyncapi.ts`).
- `yanote-js/src/events/`: JSONL ingestion (`readJsonl.ts`).
- `yanote-js/src/model/`: shared TS types (`httpEvent.ts`, `operationKey.ts`).
- `yanote-js/src/coverage/`: coverage computation (`coverage.ts`).
- `yanote-js/src/report/`: report assembly and persistence (`report.ts`, `writeReport.ts`).
- `yanote-js/src/baseline/`: baseline parsing and regression checks (`baseline.ts`).

## Example and Integration Layout
- `examples/springmvc-service/src/main/java/`: demo Spring Boot API.
- `examples/springmvc-service/src/main/resources/application.properties`: example runtime config.
- `examples/tests-restassured/src/test/java/`: E2E tests generating tagged traffic.
- `examples/openapi/demo-openapi.yaml`: demo specification input.
- `examples/docker-compose.yml`: three-stage api/tests/report orchestration.

## Naming and Organization Conventions
- Java package root consistently uses `dev.yanote.*` (e.g., `dev.yanote.core`, `dev.yanote.recorder.springmvc`).
- Java source roots follow standard Gradle layout: `src/main/java`, `src/test/java`, `src/test/resources`.
- TypeScript source is feature-foldered by concern (`spec`, `events`, `coverage`, `report`, `model`, `baseline`) under `yanote-js/src/`.
- File names are mostly PascalCase in Java (`CoverageCalculator.java`) and camel/lower in TS (`writeReport.ts`, `readJsonl.ts`).
- Tests mirror implementation names with `*Test` in Java (`CoverageCalculatorTest.java`) and `.test.ts` in Node (`coverage.test.ts`).
- Generated/distribution outputs are segregated into `build/` per module and top-level `dist/` bundles.

## Notable Structural Observations
- `yanote-cli/` currently contains only `build/` artifacts in-tree and no tracked source files.
- Java runtime and Node analyzer are loosely coupled through file artifacts (`events.jsonl`, output JSON report), not direct module dependency.
- Distribution assets include runnable docs/scripts: `dist/flatdir-recorder/README.md`, `dist/flatdir-recorder/verify.sh`, `dist/node-analyzer/README.md`, `dist/node-analyzer/verify.sh`.
