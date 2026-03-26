---
estimated_steps: 1
estimated_files: 6
skills_used: []
---

# T01: Generalize AsyncAPI normalization to protocol-aware async identities

Why: retire the parser’s Kafka-only rejection boundary and define deterministic protocol-scoped operation keys before wider analyzer work. Do: accept the chosen AMQP subset beside Kafka, capture protocol in normalized async identities and diagnostics, and keep unsupported or mixed protocols fail-closed. Done when: spec tests prove AMQP acceptance, unchanged Kafka keys, and preserved rejection outside the chosen subset.

## Inputs

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/test/fixtures/asyncapi/unsupported-rabbitmq.yaml`

## Expected Output

- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/spec/asyncapi.parity.test.ts`
- `yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml`
- `yanote-js/test/fixtures/asyncapi/unsupported-mqtt.yaml`

## Verification

`npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`

## Observability Impact

- AsyncAPI semantic diagnostics retain protocol attribution so AMQP acceptance or unsupported-protocol failures stay explicit in focused spec tests.
- Future agents inspect `src/spec/asyncapi*.test.ts` snapshots to see whether a drift came from protocol selection, key serialization, or fail-closed diagnostics.
