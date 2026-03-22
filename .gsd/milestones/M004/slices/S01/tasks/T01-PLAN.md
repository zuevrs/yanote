---
estimated_steps: 4
estimated_files: 5
---

# T01: Generalize the JVM event contract for normalized Kafka JSONL

**Slice:** S01 — Truthful Spring Kafka Recorder Path
**Milestone:** M004

## Description

Introduce a first-class JVM Kafka event contract and generalized JSONL boundary so the new Spring Kafka recorder can emit the exact metadata-only evidence shape that M003 already proved the async analyzer can consume.

## Steps

1. Audit the current `yanote-core` HTTP-only event model and identify the minimal generalized shape needed for `kind:"kafka"` send/receive evidence.
2. Add `KafkaEvent` plus any supporting enums/helpers so the JVM side can represent `action`, `channel`, optional `message`, `service`, `instance`, `error`, and `test.*` attribution without payload leakage.
3. Refactor the JSONL writer/reader to handle both HTTP and Kafka events while preserving existing HTTP round-trip behavior.
4. Add Java round-trip tests that pin the serialized Kafka JSONL shape and make analyzer-contract drift obvious before Spring Kafka wiring begins.

## Must-Haves

- [ ] `KafkaEvent` serializes as metadata-only `kind:"kafka"` evidence with canonical `send` / `receive` actions.
- [ ] `message` stays optional and is not inferred from payload classes or generic record structure.
- [ ] Existing HTTP event round-trip behavior stays green after the shared JSONL boundary is generalized.

## Verification

- `./gradlew :yanote-core:test`
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` proves the JVM output matches the analyzer-facing Kafka JSONL contract.

## Observability Impact

- Signals added/changed: JVM event files can now contain explicit Kafka `send` / `receive` facts alongside HTTP facts.
- How a future agent inspects this: run `:yanote-core:test` and inspect the round-trip assertions plus serialized JSONL lines in the new Kafka event test.
- Failure state exposed: contract drift becomes visible as round-trip mismatch, missing optional-field handling, or accidental HTTP regression.

## Inputs

- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — current HTTP-only sealed event boundary.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — current JSONL write seam that only accepts `HttpEvent`.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java` — current JSONL read seam that only parses `HttpEvent`.
- `yanote-js/src/model/asyncEvent.ts` — established M003 async evidence shape that the JVM output must stay compatible with.

## Expected Output

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — normalized JVM Kafka evidence contract.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — generalized sealed event hierarchy covering HTTP and Kafka.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — JSONL writer that accepts the generalized event boundary.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java` — reader that can round-trip both HTTP and Kafka lines.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` — contract proof for serialized Kafka evidence.
