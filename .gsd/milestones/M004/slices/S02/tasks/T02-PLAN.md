---
estimated_steps: 4
estimated_files: 6
---

# T02: Prove HTTP → Kafka → Kafka republish attribution on the example service

**Slice:** S02 — Metadata Propagation And Republish Attribution
**Milestone:** M004

## Description

Turn the existing example Spring Boot app into the slice’s republish proof surface so one real-broker scenario shows framework-driven HTTP → Kafka propagation, listener-triggered Kafka → Kafka republish, raw evidence-level attribution checks, and downstream analyzer acceptance.

## Steps

1. Refactor `examples/springmvc-service` so the HTTP entrypoint publishes without manually seeding Kafka context and the Kafka listener republishes to a second topic using the shared runtime metadata bridge from T01.
2. Extend the example’s Testcontainers integration test to drive one HTTP request through HTTP → Kafka → Kafka and assert raw JSONL `test.run_id` / `test.suite` values on the first send/receive and the republished send/receive.
3. Add a matching AsyncAPI fixture plus `scripts/ci/verify-m004-s02-metadata-propagation.sh` so the live example evidence is checked at the JSONL boundary before being passed into `yanote async-report`.
4. Refresh `.gsd/STATE.md` once the slice proof is green so the active-state handoff points to S03 execution.

## Must-Haves

- [ ] The example service proves framework-driven HTTP → Kafka propagation without controller or service code calling Kafka context APIs directly.
- [ ] Raw JSONL assertions cover both the first publish/receive and the listener-triggered republish path with the expected suite/run attribution.
- [ ] One repeatable verifier command proves live republish attribution and analyzer acceptance against a real Kafka broker.

## Verification

- `./gradlew :examples:springmvc-service:test`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`

## Observability Impact

- Signals added/changed: the example service now emits two-hop Kafka evidence whose raw JSONL shows whether suite/run attribution survived the republish boundary.
- How a future agent inspects this: run the example integration test or verifier script, then inspect the produced events file and async report artifacts side by side.
- Failure state exposed: missing republish facts, wrong `test.*` attribution, or stale `yanote.message` leakage becomes visible before the analyzer can normalize or hide it.

## Inputs

- `.gsd/milestones/M004/slices/S02/tasks/T01-PLAN.md` — shared metadata carrier and propagation rules that the example service must exercise.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current single-service proof app that still contains manual HTTP → Kafka context plumbing.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — existing live-proof pattern to adapt for S02’s republish and evidence-level attribution checks.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — single-service HTTP → Kafka → Kafka republish proof app using framework-driven propagation.
- `examples/springmvc-service/src/main/resources/application.properties` — deterministic topic/config surface for the republish scenario.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — live republish attribution proof with raw JSONL assertions.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — AsyncAPI fixture aligned to the two-hop example flow.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — end-to-end verifier for raw evidence attribution plus `async-report` acceptance.
- `.gsd/STATE.md` — updated active-state handoff after the slice proof lands.
