---
estimated_steps: 4
estimated_files: 6
skills_used:
  - spring-web
  - java-junit
  - test
---

# T01: Capture additive HTTP request evidence in the recorder and JSONL contract

**Slice:** S01 — Safe Request Evidence And First Scalar Truth
**Milestone:** M011

## Description

Add the additive JSONL contract and Spring MVC capture path that make the rest of M011 possible. The recorder must retain request-surface evidence truthfully before any scalar semantics can be evaluated in Node.

## Steps

1. Extend the core HTTP event contract with multi-value-safe path/query/request-header/cookie evidence entries carrying captured/redacted/omitted provenance while keeping legacy payload fields and the canonical templated `route` untouched.
2. Add a Spring MVC request-evidence capture helper that extracts path variables, query parameters, headers, and cookies from the live request, preserves repeated values, excludes `X-Test-Run-Id` / `X-Test-Suite`, redacts sensitive header/cookie names, and omits unsupported or oversized values with explicit reasons.
3. Wire the capture helper into `HttpEventRecordingFilter` so every recorded HTTP event writes the additive evidence fields alongside the existing payload and metadata contract.
4. Pin the new shape with focused Java tests for JSONL round-trip, captured query/path evidence, redacted auth/session evidence, and omission behavior.

## Must-Haves

- [ ] Old HTTP events still deserialize without the new request evidence fields.
- [ ] Captured evidence preserves repeated values in stable order and never replaces the templated `route`.
- [ ] Sensitive headers/cookies are recorded as redacted/omitted provenance, and Yanote test metadata headers are absent from semantic evidence.

## Verification

- Focused Java tests prove the additive event shape and Spring MVC capture behavior for captured, redacted, and omitted request evidence.
- `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`

## Observability Impact

- Signals added/changed: raw HTTP JSONL gains request-evidence maps plus captured/redacted/omitted provenance for path/query/header/cookie inputs.
- How a future agent inspects this: run the focused Java tests and inspect the emitted JSONL line in the recorder temp file.
- Failure state exposed: missing keys, leaked sensitive values, dropped repeated values, or missing provenance reasons become explicit in the recorder test failures and serialized event payload.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — current HTTP JSONL contract that needs additive request evidence.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — existing round-trip baseline that proves old events must stay readable.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — current Spring MVC recorder entrypoint that writes HTTP events.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java` — current source of the canonical templated `route` contract.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — existing recorder proof that should remain aligned with the widened event shape.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — additive HTTP event fields for request evidence without breaking legacy fields.
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java` — shared request-evidence model with captured/redacted/omitted provenance.
- `yanote-core/src/test/java/dev/yanote/core/events/HttpEventRequestEvidenceJsonlRoundTripTest.java` — focused core round-trip proof for the new JSONL shape.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java` — Spring MVC capture helper for path/query/header/cookie evidence.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — recorder wiring that emits the additive request evidence.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCaptureTest.java` — focused recorder proof for capture, redaction, and omission behavior.
