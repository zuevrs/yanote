---
id: S01
parent: M011
milestone: M011
provides:
  - Additive `pathParams`, `queryParams`, `requestHeaders`, and `cookies` evidence on HTTP JSONL events with captured/redacted/omitted provenance.
  - An additive `requestParameters` OpenAPI contract and `httpRequestConformance` analyzer/report/CLI surface for first-scalar path/query/header/cookie truth.
  - A focused Spring MVC/OpenAPI proof route plus verifier script that localizes request-evidence drift across recorder, JSONL normalization, and report rendering.
requires:
  []
affects:
  - S02
  - S04
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/cli.ts
  - examples/openapi/request-evidence-openapi.yaml
  - scripts/ci/verify-m011-s01-request-evidence.sh
key_decisions:
  - Represent retained path/query/request-header/cookie evidence as tri-state `{ state, values[], reason }` objects, preserving repeated values and lowercasing only request-header keys.
  - Keep legacy `coverage.parameters` math stable by adding an additive `requestParameters` contract and a separate `httpRequestConformance` truth surface instead of redefining existing parameter coverage.
  - Keep raw observed request values in `yanote-report.json` diagnostics only; CLI request-conformance output uses sanitized summary messages plus evidence reasons so stdout never leaks secrets or retained values.
  - Use a focused proof route and TCP-port readiness checks for live request-evidence verification so retained artifacts contain only declared proof traffic.
patterns_established:
  - Recorder captures portable request evidence; analyzer computes semantic truth from retained artifacts rather than introspecting the runtime directly.
  - Widen HTTP contract depth additively: preserve existing coverage numerators while publishing new truth on a separate report/CLI surface.
  - Focused live proofs should assert both raw `events.jsonl` evidence and normalized `yanote-report.json` truth so failures localize cleanly to capture, normalization, or rendering.
observability_surfaces:
  - `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`
  - `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`
  - `bash scripts/ci/verify-m011-s01-request-evidence.sh`
  - Retained `events.jsonl` artifact from the focused verifier
  - Retained `yanote-report.json` and CLI stdout from the focused verifier
drill_down_paths:
  - .gsd/milestones/M011/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M011/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M011/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T15:27:49.007Z
blocker_discovered: false
---

# S01: Safe Request Evidence And First Scalar Truth

**Spring MVC request evidence now survives recorder → JSONL → analyzer → report with additive captured/redacted/omitted path/query/header/cookie proof and a dedicated first-scalar `httpRequestConformance` truth surface.**

## What Happened

S01 widened the live HTTP contract additively instead of redefining the existing coverage math. On the JVM side, the slice introduced a shared `HttpRequestEvidence` model plus additive `pathParams`, `queryParams`, `requestHeaders`, and `cookies` fields on `HttpEvent`, then wired Spring MVC capture so request evidence is recorded after handler mapping, keeps the canonical templated route unchanged, preserves repeated values in order, excludes Yanote metadata headers, and redacts or omits sensitive/unsupported values honestly. On the Node side, the slice normalized the new request-evidence maps backward-compatibly, derived legacy `queryKeys` and `headerKeys` only from captured retained evidence, kept legacy `parameters` for existing coverage numerators, added additive `requestParameters` for path/query/header/cookie first-scalar semantics, and implemented `computeHttpRequestConformance()` so retained request evidence is classified as captured-valid, captured-invalid, redacted, omitted, or unsupported without guessing. The public surface then grew a deterministic top-level `httpRequestConformance` section in `yanote-report.json`, schema/normalization support, CLI `HTTP Request Conformance` output, and additive `YANOTE_SUMMARY` request tokens while keeping raw request values out of stdout. Finally, the slice added a focused Spring MVC proof route, matching OpenAPI contract, RestAssured test, and `scripts/ci/verify-m011-s01-request-evidence.sh` so a real request now proves raw `events.jsonl` evidence and report/CLI truth end to end. During closeout, the exact Gradle slice verifier initially missed the focused JUnit classes under `--tests`; making those focused test classes public restored the exact slice-plan verifier without weakening the command.

## Verification

Ran every slice-plan verifier successfully. `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'` passed after making the targeted JUnit classes public so the exact Gradle filter discovered them. `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` passed with 6/6 focused Vitest files and 16/16 tests. `bash scripts/ci/verify-m011-s01-request-evidence.sh` passed end to end. For observability, reran the verifier with `YANOTE_KEEP_TEMP=true` and inspected the retained `events.jsonl`, `yanote-report.json`, and CLI stdout bundle: raw artifacts showed captured/redacted/omitted request evidence with no leaked secrets, and `yanote-report.json` showed `httpRequestConformance.summary` with `observedOperations=1`, `observedParameters=7`, counts `capturedValid=4`, `capturedInvalid=0`, `redacted=2`, `omitted=1`, `unsupported=0` on the focused proof route.

## Requirements Advanced

- R022 — Proved the first safe request-evidence increment: live Spring MVC capture now retains additive path/query/header/cookie evidence and the analyzer/report path publishes first-scalar request truth on retained artifacts without overclaiming broader serialization/media support.

## Requirements Validated

