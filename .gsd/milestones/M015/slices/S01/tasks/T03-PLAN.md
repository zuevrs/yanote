---
estimated_steps: 1
estimated_files: 8
skills_used: []
---

# T03: Make async coverage and conformance protocol-aware for AMQP fixtures

Why: accepted AMQP specs and events are only useful if routing, message, and payload truth can be computed without pretending RabbitMQ already supports every Kafka-only semantic. Do: generalize coverage matching and schema diagnostics to protocol-aware identities, keep Kafka-only additive semantics scoped to Kafka, and add positive plus fail-closed AMQP fixtures. Done when: AMQP fixtures produce truthful channel/operation/message/payload coverage, invalid AMQP evidence fails closed, and Kafka numerators stay unchanged.

## Inputs

- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSemanticConformance.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml`

## Expected Output

- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSemanticConformance.ts`
- `yanote-js/src/coverage/asyncCoverage.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncCoverage.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl`
- `yanote-js/test/fixtures/async-events/amqp-invalid-payload.fixture.jsonl`

## Verification

`npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncSemanticConformance.test.ts`

## Observability Impact

- Coverage diagnostics start naming protocol-aware operation keys so failures localize to AMQP vs Kafka inputs immediately.
- Focused coverage tests expose whether drift came from routing, schema validation, or mistakenly applied Kafka-only semantics.
