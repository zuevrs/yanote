---
id: T03
parent: S01
milestone: M004
provides:
  - `examples/springmvc-service` now acts as the single-service HTTP+Kafka proof surface, emits mixed live HTTP/Kafka JSONL against a real broker, and proves that the unchanged file feeds `yanote async-report` end to end.
key_files:
  - examples/springmvc-service/build.gradle.kts
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/main/resources/application.properties
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml
  - scripts/ci/verify-m004-s01-kafka-recorder.sh
  - yanote-recorder-spring-kafka/build.gradle.kts
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java
  - .gsd/milestones/M004/M004-ROADMAP.md
  - .gsd/DECISIONS.md
  - .gsd/STATE.md
key_decisions:
  - Use the existing `POST /users` example path to trigger Kafka publish and keep one mixed per-service JSONL file as the analyzer handoff surface instead of extracting Kafka-only evidence.
  - Override Spring Boot 3.2.2’s managed Testcontainers core to `1.21.4` in the Kafka proof modules so the real-broker verifier stays runnable on Docker 29.
patterns_established:
  - When the example service needs async proof without creating a parallel demo app, gate the Kafka flow behind an example-only property, drive it through the existing HTTP surface, and assert the mixed JSONL file directly.
  - For Spring Boot modules that depend on Testcontainers against current Docker Desktop, verify the resolved `org.testcontainers:testcontainers` core version explicitly instead of assuming the Boot BOM is new enough.
observability_surfaces:
  - ./gradlew :examples:springmvc-service:test
  - bash scripts/ci/verify-m004-s01-kafka-recorder.sh
  - examples/springmvc-service/build/test-results/test/TEST-dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest.xml
  - yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml
  - live mixed events file and generated `yanote-async-report.json` under the verifier script temp directory
duration: ~3h 35m
verification_result: passed
completed_at: 2026-03-13 22:59:37 +0300
blocker_discovered: false
---

# T03: Prove the single-service Kafka analyzer path on the example service

**Turned `examples/springmvc-service` into the slice’s single-service HTTP+Kafka proof, added a real-broker example test, and proved that the unchanged live JSONL file reaches `yanote async-report` through one CI-grade verifier.**

## What Happened

I extended `examples/springmvc-service` instead of creating a parallel demo app. The existing `POST /users` path now optionally publishes a Kafka `users.created` event when `example.kafka.enabled=true`, using `YanoteKafkaContextHolder` to carry the existing HTTP run/suite headers plus the explicit `UserCreated` message hint into the Kafka recorder path. The example keeps its normal HTTP-only behavior by default and only enables the Kafka flow in the proof configuration.

That change made the example service a true mixed-surface proof: one request now produces a service-local JSONL file containing the normal HTTP `POST /users` fact plus separate Kafka `send` and `receive` facts on the same service. The new `examples/springmvc-service` integration test drives that flow through `TestRestTemplate` against a real Kafka broker from Testcontainers, waits for the mixed file, and asserts the exact analyzer-facing truth surface: one HTTP fact, one Kafka `send`, one Kafka `receive`, shared run/suite attribution, explicit `message=UserCreated`, and `error=false` on the Kafka facts.

I added `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml` to match the example channel and message contract exactly, then wrote `scripts/ci/verify-m004-s01-kafka-recorder.sh`. The script regenerates live evidence via the example-service test, inspects the raw mixed JSONL file directly, builds `yanote-js`, and runs `node yanote-js/dist/yanote.cjs async-report --events <live mixed file>` without translation. It asserts the resulting `yanote-async-report.json` shows one covered channel, two covered operations, two covered message contracts, zero async diagnostics, and the expected suite attribution.

