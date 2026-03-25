---
id: T01
parent: S01
milestone: M011
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java
  - yanote-core/src/test/java/dev/yanote/core/events/HttpEventRequestEvidenceJsonlRoundTripTest.java
  - yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java
  - yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCaptureTest.java
  - yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Use per-key tri-state `{ state, values[], reason }` request-evidence objects for path/query/request-header/cookie capture, preserving repeated values in order and lowercasing only request-header keys.
  - Capture request evidence when recording after `filterChain.doFilter(...)` so Spring MVC path variables are available while keeping the canonical templated `route` unchanged.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T14:13:26.989Z
blocker_discovered: false
---

# T01: Add additive Spring MVC request-evidence capture and JSONL contract fields for path/query/header/cookie provenance.

**Add additive Spring MVC request-evidence capture and JSONL contract fields for path/query/header/cookie provenance.**

## What Happened

I widened the JVM HTTP contract by adding additive `pathParams`, `queryParams`, `requestHeaders`, and `cookies` maps backed by a shared `HttpRequestEvidence` model. The new evidence shape reuses the existing captured/redacted/omitted honesty pattern, preserves repeated values in stable order, lowercases only request-header keys, and leaves the canonical templated `route` untouched so downstream coverage math can stay additive.

On the recorder side, I added `HttpRequestEvidenceCapture` and wired it into `HttpEventRecordingFilter` so live Spring MVC requests now retain path variables, query parameters, request headers, and cookies alongside the existing payload/body metadata. The helper excludes Yanote test metadata headers, redacts sensitive header/cookie names, and emits explicit omission reasons for unsupported or oversized values instead of leaking or silently dropping them.

To pin the contract, I created the focused core round-trip test `HttpEventRequestEvidenceJsonlRoundTripTest`, the focused recorder helper test `HttpRequestEvidenceCaptureTest`, and extended `RecorderWritesJsonlTest` so the emitted JSONL line is asserted end to end on a real Spring MVC request. I also updated the pre-existing `EventJsonlRoundTripTest` constructor call sites so the old baseline remained readable and compiling after the additive contract change, and I recorded the Spring MVC path-variable timing rule plus the worktree-local Node tooling mismatch in `.gsd/KNOWLEDGE.md`.

## Verification

Verified the exact task-level Java gate with `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`, which passed and proved additive request-evidence JSONL round-trip plus capture/redaction/omission behavior. Verified the raw recorder observability surface with `./gradlew :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.RecorderWritesJsonlTest'`, which passed and confirmed emitted `events.jsonl` carries `pathParams`, `queryParams`, `requestHeaders`, and `cookies`, redacts `Authorization` and `SESSION`, excludes `X-Test-Run-Id` / `X-Test-Suite`, and keeps `route` templated.

As an additional regression check, `./gradlew :yanote-core:test --tests '*EventJsonlRoundTripTest' --rerun-tasks` passed, confirming legacy HTTP/Kafka JSONL round-trip behavior still compiles and runs with the widened constructor. Per the slice-level verification stack, I also ran the Node and shell verifiers: `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` still failed in this worktree with `vitest: command not found`, and `bash scripts/ci/verify-m011-s01-request-evidence.sh` failed because the T04 verifier script has not been created yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'` | 0 | ✅ pass | 5641ms |
| 2 | `./gradlew :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.RecorderWritesJsonlTest'` | 0 | ✅ pass | 2629ms |
| 3 | `./gradlew :yanote-core:test --tests '*EventJsonlRoundTripTest' --rerun-tasks` | 0 | ✅ pass | 1687ms |
| 4 | `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` | 127 | ❌ fail | 191ms |
| 5 | `bash scripts/ci/verify-m011-s01-request-evidence.sh` | 127 | ❌ fail | 32ms |


## Deviations

- I extended `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` in addition to the planned focused helper/core tests so the filter wiring and emitted JSONL shape were verified directly.
- I updated existing `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` constructor call sites so the legacy round-trip baseline continued compiling against the widened additive contract.

## Known Issues

- The slice-level Node verifier still fails in this worktree because `npm -C yanote-js test -- ...` resolves `vitest: command not found`; both `npm -C yanote-js ci` and `npm --prefix yanote-js ci` reported success but did not create `yanote-js/node_modules` or a local `vitest` bin.
- `scripts/ci/verify-m011-s01-request-evidence.sh` does not exist yet; it is planned work for T04, so the full slice verification stack is intentionally still partial at the end of T01.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java`
- `yanote-core/src/test/java/dev/yanote/core/events/HttpEventRequestEvidenceJsonlRoundTripTest.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCaptureTest.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
- `.gsd/KNOWLEDGE.md`
