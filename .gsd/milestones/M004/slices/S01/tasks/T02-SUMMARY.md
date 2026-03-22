---
id: T02
parent: S01
milestone: M004
provides:
  - A dedicated `yanote-recorder-spring-kafka` module that auto-configures truthful Spring Kafka producer/listener recording, writes analyzer-facing `KafkaEvent` JSONL, and protects the new seams with auto-config plus failure-path tests.
key_files:
  - settings.gradle.kts
  - yanote-recorder-spring-kafka/build.gradle.kts
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaInstrumentationBeanPostProcessor.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java
  - .gsd/milestones/M004/slices/S01/S01-PLAN.md
  - .gsd/DECISIONS.md
  - .gsd/STATE.md
key_decisions:
  - Carry only `yanote.test.run_id`, `yanote.test.suite`, and `yanote.message` through Kafka headers/context, enrich outbound records through a `KafkaTemplate` producer interceptor, and record producer/consumer truth on `ProducerListener` and listener `RecordInterceptor` success/failure hooks.
patterns_established:
  - Use Spring Boot auto-configuration plus bean post-processing to attach truthful Kafka recorder hooks to existing `KafkaTemplate` and listener-container-factory beans without broad header mapping or payload-derived message inference.
observability_surfaces:
  - `./gradlew :yanote-recorder-spring-kafka:test --tests '*Failure*'`
  - `./gradlew :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaRecorderAutoConfigurationTest'`
  - `yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml`
  - warning log line `Failed to write yanote kafka event to ... (dropping event)` from `KafkaRecorderFailurePathTest`
  - `git diff --check`
duration: ~2h 15m
verification_result: partial
completed_at: 2026-03-13 22:14:49 +0300
blocker_discovered: false
---

# T02: Add truthful Spring Kafka recorder auto-configuration and failure-path tests

**Added the dedicated Spring Kafka recorder module, wired producer/listener truth at the correct Spring Kafka seams, and protected the new runtime path with auto-config plus failure-path tests while leaving a real-broker Testcontainers proof ready for T03.**

## What Happened

I started by creating the new `yanote-recorder-spring-kafka` module and registering it in `settings.gradle.kts`. The build uses the Spring Boot 3.2.2 BOM for Spring Kafka, Boot test, and Testcontainers dependencies so the module stays a plain library while still compiling against the same Boot line as the rest of the repo.

On the runtime side, I mirrored the Spring MVC starter posture: disabled by default, explicit `yanote.recorder.*` properties, and fail-safe evidence writing. `YanoteKafkaEventRecorder` now writes shared `KafkaEvent` facts through the generalized T01 JSONL boundary and logs a warning instead of breaking the application when the events file cannot be written.

The producer path is split the way the slice research required. `YanoteKafkaProducerInterceptor` only enriches outbound records with the narrow Yanote header surface from a shared thread-local context: `yanote.test.run_id`, `yanote.test.suite`, and the explicit message hint `yanote.message`. It does **not** record evidence. Producer truth is recorded in `YanoteKafkaProducerListener`, which writes a `send` fact only on broker success/failure callback paths.

The consumer path uses `YanoteKafkaRecordInterceptor`. It snapshots the narrow Yanote header surface into the thread-local context before listener execution so nested publishes can inherit the same attribution later, and it writes a distinct `receive` fact only from the listener `success` / `failure` hooks. That keeps receive evidence tied to listener handling instead of raw poll/container delivery. `message` remains absent unless `yanote.message` is explicitly present on the record headers.

To attach the hooks without asking applications to replace their existing Kafka beans, `YanoteKafkaInstrumentationBeanPostProcessor` post-processes existing `KafkaTemplate` and listener container factory beans. It wires the producer interceptor, chains producer listeners where present, and installs a composite record interceptor when a factory already had one. That keeps the instrumentation thin and auto-config driven.

On the test side, `KafkaRecorderAutoConfigurationTest` proves the module stays disabled by default and, when enabled, mutates the real `KafkaTemplate` / listener-factory beans while copying only the narrow Yanote metadata surface onto an outbound record. `KafkaRecorderFailurePathTest` proves producer and consumer recording seams remain fail-safe when the recorder is pointed at an unwritable path and that the warning log is emitted instead of throwing back into the app path.

I also added `KafkaRecorderSingleServiceIntegrationTest` as the live-broker proof surface required by the task plan. The test app is set up to prove the exact intended truth model: one successful send/receive pair, one send that later turns into a listener failure, and one producer send failure after the broker becomes unavailable. The assertions pin the separate `send` / `receive` event ordering, `error` state, service/channel fields, and the boundary that `message` is only present when an explicit Yanote hint was supplied.

## Verification

