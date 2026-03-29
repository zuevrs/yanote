# S02: Kafka Header Evidence And AsyncAPI Header Verification

**Goal:** Promote Kafka headers from metadata-only transport detail to a redaction-safe evidence surface that can be retained in JSONL, normalized in Node, and validated against AsyncAPI header contracts instead of remaining broadly unverifiable.
**Demo:** Running the Kafka metadata propagation proof and async analyzer/report suites shows retained Kafka headers in normalized async events, typed header drift diagnostics for missing/invalid values, and a truthful distinction between truly unverifiable header cases and headers that were retained and checked.

## Must-Haves

- `KafkaEvent` and `AsyncEvent` can carry retained Kafka headers through JSONL and normalization with an explicit allowlist/redaction boundary.
- AsyncAPI message loading and async schema conformance can validate retained header evidence when the contract is representable, while leaving genuinely unsupported encodings flagged as unsupported instead of silently unverifiable.
- Existing suite/run/message-hint propagation and live metadata proof paths remain green after retained headers become first-class evidence.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-kafka:test`
- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`

## Observability / Diagnostics

- Runtime signals: retained Kafka header maps, redaction markers, header-validation diagnostics, and narrowed `unverifiable-headers` cases.
- Inspection surfaces: Kafka recorder seam tests, `asyncSchemaConformance` diagnostics suites, async report/CLI tests, and retained artifacts from the metadata propagation / async acceptance scripts.
- Failure visibility: missing required headers, invalid retained header values, redacted/filtered headers, and truly unsupported header encodings surface as distinct diagnostics instead of one broad unverifiable bucket.
- Redaction constraints: retained headers must never echo secrets or unbounded binary content; allowlisting/redaction decisions are part of the contract surface.

## Integration Closure

- Upstream surfaces consumed: S01 additive event-model provenance, `YanoteKafkaHeaders`, Kafka producer/listener interceptors, `AsyncEvent`, AsyncAPI message-contract loading, and async conformance/report and gate surfaces.
- New wiring introduced in this slice: retained header evidence crosses the Spring Kafka recorder → JSONL → async analyzer path and becomes part of typed async drift reporting.
- What remains before the milestone is truly usable end-to-end: S03 still needs multi-message AsyncAPI resolution, and S05 still needs retained proof/docs/compatibility hardening around the stronger async boundary.

## Tasks

- [ ] **T01: Retain redaction-safe Kafka header evidence in recorder and JSONL models** `est:1h20m`
  - Why: header validation cannot become real until the recorder chooses what to retain, what to redact, and what to omit on purpose.
  - Files: `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`, `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`, `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java`, `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
  - Do: Add retained header fields and a stable redaction/allowlist policy to the Kafka event path, normalize them into async events, and pin how filtered or redacted headers appear so downstream validation does not have to infer recorder policy.
  - Verify: `./gradlew --no-daemon :yanote-recorder-spring-kafka:test && npm -C yanote-js test -- src/events/readAsyncEventsJsonl.test.ts`
  - Done when: recorder tests and JSONL reader tests prove retained headers survive into normalized async events with deterministic redaction semantics and no metadata-propagation regression.
- [ ] **T02: Validate AsyncAPI headers against retained evidence and tighten diagnostics** `est:1h40m`
  - Why: the user-facing value is not header retention by itself but truthful contract verification that separates missing/invalid headers from truly unsupported verification gaps.
  - Files: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/report/asyncReport.contract.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/src/cli.async-report.contract.test.ts`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m005-s02-async-acceptance.sh`
  - Do: Reuse the retained header evidence to validate AsyncAPI header contracts where supported, narrow `unverifiable-headers` to genuinely unsupported cases, surface typed missing/invalid header diagnostics in async report/CLI output, and refresh the live proof scripts to show the stronger truth.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncSchemaConformance.diagnostics.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts && bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh`
  - Done when: retained headers are validated where possible, unsupported cases stay explicit, and the live metadata/async acceptance proofs remain green with richer diagnostics.

## Files Likely Touched

- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java`
- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.ts`
- `yanote-js/src/events/readAsyncEventsJsonl.test.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`
