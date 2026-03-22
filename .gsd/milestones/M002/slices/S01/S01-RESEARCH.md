# M002/S01 — Research

**Date:** 2026-03-12

## Summary

This slice directly owns **R023** (verified real-service recorder integration path) and **R024** (event evidence capture and retrieval guidance), and it supports **R026** (RestAssured/Cucumber tagging guidance). The good news: the codebase already has the core ingredients. `yanote-recorder-spring-mvc` is a real Spring Boot auto-configuration module, it is disabled by default for production safety, the repo contains a runnable Spring MVC example that writes `events.jsonl`, and there is already a secondary flatDir/offline smoke path. The missing piece is not recorder functionality — it is a short, truthful, user-facing path that clearly separates the recommended integration from the temporary smoke shortcut.

The recommended execution path for S01 is to document **dependency-based integration first** and keep `dist/flatdir-recorder/` explicitly secondary. I verified two real capture paths locally: (1) the in-repo example service plus RestAssured tests produced a non-empty `/tmp/yanote-s01-events.jsonl` with four recorded events and templated routes; (2) an external temporary Spring Boot app outside this monorepo, wired only through published local Maven artifacts, also produced `events.jsonl`. That means S01 can truthfully present a “real service” path instead of leaning on the flatDir bundle.

The main doc risk is contract drift around metadata and verification details. The recorder captures requests even without suite/run metadata, but the current code writes `null` when the headers are absent — not `"unknown"`. The RestAssured helper reads run ID from env only when the caller uses `fromEnv()`, while suite naming comes from the **system property** `yanote.suite`; the example test bridges `YANOTE_SUITE` into that property manually. S01 should already call out the exact header/property contract so S02 does not have to unwind misleading setup assumptions.

## Recommendation

Implement S01 around one canonical user flow, grounded in existing verified assets:

1. **Primary path: dependency-based Spring integration**
   - Add one user-facing guide under `docs/` for integrating `yanote-recorder-spring-mvc` into a real Spring Boot service.
   - Lead with the dependency-based path (`mavenCentral()` / internal mirror for released versions, `mavenLocal()` for local branch verification).
   - Show the canonical recorder config surface exactly as implemented: `yanote.recorder.enabled`, `yanote.recorder.events-path`, optional `yanote.recorder.service-name`.

2. **Verification contract: request → non-empty file → inspect first line**
   - Require one real HTTP request against the service.
   - Require `test -s <events.jsonl>` or equivalent non-empty check, not just file existence.
   - Show how to inspect the first one or two JSONL lines and what fields to expect: `method`, templated `route`, `status`, optional `service`, `test.run_id`, `test.suite`.

3. **Retrieval guidance for real environments**
   - Document how to choose a writable path that survives the process/container boundary.
   - Reuse the example’s `/data/yanote/events.jsonl` pattern for Docker/CI-style environments.
   - Tell the user explicitly that the file must be copied out or mounted from a stable location before analysis.

4. **Secondary path: flatDir bundle, clearly labeled smoke/offline only**
   - Keep `dist/flatdir-recorder/README.md` as a fallback for closed networks and very fast smoke checks.
   - Do not present flatDir as the main product path.
   - Link to it from the main guide as an escape hatch, not as the headline path.

5. **Support R026 without overloading S01**
   - Include one short “metadata headers” callout in the S01 guide: recorder reads `X-Test-Run-Id` and `X-Test-Suite` if present.
   - Defer full RestAssured/Cucumber walkthroughs to S02, but already state the exact current contract: RestAssured filter uses `YANOTE_RUN_ID` + `yanote.suite`, and the Cucumber plugin sets `yanote.suite`.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Spring MVC request capture | `yanote-recorder-spring-mvc` auto-configuration + `HttpEventRecordingFilter` | Already verified in tests and in live local runs; no need for custom filter examples. |
| Recorder enable/disable behavior | `YanoteRecorderProperties` + `@ConditionalOnProperty` in `YanoteRecorderAutoConfiguration` | Keeps the guide aligned with the real prod-safe contract: disabled by default, explicit opt-in only. |
| RestAssured header injection | `yanote-test-tags-restassured` | Prevents docs from inventing ad hoc header wiring that can drift from the shipped API. |
| Cucumber suite naming | `yanote-test-tags-cucumber` | Reuses the existing suite derivation path instead of making users hand-maintain suite headers. |
| Offline smoke verification | `dist/flatdir-recorder/verify.sh` | Already matches the flatDir bundle and checks the right success condition: non-empty `events.jsonl`. |

## Existing Code and Patterns

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderProperties.java` — canonical configuration surface: `enabled=false` by default, default path `events.jsonl`, optional `serviceName`.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java` — the real integration seam; the recorder is activated only when `yanote.recorder.enabled=true` is set.
- `yanote-recorder-spring-mvc/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — proves the module is packaged as a Spring Boot auto-configuration dependency, not just an internal example.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — exact event contract for S01 docs: header names, status capture, optional `service`, and fail-safe IO behavior.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java` — recorder prefers Spring MVC templated routes and falls back to raw request URI only when the matching pattern attribute is unavailable.
- `examples/springmvc-service/src/main/resources/application.properties` — best current example of explicit enablement plus env-backed writable events path.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — verified example of route capture, run/suite propagation, and non-empty file validation against a running service.
- `dist/flatdir-recorder/README.md` + `dist/flatdir-recorder/snippets/run-with-recorder.md` — secondary smoke path that should stay available, but clearly marked temporary/offline.
- `build.gradle.kts` — confirms both publication and bundle assembly exist today: `publishToMavenLocal` works for recorder modules, and `distFlatdirRecorder` assembles the offline JAR bundle.

