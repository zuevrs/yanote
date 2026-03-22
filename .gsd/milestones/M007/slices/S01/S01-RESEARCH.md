# M007/S01 — Research

**Date:** 2026-03-20

## Summary

S01’s primary active requirement is **R049**. It also prepares the evidence boundary needed for the later schema-vs-routing drift split described for **R065**, but this slice should not yet change async report/gate semantics. The current Kafka async path is metadata-only end to end: `yanote-core`’s `KafkaEvent` and `yanote-js`’s `AsyncEvent` carry only `action`, `channel`, optional `message`, service/error/test attribution; `readAsyncEventsJsonl()` deliberately drops arbitrary structures; `KafkaOperationContract` stores only `message.name`; and `computeAsyncCoverage()` only matches action/channel and compares `event.message` to `contract.message.name`. AsyncAPI fixtures already declare `payload` schemas, but none of that data survives spec normalization or runtime evidence.

The strongest proof of the gap is the live example path. `examples/springmvc-service` publishes raw `String` Kafka payloads (`"alice"` / republished strings), while the authoritative AsyncAPI proof fixtures `spring-kafka-single-service.yaml` and `spring-kafka-single-service-republish.yaml` declare `payload: { type: object }`. `async-report` still passes with `messageCoveragePercent = 100` because the analyzer never sees payload. That is the exact R049 gap.

Recommendation: treat S01 as a **contract slice**, not a reporting slice. Extend the shared event model to carry payload-bearing JSON-safe evidence (and, if included now, a narrow deterministic application-header map) through Java JSONL -> Node JSONL reader -> AsyncAPI contract model. Preserve the earlier async decisions that still matter here: do not infer message identity from payload, keep `YanoteEvent` JSONL as the stable wire format with null omission, and keep auto-propagation limited to suite/run plus explicit `yanote.message`. Leave `asyncCoverage.ts`, `asyncReport.ts`, `asyncEvaluator.ts`, and CLI routing-vs-schema semantics for S02/S03.

## Recommendation

Adopt one explicit, JSON-safe Kafka evidence contract:

- **Java `KafkaEvent`**: add optional `payload` as a Jackson `JsonNode` (or equivalent JSON-safe tree) and optionally `headers` as a deterministic map of **non-Yanote** application headers.
- **Node `AsyncEvent`**: mirror the same shape with a JSON value type and narrow header-map normalization.
- **AsyncAPI model**: extend `KafkaMessageContract` so message metadata stays beside the canonical `kafka <action> <channel>` key, but now also carries payload/header schema material (`payload`, `headers`, `contentType`, `schemaFormat`, or equivalent raw spec fragments).

Why this shape:

- it is small enough to stay JSONL-friendly,
- truthful enough for later Ajv-based JSON Schema validation,
- and compatible with the existing Spring Kafka send/receive truth seams.

Avoid `toString()` payload capture and avoid dumping arbitrary broker metadata. If capture fails, keep the current fail-safe recorder posture: warn and drop or omit the capture rather than breaking user traffic.

## Implementation Landscape

