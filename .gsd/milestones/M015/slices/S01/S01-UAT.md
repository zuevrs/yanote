# S01: Protocol-aware async analyzer contract with first RabbitMQ path — UAT

**Milestone:** M015
**Written:** 2026-03-26T16:34:06.159Z

# S01 UAT — Protocol-aware async analyzer contract with first RabbitMQ path

## Preconditions
- `npm -C yanote-js run build` has completed successfully.
- The fixture spec `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml` exists.
- The fixture events file `yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl` exists.
- The unsupported-protocol fixture `yanote-js/test/fixtures/asyncapi/unsupported-mqtt.yaml` exists.

## Test Case 1 — Happy-path AMQP async report from the shipped dist CLI
1. Run:
   ```bash
   rm -rf .tmp/uat-s01-amqp && mkdir -p .tmp/uat-s01-amqp
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml \
     --events yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl \
     --out .tmp/uat-s01-amqp \
     --profile local
   ```
2. Expected outcome:
   - Process exits `0`.
   - Stdout `Summary` shows `status: ok`, `protocols: amqp`, `channels: 1/1`, `operations: 1/1`, and `messages: 1/1`.
   - The last machine line starts with `YANOTE_ASYNC_SUMMARY` and contains `protocols=amqp`, `covered_operations=1/1`, `binding_total=0`, and `report=.tmp/uat-s01-amqp/yanote-async-report.json`.
3. Inspect `.tmp/uat-s01-amqp/yanote-async-report.json`.
4. Expected outcome:
   - File exists.
   - Top-level `protocols` equals `["amqp"]`.
   - `coverage.operations.items[0].operationKey` equals `amqp send users.signedup`.
   - `bindingSupport.summary.totalBindings` equals `0`.
   - `declaredSemantics.summary.totalOperations` and `runtimeSemantics.summary.totalOperations` both equal `0` for this basic AMQP fixture.
5. Inspect `.tmp/uat-s01-amqp/yanote-async-report.html`.
6. Expected outcome:
   - File exists.
   - Overview shows protocol attribution for `amqp`.
   - The `Kafka Binding Support` section renders and shows no bindings/details rather than implying RabbitMQ parity.

## Test Case 2 — Unsupported protocol fails closed on the dist CLI
1. Run:
   ```bash
   rm -rf .tmp/uat-s01-unsupported && mkdir -p .tmp/uat-s01-unsupported
   node yanote-js/dist/yanote.cjs async-report \
     --spec yanote-js/test/fixtures/asyncapi/unsupported-mqtt.yaml \
     --events yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl \
     --out .tmp/uat-s01-unsupported \
     --profile local
   ```
2. Expected outcome:
   - Process exits `5`.
   - Stdout shows `status: invalid`.
   - Stderr includes `YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID`.
   - The reason text names the unsupported protocol and the supported set (`amqp, kafka`).
   - Neither `.tmp/uat-s01-unsupported/yanote-async-report.json` nor `.html` exists.

## Test Case 3 — Regression guard for cross-runtime AMQP event compatibility
1. Run:
   ```bash
   npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts
   ./gradlew :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.AmqpEventJsonlRoundTripTest
   ```
2. Expected outcome:
   - Both commands pass.
   - Node-side reader accepts `kind: "amqp"` evidence.
   - JVM round-trip keeps the new `AmqpEvent` subtype readable without breaking legacy async event handling.

## Test Case 4 — Regression guard for preserved Kafka identities and widened protocol-aware analyzer seams
1. Run:
   ```bash
   npm -C yanote-js test -- \
     src/spec/asyncapi.test.ts \
     src/spec/asyncapi.parity.test.ts \
     src/coverage/asyncSchemaConformance.test.ts \
     src/coverage/asyncCoverage.test.ts \
     src/report/asyncReport.contract.test.ts \
     src/cli.async-report.contract.test.ts
   ```
2. Expected outcome:
   - The suite passes.
   - Kafka fixtures still normalize to `kafka <action> <channel>` keys.
   - AMQP fixtures normalize to `amqp <action> <channel>` keys.
   - Protocol-aware coverage/report/CLI contracts stay deterministic.

## Edge cases to check during sign-off
- AMQP support remains intentionally narrow: only exact `protocol: amqp` single-protocol specs are supported.
- Kafka-only additive sections may be empty on AMQP runs, but they must still be explicit human/machine surfaces.
- Unsupported protocols must fail closed without emitting a misleading partial report artifact.
