---
id: S01
parent: M015
milestone: M015
provides:
  - A protocol-scoped async parser/model/report contract that S02 can target with live RabbitMQ recorder evidence.
  - Stable AMQP fixture proof and dist-entrypoint behavior that S03 can aggregate without redefining split async truth.
  - An explicit self-describing AMQP report shape that keeps Kafka-only semantics visible as intentionally unsupported rather than silently absent.
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java
  - yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java
  - yanote-js/src/coverage/asyncSchemaConformance.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/cli.ts
key_decisions:
  - Normalize supported async identities as `<protocol> <action> <channel>` while preserving exact Kafka keys (`kafka <action> <channel>`).
  - Represent RabbitMQ evidence as a first-class sibling async kind (`kind: "amqp"`) in both Node and JVM event contracts instead of overloading Kafka shapes.
  - Keep Kafka-only additive report/CLI sections explicit zero-or-none on AMQP inputs instead of fabricating RabbitMQ semantic parity.
patterns_established:
  - Protocol must travel with async identity, matching, reporting, and diagnostics.
  - Add new async runtimes as sibling evidence/contract types rather than by widening Kafka-specific records in place.
  - Keep additive protocol-specific sections explicit even when they are empty so downstream aggregation does not guess feature parity.
observability_surfaces:
  - `YANOTE_ASYNC_SUMMARY` now emits `protocols=` alongside coverage, binding, and runtime-semantic tokens for protocol-aware runs.
  - `YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID` is the fail-closed operator signal for unsupported protocols.
  - `yanote-async-report.json` now includes a top-level `protocols` array and explicit empty `bindingSupport` on AMQP runs.
  - `yanote-async-report.html` renders the same protocol attribution plus an explicit `Kafka Binding Support` section that shows none on AMQP input.
drill_down_paths:
  - .gsd/milestones/M015/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M015/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M015/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M015/slices/S01/tasks/T04-SUMMARY.md
  - .gsd/milestones/M015/slices/S01/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T16:34:06.159Z
blocker_discovered: false
---

# S01: Protocol-aware async analyzer contract with first RabbitMQ path

**Generalized Yanote’s async analyzer from Kafka-only assumptions to protocol-aware Kafka/AMQP identities, contracts, coverage, reports, and CLI output, then proved the shipped dist entrypoint on a RabbitMQ/AMQP fixture without regressing Kafka keys.**

## What Happened

## What this slice delivered

S01 turned the async analyzer boundary from Kafka-only into a protocol-aware contract while keeping the existing Kafka identity stable.

- AsyncAPI normalization now accepts only single-protocol documents whose server protocol is exactly `kafka` or `amqp`, and serializes canonical async identities as `<protocol> <action> <channel>`.
- Existing Kafka contracts still keep the exact `kafka <action> <channel>` keys and Kafka-specific additive semantics.
- Node-side async evidence now accepts sibling `kind: "amqp"` JSONL events beside `kind: "kafka"`.
- `yanote-core` now round-trips the same AMQP evidence shape through a first-class `AmqpEvent` subtype registered on the sealed `YanoteEvent` boundary.
- Async coverage, schema conformance, report building, normalization, HTML rendering, and CLI summaries are now protocol-attributed, so AMQP evidence matches only AMQP operations instead of cross-matching Kafka rows with the same action/channel names.
- The shipped `node yanote-js/dist/yanote.cjs async-report` entrypoint now produces truthful AMQP JSON and HTML artifacts from the retained RabbitMQ fixture path.

The assembled demo proved the intended product boundary: an AsyncAPI spec with `protocol: amqp` plus retained AMQP JSONL evidence yields `yanote-async-report.json` and `yanote-async-report.html` with `protocols: ["amqp"]`, `amqp send users.signedup` as the canonical operation key, and an explicit zero/none `Kafka Binding Support` section instead of fabricated RabbitMQ parity.

## Patterns established for downstream slices

1. **Protocol is now part of canonical async identity.** Future async work should key lookups, coverage, report aggregation, and diagnostics by `<protocol, action, channel>`, not just `<action, channel>`.
2. **New async runtimes should be sibling contracts, not Kafka overloads.** AMQP landed as first-class `kind: "amqp"` evidence and operation keys, which keeps Kafka behavior stable and makes future runtime widening explicit.
3. **Kafka-only additive sections stay explicit on AMQP.** `bindingSupport`, runtime semantics, and human CLI/HTML sections render as zero/none on AMQP instead of being omitted or backfilled with guessed parity. That keeps the widened support self-describing for S03 combined-report work.
4. **Fail-closed protocol handling remains part of the public contract.** Unsupported or ambiguous protocol declarations surface semantic-invalid failures rather than silently mapping onto Kafka behavior.

## Operational Readiness (Q8)

