---
estimated_steps: 4
estimated_files: 5
---

# T01: Add executable recorder proof for dependency-based Spring integration

**Slice:** S01 — Verified Recorder Integration Path
**Milestone:** M002

## Description

Build the slice's objective proof surface by codifying an external-style Spring Boot fixture and a verification script that exercises published local artifacts, writes `events.jsonl`, and exposes failure clues when recorder contracts drift.

## Steps

1. Add `test/fixtures/recorder-spring-smoke/` as a minimal Spring Boot app that resolves `yanote-recorder-spring-mvc` from `mavenLocal()` and exposes one templated HTTP endpoint.
2. Implement `scripts/docs/verify-s01-recorder-path.sh` to publish the required Yanote modules to `mavenLocal`, boot the fixture with a temp writable events path, and send a real HTTP request through the recorder.
3. Assert in the script that the events file exists, is non-empty, and its first JSONL line contains the route, status, service, and truthful `null` metadata behavior that S01 documentation will promise.
4. Preserve temp workspace and log locations on failure so a future agent can inspect exactly why recorder integration failed.

## Must-Haves

- [ ] The proof path uses dependency resolution via published artifacts (`mavenLocal()` for local proof), not the flatDir bundle.
- [ ] The verification fails on missing or empty `events.jsonl` and on drift in the inspected JSONL fields that S01 will document.
- [ ] Failure output tells a future agent where the temp events file and boot logs were left.

## Verification

- `bash scripts/docs/verify-s01-recorder-path.sh`
- A failing run reports retained temp/log paths instead of swallowing the runtime evidence.

## Observability Impact

- Signals added/changed: deterministic script assertions over `events.jsonl` existence, non-empty state, and selected JSONL fields.
- How a future agent inspects this: run `bash scripts/docs/verify-s01-recorder-path.sh` and inspect the emitted temp directory, events file, and captured boot log.
- Failure state exposed: publish failures, Spring boot failures, empty event capture, or JSONL field drift.

## Inputs

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderProperties.java` — canonical enablement and events-path property contract.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — event/header field contract that the proof script must assert.
- `examples/springmvc-service/src/main/resources/application.properties` — proven pattern for a writable recorder path.

## Expected Output

- `scripts/docs/verify-s01-recorder-path.sh` — repeatable proof command for S01 runtime verification.
- `test/fixtures/recorder-spring-smoke/build.gradle.kts` — external-style fixture build using published local artifacts.
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java` — minimal boot app for the proof flow.
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java` — templated route used to verify captured route normalization.
- `test/fixtures/recorder-spring-smoke/src/main/resources/application.properties` — temp-path-friendly recorder config for the proof app.
