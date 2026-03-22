---
estimated_steps: 4
estimated_files: 5
---

# T01: Extract the shared metadata carrier and pin Kafka propagation rules

**Slice:** S02 — Metadata Propagation And Republish Attribution
**Milestone:** M004

## Description

Create one shared JVM suite/run metadata carrier for the Spring MVC and Spring Kafka recorder paths, then protect its narrow Kafka propagation semantics with contract tests for precedence, cleanup, and fail-safe behavior.

## Steps

1. Introduce a tiny shared test-metadata carrier in `yanote-core` so both recorder modules can depend on the same suite/run context without creating a new module knot.
2. Update `HttpEventRecordingFilter` to seed and clear that context from the existing `X-Test-Run-Id` / `X-Test-Suite` request headers while preserving the current HTTP event recording behavior.
3. Update the Spring Kafka producer and listener hooks to read and write suite/run through the shared carrier, keep `YanoteKafkaHeaders` apply-if-absent precedence, and leave `yanote.message` explicit-only.
4. Add focused MVC and Kafka tests that pin request/listener cleanup, explicit outbound-header precedence, no metadata bleed between invocations, and fail-safe behavior when recorder writes fail.

## Must-Haves

- [ ] The shared carrier becomes the only automatic bridge for suite/run metadata between HTTP ingress and Kafka send/receive hooks.
- [ ] Kafka propagation remains narrow: explicit headers win, only suite/run auto-propagate, and `yanote.message` is never ambiently inherited.
- [ ] Success and failure paths both clear ambient metadata so later requests or listener invocations cannot inherit stale attribution.

## Verification

- `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` proves precedence and cleanup while the MVC test proves request-lifecycle bridging.

## Observability Impact

- Signals added/changed: request and listener lifecycles now expose suite/run propagation via raw Kafka evidence and keep recorder warning logs on dropped writes.
- How a future agent inspects this: run the MVC/Kafka test suites and inspect the dedicated bridge/contract assertions instead of inferring propagation from analyzer output.
- Failure state exposed: stale ThreadLocal bleed, lost suite/run headers, or accidental `yanote.message` inheritance becomes visible at the contract-test boundary.

## Inputs

- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaContextHolder.java` — current Kafka-only ThreadLocal seed for suite/run/message hints.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — existing HTTP header extraction point that must become the request-lifecycle bridge.
- `.gsd/milestones/M004/slices/S02/S02-RESEARCH.md` — slice constraint to keep propagation narrow and verify attribution at the raw-evidence boundary.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/testmetadata/*` — shared JVM carrier for suite/run attribution.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — HTTP ingress seeds and clears the shared context.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java` — request-lifecycle bridge proof.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/*` — producer/listener propagation wired through the shared carrier.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — precedence and cleanup proof for Kafka headers/context.
