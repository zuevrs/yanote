---
estimated_steps: 1
estimated_files: 6
skills_used: []
---

# T05: Ship the AMQP fixture path through async-report CLI and built dist output

Why: the slice closes only when the supported entrypoint can build and run against AMQP fixtures while Kafka CLI contracts remain stable. Do: update `async-report` wording, machine tokens, and contract tests for protocol-aware async evidence, then prove the built CLI writes both async report artifacts for the RabbitMQ fixture. Done when: CLI tests pass for Kafka and AMQP cases, and the built `yanote.cjs async-report` command succeeds on the AMQP fixture with retained JSON and HTML outputs.

## Inputs

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml`
- `yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl`

## Expected Output

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml`
- `yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl`

## Verification

`npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build`

## Observability Impact

- `YANOTE_ASYNC_SUMMARY` and typed stderr stay protocol-aware so future CI and combined-report work can attribute failures to AMQP vs Kafka without opening raw fixtures.
- The built-dist proof command makes output-path regressions or missing companion artifacts visible immediately.
