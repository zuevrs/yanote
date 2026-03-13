---
estimated_steps: 4
estimated_files: 6
---

# T03: Prove the single-service Kafka analyzer path on the example service

**Slice:** S01 — Truthful Spring Kafka Recorder Path
**Milestone:** M004

## Description

Turn the existing example Spring Boot service into the slice’s single-service HTTP+Kafka proof surface and add one executable verifier that runs the real-broker path all the way through `yanote async-report`.

## Steps

1. Extend `examples/springmvc-service` with the minimal Spring Kafka publish/consume flow needed for one application to produce both `send` and `receive` evidence while still fitting the later S02 HTTP→Kafka metadata work.
2. Add a Testcontainers-backed integration test that drives the example service through one publish→consume cycle and asserts both directions in the service-local JSONL file.
3. Add a matching AsyncAPI fixture plus `scripts/ci/verify-m004-s01-kafka-recorder.sh` so the live example evidence is fed directly into `yanote async-report` and checked for truthful analyzer acceptance.
4. Refresh `.gsd/STATE.md` so the repo state points at execution of the planned S01 tasks rather than an unplanned slice.

## Must-Haves

- [ ] `examples/springmvc-service` becomes the single-service proof surface for one app that both publishes and consumes Kafka.
- [ ] The example proof asserts separate `send` and `receive` facts in one per-service JSONL file produced by a real Kafka broker.
- [ ] The verifier script proves that live example evidence reaches `yanote async-report` without translation or hand-edited fixtures.

## Verification

- `./gradlew :examples:springmvc-service:test`
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh`

## Observability Impact

- Signals added/changed: the example service now produces inspectable Kafka JSONL evidence and a deterministic async analyzer report from live output.
- How a future agent inspects this: run the example test or verifier script, then inspect the generated events file and `yanote-async-report.json` in the script’s output directory.
- Failure state exposed: missing send/receive facts, wrong channel/action normalization, or analyzer-rejected JSONL are all surfaced by one repeatable proof command.

## Inputs

- `.gsd/milestones/M004/slices/S01/tasks/T02-PLAN.md` — recorder module and real-broker module tests from the prior task.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current example app that already anchors the repo’s verified service-side proof path.
- `yanote-js/src/cli.ts` — existing async analyzer entrypoint that must accept the example’s live JSONL unchanged.

## Expected Output

- `examples/springmvc-service/build.gradle.kts` — example module wired for Spring Kafka and recorder usage.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — single-service publish/consume proof app.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — real-broker example proof.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service.yaml` — AsyncAPI fixture aligned to the example proof channel/actions.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — end-to-end verifier for live evidence → `async-report`.
- `.gsd/STATE.md` — updated active-state pointer after planning/execution handoff.
