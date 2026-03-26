---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T04: Publish protocol-aware async report JSON and HTML without lying about Kafka-only extras

Why: widened async coverage must survive into retained report artifacts before the CLI can ship a believable RabbitMQ path. Do: carry protocol-aware keys and diagnostics through the async report DTO, schema, normalization, and HTML rendering while keeping Kafka Binding Support explicit and non-fabricated on AMQP inputs. Done when: AMQP report artifacts validate, render truthful coverage, and Kafka-specific additive sections stay empty or absent instead of implying RabbitMQ parity.

## Inputs

- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml`
- `yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl`

## Expected Output

- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts`

## Verification

`npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`

## Observability Impact

- `yanote-async-report.json` and `.html` become protocol-attributed inspection surfaces for AMQP coverage and fail-closed diagnostics.
- Report contract tests reveal whether a regression came from DTO shape, schema validation, deterministic ordering, or misleading Kafka-only sections.
