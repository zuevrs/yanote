---
id: T01
parent: S01
milestone: M009
provides:
  - Shared additive HTTP/Kafka payload provenance contracts and backward-compatible JSONL reader normalization
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureState.java
  - yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureReason.java
  - yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java
  - yanote-js/src/model/payloadCapture.ts
  - yanote-js/src/events/readJsonl.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
key_decisions:
  - D015: use shared additive state/reason provenance fields across HTTP and Kafka and omit absent provenance fields instead of serializing JSON nulls
patterns_established:
  - Normalize new provenance enums in readers while leaving legacy JSONL files valid and unannotated
observability_surfaces:
  - EventJsonlRoundTripTest, KafkaEventJsonlRoundTripTest, readJsonl.test.ts, readAsyncEventsJsonl.test.ts, and retained events.jsonl proof artifacts
duration: 1h20m
verification_result: passed
completed_at: 2026-03-21
blocker_discovered: false
---

# T01: Widen HTTP/Kafka event models and Node readers for additive provenance

**Added shared HTTP/Kafka payload provenance fields and backward-compatible JSONL reader normalization.**

## What Happened

I introduced one shared provenance vocabulary for recorder payload evidence in both runtimes: Java now has `PayloadCaptureState` (`captured|omitted`) and `PayloadCaptureReason` (`malformed|oversized|unsupported|policy-filtered`), and Node now mirrors that contract in `yanote-js/src/model/payloadCapture.ts`.

I widened `HttpEvent` and `KafkaEvent` with additive optional provenance fields (`requestBodyState`, `requestBodyReason`, `responseBodyState`, `responseBodyReason`, `payloadState`, `payloadReason`) and kept them omission-friendly with `NON_NULL` serialization so absent provenance stays absent instead of becoming misleading JSON `null`.

I updated the JVM round-trip tests to pin both presence and absence behavior, including legacy JSONL compatibility and exact raw JSON assertions for the new fields. I also updated the Node readers and their Vitest suites so new provenance values normalize consistently while older event files still parse cleanly with undefined provenance.

As a local compatibility adaptation, I updated the current Spring MVC and Spring Kafka recorder constructor call sites to pass `null` for the new fields until T02 teaches the real emitters to populate them.

## Verification

Task-level verification passed after fixing one brittle raw JSON field-order expectation in `EventJsonlRoundTripTest` and installing `yanote-js` dependencies locally so Vitest could run in this worktree.

Slice-level verification was also run. The Gradle suites, focused round-trip tests, Node reader suite, and retained Spring MVC recorder proof passed. The retained Kafka proof script still fails, but its current failure is the pre-existing live-proof expectation drift where the example `POST /users` flow now emits HTTP `201` while the delegated verifier still expects `200`; the retained `events.jsonl` artifact confirms the script fails before any new provenance assertion becomes relevant.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew --no-daemon :yanote-core:test` | 0 | ✅ pass | 6.3s |
| 2 | `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readAsyncEventsJsonl.test.ts` | 0 | ✅ pass | 7.1s |
| 3 | `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test` | 0 | ✅ pass | 16.7s |
| 4 | `./gradlew --no-daemon :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.KafkaEventJsonlRoundTripTest` | 0 | ✅ pass | 6.0s |
| 5 | `npm -C yanote-js test -- src/events/readJsonl.test.ts src/events/readJsonl.parameters.test.ts src/events/readAsyncEventsJsonl.test.ts` | 0 | ✅ pass | 5.9s |
| 6 | `bash scripts/docs/verify-s01-recorder-path.sh` | 0 | ✅ pass | 328.5s |
| 7 | `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` | 1 | ❌ fail | 38.9s |

## Diagnostics

Inspect the shared provenance contract in `yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureState.java`, `yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureReason.java`, and `yanote-js/src/model/payloadCapture.ts`.

For serialization truth, use `EventJsonlRoundTripTest` and `KafkaEventJsonlRoundTripTest`; they now prove raw JSON presence/absence and legacy-file compatibility. For Node-side normalization, use `yanote-js/src/events/readJsonl.test.ts` and `yanote-js/src/events/readAsyncEventsJsonl.test.ts`.

Live recorder artifacts remain inspectable through `bash scripts/docs/verify-s01-recorder-path.sh` and `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`; the latest failing Kafka proof retained an `events.jsonl` artifact showing the live HTTP status was `201` when the script still expected `200`.

## Deviations

I added three small shared-contract files (`PayloadCaptureState.java`, `PayloadCaptureReason.java`, and `yanote-js/src/model/payloadCapture.ts`) even though the task output list only named existing files, because the slice needed one reusable vocabulary rather than transport-specific ad hoc strings.

I also updated the current recorder constructor call sites in `yanote-recorder-spring-mvc` and `yanote-recorder-spring-kafka` for arity compatibility so the wider repository still builds cleanly before T02 fills in real provenance emission.

## Known Issues

- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` currently fails on retained proof drift: the delegated verifier still expects the example `POST /users` flow to return HTTP `200`, but the live `events.jsonl` shows the real status is `201`.
- T02 still needs to populate the new provenance fields from the real Spring MVC and Spring Kafka payload capture helpers; T01 only widened the contracts/readers and proved backward-compatible round-trip behavior.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureState.java` — added the shared captured/omitted provenance enum for JSONL events.
- `yanote-core/src/main/java/dev/yanote/core/events/PayloadCaptureReason.java` — added the shared malformed/oversized/unsupported/policy-filtered provenance enum.
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` — widened the HTTP event contract with omission-friendly request/response provenance fields.
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — widened the Kafka event contract with omission-friendly payload provenance fields.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — pinned HTTP raw JSON ordering/presence semantics and legacy compatibility.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — pinned Kafka provenance serialization, omission behavior, and legacy compatibility.
- `yanote-js/src/model/payloadCapture.ts` — added shared Node provenance types and normalizers.
- `yanote-js/src/model/httpEvent.ts` — widened the HTTP reader model type with additive provenance fields.
- `yanote-js/src/model/asyncEvent.ts` — widened the Kafka reader model type with additive provenance fields.
- `yanote-js/src/events/readJsonl.ts` — normalized HTTP provenance fields from new and legacy JSONL.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — normalized Kafka provenance fields from new and legacy JSONL.
- `yanote-js/src/events/readJsonl.test.ts` — added HTTP reader coverage for new provenance fields and older files without them.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — added Kafka reader coverage for new provenance fields and older files without them.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — adapted constructor call sites to the widened HTTP event contract.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — adapted constructor call sites to the widened Kafka event contract.
- `.gsd/KNOWLEDGE.md` — recorded the retained Kafka verifier’s current `200` vs `201` proof drift.
