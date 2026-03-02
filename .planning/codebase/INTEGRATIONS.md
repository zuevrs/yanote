# Integrations

## External APIs and Protocol Parsers
- OpenAPI parsing in Java uses `io.swagger.parser.v3:swagger-parser` (`yanote-core/build.gradle.kts`, `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`).
- OpenAPI parsing in Node uses `@apidevtools/swagger-parser` (`yanote-js/package.json`, `yanote-js/src/spec/openapi.ts`).
- AsyncAPI parsing in Node uses `@asyncapi/parser` (`yanote-js/package.json`, `yanote-js/src/spec/asyncapi.ts`).
- No outbound business API client integration (Stripe, AWS SDK, GCP, etc.) was found in source modules.

## Service-to-Service / HTTP Touchpoints
- Example test suite calls the demo service over HTTP using RestAssured (`examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`).
- Demo service exposes HTTP endpoints (`/health`, `/users`, `/users/{id}`, `/admin/ping`) in `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`.
- Docker Compose wires `tests -> api` via `YANOTE_BASE_URI=http://api:8080` in `examples/docker-compose.yml`.

## Data Stores and Persistence
- Primary persisted artifact is append-only event log file `events.jsonl` written by recorder (`yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`).
- CLI reads JSONL events from filesystem (`yanote-js/src/events/readJsonl.ts`).
- CLI writes coverage report JSON to filesystem as `yanote-report.json` (`yanote-js/src/report/writeReport.ts`).
- No relational/NoSQL datastore integration detected (no JDBC drivers, ORM mappings, Prisma/Drizzle schemas).

## Auth, Identity, and Access
- No user authentication/authorization provider integration (OAuth/OIDC/JWT/Clerk/Auth0/etc.) found.
- Current identity-like tags are test metadata headers only: `X-Test-Run-Id` and `X-Test-Suite` (`yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java`).
- Cucumber plugin sets suite in JVM system properties (`yanote.suite`) for propagation to HTTP headers (`yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java`).

## Webhooks and Eventing
- No webhook receiver endpoints or webhook delivery clients found.
- Event model is local JSONL records (`yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`, `YanoteEvent.java`).
- AsyncAPI support is currently parser/analyzer-side (spec analysis), not runtime broker client integration (`yanote-js/src/spec/asyncapi.ts`).

## Runtime Configuration and Env Entry Points
- Recorder feature gate and paths:
- `yanote.recorder.enabled`, `yanote.recorder.events-path`, `yanote.recorder.service-name` in `YanoteRecorderProperties.java` and `examples/springmvc-service/src/main/resources/application.properties`.
- Recorder auto-configuration activation uses Spring conditional property in `YanoteRecorderAutoConfiguration.java`.
- RestAssured test tagging env input uses `YANOTE_RUN_ID` (`YanoteRestAssuredFilter.java`).
- Example E2E tests also consume `YANOTE_BASE_URI`, `YANOTE_EVENTS_PATH`, `YANOTE_SUITE`, `YANOTE_RUN_ID` (`DemoServiceE2eTest.java`).
- Docker orchestration adds marker-file envs `YANOTE_READY_MARKER` and `YANOTE_REPORT_MARKER` (`examples/docker-compose.yml`).

## Build/Distribution Integration Surfaces
- Java artifacts and recorder bundle are produced through root Gradle tasks (`build.gradle.kts` tasks `distFlatdirRecorder`, `distAll`).
- Node analyzer distribution is built via npm + copied by Gradle (`build.gradle.kts` task `buildDistNodeAnalyzer`).
- CLI binary exposure is configured through `bin` mapping in `yanote-js/package.json`.

## Integration Summary
- Integrations are local-first and tooling-focused: Spring MVC request interception, OpenAPI/AsyncAPI spec parsing, file-based event/report exchange, and Docker-based demo orchestration.
- Most external dependency surface is parser/tooling libraries rather than live SaaS APIs.
