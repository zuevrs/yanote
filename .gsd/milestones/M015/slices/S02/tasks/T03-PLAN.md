---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - spring-boot
  - testcontainers
---

# T03: Wire the RabbitMQ producer→consumer example service and AsyncAPI fixture

**Slice:** S02 — Live RabbitMQ recorder and proof path
**Milestone:** M015

## Description

Extend the shared Spring example service with RabbitMQ roles and a two-service integration test so the slice has a real HTTP→RabbitMQ producer→consumer proof path, not only module-local AMQP tests.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Shared example-service Spring contexts | Fail the test with retained producer/consumer event paths and role names; do not keep partially booted services running | Awaitility and HTTP timeouts fail the test explicitly after retaining file paths for inspection | Unexpected payload conversion must still yield deterministic recorder output or test failure, never silent coercion |
| `RabbitMQContainer` broker | Surface connection or declaration failures through the test instead of downgrading to fixture-only behavior | Queue-delivery waits fail with the exact missing producer/consumer event counts | Invalid headers or payloads must stay redaction-safe in retained JSONL |

## Load Profile

- **Shared resources**: two Spring application contexts, one RabbitMQ container, and separate producer/consumer JSONL files.
- **Per-operation cost**: one HTTP request, one AMQP publish, one AMQP consume, and recorder appends in both services.
- **10x breakpoint**: queue backlog and container startup/teardown dominate before the analyzer or fixture files do.

## Negative Tests

- **Malformed inputs**: invalid JSON request bodies or unexpected message conversion should fail the test instead of producing misleading AMQP evidence.
- **Error paths**: missing listener enablement, queue declaration drift, or recorder dependency miswiring.
- **Boundary conditions**: producer service must not emit consumer receive facts, consumer service must not emit HTTP facts, and Kafka role wiring must stay isolated.

## Steps

1. Add Spring AMQP and the new recorder module dependencies plus RabbitMQ role properties and deterministic queue names to the example service configuration.
2. Extend `ExampleServiceApplication` with role-scoped RabbitMQ publisher and listener wiring that mirrors the existing Kafka proof flow without breaking Kafka property namespaces.
3. Add `RabbitMqRecorderTwoServiceIntegrationTest` that starts producer and consumer contexts against `RabbitMQContainer`, calls `POST /users`, and asserts separate producer/consumer AMQP JSONL with shared run/suite metadata.
4. Add the AsyncAPI fixture the proof script will analyze, keeping operation keys aligned to `amqp send users.created` and `amqp receive users.created`.

## Must-Haves

- [ ] The HTTP-triggered RabbitMQ handoff produces separate producer and consumer evidence that the analyzer can merge deterministically.
- [ ] Existing Kafka example tests still pass after the shared example service gains AMQP wiring.

## Verification

- `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest`
- Expect the new RabbitMQ proof to go green while the reused Kafka two-service proof stays unchanged.

## Observability Impact

- Signals added/changed: separate producer and consumer AMQP JSONL files plus deterministic run/suite metadata for the shared example service.
- How a future agent inspects this: rerun the RabbitMQ and Kafka two-service example tests and inspect the event files they retain on failure.
- Failure state exposed: role miswiring, queue drift, or cross-service evidence leakage shows up as exact file-count and event-shape assertions.

## Inputs

- `examples/springmvc-service/build.gradle.kts` — current shared example-service dependency graph.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current HTTP and Kafka proof wiring.
- `examples/springmvc-service/src/main/resources/application.properties` — existing role-scoped example configuration.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — existing live two-service proof pattern to mirror.
- `yanote-recorder-spring-amqp/build.gradle.kts` — new recorder module from T01/T02 that the example service must consume.

## Expected Output

- `examples/springmvc-service/build.gradle.kts` — example service wired to Spring AMQP and the new recorder module.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — RabbitMQ producer/listener roles added beside Kafka roles.
- `examples/springmvc-service/src/main/resources/application.properties` — RabbitMQ role and queue properties added without breaking Kafka defaults.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java` — live RabbitMQ producer→consumer proof test.
- `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml` — analyzer fixture matching the live RabbitMQ proof path.
