---
id: T01
parent: S01
milestone: M002
provides:
  - "Executable dependency-based Spring recorder proof via mavenLocal-published artifacts."
  - "Standalone Spring Boot smoke fixture with a templated `/orders/{orderId}` endpoint for recorder verification."
key_files:
  - scripts/docs/verify-s01-recorder-path.sh
  - test/fixtures/recorder-spring-smoke/settings.gradle.kts
  - test/fixtures/recorder-spring-smoke/build.gradle.kts
  - test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java
  - test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java
  - test/fixtures/recorder-spring-smoke/src/main/resources/application.properties
key_decisions:
  - "Kept the smoke fixture as an isolated Gradle build with its own settings file so the proof path resolves published coordinates from `mavenLocal()` instead of project dependencies or flatDir jars."
patterns_established:
  - "Recorder proof scripts should publish local artifacts first, boot an external-style fixture, and assert JSONL fields directly."
  - "Failure-path verification can be exercised through env-driven expected-value overrides without editing the script itself."
observability_surfaces:
  - "`scripts/docs/verify-s01-recorder-path.sh` retains `temp_dir`, `publish_log`, `app_log`, `events_file`, and `response_file` on failure and prints tail excerpts for quick triage."
duration: 40m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T01: Add executable recorder proof for dependency-based Spring integration

**Added a standalone Spring Boot smoke fixture plus a proof script that publishes Yanote artifacts to `mavenLocal()`, drives a real request, and fails closed on `events.jsonl` drift.**

## What Happened

I added `test/fixtures/recorder-spring-smoke/` as an isolated Gradle Spring Boot app that depends on `io.github.zuevrs:yanote-recorder-spring-mvc` from `mavenLocal()` and exposes a templated `GET /orders/{orderId}` route.

I then added `scripts/docs/verify-s01-recorder-path.sh` to:

- publish `yanote-core` and `yanote-recorder-spring-mvc` to `mavenLocal()`
- boot the standalone fixture against a temp writable `YANOTE_EVENTS_PATH`
- send a real HTTP request through the recorder
- assert that `events.jsonl` exists, is non-empty, and that its first JSONL record matches the S01 contract for `method`, templated `route`, `status`, `service`, `test.run_id`, and `test.suite`
- retain temp/log artifacts on failure and print their locations

During verification I hit two runtime issues and fixed them at the root cause:

1. Gradle treated the fixture as part of the main build when it had no local settings file, so I added `test/fixtures/recorder-spring-smoke/settings.gradle.kts` to keep it truly external-style.
2. Local `curl` requests were going through proxy env vars and returning `502`, so the proof script now uses `--noproxy '*'` for the localhost request.

## Verification

- `bash scripts/docs/verify-s01-recorder-path.sh` ✅
  - passed with `method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`
- `YANOTE_EXPECTED_ROUTE=/wrong bash scripts/docs/verify-s01-recorder-path.sh` ✅ expected failure-path check
  - exited non-zero and printed retained `temp_dir`, `publish_log`, `app_log`, and `events_file` locations
- `bash scripts/docs/verify-s01-doc-links.sh` ❌
  - currently missing; this slice-level verification remains pending for T03 as planned

## Diagnostics

Re-run `bash scripts/docs/verify-s01-recorder-path.sh` for the happy path.

For failure inspection, the script now leaves behind and prints:

- temp workspace directory
- publish log path
- Spring boot log path
- `events.jsonl` path
- HTTP response capture path

It also prints log tails before exiting so a future agent can see whether the failure was publish-time, boot-time, request-time, or JSONL-contract drift.

## Deviations

- Added `test/fixtures/recorder-spring-smoke/settings.gradle.kts` even though it was not listed in the task expected-output block. This was required to make Gradle treat the fixture as an unrelated external build instead of trying to attach it to the repository root settings file.

## Known Issues

- `scripts/docs/verify-s01-doc-links.sh` does not exist yet, so the full slice verification set is still incomplete until T03.

## Files Created/Modified

- `scripts/docs/verify-s01-recorder-path.sh` — publishes local artifacts, boots the smoke fixture, asserts JSONL contract fields, and preserves failure artifacts.
- `test/fixtures/recorder-spring-smoke/settings.gradle.kts` — isolates the fixture as its own Gradle build.
- `test/fixtures/recorder-spring-smoke/build.gradle.kts` — configures the standalone Spring Boot fixture to resolve Yanote artifacts from `mavenLocal()`.
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java` — boots the standalone smoke app.
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java` — exposes the templated route used to verify route normalization.
- `test/fixtures/recorder-spring-smoke/src/main/resources/application.properties` — binds recorder enablement, writable events path, service name, and overridable server port.
