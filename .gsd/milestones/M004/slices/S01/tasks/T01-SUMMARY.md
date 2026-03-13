---
id: T01
parent: S01
milestone: M004
provides:
  - A generalized JVM JSONL event boundary that round-trips existing HTTP facts and new metadata-only Kafka `send` / `receive` evidence in the analyzer-facing `kind:"kafka"` shape.
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java
  - yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java
  - yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java
  - yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java
  - .gsd/milestones/M004/slices/S01/S01-PLAN.md
  - .gsd/DECISIONS.md
  - .gsd/STATE.md
key_decisions:
  - Serialize JSONL through the sealed `YanoteEvent` root, canonicalize Kafka direction with `KafkaEvent.Action`, and omit null Kafka optional fields instead of inferring or backfilling them.
patterns_established:
  - Add new runtime evidence kinds as sealed `YanoteEvent` subtypes and protect them with exact JSONL contract tests that pin the serialized line plus shared-reader round-trip behavior.
observability_surfaces:
  - `./gradlew :yanote-core:test`
  - `./gradlew :yanote-recorder-spring-mvc:test`
  - `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`
  - `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
duration: ~35m
verification_result: passed
completed_at: 2026-03-13 21:46:25 +0300
blocker_discovered: false
---

# T01: Generalize the JVM event contract for normalized Kafka JSONL

**Added a first-class JVM Kafka event contract and generalized JSONL read/write so HTTP and Kafka facts now share one sealed boundary without regressing the existing HTTP path.**

## What Happened

I started by auditing the current `yanote-core` event surface and the M003 async analyzer model. The minimal cross-runtime shape turned out to be a new `KafkaEvent` record with `kind:"kafka"`, canonical `send` / `receive` action values, required `channel`, optional `message`, optional `service` / `instance` / `error`, and `test.run_id` / `test.suite` attribution fields. To keep the future Spring Kafka recorder truthful, `message` is only whatever the application explicitly provides; the JVM contract does not infer it from payload class names or record structure.

`yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` is now a sealed shared boundary for both `HttpEvent` and `KafkaEvent`. `KafkaEvent` trims and validates the metadata-safe fields that actually matter for analyzer matching: blank `channel` is rejected, blank `message` collapses to absent, and action values normalize through the nested `Action` enum so the serialized JSON is always `send` or `receive`.

I then generalized the JSONL seam itself. `EventJsonlWriter` now serializes through `YanoteEvent` rather than a hard-coded `HttpEvent`, and `EventJsonlReader` now reads back `List<YanoteEvent>` using the same sealed polymorphic boundary. To make analyzer-facing Kafka lines cleaner and to keep optionality obvious in tests, `KafkaEvent` omits null optional fields from serialized JSON instead of writing `null` placeholders.

On the test side, `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` now pins the exact Kafka JSONL lines for both a populated `send` fact and a metadata-only `receive` fact with no `message`. `EventJsonlRoundTripTest` was updated to keep the existing HTTP round-trip proof green and adds a mixed HTTP+Kafka file assertion so the new shared boundary is exercised directly. Because the unit pre-flight flagged a missing slice-level diagnostic verifier, I also amended `S01-PLAN.md` to include an explicit failure-path verification step for the future Kafka recorder module.

## Verification

Task verifier and direct contract proof:

- `./gradlew :yanote-core:test --tests dev.yanote.core.events.KafkaEventJsonlRoundTripTest` — failed first as expected before implementation (`KafkaEvent` and generalized reader did not exist yet), then passed after the new boundary was added.
- `./gradlew :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.KafkaEventJsonlRoundTripTest` — passed, proving exact Kafka JSON serialization and mixed HTTP/Kafka round-trip behavior together.
- `./gradlew :yanote-core:test` — passed.

Additional HTTP non-regression verification:

- `./gradlew :yanote-recorder-spring-mvc:test` — passed, confirming the existing Spring MVC recorder still compiles and writes through the generalized JSONL seam.
- `./gradlew :examples:springmvc-service:test` — passed.
- `git diff --check` — passed.

Slice-level verification status at the end of T01:

- `./gradlew :yanote-core:test :yanote-recorder-spring-kafka:test` — fails as expected because `yanote-recorder-spring-kafka` is not created until T02.
- `./gradlew :yanote-recorder-spring-kafka:test --tests '*Failure*'` — fails as expected for the same reason.
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — fails as expected because the verifier script is planned for T03 and does not exist yet.

Must-have readback confirmed:

- `KafkaEvent` serializes as metadata-only `kind:"kafka"` evidence with canonical `send` / `receive` actions.
- `message` stays optional and the JVM boundary does not infer it.
- Existing HTTP round-trip behavior remains green after JSONL generalization.

## Diagnostics

Future-agent inspection path:

- run `./gradlew :yanote-core:test`
- inspect `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` for the exact pinned analyzer-facing Kafka JSONL lines
- inspect `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` for HTTP non-regression plus mixed-file proof
- inspect `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` when action normalization, optional-field omission, or message handling drift

Failure state exposed now:

- contract drift shows up as exact JSON mismatch in `KafkaEventJsonlRoundTripTest`
- generalized read/write regressions show up as mixed-file or HTTP round-trip failures in `EventJsonlRoundTripTest`
- invalid Kafka metadata such as blank `channel` or unsupported action values now fails fast at the JVM contract boundary instead of producing malformed evidence

## Deviations

None.

## Known Issues

- The slice-level Kafka recorder module and its failure-path verifier do not exist yet, so the `:yanote-recorder-spring-kafka:*` verification commands still fail until T02.
- The end-to-end verifier script `scripts/ci/verify-m004-s01-kafka-recorder.sh` is still planned work for T03.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — added the new metadata-only JVM Kafka evidence contract with canonical `send` / `receive` action normalization.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — generalized the sealed event hierarchy to cover both HTTP and Kafka facts.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — switched JSONL writing to the shared `YanoteEvent` boundary.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java` — switched JSONL reading to polymorphic `YanoteEvent` round-tripping.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — pinned the exact analyzer-facing Kafka JSONL contract and optional-message behavior.
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java` — preserved HTTP round-trip proof and added mixed HTTP+Kafka file coverage.
- `.gsd/milestones/M004/slices/S01/S01-PLAN.md` — added the missing slice-level failure-path verifier and marked T01 complete.
- `.gsd/DECISIONS.md` — recorded the generalized JVM event JSONL boundary decision for downstream Kafka recorder work.
- `.gsd/STATE.md` — advances the active next action to T02.
- `.gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md` — records the delivered contract, verifier outcomes, and remaining slice-level work.
