---
estimated_steps: 4
estimated_files: 9
skills_used:
  - debug-like-expert
  - spring-boot
---

# T01: Add the Spring AMQP recorder module and truthful instrumentation seams

**Slice:** S02 — Live RabbitMQ recorder and proof path
**Milestone:** M015

## Description

Build a new `yanote-recorder-spring-amqp` module on Spring AMQP abstractions so `RabbitTemplate` sends and listener receives can emit first-class `AmqpEvent` JSONL using the S01 contract instead of Kafka overloads.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Spring AMQP `RabbitTemplate` / listener container wiring | Keep the recorder opt-in and fail tests loudly if hooks are not attached; do not half-instrument production beans | Bean wiring is synchronous; contract tests must fail if hooks never execute inside the test lifecycle | Unsupported payload/header values must be recorded as omitted or redacted evidence instead of serializing raw broker objects |
| `EventJsonlWriter` file append | Log and drop only the failing AMQP event without breaking the caller path | N/A | N/A |

## Load Profile

- **Shared resources**: one append-only JSONL file per service plus `RabbitTemplate` and listener hook chains.
- **Per-operation cost**: one payload/header capture plus one JSONL append per send or receive.
- **10x breakpoint**: file append contention or oversized payload/header capture before broker throughput becomes the bottleneck.

## Negative Tests

- **Malformed inputs**: null or blank test metadata, unsupported payload objects, binary headers, and oversized headers.
- **Error paths**: disabled AMQP beans, recorder write failure, and listener context not cleared after exceptions.
- **Boundary conditions**: ambient context vs explicit headers, existing user hooks already present, and receive paths without message hints.

## Steps

1. Add `yanote-recorder-spring-amqp` to `settings.gradle.kts` and create its Gradle metadata with Spring Boot AMQP dependencies and auto-configuration registration.
2. Implement AMQP header/context helpers and an event recorder that writes `AmqpEvent` send/receive rows with safe payload/header capture and service/run/suite attribution.
3. Instrument `RabbitTemplate` and Rabbit listener container factories through Spring AMQP seams while preserving existing user customizers and interceptors.
4. Add auto-configuration and metadata-propagation contract tests that prove opt-in enablement, hook composition, and no cross-request metadata bleed.

## Must-Haves

- [ ] Real Spring AMQP sends and receives can emit `kind: "amqp"` JSONL without mutating the S01 analyzer contract.
- [ ] Recorder hooks remain opt-in and do not clobber existing application `RabbitTemplate` or listener customization.

## Verification

- `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest`
- Expect the new module to stay disabled by default, attach AMQP hooks when enabled, and preserve explicit outbound metadata over ambient context.

## Observability Impact

- Signals added/changed: new AMQP JSONL rows and warning logs for dropped payload or header capture.
- How a future agent inspects this: rerun the focused AMQP auto-config/metadata tests and inspect the retained JSONL expectations they pin.
- Failure state exposed: missing hook attachment, metadata bleed, or unsafe header capture fails on the exact AMQP seam under test.

## Inputs

- `settings.gradle.kts` — current module registry.
- `build.gradle.kts` — root publication and shared Gradle conventions.
- `yanote-recorder-spring-kafka/build.gradle.kts` — current async recorder module dependency pattern.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecorderAutoConfiguration.java` — existing recorder auto-configuration pattern.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaInstrumentationBeanPostProcessor.java` — current async hook-composition pattern.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — current metadata/redaction rules to mirror truthfully.
- `yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java` — protocol-scoped AMQP evidence contract from S01.

## Expected Output

- `settings.gradle.kts` — AMQP module included in the build.
- `build.gradle.kts` — root conventions updated for the new recorder module if needed.
- `yanote-recorder-spring-amqp/build.gradle.kts` — Spring AMQP recorder module build definition.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpRecorderAutoConfiguration.java` — opt-in recorder wiring.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpEventRecorder.java` — truthful AMQP event writer.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpHeaders.java` — metadata propagation and safe header retention.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java` — hook composition for templates and listeners.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderAutoConfigurationTest.java` — seam-attachment contract tests.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpMetadataPropagationContractTest.java` — metadata/context propagation contract tests.
