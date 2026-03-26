---
estimated_steps: 4
estimated_files: 4
skills_used:
  - debug-like-expert
  - spring-boot
  - testcontainers
  - java-junit
---

# T02: Prove live AMQP send/receive and failure capture in the recorder module

**Slice:** S02 — Live RabbitMQ recorder and proof path
**Milestone:** M015

## Description

Add failure-path and live RabbitMQ module tests so AMQP send/receive/error truth is proven before the example-service proof script depends on it.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `RabbitMQContainer` | Fail the test with retained events-path context and broker endpoint details; no mocked fallback | Awaitility timeouts fail the test and keep events paths visible for inspection | Conversion or header decode drift must produce omitted or unsupported capture states instead of raw leaks |
| Spring AMQP listener acknowledgement and failure handling | Record `error=true` receives and clear context even when the listener throws | Wait only long enough to prove event-count transitions, then fail explicitly | Unsupported payloads still emit omission markers rather than corrupting JSONL |

## Load Profile

- **Shared resources**: one RabbitMQ test container, listener queues, and append-only JSONL output files.
- **Per-operation cost**: broker publish/consume plus one recorder append for each observed send or receive.
- **10x breakpoint**: container startup and queue backlog will break before the analyzer or JSONL serialization becomes expensive.

## Negative Tests

- **Malformed inputs**: unsupported payload objects, oversized payloads, and sensitive/binary headers.
- **Error paths**: broker-down sends, listener exceptions, and recorder write failures.
- **Boundary conditions**: send-only, receive-only, and repeated runs that would reveal context bleed between deliveries.

## Steps

1. Add failure-path tests for write failure, redaction and oversized-header handling, and unsupported payload omission on AMQP events.
2. Add a single-service `RabbitMQContainer` integration test that proves separate send, receive, and error facts round-trip as `AmqpEvent` JSONL.
3. Assert metadata propagation, message hints, and context cleanup across successful, failed, and broker-down paths.
4. Adjust recorder internals only as needed to keep the AMQP tests deterministic and redaction-safe.

## Must-Haves

- [ ] Live RabbitMQ send, receive, and error cases write truthful `AmqpEvent` rows with expected metadata and omission markers.
- [ ] Failure cases do not leak prior test metadata into later deliveries.

## Verification

- `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest`
- Expect retained AMQP events to show safe header handling, explicit omission states, and `error=true` when broker or listener paths fail.

## Observability Impact

- Signals added/changed: AMQP warning logs for dropped payload/header capture and retained `error=true` send/receive JSONL rows.
- How a future agent inspects this: rerun the AMQP failure/integration tests or open the temporary JSONL files asserted by those tests.
- Failure state exposed: broker-down sends, listener exceptions, and unsupported capture states become concrete AMQP evidence instead of silent drops.

## Inputs

- `yanote-recorder-spring-amqp/build.gradle.kts` — new AMQP recorder module definition from T01.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpRecorderAutoConfiguration.java` — recorder wiring produced in T01.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpEventRecorder.java` — base AMQP event writer from T01.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpHeaders.java` — AMQP metadata and redaction helpers from T01.
- `yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java` — canonical AMQP evidence model.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java` — reader used to assert written JSONL truth.

## Expected Output

- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpEventRecorder.java` — recorder internals hardened for failure-path truth.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpHeaders.java` — redaction and omission rules hardened under live tests.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java` — failure-path contract coverage.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java` — live RabbitMQ recorder integration proof.
