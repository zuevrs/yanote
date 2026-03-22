# M007: AsyncAPI Schema Conformance And Contract Depth — Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

## Project Description

Yanote already understands Kafka-oriented AsyncAPI contracts at the level of channel, direction, and message-contract identity, and it can report unmatched or mismatched async drift. This milestone deepens that path into a strong contract surface by introducing payload-bearing async evidence, validating observed Kafka payloads against AsyncAPI message schemas, surfacing schema-level drift distinctly from routing drift, and proving the stronger behavior through the real Spring Kafka proof path.

## Why This Milestone

The current public async story is intentionally honest: `async-report` proves channel, operation, and message-contract coverage, but `payload-schema enforcement пока нет`. That boundary was right for the first async rollout, but it is now the clearest remaining contract-depth gap in the product.

Investigation also shows that the gap is not analyzer-only. The current `KafkaEvent` / `AsyncEvent` surfaces carry metadata (`action`, `channel`, `message`, service/test attribution) but not payload or header facts. That means a strong async contract requires coordinated changes across the event model, the Spring Kafka recorder path, the JSONL reader/normalizer, the async coverage/report/gate surfaces, and the live proof stack.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run `async-report` on Kafka evidence that carries enough contract truth to validate AsyncAPI payload schemas rather than only message names
- distinguish async routing drift from async payload/header schema drift in CLI output, JSON report artifacts, and gate failures
- trust the stronger async contract because the repository proves it through the real Kafka recorder/runtime path instead of fixture-only promises

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs async-report`, `yanote-async-report.json`, Spring Kafka recorder modules, and the M004/M005 proof scripts
- Environment: local development, CI, fixture/unit proof, and live Spring Kafka runtime proof
- Live dependencies involved: AsyncAPI documents, Kafka JSONL evidence, `yanote-recorder-spring-kafka`, example Spring services, and the async report/gate surfaces

## Completion Class

- Contract complete means: supported AsyncAPI contracts can be validated against observed payload-bearing evidence with deterministic schema-level diagnostics
- Integration complete means: the event model, Spring Kafka recorder, JSONL ingestion, async coverage engine, and async report/gate surfaces all agree on one truthful conformance boundary
- Operational complete means: the stronger async contract is exercised through live Kafka proof commands and leaves inspectable diagnostics when it fails

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a supported AsyncAPI contract with schema-bearing messages can reject invalid observed Kafka payloads and accept conforming ones through the real `async-report` path
- async failures distinguish routing/identity drift from schema/header drift instead of flattening both into one generic mismatch bucket
- the repository’s live Kafka proof stack and user-facing async boundary docs both reflect the stronger contract truth without implying broker-agnostic scope or combined HTTP/async reporting

## Risks and Unknowns

- The current async evidence model does not yet carry payload or header facts, so M007 must settle a safe, deterministic recorder boundary before schema validation can be truthful
- AsyncAPI schema/reference depth may expose parser or normalization edge cases that the current v2/v3 support layer never had to answer
- Schema-level diagnostics can easily blur with existing unmatched/mismatched async semantics if the report/gate model is not explicit
- Capturing payload-bearing evidence must not break the current fail-safe recorder behavior or turn the live proof stack flaky or non-deterministic

## Existing Codebase / Prior Art

- `yanote-js/src/spec/asyncapi.ts` — current AsyncAPI ingestion and normalization surface
- `yanote-js/src/coverage/asyncCoverage.ts` — current async coverage and drift logic
- `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/cli.ts` — current async report, schema, gate, and CLI surfaces
- `yanote-js/src/model/asyncEvent.ts` and `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — current async evidence boundary, which is metadata-only today
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/` — live Kafka recorder seams that will need to emit stronger evidence
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, and `scripts/ci/verify-m005-s02-async-acceptance.sh` — existing authoritative async proof stack
- `docs/guides/asyncapi-kafka.md` and `docs/requirements.md` — current public boundary surfaces that explicitly admit the payload-validation gap

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R049 — payload validation against AsyncAPI message schema
- R065 — async schema-level drift is surfaced distinctly from routing drift
- R040 / R041 — existing async diagnostics and separate async report/gate surfaces that must remain truthful while deepening
- R045 / R046 / R048 — live-proof and quality-bar requirements that force this work beyond fixture-only coverage

## Scope

### In Scope

- payload-bearing async evidence contract for Kafka JSONL
- Spring Kafka recorder changes needed to emit schema-relevant payload/header facts safely
- AsyncAPI payload/schema validation and deterministic schema-level diagnostics
- async report/gate/CLI updates that separate routing drift from schema drift
- live Kafka proof and public boundary updates for the stronger async contract

### Out of Scope / Non-Goals

- unified HTTP + async reporting
- non-Kafka broker expansion
- Schema Registry integration or schema-evolution policy
- DLQ/retry/partition/lag-aware async dimensions
- OpenAPI payload hardening work reserved for M008

## Technical Constraints

- Keep the async path Kafka-only and Spring Kafka-first in this milestone.
- Preserve the separate `async-report` / `yanote-async-report.json` surface instead of collapsing async into HTTP vocabulary.
- Keep recorder failure behavior non-breaking and inspectable; stronger evidence capture must not make user traffic fail when the recorder cannot persist an event.
- Be explicit about what is validated (payload, headers, references, media/schema depth) and what still is not.

## Integration Points

- `yanote-core` event model and JSONL round-trip layer
- `yanote-recorder-spring-kafka` recorder/interceptor/listener seams
- `yanote-js` async JSONL readers, spec normalizer, coverage engine, report schema/writer, gates, and CLI
- example Spring Kafka services and async proof scripts under `scripts/ci/`
- user-facing async docs and support boundaries

## Open Questions

- What is the smallest payload/header evidence shape that makes AsyncAPI schema validation truthful without turning JSONL into an unbounded dump? — Current leaning: capture contract-relevant payload/header material explicitly, not arbitrary broker metadata.
- Should schema failures be modeled as a new async diagnostic family or as a richer extension of the current mismatched surface? — Current leaning: keep routing drift and schema drift distinct.
- How much AsyncAPI header validation belongs in the first strong contract milestone versus a later completeness pass? — Current leaning: include the header surface only if the evidence and spec shapes can be made deterministic without reopening broker-agnostic scope.
- Which existing live proof script should become the authoritative final acceptance surface for schema-depth async validation? — Current leaning: extend the M005 acceptance composition rather than inventing a parallel proof runner.
