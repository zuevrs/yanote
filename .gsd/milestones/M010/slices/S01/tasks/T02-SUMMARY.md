---
id: T02
parent: S01
milestone: M010
provides:
  - Spring MVC recorder emission of additive path/query/request-header/response-header evidence with sensitive request-value redaction and compatibility key preservation.
key_files:
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java
  - yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Capture query params and request headers before the filter chain, but capture URI template variables and response headers after controller execution because Spring only exposes path variables after handler mapping.
patterns_established:
  - Recorder-side HTTP evidence uses a dedicated helper that lowercases header names, preserves repeated values as arrays, redacts sensitive request keys by name, and emits explicit `unavailable` omissions for blank header values.
observability_surfaces:
  - `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`, emitted temp `yanote-recorder-events.jsonl` lines, and `bash scripts/docs/verify-s02-analysis-path.sh`
duration: 1h10m
verification_result: passed
completed_at: 2026-03-25T01:15:00+03:00
blocker_discovered: false
---

# T02: Capture redaction-safe parameter and header evidence in the Spring MVC recorder

**Spring MVC recorder now writes additive HTTP evidence with live path/query/header facts, sensitive request-value redaction, and post-controller response header capture.**

## What Happened

I added a new recorder-side helper, `HttpEvidenceCapture`, to translate live Spring MVC request/response metadata into the additive `HttpEvent` evidence contract from T01. It captures repeated query params, request headers, path params, and response headers as `ValueEvidence`, lowercases header names, preserves multi-value order, redacts sensitive request inputs by name, and emits explicit `unavailable` omissions when a retained text value is blank.

In `HttpEventRecordingFilter`, I split capture timing to match Spring MVC reality: query params and request headers are snapped before `filterChain.doFilter(...)`, while URI template variables and final response headers are captured after controller execution. This keeps payload capture behavior unchanged while ensuring route variables and final response metadata are present when the event is written.

I then expanded `RecorderWritesJsonlTest` so the focused Spring MVC proof now exercises real additive evidence: path params, repeated query params, repeated request headers, repeated response headers, sensitive query/header redaction, explicit blank response-header omission, and continued request/response payload capture behavior. During verification, one assertion initially failed because MockMvc normalized the text response content type to `text/plain;charset=UTF-8`; I verified the emitted JSONL, confirmed the mismatch, and narrowed the test to assert the semantic prefix instead of a too-strict raw string.

Finally, I appended the Spring MVC timing rule to `.gsd/KNOWLEDGE.md` because it is easy to miss that URI template variables are unavailable until after handler mapping has completed.

## Verification

Task-level verification passed with the required recorder commands:
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`
- `./gradlew :yanote-recorder-spring-mvc:test`

I also reran the slice-level stack relevant to this intermediate task:
- `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest" --info` passed and produced detailed Spring/Gradle diagnostics.
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"` passed, confirming the recorder changes still fit the canonical HTTP contract.
- `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts` passed, confirming Node-side compatibility remains intact.
- `bash scripts/docs/verify-s02-analysis-path.sh` passed, confirming the existing analyzer-path regression proof still holds after the recorder change.
- `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` still fails with `127` because that verifier belongs to T03 and is not created yet; this remains the expected intermediate slice-level gap.

For observability, I also directly inspected the emitted `yanote-recorder-events.jsonl` line after the focused recorder test. It showed additive `pathParams`, `queryParams`, `requestHeaders`, and `responseHeaders`, retained compatibility `queryKeys`/`headerKeys`, redacted `token`/`authorization`/`cookie`, preserved repeated `x-trace-id` values, and emitted `server-timing` as `{ state: "omitted", reason: "unavailable" }`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"` | 0 | ✅ pass | 3.0s |
| 2 | `./gradlew :yanote-recorder-spring-mvc:test` | 0 | ✅ pass | 4.0s |
| 3 | `./gradlew :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest" --info` | 0 | ✅ pass | 3.3s |
| 4 | `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest"` | 0 | ✅ pass | 3.0s |
| 5 | `npm -C yanote-js test -- src/events/readJsonl.httpEvidence.test.ts` | 0 | ✅ pass | 1.0s |
| 6 | `bash scripts/docs/verify-s02-analysis-path.sh` | 0 | ✅ pass | 334.6s |
| 7 | `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` | 127 | ❌ fail | 0.0s |

## Diagnostics

Future inspection points for this task:
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` now pins captured, redacted, and omitted additive HTTP evidence at field level.
- The temp recorder artifact `yanote-recorder-events.jsonl` shows the live JSONL line shape with compatibility arrays plus additive evidence maps.
- `bash scripts/docs/verify-s02-analysis-path.sh` remains green, so downstream analyzer-path regressions still surface separately from the recorder-focused proof.

## Deviations

- I did not need to modify `HttpPayloadCapture.java`; the existing payload capture semantics remained aligned once the new evidence helper was added around the filter.
- I recorded the Spring MVC path-variable timing rule in `.gsd/KNOWLEDGE.md` because it was a non-obvious execution detail discovered during implementation.

## Known Issues

- `scripts/docs/verify-m010-s01-http-evidence-depth.sh` does not exist yet in this worktree. That verifier is planned work for T03, so the full slice verification stack is still intentionally partial at the end of T02.

## Files Created/Modified

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEvidenceCapture.java` — added recorder-side capture/redaction logic for path params, query params, request headers, and response headers.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — split capture timing across pre-chain request evidence and post-chain path/response evidence, then wrote the additive maps into `HttpEvent`.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — extended the focused recorder proof to cover captured values, repeated headers, redacted request inputs, explicit omissions, and payload non-regression.
- `.gsd/KNOWLEDGE.md` — recorded the Spring MVC handler-mapping timing rule for path-parameter capture.
- `.gsd/milestones/M010/slices/S01/S01-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the next action from T02 to T03.
- `.gsd/milestones/M010/slices/S01/tasks/T02-SUMMARY.md` — documented implementation, verification, diagnostics, and remaining slice-level gap.
