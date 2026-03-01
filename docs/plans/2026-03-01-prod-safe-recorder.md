# Prod-safe yanote recorder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `yanote-recorder-spring-mvc` disabled-by-default and fail-safe so production deployments don't record traffic unless explicitly enabled and don't break requests on IO errors.

**Architecture:** Change Spring Boot auto-configuration gating to require `yanote.recorder.enabled=true`, set the default property to `false`, and make the filter swallow IO write failures with a warning log.

**Tech Stack:** Java 21, Spring Boot 3.2.x, Servlet Filter, JUnit 5.

---

### Task 1: Auto-config is disabled by default

**Files:**
- Modify: `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderAutoConfigurationTest.java`
- Create: `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderDisabledByDefaultTest.java`
- Modify: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderProperties.java`
- Modify: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java`

**Step 1: Write the failing test**
- Add a Spring Boot test that starts an app with `@ImportAutoConfiguration(YanoteRecorderAutoConfiguration.class)` but WITHOUT setting `yanote.recorder.enabled=true`.
- Assert the `yanoteHttpEventRecordingFilter` bean is absent.

**Step 2: Run test to verify it fails**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: FAIL because the filter is currently created by default.

**Step 3: Minimal implementation**
- Set `YanoteRecorderProperties.enabled` default to `false`.
- Set `@ConditionalOnProperty(... matchIfMissing = false)` so missing property means “off”.

**Step 4: Run tests to verify green**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: PASS.

---

### Task 2: Existing auto-config recording test remains valid when enabled explicitly

**Files:**
- Modify: `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderAutoConfigurationTest.java`

**Step 1: Write the failing test**
- Update `RecorderAutoConfigurationTest` to set `yanote.recorder.enabled=true`.

**Step 2: Run test to verify it fails**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: FAIL until the property is added.

**Step 3: Minimal implementation**
- Add `@TestPropertySource(properties = "yanote.recorder.enabled=true")` (or DynamicPropertySource) to the test.

**Step 4: Run tests to verify green**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: PASS.

---

### Task 3: Recorder is fail-safe on IO errors

**Files:**
- Create: `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderIoFailureDoesNotBreakRequestTest.java`
- Modify: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`

**Step 1: Write the failing test**
- Configure recorder enabled and set `yanote.recorder.events-path` to an invalid path (e.g. a directory).
- Perform a request with MockMvc.
- Expect HTTP 200 (i.e., no 500 from the filter).

**Step 2: Run test to verify it fails**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: FAIL because current code throws `UncheckedIOException`.

**Step 3: Minimal implementation**
- Catch `IOException` in `record(...)` and log a warning, do not throw.

**Step 4: Run tests to verify green**
Run: `./gradlew :yanote-recorder-spring-mvc:test`
Expected: PASS.

---

### Task 4: Documentation updates

**Files:**
- Modify: `README.md` (if it implies default-on)
- Modify: `docs/plans/2026-02-28-yanote.md` (fix property names if needed)

**Step 1: Update docs**
- Add explicit note: in prod keep `yanote.recorder.enabled=false` (default), enable only in test/stage.

**Step 2: Verify**
- Ensure examples already set `yanote.recorder.enabled=true` (keep as-is).