### Key Files

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — current shared Kafka event contract; metadata-only today. Primary place to add optional payload/header fields, normalization, and null-omission behavior.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — sealed JSONL root. Keep `kind:"kafka"` unchanged so mixed HTTP/Kafka JSONL stays compatible.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` / `EventJsonlReader.java` — stable Java JSONL boundary. Nested payload/header ordering and round-trip behavior need tests here, but the shared writer/reader pattern should stay unchanged.
- `yanote-core/src/test/java/dev/yanote/core/events/KafkaEventJsonlRoundTripTest.java` / `EventJsonlRoundTripTest.java` — current proof of metadata-only JSONL. Add payload-bearing round-trip cases here first; keep mixed HTTP+Kafka compatibility green.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — current send/receive recorder only reads topic + headers. This is the capture-helper seam for observed payload and any persisted header map.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java` / `YanoteKafkaRecordInterceptor.java` — already the correct truthful send/receive outcome seams; extend recorder internals, do not move capture elsewhere.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — current internal header contract (`yanote.test.run_id`, `yanote.test.suite`, `yanote.message`). If a generic header map is added, exclude or clearly separate these internal keys so they do not duplicate existing dedicated fields or widen auto-propagation.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — protects explicit-vs-ambient header behavior. Update only if generic header capture is added; keep the current suite/run/message propagation rules intact.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` / `KafkaRecorderFailurePathTest.java` — strongest recorder-side proof that success/failure capture remains truthful and fail-safe. Add payload assertions here without regressing warn-and-drop behavior.
- `yanote-js/src/model/asyncEvent.ts` — Node-side async evidence model; currently metadata-only. Mirror the Java contract exactly here.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — JSONL ingestion seam. It currently drops arbitrary nested structures by design; add narrow payload/header normalization instead of generic passthrough.
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts` — currently proves invalid lines are ignored and arbitrary structures are dropped. Replace that “drop everything unknown” behavior with explicit payload/header acceptance rules and new malformed-field cases.
- `yanote-js/src/model/operationKey.ts` — `KafkaMessageContract` currently stores only `name`. Extend this type here, but keep `serializeOperationKey()` unchanged.
- `yanote-js/src/spec/asyncapi.ts` — AsyncAPI normalization currently extracts only message names. This needs the new schema-carrying contract fields beside `message.name`, without changing canonical operation identity.
- `yanote-js/src/spec/asyncapi.parity.test.ts` / `yanote-js/src/spec/asyncapi.test.ts` — current parity/diagnostic contract. Add expectations for payload/header schema extraction while preserving the existing `kafka send/receive <channel>` key invariant.
- `yanote-js/test/fixtures/asyncapi/v2.yaml`, `yanote-js/test/fixtures/asyncapi/v3.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service*.yaml` — current fixtures already contain `payload` schemas that are silently ignored. They are the right place to pin what schema material must be retained in S01.
- `yanote-js/test/fixtures/async-events/*.jsonl` — add new payload-bearing fixtures here. Current fixtures prove only message-name drift.
- `yanote-js/src/coverage/asyncCoverage.ts` — currently only routing/message-name matching. S01 should avoid changing coverage semantics beyond minimal type plumbing; schema drift belongs to S02.
- `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncSchema.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `yanote-js/src/cli.ts` — leave report/gate/CLI semantics alone in S01 except for any compile-time type propagation. Routing-vs-schema diagnostic split is downstream work.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — important forward constraint: the live proof app publishes plain `String` payloads, while current AsyncAPI proof specs declare `payload.type: object`. Later slices must reconcile this before schema-validation claims become truthful.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — current end-to-end proof checks message hints only. If S01 touches the example app or proof truth, this is the test to update.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` / `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — current authoritative proof stack. Today they only assert message-contract names and zero unmatched/mismatched diagnostics; use them as regression guards, not as the first place to add schema-truth semantics.

### Build Order

1. **Lock the evidence contract first** in `yanote-core` + `yanote-js/src/model/asyncEvent.ts` + `yanote-js/src/events/readAsyncEventsJsonl.ts`.
   - This retires the earlier metadata-only boundary and unblocks every downstream slice.
   - Prove round-trip first with Java JSONL tests and Node reader tests before touching live recorder behavior.

2. **Extend the Spring Kafka recorder without changing the truth seams.**
   - Keep `ProducerListener` / `RecordInterceptor` as the outcome boundary.
   - Add capture helpers in `YanoteKafkaEventRecorder`, then prove success/failure + fail-safe behavior in `yanote-recorder-spring-kafka` tests.

3. **Extend the AsyncAPI contract model to retain schema-bearing message data beside the existing operation key.**
   - Update `KafkaMessageContract` + `asyncapi.ts` + parity fixtures/tests.
   - Do **not** change `serializeOperationKey()` or coverage semantics here.

4. **Add a deterministic fixture corpus that proves the new boundary can carry schema-relevant facts.**
   - New async JSONL fixtures should cover at least: scalar/string payload, object payload, missing payload, malformed nested header map, and mixed HTTP+Kafka JSONL compatibility.
   - Keep `asyncCoverage.ts` / report / gate untouched so S02 can consume the contract cleanly.

5. **Only touch the example app/live proof if the slice needs runtime proof of capture.**
   - Current live proof app is already schema-inconsistent (string payload vs object spec). Avoid coupling S01 to full end-to-end schema semantics unless the planner explicitly budgets that work.

### Verification Approach

- **Java contract tests first**
  - `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-kafka:test`
  - Expected signals:
    - Kafka JSONL round-trip preserves the new payload-bearing fields.
    - Mixed HTTP+Kafka JSONL still reads correctly.
    - Recorder success/failure tests still log-and-drop safely on write failure.

- **Node contract/parity tests second**
  - `npm -C yanote-js ci && npm -C yanote-js test`
  - Focus on:
    - `src/events/readAsyncEventsJsonl.test.ts`
    - `src/spec/asyncapi.test.ts`
    - `src/spec/asyncapi.parity.test.ts`
  - Expected signals:
    - payload/header fields survive JSONL ingestion deterministically,
    - invalid JSONL lines are still surfaced as input diagnostics,
    - AsyncAPI v2/v3 parity still normalizes to the same canonical operation keys while retaining richer message contract data.

- **Regression guards if recorder/example code changes**
  - `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - These should remain green even with extra payload fields because the current proof scripts read only known fields; if they fail, the slice likely regressed the stable evidence path.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| AsyncAPI parsing / `$ref` resolution across v2 and v3 | `@asyncapi/parser` already used in `yanote-js/src/spec/asyncapi.ts` | The current loader already relies on parser-level invalid-document rejection and resolved message metadata (`x-parser-message-name`). Replacing it would create a second semantics surface. |
