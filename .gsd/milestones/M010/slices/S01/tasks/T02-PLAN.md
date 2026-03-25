---
estimated_steps: 5
estimated_files: 4
skills_used:
  - java-junit
  - best-practices
  - debug-like-expert
---

# T02: Capture redaction-safe parameter and header evidence in the Spring MVC recorder

**Slice:** S01 — HTTP Evidence Depth For Undeclared Statuses, Parameter Values, And Response Headers
**Milestone:** M010

## Description

Populate the new HTTP evidence contract from real Spring MVC traffic. This task is where S01 becomes truthful instead of fixture-driven: URI template variables, query params, request headers, and response headers must be captured after the filter chain runs, with explicit sensitive-value handling and no regression to current payload capture behavior.

## Steps

1. Introduce a recorder-side helper that extracts URI template variables, repeated query params, request headers, and response headers into the additive evidence structures from T01.
2. Capture request evidence before the chain and response headers after controller execution so final response metadata is available.
3. Normalize request/response header names to lowercase and preserve repeated values as arrays.
4. Apply a minimal sensitive-name policy for request evidence (for example `authorization`, `cookie`, and names containing `token`, `secret`, `password`, or `api-key`) so raw sensitive values never land in JSONL.
5. Extend recorder tests to pin both captured values and redacted/omitted cases.

## Must-Haves

- [ ] Spring MVC recording writes additive path/query/request-header/response-header evidence on real requests.
- [ ] Sensitive request inputs are represented as explicit redacted/omitted evidence instead of raw values.
- [ ] Response headers are captured after controller execution without regressing request/response payload capture.

## Verification

- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`
- `./gradlew :yanote-recorder-spring-mvc:test`

## Observability Impact

- Signals added/changed: recorded JSONL now exposes live parameter/header evidence and explicit sensitive-value handling.
- How a future agent inspects this: `RecorderWritesJsonlTest` expectations and the emitted `events.jsonl` line shape.
- Failure state exposed: missing route/query/header evidence, wrong normalization, or leaked sensitive request values fail with concrete field-level assertions.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — additive evidence contract from T01 that the recorder must populate.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — current recording seam.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — existing omission/capture pattern worth mirroring.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — focused recorder contract coverage.

## Expected Output

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — recorder updated to emit additive evidence.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java` — helper for safe parameter/header capture and normalization.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — shared omission/capture semantics kept aligned where needed.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — recorder tests covering captured and redacted/omitted evidence.
