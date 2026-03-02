# Testing Practices

## Test frameworks in use
- Java tests use JUnit 5 (`useJUnitPlatform()` in `yanote-core/build.gradle.kts`, `yanote-recorder-spring-mvc/build.gradle.kts`, `yanote-test-tags-restassured/build.gradle.kts`, `yanote-test-tags-cucumber/build.gradle.kts`).
- Spring module tests use Spring Boot test stack (`spring-boot-starter-test`) in `yanote-recorder-spring-mvc/build.gradle.kts`.
- TypeScript tests use Vitest via `"test": "vitest run"` in `yanote-js/package.json`.

## Test layout and organization
- Java test files mirror source package structure under `src/test/java`, e.g. `yanote-core/src/test/java/dev/yanote/core/coverage/CoverageCalculatorTest.java`.
- TypeScript tests are colocated with source (`*.test.ts`), e.g. `yanote-js/src/coverage/coverage.test.ts` and `yanote-js/src/cli.test.ts`.
- Fixture-driven tests exist for specs/events under `yanote-js/test/fixtures/`.

## Test style patterns
- Java tests use behavior-focused names with `should...`, e.g. `shouldRecordEventViaAutoConfiguration` in `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderAutoConfigurationTest.java`.
- Java assertions rely on JUnit static assertions (`assertEquals`, `assertTrue`) seen across `yanote-core/src/test/java/...` and `yanote-recorder-spring-mvc/src/test/java/...`.
- Spring HTTP tests use `MockMvc` request/response assertions, e.g. `status().isOk()` and `content().string(...)`.
- Vitest tests use `describe/it/expect` and mostly validate observable outputs over internals, e.g. `yanote-js/src/report/report.test.ts`.

## Integration vs unit balance
- Java coverage includes focused unit tests (e.g. coverage math in `CoverageCalculatorTest`) plus integration-ish Spring auto-config tests (`RecorderAutoConfigurationTest`).
- Recorder tests verify real file output and request flow rather than mocked internals (`RecorderWritesJsonlTest`, `RecorderIoFailureDoesNotBreakRequestTest`).
- TypeScript tests are mostly unit/functional with file fixtures and async calls (`discover.test.ts`, `report.test.ts`).

## Mocking and test doubles
- No dedicated mocking framework usage was found (no Mockito/vi.mock patterns in current tests).
- The project favors real collaborators, temporary files, and framework test harnesses.
- For Spring integration tests, configuration is controlled through `@TestPropertySource` and `@DynamicPropertySource` rather than heavy mocking.

## Coverage signals and quality gates
- There is no repository-wide JaCoCo/LCOV gating config in current Gradle/Node configs.
- Product-level coverage signal is computed by domain logic (`CoverageCalculator` in Java, `computeCoverage` in TS) and reported by CLI.
- CLI can enforce threshold/regression gates using `--min-coverage` and `--fail-on-regression` in `yanote-js/src/cli.ts`.
- Example E2E uses strict threshold (`--min-coverage 100`) in `examples/docker-compose.yml` (referenced in root `README.md`).

## How tests run
- Full Java test sweep: `./gradlew test` (documented in `README.md`).
- Module-specific Java tests: `./gradlew :examples:tests-restassured:test` (documented in `examples/tests-restassured/README.md`).
- Node tests: `npm -C yanote-js test` (documented in `yanote-js/README.md`).
- Node watch mode for local iteration: `npm -C yanote-js run test:watch` from `yanote-js/package.json`.

## Contributor guidance
- Prefer stable, behavior-first tests with deterministic fixtures (`yanote-js/test/fixtures/...`).
- Keep recorder resilience tests asserting that request flow is not broken by telemetry failures.
- Maintain current pattern of validating final artifacts (`events.jsonl`, report JSON) instead of private implementation details.
- If introducing new gates, align them with existing CLI exit code semantics in `yanote-js/src/cli.ts`.
