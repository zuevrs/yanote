---
estimated_steps: 5
estimated_files: 7
---

# T02: Add truthful Spring Kafka recorder auto-configuration and failure-path tests

**Slice:** S01 — Truthful Spring Kafka Recorder Path
**Milestone:** M004

## Description

Create the dedicated Spring Kafka recorder module and wire it at the producer and listener seams that reflect real broker/listener outcomes, then prove those seams with Spring Boot and Testcontainers tests.

## Steps

1. Register a new `yanote-recorder-spring-kafka` module and add the Spring Kafka, Spring Boot, and Testcontainers dependencies needed for recorder wiring and live-broker tests.
2. Implement recorder properties, auto-configuration, and shared helpers that write `KafkaEvent` facts through the generalized JSONL boundary from T01.
3. Hook the producer path so outbound records receive only the narrow Yanote metadata/hint surfaces needed later, and record broker-acknowledged send success/failure via the producer outcome callback path.
4. Hook the consumer path so listener success/failure records a distinct `receive` fact tied to listener handling, not raw poll/container delivery.
5. Add auto-configuration and real-broker integration tests that prove separate `send` and `receive` facts, truthful `error` handling, and fail-safe recorder behavior when writing evidence fails.

## Must-Haves

- [ ] Producer evidence is recorded from broker outcome callbacks, not from optimistic send attempts.
- [ ] Consumer evidence is recorded from listener success/failure hooks, not from pre-listener container delivery.
- [ ] The module emits only metadata-safe Yanote fields and leaves message identity empty unless an explicit hint is present.

## Verification

- `./gradlew :yanote-recorder-spring-kafka:test`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` proves live send/receive capture against Testcontainers Kafka.

## Observability Impact

- Signals added/changed: Spring Kafka apps gain JSONL evidence for producer ack/failure and listener success/failure, plus warning logs when the recorder must drop an event.
- How a future agent inspects this: run `:yanote-recorder-spring-kafka:test` and inspect the generated events file plus the dedicated success/failure assertions in the module tests.
- Failure state exposed: wrong-seam capture, duplicate facts, dropped writes, or collapsed producer/consumer outcomes become visible in the module test surface.

## Inputs

- `.gsd/milestones/M004/slices/S01/tasks/T01-PLAN.md` — generalized Kafka event and JSONL contract the recorder must emit.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java` — existing Spring Boot recorder packaging pattern to mirror where it still fits.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderIoFailureDoesNotBreakRequestTest.java` — existing fail-safe recorder behavior to preserve for Kafka.

## Expected Output

- `settings.gradle.kts` — new recorder module registered in the workspace.
- `yanote-recorder-spring-kafka/build.gradle.kts` — Spring Kafka/Testcontainers module build surface.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/*` — auto-configuration, properties, and producer/listener recorder hooks.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — auto-config proof.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — real-broker truth proof for separate producer and consumer evidence.