- R001 — The exact slice-plan Java/Vitest verifiers and the focused `bash scripts/ci/verify-m011-s01-request-evidence.sh` proof all passed, showing the deterministic recorder → JSONL → analyzer → report contract still holds while request evidence and request-conformance surfaces were added additively.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Used additive `requestParameters` and top-level `httpRequestConformance` surfaces instead of widening legacy parameter-coverage/report numerators. Switched focused proof readiness from recorded HTTP probes to TCP-port checks so undeclared readiness traffic could not pollute the retained proof bundle. During closeout, made the two focused JUnit test classes public so the exact slice-plan Gradle `--tests` verifier worked as written.

## Known Limitations

This slice only proves the first supported scalar subset on retained request evidence. Repeated-value arrays, wider serialization/style/explode/content semantics, and richer cookie semantics are still deferred to S02. Format policy and most-specific media truth remain deferred to S03. Public docs/CI/schema contract closeout for the widened HTTP boundary remains deferred to S04.

## Follow-ups

S02 should build directly on the retained request evidence and additive `requestParameters` contract to classify supported repeated-value arrays and explicit unsupported serialization/style/content constructs without changing the established numerators. S03 should keep the request-conformance surface separate while adding format/media truth. S04 should document and stabilize the widened public HTTP boundary across CLI/report/schema/docs/CI surfaces.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — Added additive request-evidence fields for path/query/request-header/cookie retention on HTTP events.
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java` — Introduced the shared tri-state request-evidence model used across recorder and analyzer boundaries.
- `yanote-core/src/test/java/dev/yanote/core/events/HttpEventRequestEvidenceJsonlRoundTripTest.java` — Pinned HTTP request-evidence JSONL round-trip behavior and made the focused JUnit class public so the exact Gradle verifier filter resolves it.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — Updated legacy round-trip fixtures to stay compatible with the widened additive HTTP contract.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java` — Captured repeated request values safely, excluded Yanote metadata headers, and redacted/omitted sensitive or unsupported inputs.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — Recorded request evidence after Spring MVC handler mapping so path variables are available while the canonical templated route stays unchanged.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCaptureTest.java` — Verified request-evidence capture/redaction/omission behavior and made the focused JUnit class public for exact Gradle filtering.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — Asserted the real recorder emits additive request evidence in `events.jsonl` without leaking metadata headers or sensitive values.
- `yanote-js/src/model/httpEvent.ts` — Extended the Node HTTP event model with additive request-evidence fields.
- `yanote-js/src/events/readJsonl.ts` — Normalized request-evidence maps backward-compatibly and derived legacy query/header key arrays only from captured retained evidence.
- `yanote-js/src/events/readJsonl.requestEvidence.test.ts` — Pinned backward-compatible JSONL ingestion for legacy and additive request-evidence fixtures.
- `yanote-js/src/coverage/dimensions.ts` — Kept legacy coverage dimensions stable while request evidence was added additively.
- `yanote-js/src/spec/openapi.ts` — Added cookie-aware `requestParameters` extraction with first-scalar support metadata and style/explode defaults.
- `yanote-js/src/spec/openapi.test.ts` — Verified cookie/request-parameter extraction for the supported first-scalar subset.
- `yanote-js/src/coverage/httpRequestConformance.ts` — Implemented first-scalar request-conformance analysis across captured-valid, captured-invalid, redacted, omitted, and unsupported truth states.
- `yanote-js/src/coverage/httpRequestConformance.test.ts` — Pinned deterministic request-conformance truth classification on focused fixtures.
- `yanote-js/src/report/report.ts` — Published the additive top-level `httpRequestConformance` section in the JSON report.
- `yanote-js/src/report/schema.ts` — Extended the report schema to validate request-conformance output.
- `yanote-js/src/report/normalize.ts` — Added deterministic ordering/normalization for request-conformance summaries and diagnostics.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — Locked the request-evidence JSON report contract on a schema-valid focused fixture.
- `yanote-js/src/cli.ts` — Added `HTTP Request Conformance` stdout output and sanitized machine-summary tokens without leaking retained values.
- `yanote-js/src/cli.requestEvidence.test.ts` — Verified CLI request-conformance output and no-leak behavior.
- `yanote-js/src/cli.summary.contract.test.ts` — Pinned final summary ordering and additive request-conformance tokens.
- `yanote-js/src/report/report.contract.test.ts` — Updated broader report contract fixtures to stay valid with the additive request-conformance surface.
- `yanote-js/src/report/writeReport.determinism.test.ts` — Preserved deterministic report serialization after the new request-conformance section was added.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — Added the focused `/request-evidence/users/{userId}` proof route with safe response echoes for redacted and oversized inputs.
- `examples/openapi/request-evidence-openapi.yaml` — Declared the focused OpenAPI contract used to prove retained path/query/header/cookie semantics end to end.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java` — Drove the live focused route and asserted raw `events.jsonl` evidence directly.
- `scripts/ci/verify-m011-s01-request-evidence.sh` — Automated the focused end-to-end proof, artifact retention, and request/report assertions.
- `.gsd/KNOWLEDGE.md` — Recorded focused proof and Java test-filter lessons learned for future agents.
- `.gsd/REQUIREMENTS.md` — Updated R022 notes/validation to reflect the concrete S01 proof boundary.
- `.gsd/DECISIONS.md` — Recorded the focused live-proof readiness decision for future verification work.
- `.gsd/PROJECT.md` — Refreshed project state to note that M011 S01 request-evidence and first-scalar truth are now delivered.