## Constraints

- The recorder is **disabled by default** and only activates when `yanote.recorder.enabled=true` is set explicitly.
- The events path must point to a **writable** location; the slice should recommend stable paths that are easy to mount or copy out of containers/CI jobs.
- Current service-side integration is explicitly **Spring Boot / Spring MVC 3.x-oriented**; the module depends on Spring Boot 3.2.2 autoconfiguration and `spring-boot-starter-web`.
- Route capture is only as good as Spring MVC route resolution; when the matching pattern attribute is absent, the recorder falls back to the raw request URI.
- The guide must distinguish **recommended product usage** from the current **flatDir smoke/offline shortcut**, per milestone scope.
- The current repo version is `0.1.0-SNAPSHOT`, while the release tag line is already in the `v1.0.x` range; S01 should avoid hardcoding stale-looking version narratives that S04 will formalize later.

## Common Pitfalls

- **Presenting flatDir as the main integration path** — keep it as an escape hatch for closed networks and smoke checks; lead with dependency-based integration instead.
- **Documenting `YANOTE_SUITE` as if the RestAssured library reads it directly** — the shipped filter reads `yanote.suite` as a system property; only the example test bridges env to that property.
- **Checking only file existence** — require a non-empty file check (`test -s`) and show a sample line so the user knows the recorder is writing valid JSONL.
- **Claiming missing test metadata becomes `"unknown"`** — current code writes `null` when `X-Test-Run-Id` / `X-Test-Suite` are absent, so docs must describe those headers truthfully.
- **Burying retrieval details** — for containers and CI, the file path must be chosen so the user can actually export `events.jsonl` for the analyzer step.

## Open Risks

- The repo still lacks a stable user-docs information architecture, so S01 may need to create a temporary-but-sane guide location that S05 later normalizes.
- The released artifact version story is not yet exposed clearly in repo docs; S01 can prove the path technically, but S04 still needs to make the release line obvious.
- If S01 only documents the in-repo example service, the guide will still feel internal; execution should preserve the external-service dependency snippet as the real adoption path.
- `dist/flatdir-recorder/libs/` is build output, not a committed product surface; docs must tell users to generate the bundle first instead of implying the JARs are always present in Git.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Spring Boot | `github/awesome-copilot@java-springboot` | available (not installed; 7.8K installs, directly relevant) |
| Gradle | `pluginagentmarketplace/custom-plugin-java@java-gradle` | available (not installed; 125 installs, more relevant than Android-specific Gradle skills) |
| Docker Compose | `sickn33/antigravity-awesome-skills@docker-expert` | available (not installed; 5.6K installs, broad Docker help if compose proof work expands) |

## Sources

- Recorder configuration and prod-safe activation are implemented exactly in `YanoteRecorderProperties`, `YanoteRecorderAutoConfiguration`, and Boot auto-configuration imports (source: [YanoteRecorderProperties.java](../../../../../yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderProperties.java), [YanoteRecorderAutoConfiguration.java](../../../../../yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java), [AutoConfiguration.imports](../../../../../yanote-recorder-spring-mvc/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports)).
- Recorder event shape, metadata headers, route templating, and fail-safe IO behavior come from the shipped filter and route resolver (source: [HttpEventRecordingFilter.java](../../../../../yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java), [RouteTemplateResolver.java](../../../../../yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java), [HttpEvent.java](../../../../../yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java)).
- The in-repo real-service path is already runnable: the example service enables the recorder and the RestAssured demo proves `events.jsonl` capture against a live Spring MVC app (source: [application.properties](../../../../../examples/springmvc-service/src/main/resources/application.properties), [ExampleServiceApplication.java](../../../../../examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java), [DemoServiceE2eTest.java](../../../../../examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java), [examples/tests-restassured/README.md](../../../../../examples/tests-restassured/README.md)).
- Local verification completed on 2026-03-12: `./gradlew :yanote-recorder-spring-mvc:test :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test` passed; `:examples:springmvc-service:bootRun` plus `:examples:tests-restassured:test` produced a four-line `/tmp/yanote-s01-events.jsonl`; and a temporary external Spring Boot app using `mavenLocal()` also produced `/tmp/yanote-s01-external-events.jsonl` with a recorded `/orders/{id}` event.
- The secondary offline/smoke route already exists and should be preserved as such, not promoted to the primary integration story (source: [dist/flatdir-recorder/README.md](../../../../../dist/flatdir-recorder/README.md), [run-with-recorder.md](../../../../../dist/flatdir-recorder/snippets/run-with-recorder.md), [verify.sh](../../../../../dist/flatdir-recorder/verify.sh)).
- The repo root already hints at the right boundary — recommended long-term dependency usage vs temporary flatDir smoke checks — but does not yet turn that into a short verified guide (source: [README.md](../../../../../README.md), [build.gradle.kts](../../../../../build.gradle.kts), [gradle.properties](../../../../../gradle.properties)).
