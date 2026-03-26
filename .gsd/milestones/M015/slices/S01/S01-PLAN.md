# S01: Protocol-aware async analyzer contract with first RabbitMQ path

**Goal:** Generalize the async parser/event/model/coverage/report seams from Kafka-only assumptions to protocol-aware async identities, then ship the first concrete non-Kafka analyzer path on RabbitMQ/AMQP without regressing existing Kafka artifacts.
**Demo:** After this: TBD

## Tasks
- [x] **T01: Accepted AMQP AsyncAPI specs with protocol-scoped operation keys while preserving Kafka identities and fail-closed protocol diagnostics.** — 
  - Files: yanote-js/src/model/operationKey.ts, yanote-js/src/spec/asyncapi.ts, yanote-js/src/spec/asyncapi.test.ts, yanote-js/src/spec/asyncapi.parity.test.ts, yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml, yanote-js/test/fixtures/asyncapi/unsupported-mqtt.yaml
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- [x] **T02: Added AMQP-aware async JSONL contracts in Node and yanote-core without breaking Kafka evidence round-trips.** — 
  - Files: yanote-js/src/model/asyncEvent.ts, yanote-js/src/events/readAsyncEventsJsonl.ts, yanote-js/src/events/readAsyncEventsJsonl.test.ts, yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java, yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java, yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java, yanote-core/src/test/java/dev/yanote/core/events/AmqpEventJsonlRoundTripTest.java
  - Verify: `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts` and `./gradlew :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.AmqpEventJsonlRoundTripTest`
- [x] **T03: Made async coverage and schema conformance protocol-aware for AMQP while keeping Kafka-only runtime semantics explicit.** — 
  - Files: yanote-js/src/coverage/asyncSchemaConformance.ts, yanote-js/src/coverage/asyncSemanticConformance.ts, yanote-js/src/coverage/asyncCoverage.ts, yanote-js/src/coverage/asyncSchemaConformance.test.ts, yanote-js/src/coverage/asyncCoverage.test.ts, yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts, yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl, yanote-js/test/fixtures/async-events/amqp-invalid-payload.fixture.jsonl
  - Verify: `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncSemanticConformance.test.ts`
- [x] **T04: Published protocol-attributed async report artifacts that render truthful AMQP coverage while keeping Kafka-only additive sections explicitly empty.** — 
  - Files: yanote-js/src/report/asyncReport.ts, yanote-js/src/report/asyncSchema.ts, yanote-js/src/report/asyncNormalize.ts, yanote-js/src/report/asyncReportHtml.ts, yanote-js/src/report/asyncReport.test.ts, yanote-js/src/report/asyncReport.contract.test.ts, yanote-js/src/report/writeAsyncReport.determinism.test.ts
  - Verify: `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- [x] **T05: Added protocol-aware async-report CLI summaries and RabbitMQ AMQP proof on the shipped dist entrypoint.** — 
  - Files: yanote-js/src/cli.ts, yanote-js/src/cli.async-report.contract.test.ts, yanote-js/src/cli.async-report.test.ts, yanote-js/src/cli.remote-spec.contract.test.ts, yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml, yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl
  - Verify: `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build`