| JSON Schema validation for future payload/header checks | `ajv` already shipped in `yanote-js/package.json` | Later S02 validation should compile extracted JSON Schema fragments instead of inventing a custom validator. |
| Spring Kafka producer/consumer truth capture | Existing `ProducerListener` + `RecordInterceptor` seams in `yanote-recorder-spring-kafka` | These already capture broker-acknowledged send outcomes and listener success/failure truth. Payload capture should extend them, not bypass them. |

## Constraints

- **Primary active requirement is R049.** S01 should deliver the payload-bearing evidence/spec contract that R049 needs, while only preparing the later schema-vs-routing drift split.
- Keep the existing async decisions intact:
  - explicit message identity stays explicit-only; do not infer `message` from payload,
  - JSONL still flows through the sealed `YanoteEvent` root and omits null optionals,
  - only suite/run auto-propagate; `yanote.message` remains explicit-only.
- `readAsyncEventsJsonl.ts` currently treats unknown nested structures as something to drop, not preserve. Any new nested fields must be explicitly normalized.
- Current live proof specs already contain `payload` schemas, but `yanote-js` ignores them. S01 should fix the contract gap, not paper over it in docs or report wording.
- AsyncAPI supports headers and multi-format payload schemas (`schemaFormat`), but only JSON Schema-shaped payloads are immediately compatible with Ajv. Non-JSON-schema formats should be preserved as contract metadata or explicitly deferred, not heuristically converted.
- The recorder must stay fail-safe: payload capture errors cannot break user traffic or listener execution.

## Common Pitfalls

- **Accidentally widening the canonical operation key** — keep all payload/header schema metadata inside `KafkaMessageContract`; `serializeOperationKey()` must stay `kafka <action> <channel>`.
- **Using `toString()` as payload capture** — this would make schema validation synthetic and non-deterministic. Capture JSON-safe values/trees instead.
- **Breaking explicit message-hint semantics** — payload capture is additional evidence, not permission to infer `message` automatically.
- **Assuming the current live proof is schema-truthful** — `ExampleServiceApplication` sends raw strings, while `spring-kafka-single-service*.yaml` declares `payload.type: object`. That mismatch must be handled intentionally later.
- **Leaking payloads into human-facing summaries** — `scripts/ci/render-yanote-summary.test.mjs` already protects against payload leaks. JSONL/report work should not spill raw payload into summary stderr/markdown surfaces.
- **Relying on nested map/object serialization order in exact-line tests** — current Java tests use exact JSONL string equality for metadata-only events. For nested payload/header objects, prefer round-trip/tree assertions unless ordering is explicitly canonicalized.

## Open Risks

- The exact resolved shape returned by `@asyncapi/parser` for v3 message refs is only partially inferred from current code (`x-parser-message-name`). S01 should pin payload/header extraction with contract tests instead of assuming undocumented parser internals.
- Kafka headers are byte arrays and may repeat keys. If S01 captures headers now, it needs one explicit rule (for example: non-Yanote headers only, UTF-8 decode, last-value-wins) or it will create nondeterministic evidence.
- Large or opaque payloads can make JSONL lines huge or non-serializable. If the planner wants broad capture, it must also define omission/truncation rules without invalidating later schema truth.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI | `asyncapi-design` | available |
| Kafka | `kafka-engineer` | available |
| Spring Kafka | `spring-kafka` | available |
| JSON Schema / Ajv | skill search run (`npx skills find "JSON Schema validation"`); results were low-relevance/general-purpose only | none installed |

## Sources

- AsyncAPI message objects can carry both `payload` and `headers`, and AsyncAPI also supports multi-format payload schemas via `schemaFormat`; this matters because S01 should preserve schema-bearing message data now, while later slices can explicitly support only JSON Schema-compatible formats. (source: [AsyncAPI specification](https://github.com/asyncapi/spec/blob/master/spec/asyncapi.md))
