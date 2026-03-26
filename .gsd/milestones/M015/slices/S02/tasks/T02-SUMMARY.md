---
id: T02
parent: S02
milestone: M015
provides: []
requires: []
affects: []
key_files: ["yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java", "yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java", "yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Seed the AMQP send context from explicit RabbitTemplate Message arguments before invocation so broker-down send(Message) failures still emit truthful error=true send evidence even when before-publish processors never run.", "Use one RabbitMQContainer-backed Spring Boot test to prove AMQP send, receive, listener failure, and metadata no-bleed behavior through retained AmqpEvent JSONL facts."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task verifier `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest` and confirmed the live RabbitMQContainer proof plus failure-path tests passed. Then reran the earlier slice verifier `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest` to confirm the send-capture hardening did not regress the existing AMQP auto-configuration and metadata-propagation contracts."
completed_at: 2026-03-26T17:40:46.728Z
blocker_discovered: false
---

# T02: Added live RabbitMQ AMQP proof tests and hardened broker-down send capture for the Spring AMQP recorder.

> Added live RabbitMQ AMQP proof tests and hardened broker-down send capture for the Spring AMQP recorder.

## What Happened
---
id: T02
parent: S02
milestone: M015
key_files:
  - yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java
  - yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java
  - yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Seed the AMQP send context from explicit RabbitTemplate Message arguments before invocation so broker-down send(Message) failures still emit truthful error=true send evidence even when before-publish processors never run.
  - Use one RabbitMQContainer-backed Spring Boot test to prove AMQP send, receive, listener failure, and metadata no-bleed behavior through retained AmqpEvent JSONL facts.
duration: ""
verification_result: passed
completed_at: 2026-03-26T17:40:46.731Z
blocker_discovered: false
---

# T02: Added live RabbitMQ AMQP proof tests and hardened broker-down send capture for the Spring AMQP recorder.

**Added live RabbitMQ AMQP proof tests and hardened broker-down send capture for the Spring AMQP recorder.**

## What Happened

Replaced the placeholder T02 AMQP tests with real failure-path and live RabbitMQ coverage. The new failure-path test class now proves recorder write failures fail closed without throwing, sensitive and oversized headers are redacted or omitted safely, unsupported payload bytes become explicit omission markers, and oversized payloads emit warning-backed omission states. The live single-service integration test now boots a Spring Boot app against RabbitMQContainer, sends success, listener-failure, metadata-free, and broker-down messages through RabbitTemplate, and asserts retained AmqpEvent JSONL truth for send/receive rows, message hints, metadata propagation, error=true receive/send rows, and no metadata bleed across deliveries. While running the live proof I found that broker-down RabbitTemplate.send(Message) calls could fail before Spring AMQP before-publish processors captured the message, so no failing send event was written. I fixed that minimally by seeding the send context from explicit Message arguments before invocation and recorded the seam in .gsd/KNOWLEDGE.md for future agents.

## Verification

Ran the task verifier `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest` and confirmed the live RabbitMQContainer proof plus failure-path tests passed. Then reran the earlier slice verifier `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest` to confirm the send-capture hardening did not regress the existing AMQP auto-configuration and metadata-propagation contracts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest` | 0 | ✅ pass | 1530ms |
| 2 | `./gradlew ':yanote-recorder-spring-amqp:test' --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest` | 0 | ✅ pass | 6452ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java`
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java`
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java`
- `.gsd/KNOWLEDGE.md`


## Deviations
None.

## Known Issues
None.
