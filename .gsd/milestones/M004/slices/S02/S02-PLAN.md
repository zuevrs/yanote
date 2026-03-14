# S02: Metadata Propagation And Republish Attribution

**Goal:** Make Yanote’s Spring MVC → Spring Kafka path carry suite/run attribution automatically through one shared runtime context and the explicit Yanote Kafka header contract so single-service republish flows land truthful `test.*` metadata in normalized Kafka evidence.
**Demo:** Running the slice verifier stack proves a real-broker single-service flow can start at an HTTP request, publish to Kafka, republish from a Kafka listener to a second topic, preserve suite/run attribution across both hops, and feed the resulting JSONL into `yanote async-report` without manual controller/service context plumbing.

## Decomposition Rationale

- S02 owns R044 and supports R042, R043, and R046, so the plan starts with the shared metadata contract plus cleanup/precedence tests; otherwise a live demo could still look healthy while async attribution silently degrades to `unknown`.
- Keep the real-broker republish proof second because S01 already proved truthful `send` / `receive` capture; the main remaining risk is stale context, manual HTTP bridging, or overly broad header propagation during HTTP → Kafka → Kafka handoff.

## Must-Haves

- A shared JVM test-metadata context bridges Spring MVC ingress and Spring Kafka listener scopes into outbound sends without requiring controller or service code to set Kafka context manually.
- Kafka auto-propagation stays narrow: only suite/run attribution flows automatically via explicit Yanote headers, explicit outbound headers keep precedence, and `yanote.message` remains explicit-only.
- A single-service real-broker republish flow proves raw JSONL `send` and `receive` facts retain the expected `test.run_id` and `test.suite` values after HTTP-triggered publish and listener-triggered republish.
- The slice adds evidence-level verifier surfaces, plus downstream `yanote async-report` acceptance, so metadata regressions cannot hide behind analyzer normalization to `unknown`.

## Proof Level

- This slice proves: operational
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test` proves `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`, and existing recorder failure-path tests stay green.
- `./gradlew :examples:springmvc-service:test` proves `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` covers HTTP → Kafka → Kafka republish attribution against Testcontainers Kafka.
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` runs the single-service republish proof end to end, asserts raw JSONL `test.*` attribution before analysis, and feeds the live evidence into `yanote async-report` against the matching AsyncAPI fixture.
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: JSONL `kafka send` / `kafka receive` lines with `test.run_id`, `test.suite`, optional explicit `message`, and warning logs when recorder writes are dropped.
- Inspection surfaces: new MVC/Kafka contract tests, example-service integration test output, the raw events JSONL collected by the verifier script, and `yanote async-report` stdout / report output.
- Failure visibility: context bleed, lost suite/run headers, explicit-header overwrite regressions, and stale `yanote.message` reuse stay visible as raw-evidence assertion failures instead of only later coverage drift.
- Redaction constraints: keep propagation and evidence limited to Yanote suite/run/message hints; do not expose arbitrary headers, payload bodies, or broker credentials.

## Integration Closure

- Upstream surfaces consumed: `yanote-recorder-spring-mvc` HTTP header extraction, `yanote-recorder-spring-kafka` header contract and producer/listener recorder seams, the `examples/springmvc-service` proof app, and the M003 async analyzer entrypoint.
- New wiring introduced in this slice: a shared JVM test-metadata carrier across MVC and Kafka, framework-driven republish attribution in the example service, and a CI-style verifier that checks raw evidence before calling `yanote async-report`.
- What remains before the milestone is truly usable end-to-end: S03 still needs the two-service proof, deterministic per-service merge, and the milestone-level live proof stack.

## Tasks

- [x] **T01: Extract the shared metadata carrier and pin Kafka propagation rules** `est:1h`
  - Why: R044 is only real if Spring MVC and Spring Kafka share one automatic suite/run bridge with strict precedence and cleanup semantics instead of controller-managed context or broad header copying.
  - Files: `yanote-core/src/main/java/dev/yanote/core/testmetadata/*`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`, `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/*`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
  - Do: Extract the current Kafka-only ThreadLocal into a tiny core-scoped suite/run carrier, seed and clear it in the HTTP filter and Kafka record-interceptor lifecycle, keep `YanoteKafkaHeaders` apply-if-absent behavior for suite/run only, and add focused tests for precedence, cleanup, and fail-safe no-bleed behavior without ambient `yanote.message` propagation.
  - Verify: `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
  - Done when: Spring MVC ingress and Kafka listener code both use the same context, explicit outbound headers still win, `yanote.message` only moves when set explicitly, and tests pin cleanup on both success and failure paths.
- [x] **T02: Prove HTTP → Kafka → Kafka republish attribution on the example service** `est:1h15m`
  - Why: The slice only closes when automatic propagation is visible in raw evidence from a real broker and the analyzer still accepts the resulting JSONL without any translation or hand-edited fixtures.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/springmvc-service/src/main/resources/application.properties`, `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`, `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `.gsd/STATE.md`
  - Do: Replace the example’s manual request-header → Kafka context plumbing with framework-driven propagation, add a listener-triggered republish to a second topic, extend the live integration test to assert raw JSONL `test.*` values on both hops and that stale `yanote.message` does not leak, add a verifier script that reruns the flow and then invokes `yanote async-report` on the resulting file, and refresh `STATE.md` once the proof is green.
  - Verify: `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
  - Done when: One repeatable command proves HTTP → Kafka → Kafka attribution in raw evidence and analyzer acceptance, the example no longer needs controller or service code to seed Yanote Kafka context manually, and `STATE.md` points at S03 as the next step.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/testmetadata/*`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaContextHolder.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerInterceptor.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/springmvc-service/src/main/resources/application.properties`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `.gsd/STATE.md`
