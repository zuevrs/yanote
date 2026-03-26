# S01 planning wrap-up

## Completed in this unit
- Read the slice and task-plan templates plus current `.gsd/STATE.md`.
- Activated the `debug-like-expert` skill for planning context.
- Explored the real codebase seams for async support across `yanote-js` and `yanote-core`.
- Persisted the S01 task breakdown through `gsd_plan_slice`.
- Confirmed the rendered slice plan now exists at `.gsd/milestones/M015/slices/S01/S01-PLAN.md` and task plans exist under `.gsd/milestones/M015/slices/S01/tasks/`.

## Important verified codebase constraints
- `yanote-js/src/spec/asyncapi.ts` still rejects non-Kafka protocols today with `Only kafka is supported.`
- `yanote-js/src/model/asyncEvent.ts` and `yanote-js/src/events/readAsyncEventsJsonl.ts` are Kafka-only today.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` only permits `HttpEvent` and `KafkaEvent` today.
- Async coverage/report/CLI paths are structurally Kafka-first; widening to AMQP is a real contract change, not a docs tweak.
- `yanote-js/node_modules` is absent in this worktree, so `npm -C yanote-js test ...` currently fails with `vitest: command not found` until dependencies are installed.

## What remains unfinished / resume from here
1. **Quality-gate persistence is still pending.**
   - `gsd_plan_slice` moved state to `evaluating-gates`.
   - The next unit should evaluate and save at least slice gates Q3 and Q4 for S01, then decide whether any task-level Q5/Q6/Q7 gate rows also need explicit results before execution.
2. **Rendered task plans are the DB-rendered minimal form.**
   - They currently contain title/description/inputs/expected output/verification, but do **not** yet include richer gate-derived sections because those gate rows have not been saved.
   - If the next unit wants the rendered markdown to show Threat Surface / Requirement Impact, save Q3/Q4 and then re-render via the canonical DB-backed path.
3. **Two structural planning decisions were identified and should be kept aligned with execution.**
   - Protocol-scoped async identities/event kinds (`kafka`, `amqp`) with RabbitMQ as the first supported AMQP runtime.
   - Kafka-only additive async sections stay protocol-scoped on AMQP inputs instead of pretending feature parity.

## Persisted task breakdown
- `T01` — Generalize AsyncAPI normalization to protocol-aware async identities.
- `T02` — Admit AMQP evidence in Node and JVM async JSONL contracts.
- `T03` — Make async coverage and conformance protocol-aware for AMQP fixtures.
- `T04` — Publish protocol-aware async report JSON and HTML without lying about Kafka-only extras.
- `T05` — Ship the AMQP fixture path through `async-report` CLI and built dist output.

## Resume note
Do **not** re-research the slice. Start from the persisted S01 plan, then handle gate persistence / rendering alignment before dispatching execution.