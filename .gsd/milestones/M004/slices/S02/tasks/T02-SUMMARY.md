---
id: T02
parent: S02
milestone: M004
provides:
  - Example-service HTTP → Kafka → Kafka republish flow with framework-driven suite/run propagation and per-hop explicit message hints
  - Raw JSONL attribution assertions for the first publish/receive pair and the listener-triggered republish pair
  - A repeatable verifier that checks live evidence before feeding it into `yanote async-report`
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
  - scripts/ci/verify-m004-s02-metadata-propagation.sh
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
key_decisions:
  - Keep suite/run propagation fully automatic through the shared MVC/Kafka bridge while leaving `yanote.message` explicit on each outbound Kafka hop
  - Fail the proof at the raw JSONL boundary before analysis so lost attribution or stale message reuse cannot hide behind analyzer normalization
patterns_established:
  - Use explicit `yanote.message` headers per publish hop while relying on recorder instrumentation to auto-apply `yanote.test.run_id` and `yanote.test.suite`
  - Validate live republish flows twice: first against raw mixed HTTP/Kafka JSONL, then against `yanote async-report` with a matching AsyncAPI fixture
observability_surfaces:
  - ./gradlew :examples:springmvc-service:test
  - bash scripts/ci/verify-m004-s02-metadata-propagation.sh
  - YANOTE_EVENTS_PATH raw events.jsonl plus the verifier’s generated yanote-async-report.json artifact
duration: 1h12m
verification_result: passed
completed_at: 2026-03-14T10:47:30+03:00
blocker_discovered: false
---

# T02: Prove HTTP → Kafka → Kafka republish attribution on the example service

**Converted the example Spring Boot app into a real HTTP → Kafka → Kafka republish proof that preserves suite/run attribution automatically and proves the raw JSONL plus async analyzer contract end to end.**

## What Happened

I removed the example app’s manual `YanoteKafkaContextHolder` plumbing from the controller and publisher path, so `POST /users` now publishes to Kafka without controller/service code seeding suite/run metadata directly. The app now relies on the shared Spring MVC → Spring Kafka metadata bridge added in T01 for automatic `yanote.test.run_id` / `yanote.test.suite` propagation.

I extended `examples/springmvc-service` into a two-hop single-service flow: the first listener consumes `users.created` and republishes to `users.created.republished`, and a second listener consumes the republished topic so the recorder emits all four Kafka facts (`send`/`receive` for both hops). Each outbound hop sets only an explicit `yanote.message` hint (`UserCreated` on the first topic, `UserRepublished` on the second topic), which keeps message identity truthful while proving that stale inbound message hints do not leak across the republish boundary.

I rewrote the example integration test to assert the mixed evidence at the raw JSONL layer using `JsonNode` rather than the typed reader surface. The test now waits for exactly five lines (one HTTP + four Kafka), asserts raw `test.run_id` / `test.suite` values on the HTTP event and on both Kafka hop pairs, and verifies that the republished topic only carries `UserRepublished` rather than reusing the first hop’s message hint.

I added `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` to match the two-channel republish flow and created `scripts/ci/verify-m004-s02-metadata-propagation.sh` as the slice verifier. That script reruns the live Testcontainers proof, validates the raw JSONL contract with Python before analysis, builds `yanote-js`, runs `yanote async-report` against the live events file, and checks that the generated async report covers both channels, all four operations, and all four message-contract observations at 100% coverage.

Finally, I marked T02 complete in the slice plan, marked S02 complete in the milestone roadmap, recorded the republish-proof boundary in `.gsd/DECISIONS.md`, and refreshed `.gsd/STATE.md` so handoff points to S03.

## Verification

- Passed `./gradlew :examples:springmvc-service:test`.
- Passed `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`.
- Passed `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test :examples:springmvc-service:test` as the final slice-wide JVM verifier stack.
- Passed `git diff --check`.

## Diagnostics

- Run `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest` to inspect the raw five-event HTTP/Kafka republish proof directly.
- Run `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` to regenerate the live events file, raw-JSONL assertions, and async analyzer output in one command.
- On verifier failure, the script preserves its temp directory and prints the paths to the test log, raw `events.jsonl`, async stdout/stderr, and generated `yanote-async-report.json` artifacts.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — removed manual Kafka context seeding, added deterministic two-topic republish flow, and kept explicit message hints per hop.
- `examples/springmvc-service/src/main/resources/application.properties` — added deterministic republish topic properties and producer timeout settings for the live broker proof.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — switched the example proof to raw JSONL assertions across both Kafka hops.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — added the AsyncAPI contract for the republish flow.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — added the end-to-end verifier that checks raw evidence and async-report acceptance.
- `.gsd/DECISIONS.md` — recorded the raw-evidence-first republish proof boundary.
- `.gsd/milestones/M004/slices/S02/S02-PLAN.md` — marked T02 complete.
- `.gsd/milestones/M004/M004-ROADMAP.md` — marked S02 complete and left S03 as the next slice.
- `.gsd/STATE.md` — advanced the active-state handoff to S03.
