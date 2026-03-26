# S02: Live RabbitMQ recorder and proof path — UAT

**Milestone:** M015
**Written:** 2026-03-26T18:43:18.380Z

# S02 UAT — Live RabbitMQ recorder and proof path

## Preconditions
- Docker/Testcontainers can start RabbitMQ locally.
- `npm -C yanote-js run build` succeeds.
- The worktree contains `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` and `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`.

## Test Case 1 — AMQP recorder module stays opt-in and supports failure-path capture
1. Run:
   ```bash
   ./gradlew :yanote-recorder-spring-amqp:test \
     --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest \
     --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest \
     --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest
   ```
2. Expected outcome:
   - The command exits `0`.
   - Auto-configuration tests prove the recorder is disabled by default and only attaches hooks when enabled.
   - Metadata propagation tests prove explicit outbound metadata wins over ambient context and does not bleed across deliveries.
   - Failure-path tests prove broker-down send capture, listener-error handling, and safe omission/redaction behavior for unsupported or sensitive AMQP evidence.

## Test Case 2 — Live two-service Spring proof emits separate producer and consumer truth
1. Run:
   ```bash
   ./gradlew :examples:springmvc-service:test \
     --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest
   ```
2. Expected outcome:
   - The command exits `0`.
   - The producer service handles `POST /users`, publishes one AMQP send event, and records the triggering HTTP event.
   - The consumer service records one AMQP receive event and does **not** emit an HTTP event.
   - The retained producer evidence includes service `rabbitmq-proof-producer-service`, `action: "send"`, `channel: "users.created"`, and captured `correlation_id` / `reply_to` headers.
   - The retained consumer evidence includes service `rabbitmq-proof-consumer-service`, `action: "receive"`, `channel: "users.created"`, and the same suite/run metadata.

## Test Case 3 — One command reruns the live RabbitMQ proof and exports AMQP report artifacts
1. Run:
   ```bash
   npm -C yanote-js run build && bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.yanote-ci/live-rabbitmq-proof/` is created or refreshed.
   - `async-report.stdout` shows `status: ok`, `protocols: amqp`, `channels: 1/1`, `operations: 2/2`, and `messages: 2/2`.
   - `yanote-async-report.json` and `yanote-async-report.html` both exist.
   - `yanote-async-report.json` contains:
     - `protocols: ["amqp"]`
     - `coverage.operations.items[*].operationKey` values `amqp send users.created` and `amqp receive users.created`
     - `declaredSemantics.summary.operationsWithCorrelationId = 2`
     - `declaredSemantics.summary.operationsWithReply = 2`
     - `bindingSupport.summary.totalBindings = 0`
     - `runtimeSemantics.summary.totalOperations = 0`

## Test Case 4 — The exported AMQP bundle makes Kafka-only companions explicitly absent
1. Inspect:
   ```bash
   .yanote-ci/live-rabbitmq-proof/artifact-manifest.txt
   .yanote-ci/live-rabbitmq-proof/artifact-source-paths.txt
   ```
2. Expected outcome:
   - Both files exist.
   - `report_status=ok`, `report_channels=1/1`, `report_operations=2/2`, and `report_messages=2/2` are present.
   - Kafka-only companions such as `single-service-proof.log`, `runtime-selected-yanote-async-report.json`, and `schema-failure-yanote-async-report.json` are recorded as `none` rather than omitted or fabricated.
   - The artifact list still includes the real AMQP proof files: `01-producer.events.jsonl`, `02-consumer.events.jsonl`, `merged-two-service.events.jsonl`, `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`, and `yanote-async-report.html`.

## Edge cases to confirm during sign-off
- AMQP support is truthful but intentionally narrower than Kafka depth: the live RabbitMQ bundle may be fully green while `runtimeSemantics` remains `0/0` and `Kafka Binding Support` stays explicit zero/none.
- Producer and consumer attribution must remain separate before merge; if consumer HTTP evidence appears, the proof has drifted.
- Missing HTML siblings on the happy path are a failure, not a warning; the exporter should fail closed rather than emitting an incomplete success bundle.
