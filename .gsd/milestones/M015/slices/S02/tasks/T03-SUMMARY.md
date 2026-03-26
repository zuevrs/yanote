---
id: T03
parent: S02
milestone: M015
provides: []
requires: []
affects: []
key_files: ["examples/springmvc-service/build.gradle.kts", "examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java", "examples/springmvc-service/src/main/resources/application.properties", "examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java", "yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml"]
key_decisions: ["Keep RabbitMQ role flags additive beside the existing Kafka role namespace so the shared example service can publish over either transport without changing Kafka proof behavior.", "Use a shared Jackson2JsonMessageConverter plus explicit RabbitTemplate.send(Message) so CreateUserRequest payload conversion and AMQP recorder header capture stay aligned."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest` and confirmed the new RabbitMQ two-service proof passed while the existing Kafka two-service proof remained green. The live RabbitMQ test verified separate producer HTTP+AMQP send evidence vs consumer AMQP receive-only evidence, shared run/suite metadata, retained AMQP headers, and negative behavior for malformed JSON and disabled listener roles."
completed_at: 2026-03-26T17:53:47.132Z
blocker_discovered: false
---

# T03: Added RabbitMQ role wiring and a two-service Spring proof test with an aligned AMQP AsyncAPI fixture.

> Added RabbitMQ role wiring and a two-service Spring proof test with an aligned AMQP AsyncAPI fixture.

## What Happened
---
id: T03
parent: S02
milestone: M015
key_files:
  - examples/springmvc-service/build.gradle.kts
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/main/resources/application.properties
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java
  - yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml
key_decisions:
  - Keep RabbitMQ role flags additive beside the existing Kafka role namespace so the shared example service can publish over either transport without changing Kafka proof behavior.
  - Use a shared Jackson2JsonMessageConverter plus explicit RabbitTemplate.send(Message) so CreateUserRequest payload conversion and AMQP recorder header capture stay aligned.
duration: ""
verification_result: passed
completed_at: 2026-03-26T17:53:47.135Z
blocker_discovered: false
---

# T03: Added RabbitMQ role wiring and a two-service Spring proof test with an aligned AMQP AsyncAPI fixture.

**Added RabbitMQ role wiring and a two-service Spring proof test with an aligned AMQP AsyncAPI fixture.**

## What Happened

Extended the shared Spring example service with additive RabbitMQ support beside the existing Kafka path. Added Spring AMQP and the new recorder module to the example-service build, introduced `example.rabbitmq.*` role properties and deterministic queue wiring, and updated `ExampleServiceApplication` with a shared AMQP JSON converter, conditional RabbitMQ publisher/listener beans, and controller publishing that uses whichever transport roles are enabled. Added `RabbitMqRecorderTwoServiceIntegrationTest` to prove a live HTTP -> RabbitMQ producer -> consumer handoff against `RabbitMQContainer`, including malformed-input and listener-disabled negative coverage, and added `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml` with operation keys aligned to `amqp send users.created` and `amqp receive users.created`.

## Verification

Ran `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest` and confirmed the new RabbitMQ two-service proof passed while the existing Kafka two-service proof remained green. The live RabbitMQ test verified separate producer HTTP+AMQP send evidence vs consumer AMQP receive-only evidence, shared run/suite metadata, retained AMQP headers, and negative behavior for malformed JSON and disabled listener roles.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest` | 0 | ✅ pass | 30300ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `examples/springmvc-service/build.gradle.kts`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/springmvc-service/src/main/resources/application.properties`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java`
- `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`


## Deviations
None.

## Known Issues
None.