During slice-level verification, two pre-existing hidden issues surfaced and had to be closed so S01 could truthfully finish. First, Docker 29 rejected the Spring Boot 3.2.2 BOM’s Testcontainers core (`1.19.3`) before any real-broker assertions ran, even after newer module artifacts were requested. I fixed that by overriding `org.testcontainers:testcontainers` itself to `1.21.4` in both Kafka-proof modules, which pulls in the newer docker-java client and makes the live-broker tests runnable again. Second, the recorder-module integration proof in `yanote-recorder-spring-kafka` was relying on an unsupported `ListenerProbe` method parameter in its `@KafkaListener`; I rewired that probe through a dedicated listener bean with constructor injection so the existing T02 proof now executes cleanly under the real broker instead of failing before the intended assertions.

I finished by marking T03 complete in the slice plan, marking S01 complete in the milestone roadmap, appending the handoff and Testcontainers compatibility decisions, and advancing `.gsd/STATE.md` to S02 planning.

## Verification

Task-level verification completed:

- `./gradlew --no-daemon :examples:springmvc-service:test` — **passed**.
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — **passed**.

Required slice-level verification sweep for final S01 completion:

- `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-kafka:test` — **passed**.
- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test --tests '*Failure*'` — **passed**.
- `./gradlew --no-daemon :examples:springmvc-service:test` — **passed**.
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` — **passed**.
- `git diff --check` — **passed**.

Must-haves read back from the live verification:

- `examples/springmvc-service` is now the single-service proof surface for one app that both publishes and consumes Kafka.
- The example proof asserts distinct `send` and `receive` facts in one per-service mixed JSONL file produced by a real Kafka broker.
- The verifier script proves that the unchanged live example evidence reaches `yanote async-report` without translation or hand-edited event fixtures.

## Diagnostics

Future-agent inspection path:

- run `./gradlew :examples:springmvc-service:test`
- inspect `examples/springmvc-service/build/test-results/test/TEST-dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest.xml`
- run `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`
- inspect the verifier script temp directory paths printed on failure for the live `events.jsonl`, analyzer stdout/stderr, and generated `yanote-async-report.json`
- inspect `yanote-recorder-spring-kafka/build/test-results/test/TEST-dev.yanote.recorder.springkafka.KafkaRecorderSingleServiceIntegrationTest.xml` if the recorder-module real-broker proof regresses again

Signals now available after this task:

- a mixed per-service JSONL file containing HTTP plus Kafka facts from one real example-service request
- a deterministic single-service AsyncAPI fixture aligned to `users.created` / `UserCreated`
- one shell verifier that fails on missing send/receive facts, wrong channel/message normalization, or analyzer-rejected live evidence

## Deviations

- In addition to the task-plan surfaces, I updated `yanote-recorder-spring-kafka/build.gradle.kts` and its `KafkaRecorderSingleServiceIntegrationTest.java` so the final S01 slice verifier could run truthfully on current Docker Desktop and the pre-existing recorder-module integration test could execute its intended assertions.

## Known Issues

- none

## Files Created/Modified

- `examples/springmvc-service/build.gradle.kts` — added Spring Kafka, shared-event test access, and explicit Testcontainers dependencies for the example proof module.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — added the gated Kafka publish/consume example flow on top of the existing HTTP service surface.
- `examples/springmvc-service/src/main/resources/application.properties` — added the example Kafka defaults that keep the listener off by default but make the proof runnable when enabled.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — added the real-broker mixed HTTP+Kafka example proof.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml` — added the AsyncAPI contract aligned to the live example-service Kafka flow.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — added the end-to-end verifier from live example evidence to `yanote async-report`.
- `yanote-recorder-spring-kafka/build.gradle.kts` — overrode the Testcontainers core version so the recorder-module live-broker tests run on Docker 29.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — repaired the listener-probe injection so the recorder-module proof executes its intended send/receive assertions.
- `.gsd/DECISIONS.md` — recorded the mixed-file analyzer handoff and Testcontainers compatibility choices.
- `.gsd/milestones/M004/slices/S01/S01-PLAN.md` — marks T03 complete.
- `.gsd/milestones/M004/M004-ROADMAP.md` — marks S01 complete in the milestone roadmap.
- `.gsd/STATE.md` — advances the active state to S02 planning.
