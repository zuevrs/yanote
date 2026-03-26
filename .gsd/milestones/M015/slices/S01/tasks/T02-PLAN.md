---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T02: Admit AMQP evidence in Node and JVM async JSONL contracts

Why: the analyzer cannot consume RabbitMQ evidence until both Node and core JVM event contracts accept one non-Kafka async subtype without breaking legacy Kafka files. Do: add an AMQP event contract that mirrors the current async JSONL metadata shape, teach readers to accept it, and preserve Kafka round-trip behavior. Done when: mixed HTTP/Kafka/AMQP JSONL files round-trip in `yanote-core` and Node reader tests still normalize legacy Kafka evidence unchanged.

## Inputs

- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`

## Expected Output

- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-core/src/test/java/dev/yanote/core/events/AmqpEventJsonlRoundTripTest.java`

## Verification

`npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts` and `./gradlew :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.AmqpEventJsonlRoundTripTest`

## Observability Impact

- Mixed-file round-trip tests expose whether JSON polymorphism, header normalization, or legacy Kafka compatibility drifted.
- Future agents inspect AMQP-vs-Kafka JSONL snapshots instead of inferring why non-Kafka evidence disappeared.
