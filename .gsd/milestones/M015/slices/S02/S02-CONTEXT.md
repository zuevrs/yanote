# S02 planning wrap-up

Slice S02 is planned and ready for execution.

## What is done

- Persisted slice planning state with `gsd_plan_slice` for `M015/S02`.
- Normalized the rendered slice/task plan files on disk so executors have concrete steps, inputs, outputs, verification, and `skills_used` frontmatter.
- Recorded decision `D072` to keep the reusable Java integration named around Spring AMQP while keeping the end-to-end runtime proof explicitly RabbitMQ-scoped.

## Planned execution order

1. **T01** — add `yanote-recorder-spring-amqp` and Spring AMQP instrumentation seams.
2. **T02** — prove live send/receive/failure capture in the new recorder module.
3. **T03** — wire the shared Spring example service to RabbitMQ and add the live two-service proof fixture.
4. **T04** — ship `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` and the retained AMQP artifact bundle flow.

## Key boundary notes for the next executor

- S01 already widened the analyzer boundary to protocol-scoped `amqp` identities and `AmqpEvent` JSONL; S02 must add the **live recorder/runtime path**, not re-open analyzer semantics.
- Keep Kafka-only additive async semantics explicit and empty on AMQP proof paths; do not fabricate runtime-selected or schema-failure AMQP companions unless the runtime actually proves them.
- The proof/export surface must stay fail-visible and redaction-safe because this slice supports `R021` and touches `R002`/`R003`/`R025` verification surfaces.
- `examples:springmvc-service` already contains the live Kafka proof shape; mirror that structure carefully without regressing Kafka tests.

## Resume point

Start with `T01` from `.gsd/milestones/M015/slices/S02/tasks/T01-PLAN.md`.
