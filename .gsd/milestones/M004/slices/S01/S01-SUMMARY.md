---
id: S01
parent: M004
milestone: M004
provides:
  - A truthful Spring Kafka recorder foundation: generalized JVM Kafka JSONL, dedicated producer/listener recorder auto-configuration, and a single-service real-broker analyzer proof that feeds `yanote async-report` unchanged.
requires: []
affects:
  - M004/S02
  - M004/S03
  - M005/S01
  - M005/S02
key_files:
  - yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
  - scripts/ci/verify-m004-s01-kafka-recorder.sh
key_decisions:
  - Serialize mixed HTTP/Kafka JSONL through the sealed `YanoteEvent` root, keep Kafka `message` explicit-only, and never infer message identity from payload structure.
  - Record producer truth on `ProducerListener` outcome callbacks and consumer truth on listener `success` / `failure` hooks instead of optimistic send-attempt or pre-listener delivery seams.
  - Reuse `examples/springmvc-service` as the single-service HTTP+Kafka proof surface and feed its mixed live JSONL directly into `yanote async-report` without translation.
patterns_established:
  - Land new runtime evidence kinds at the sealed event boundary first, then wire framework integrations against exact JSONL round-trip tests before trusting live-broker proofs.
  - Close recorder slices with one authoritative real-broker verifier that asserts raw mixed JSONL and analyzer handoff from the same example-service flow.
observability_surfaces:
  - ./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-kafka:test
  - ./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests '*Failure*'
  - ./gradlew --no-daemon :examples:springmvc-service:test
  - bash scripts/ci/verify-m004-s01-kafka-recorder.sh
  - live mixed `events.jsonl` plus generated `yanote-async-report.json` from the verifier temp directory
drill_down_paths:
  - .gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T03-SUMMARY.md
duration: 6h 25m
verification_result: passed
completed_at: 2026-03-13 22:59:37 +0300
---

# S01: Truthful Spring Kafka Recorder Path

**Delivered the first live Spring Kafka runtime path for Yanote: one shared JVM Kafka evidence contract, truthful producer/listener recording, and a single-service real-broker proof that reaches `yanote async-report` without hand-written translation.**

## What Happened

S01 closed the highest-risk runtime gap in M004 by working from the analyzer boundary inward.

T01 established the shared event contract. `yanote-core` gained a first-class `KafkaEvent` plus a sealed `YanoteEvent` root so HTTP and Kafka facts can coexist in one JSONL stream without special-case writers. That boundary pins canonical `send` / `receive` actions, rejects blank channels, omits null optional fields, and keeps `message` absent unless the application supplies an explicit Yanote hint.

T02 added the dedicated Spring Kafka recorder module and chose the truthful seams. Outbound records are enriched only with the narrow Yanote header surface, but producer evidence is written only from broker outcome callbacks in `YanoteKafkaProducerListener`. Consumer evidence is written only from listener `success` / `failure` hooks in `YanoteKafkaRecordInterceptor`, which keeps receive facts tied to listener handling rather than raw poll or container delivery. The module also proved fail-safe behavior: unwritable evidence paths log a warning and drop the event instead of throwing into application code.

T03 turned the recorder into a real end-to-end proof. `examples/springmvc-service` was extended into a mixed HTTP+Kafka example that uses the existing `POST /users` path to publish and consume on a real Testcontainers broker. The slice added a matching AsyncAPI fixture and a CI-style verifier that reruns the example proof, inspects the mixed live JSONL directly, and feeds that unchanged file into `yanote async-report`.

Two hidden runtime issues had to be retired before S01 could close truthfully. Spring Boot 3.2.2’s managed Testcontainers core was too old for Docker 29, so the Kafka proof modules now override `org.testcontainers:testcontainers` to `1.21.4`. The recorder-module integration proof also needed its listener probe rewired so the real-broker assertions could execute instead of failing before listener invocation.

## Verification

- `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-kafka:test` — passed.
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests '*Failure*'` — passed.
- `./gradlew --no-daemon :examples:springmvc-service:test` — passed.
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — passed.
- `git diff --check` — passed at slice close.

The passing proof stack verified:

- exact analyzer-facing Kafka JSONL round-trip behavior in `yanote-core`;
- separate producer `send` and consumer `receive` facts from the Spring Kafka recorder module;
- fail-safe recorder diagnostics on dropped writes;
- one application both publishing and consuming against a real broker;
- direct analyzer acceptance of the unchanged mixed HTTP+Kafka evidence file.

## Requirements Advanced

- R046 — Advanced the async quality bar by adding exact JVM contract tests, Spring Boot auto-config tests, failure-path diagnostics, a real-broker example proof, and a rerunnable analyzer handoff verifier.

## Requirements Validated

- R042 — Validated the producer-side Kafka evidence path by recording broker-acknowledged `kafka send` facts through `ProducerListener` callbacks and proving them against a real broker plus `yanote async-report`.
- R043 — Validated the consumer-side Kafka evidence path by recording listener-outcome `kafka receive` facts through record-interceptor success/failure hooks and proving them against a real broker.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- The local repo was missing `S01-SUMMARY.md` even though all task summaries and proof surfaces already existed. The slice is being closed from task evidence plus fresh milestone verification rather than from an assumed artifact trail.

## Known Limitations

- Suite/run metadata propagation across HTTP → Kafka and Kafka → Kafka republish flows is not fully closed until S02.
- The milestone still lacks the split producer-only → consumer-only proof and deterministic multi-service merge path that S03 adds.
- Payload validation against AsyncAPI message schemas remains deferred.

## Follow-ups

- Use the S01 recorder and mixed-file analyzer handoff as fixed inputs for S02 metadata propagation work; do not reopen the producer/consumer seam choice.
- Build the two-service proof in S03 on per-service JSONL files rather than trying to share one cross-process writer.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — added the analyzer-facing JVM Kafka evidence contract.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — generalized the sealed event hierarchy across HTTP and Kafka.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — switched JSONL writing to the shared sealed boundary.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java` — packaged the recorder as Spring Boot auto-configuration.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java` — recorded truthful producer outcome facts.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java` — recorded truthful consumer listener-outcome facts.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — pinned dropped-write warning behavior.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — proved the single-service real-broker path.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — added the end-to-end single-service verifier.

## Forward Intelligence

### What the next slice should know
- `YanoteKafkaProducerListener` and `YanoteKafkaRecordInterceptor` are the authoritative truth seams. S02 and S03 should extend metadata and proof depth around them rather than trying alternate Spring Kafka hooks.

### What's fragile
- Docker/Testcontainers compatibility for the real-broker proof depends on the explicit Testcontainers core override — removing it risks reviving pre-assertion environment failures on current Docker Desktop releases.

### Authoritative diagnostics
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — this is the quickest trustworthy signal because it regenerates live evidence, inspects the mixed JSONL file, and runs `yanote async-report` on that exact file.

### What assumptions changed
- “The recorder proof can stay module-local” — false; the slice only became trustworthy once the example-service flow and analyzer handoff were proven end to end.
- “The Spring Boot managed Testcontainers stack is current enough for the Kafka proof modules” — false; the core dependency needed an explicit override for Docker 29 compatibility.