Task/module verification completed:

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaRecorderAutoConfigurationTest'` — **passed**.
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaRecorderFailurePathTest'` — **passed**.
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests '*Failure*'` — **passed**.

Slice-level verification sweep for this intermediate task:

- `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-kafka:test` — **partial**: `:yanote-core:test` passed, but `:yanote-recorder-spring-kafka:test` failed on the Testcontainers integration test during Docker environment discovery.
- `./gradlew --no-daemon :examples:springmvc-service:test` — **passed** (`NO-SOURCE`, as expected before T03 adds the example-service Kafka proof).
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — **failed as expected** because the verifier script does not exist until T03.
- `git diff --check` — **passed**.

Real-broker proof status in this clone:

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests 'dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest'` — **fails locally before test execution** with `IllegalStateException: Could not find a valid Docker environment` even after bringing Docker Desktop up. The recorded failure artifact is `yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml`, and the logged Testcontainers strategies show Docker discovery hitting a Docker 29 / Docker Desktop API mismatch (`BadRequestException` with an empty `/info` payload), not a recorder assertion failure.

Must-have readback confirmed from the passing test surfaces and code inspection:

- Producer evidence is recorded only in `ProducerListener` outcome callbacks, not in optimistic send-attempt code.
- Consumer evidence is recorded only from listener `success` / `failure` hooks, not from pre-listener container delivery.
- The recorder emits only metadata-safe Yanote fields and keeps `message` null unless `yanote.message` is explicitly provided.
- Recorder write failures log a warning and drop the event instead of throwing into producer/listener code paths.

## Diagnostics

Future-agent inspection path:

- inspect `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java` for the beans that enable the module
- inspect `YanoteKafkaInstrumentationBeanPostProcessor.java` for where `KafkaTemplate` and listener factories are mutated
- inspect `YanoteKafkaHeaders.java` and `YanoteKafkaContextHolder.java` for the exact narrow header/context contract
- run `./gradlew :yanote-recorder-spring-kafka:test --tests '*AutoConfiguration*' --tests '*Failure*'`
- inspect `yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml` when the live-broker proof fails before assertions

Failure visibility added by this task:

- recorder IO drops now emit a concrete warning log instead of silently disappearing
- producer callback and listener-handling failures map to distinct `error=true` `send` / `receive` facts in the integration test surface
- a future agent can distinguish environment-level Testcontainers/Docker discovery failures from recorder assertion failures by checking the integration test XML and the `DockerClientProviderStrategy` lines inside it

## Deviations

- Added `KafkaRecorderFailurePathTest.java` in addition to the two explicitly listed expected test files so the slice-level `--tests '*Failure*'` verifier has a dedicated, inspectable failure-path class.

## Known Issues

- The real-broker `KafkaRecorderSingleServiceIntegrationTest` is present and assertion-complete, but in this local clone it does not start because Testcontainers cannot validate the available Docker Desktop 29 environment; the failure is captured in `yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml`.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` is still missing by plan and remains T03 work.

## Files Created/Modified

- `settings.gradle.kts` — registered the new `yanote-recorder-spring-kafka` module in the workspace.
- `yanote-recorder-spring-kafka/build.gradle.kts` — added the Spring Kafka/Boot/Testcontainers build surface for the new recorder module.
- `yanote-recorder-spring-kafka/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — exposed the new Kafka recorder as a Boot auto-configuration module.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderProperties.java` — mirrored the explicit recorder property contract for the Kafka starter.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — defined the narrow Kafka header contract for Yanote metadata and message hints.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaContextHolder.java` — added the shared thread-local metadata context used for header enrichment and listener-scoped propagation.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — centralized metadata-only Kafka JSONL writing and fail-safe warning logs.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerInterceptor.java` — attached the producer-side header enrichment seam without recording optimistic send attempts.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java` — recorded truthful producer `send` success/failure facts from broker outcome callbacks.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java` — recorded truthful consumer `receive` success/failure facts from listener outcome hooks.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaInstrumentationBeanPostProcessor.java` — wired the new hooks onto existing `KafkaTemplate` and listener-factory beans.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java` — packaged the full Kafka recorder module as Boot auto-configuration.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — proved disabled-by-default behavior plus enabled bean wiring and narrow header enrichment.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` — proved producer/listener recording stays fail-safe and emits warning logs when event writing fails.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — added the real-broker single-service proof surface for separate send/receive truth, listener failure, and producer failure.
- `.gsd/DECISIONS.md` — recorded the exact Kafka header/context and seam-wiring contract for downstream slice work.
- `.gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md` — captured the implementation, verification outcomes, and local Docker/Testcontainers limitation for clean resumption.
- `.gsd/milestones/M004/slices/S01/S01-PLAN.md` — marks T02 complete.
- `.gsd/STATE.md` — advances the active next action to T03.
