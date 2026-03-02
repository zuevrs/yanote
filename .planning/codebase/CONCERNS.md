# Technical Concerns

## Technical Debt
- Coverage logic is duplicated across Java and TypeScript, increasing divergence risk and maintenance cost: `yanote-core/src/main/java/dev/yanote/core/coverage/CoverageCalculator.java`, `yanote-js/src/coverage/coverage.ts`.
- OpenAPI operation extraction is also duplicated in two runtimes; behavior drift is likely over time: `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiOperations.java`, `yanote-js/src/spec/openapi.ts`.
- Build/distribution flow mixes Gradle + shell + npm in one task chain, which is hard to debug and evolve: `build.gradle.kts`.
- Distribution pipeline depends on imperative shell command composition instead of typed task graph boundaries: `build.gradle.kts` (`buildDistNodeAnalyzer`).

## Fragile Areas
- Recorder writes events only after `filterChain.doFilter(...)` without `finally`; requests ending in exception may not be recorded: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`.
- Route template resolution falls back to raw URI when pattern attribute is missing, causing coverage mismatches against templated OpenAPI routes: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java`.
- Cucumber plugin writes suite name into global JVM property; parallel test execution can cross-contaminate suite metadata: `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java`.
- Example E2E test can be silently skipped when service is unavailable (`Assumptions.assumeTrue`), masking regressions in local/CI-like runs: `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`.
- Example readiness loops rely on sleep/polling and broad exception swallowing, making failures slow and non-diagnostic: `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`.

## Security And Performance Concerns
- Event writer opens/closes a file handle for every request and creates a writer per call; this adds I/O overhead under load: `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`.
- Concurrent append behavior to a shared JSONL file is not coordinated (no explicit lock/queue), risking line interleaving/corruption at high concurrency: `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`.
- On repeated write failures, recorder warns per request and may flood logs in production incidents: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`.
- Recorder path is fully configurable and unvalidated; misconfiguration can redirect writes to sensitive/unexpected locations: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderProperties.java`.
- OpenAPI parsing uses full dereference/resolve behavior, which can significantly increase parse time and memory on large specs: `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`, `yanote-js/src/spec/openapi.ts`.
- JSONL ingestion accumulates all parsed events in memory before coverage calculation; large event files can cause memory pressure or OOM: `yanote-js/src/events/readJsonl.ts`.

## Operational Risks
- No repository CI workflow files were found (only `examples/docker-compose.yml` and spec YAMLs), so quality gates appear dependent on manual runs: `examples/docker-compose.yml`.
- Example/report flow uses `npm install` (not `npm ci`) in docker compose, reducing reproducibility and increasing supply-chain drift risk: `examples/docker-compose.yml`.
- Dist build task force-removes `yanote-js/node_modules`, increasing build time and brittleness for local/dev pipelines: `build.gradle.kts`.
- Toolchain spans Java 21 + Node >=20 with no visible compatibility matrix/tests for version drift across environments: `build.gradle.kts`, `yanote-js/package.json`.
- TypeScript config suppresses library type-checking (`skipLibCheck`), which can hide dependency typing regressions until runtime: `yanote-js/tsconfig.json`.
- Demo artifacts and bundles are committed under `dist/` (including `dist.zip`), increasing repository weight and review noise for source changes: `dist.zip`, `dist/`.

## Testing Coverage Gaps
- Core modules have unit tests, but resilience/performance behavior (high concurrency writes, huge input files) is not directly covered: `yanote-core/src/test/...`, `yanote-js/src/**/*.test.ts`.
- Example Spring MVC service has no dedicated tests in its module, pushing confidence to cross-module integration only: `examples/springmvc-service/src/main/...` (no `examples/springmvc-service/src/test/...`).