- **Health signal:** a successful dist CLI run prints `Summary` with `status: ok`, `protocols: amqp`, 100% channel/operation/message coverage, and one final `YANOTE_ASYNC_SUMMARY` line containing `protocols=amqp` plus the JSON report path.
- **Failure signal:** unsupported protocol input exits with code `5`, emits `YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID`, prints `status: invalid`, and writes no async report artifacts.
- **Recovery procedure:** fix the AsyncAPI document to a supported single protocol (`amqp` or `kafka`), rebuild with `npm -C yanote-js run build`, then rerun `node yanote-js/dist/yanote.cjs async-report --spec ... --events ... --out ...`.
- **Monitoring gaps:** this slice does not yet include live RabbitMQ recorder proof, AMQP runtime-semantics parity, or RabbitMQ-specific additive metadata beyond routing/message/payload truth. Those remain for S02-S04.


## Verification

### Slice-plan verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts` ✅ passed (26 tests)
- `npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts` ✅ passed (5 tests)
- `./gradlew :yanote-core:test --tests dev.yanote.core.events.EventJsonlRoundTripTest --tests dev.yanote.core.events.AmqpEventJsonlRoundTripTest` ✅ passed
- `npm -C yanote-js test -- src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/coverage/asyncSemanticConformance.test.ts` ✅ passed (22 tests)
- `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` ✅ passed (16 tests)
- `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build` ✅ passed (23 tests + build)

### Dist-entrypoint proof

- `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml --events yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl --out .tmp/m015-s01-amqp-proof --profile local` ✅ passed
  - stdout summary reported `status: ok`, `protocols: amqp`, and 100% channels/operations/messages.
  - `YANOTE_ASYNC_SUMMARY` included `protocols=amqp`, `covered_operations=1/1`, `binding_total=0`, and `report=.tmp/m015-s01-amqp-proof/yanote-async-report.json`.
  - `.tmp/m015-s01-amqp-proof/yanote-async-report.json` and `.tmp/m015-s01-amqp-proof/yanote-async-report.html` were both created.
  - JSON artifact confirmed `protocols: ["amqp"]`, operation key `amqp send users.signedup`, and empty Kafka binding support.

### Fail-closed protocol proof

- `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/unsupported-mqtt.yaml --events yanote-js/test/fixtures/async-events/amqp-basic.fixture.jsonl --out .tmp/m015-s01-unsupported-proof --profile local` ✅ behaved as expected
  - exited with code `5`
  - emitted `YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID`
  - printed `status: invalid`
  - wrote no JSON or HTML report artifact


## Requirements Advanced

- R021 — S01 retired the Kafka-only analyzer boundary for the first non-Kafka path by accepting AMQP AsyncAPI specs and AMQP JSONL evidence, matching them through protocol-aware coverage/report/CLI surfaces, and proving the shipped dist entrypoint on RabbitMQ/AMQP fixtures.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

- Supported widened protocol scope in this slice is intentionally narrow: only single-protocol AsyncAPI documents whose protocol is exactly `kafka` or `amqp` are accepted.
- AMQP support currently covers protocol-aware parsing, evidence ingestion, routing/message/payload truth, and report/CLI rendering only.
- Kafka runtime semantics and Kafka binding support remain explicitly protocol-scoped; AMQP reports show those sections as zero/none rather than attempting RabbitMQ parity.
- Live RabbitMQ recorder proof, combined HTTP plus async aggregation, CI artifact closure, and public docs/support closure are not part of S01.

## Follow-ups

- S02 should prove the widened AMQP contract against live RabbitMQ recorder output rather than retained fixtures alone.
- S03 should aggregate HTTP and async child reports by attribution, reusing the new `protocols` surface and explicit zero/none Kafka-only sections on AMQP inputs.
- S04 should carry the widened broker support through CI/doc/support wording without implying broader broker-agnostic coverage than S01 actually proved.

## Files Created/Modified

- `yanote-js/src/model/operationKey.ts` — Generalized async identity types and serialization from Kafka-only keys to protocol-scoped Kafka/AMQP keys.
- `yanote-js/src/spec/asyncapi.ts` — Accepted supported single-protocol AMQP AsyncAPI documents, preserved Kafka normalization, and kept unsupported protocols fail-closed.
- `yanote-js/src/model/asyncEvent.ts` — Expanded async event normalization to accept sibling `amqp` evidence kinds and shared header/payload normalization.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — Taught the async JSONL reader to ingest AMQP evidence without regressing Kafka normalization.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — Registered `AmqpEvent` on the sealed polymorphic JVM event boundary.
- `yanote-core/src/main/java/dev/yanote/core/events/AmqpEvent.java` — Added the first JVM-side AMQP event contract mirroring the retained async JSONL metadata shape.
- `yanote-js/src/coverage/asyncCoverage.ts` — Made routing/message coverage protocol-aware so AMQP evidence matches only AMQP operations.
- `yanote-js/src/report/asyncReport.ts` — Added protocol attribution to the canonical async report and preserved explicit Kafka-only additive sections on AMQP inputs.
- `yanote-js/src/report/asyncReportHtml.ts` — Rendered protocol-aware async HTML with explicit zero/none Kafka binding support on AMQP reports.
- `yanote-js/src/cli.ts` — Updated `async-report` human and machine summaries to publish protocols, AMQP truth, and fail-closed protocol errors on the built dist entrypoint.
