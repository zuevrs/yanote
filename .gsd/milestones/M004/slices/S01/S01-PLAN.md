# S01: Truthful Spring Kafka Recorder Path

**Goal:** Extend Yanote’s Java runtime with a truthful Spring Kafka recorder path so one Spring Boot service can emit normalized `kafka send` and `kafka receive` evidence that the existing async analyzer accepts without translation.
**Demo:** Running the slice verifier stack proves that a Spring Boot service publishes and consumes on a real Kafka broker, writes separate producer and consumer JSONL facts with truthful success/failure state, and feeds the resulting file directly into `yanote async-report`.

## Decomposition Rationale

- Start with the shared JVM event contract because the recorder and the analyzer handoff are only trustworthy if both sides agree on one serialized `kind:"kafka"` shape before Spring wiring begins.
- Put the core recorder work in its own module next, because the highest-risk mistake in this slice is choosing the wrong Spring Kafka seam and accidentally recording send attempts or poll delivery instead of broker/listener outcomes.
- Finish on the existing example service plus one executable verifier so the slice closes on a repeatable real-broker proof, not on unit tests that still leave the analyzer handoff implied.

## Must-Haves

- The JVM event model and JSONL writer support normalized `kind:"kafka"` evidence for both `send` and `receive` actions without regressing the existing HTTP event path.
- A dedicated Spring Kafka recorder module captures broker-acknowledged producer outcomes and listener success/failure outcomes as separate facts, with `message` remaining optional unless an explicit Yanote hint is supplied.
- One single-service real-broker proof shows the same application publishing and consuming while producing JSONL that `yanote async-report` accepts unchanged.

## Proof Level

- This slice proves: operational
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew :yanote-core:test :yanote-recorder-spring-kafka:test` proves `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` and `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/*` stay green alongside the existing HTTP event tests.
- `./gradlew :yanote-recorder-spring-kafka:test --tests '*Failure*'` proves recorder failure-path diagnostics stay inspectable instead of collapsing into silent drops or missing evidence.
- `./gradlew :examples:springmvc-service:test` proves `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` against a real Kafka broker via Testcontainers.
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` runs the single-service proof end to end and asserts that the produced JSONL feeds `yanote async-report` without translation.
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: per-service JSONL lines with `kind`, `action`, `channel`, optional `message`, `service`, `instance`, `error`, and `test.*` metadata plus recorder warning logs when evidence cannot be written.
- Inspection surfaces: `yanote-core` round-trip tests, `yanote-recorder-spring-kafka` integration tests, the example service’s generated events file, and `yanote async-report` stdout / `yanote-async-report.json` from the verifier script.
- Failure visibility: producer callback vs listener-handling failures stay distinguishable through separate `send` / `receive` facts and `error` state instead of collapsing into missing coverage.
- Redaction constraints: keep the Kafka evidence metadata-only; do not dump payload bodies, arbitrary Kafka headers, broker credentials, or inferred message names.

## Integration Closure

- Upstream surfaces consumed: `yanote-core` event JSONL boundary, the M003 async analyzer contract in `yanote-js`, and the existing `examples/springmvc-service` Spring Boot app used for live proof.
- New wiring introduced in this slice: `yanote-recorder-spring-kafka` auto-configuration, producer/listener recorder hooks, example-service Kafka publish/consume flow, and a CI-style verifier that invokes `yanote async-report` on live evidence.
- What remains before the milestone is truly usable end-to-end: S02 still needs suite/run metadata propagation across HTTP and Kafka, and S03 still needs the two-service proof plus deterministic merge/analyzer handoff.

## Tasks

- [x] **T01: Generalize the JVM event contract for normalized Kafka JSONL** `est:45m`
  - Why: The recorder module cannot be truthful until the shared Java event model can serialize and round-trip `kind:"kafka"` facts in the exact metadata-only shape the async analyzer already expects.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`, `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`, `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java`, `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`
  - Do: Add a first-class `KafkaEvent` record aligned with the M003 async evidence contract, generalize JSONL read/write to handle both HTTP and Kafka events without breaking the existing HTTP tests, and pin the boundary that `message` is optional unless an application provides an explicit Yanote hint.
  - Verify: `./gradlew :yanote-core:test`
  - Done when: Java can round-trip HTTP and Kafka JSONL deterministically, and the new Kafka event test proves the serialized shape matches the metadata-only analyzer contract.
- [x] **T02: Add truthful Spring Kafka recorder auto-configuration and failure-path tests** `est:1h15m`
  - Why: R042 and R043 are only met when the runtime records broker/listener outcomes from the correct Spring Kafka seams instead of emitting optimistic send-attempt or raw poll noise.
  - Files: `settings.gradle.kts`, `yanote-recorder-spring-kafka/build.gradle.kts`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/*`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java`
  - Do: Create the new Spring Kafka recorder module, wire producer header-enrichment plus outcome callbacks and listener success/failure hooks over the shared `KafkaEvent` writer, keep arbitrary headers out of evidence, and protect both success and failure paths with Spring Boot and Testcontainers tests.
  - Verify: `./gradlew :yanote-recorder-spring-kafka:test`
  - Done when: A Spring Kafka app can enable the recorder and emit separate `send` / `receive` facts with truthful `error` state, while tests prove the module does not record pre-ack producer attempts or pre-listener consumer delivery.
- [x] **T03: Prove the single-service Kafka analyzer path on the example service** `est:1h`
  - Why: The slice is only really closed when one application both publishes and consumes on a real broker and the produced JSONL reaches `yanote async-report` without any hand-written translation step.
  - Files: `examples/springmvc-service/build.gradle.kts`, `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`, `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml`, `scripts/ci/verify-m004-s01-kafka-recorder.sh`, `.gsd/STATE.md`
  - Do: Reuse `examples/springmvc-service` as the slice’s single-service HTTP+Kafka proof surface, add a Testcontainers-backed publish→consume test that asserts both event directions in one per-service JSONL file, and add a verifier script that runs the example proof then feeds the resulting evidence into `yanote async-report` against a matching AsyncAPI fixture.
  - Verify: `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`
  - Done when: One repeatable command proves live broker send+receive capture plus async analyzer acceptance, and `STATE.md` points execution at the next slice step instead of an unplanned S01.

## Files Likely Touched

- `settings.gradle.kts`
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java`
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java`
- `yanote-recorder-spring-kafka/build.gradle.kts`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/*`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/*`
- `examples/springmvc-service/build.gradle.kts`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml`
- `scripts/ci/verify-m004-s01-kafka-recorder.sh`
- `.gsd/STATE.md`
