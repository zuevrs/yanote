# M009: HTTP And Kafka Evidence Truth Hardening

**Gathered:** 2026-03-21
**Status:** Ready for planning

## Project Description

Yanote already has a credible HTTP/OpenAPI path and a credible Kafka/AsyncAPI first-wave path. M007 and M008 proved schema and payload conformance depth, separate report/gate surfaces, and retained green/red proof bundles. The next highest-value improvement inside the current product boundary is not new transports or a combined report; it is making the existing recorder → JSONL → analyzer path more truthful about what was actually observed, what was intentionally omitted, and what genuinely drifted from the declared contract.

## Why This Milestone

The current implementation still blurs a few important edges:

- Kafka payload capture is narrower than common Spring Kafka usage because ordinary POJO/record payloads still fall into the unsupported/omitted path.
- Kafka headers are known to the runtime path but do not survive into first-class analyzer evidence, so AsyncAPI header contracts remain mostly diagnostic-only instead of truly verifiable.
- AsyncAPI v3 multi-message operations are still outside the supported semantic surface even though they remain within the current Kafka-only scope.
- HTTP and Kafka report/gate surfaces can still benefit from an explicit distinction between recorder-policy omission and real semantic drift.

That makes this the logical follow-on to M007/M008: deepen truth inside the shipped technologies before widening scope.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run the existing HTTP and async proof paths and see whether a failure came from contract drift or from recorder capture limits/policy;
- use common Java POJO/record Kafka payloads and retained Kafka headers in the same contract-verification path instead of adapting examples to narrower recorder-friendly shapes.

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, `node yanote-js/dist/yanote.cjs async-report`, `bash scripts/docs/verify-s02-analysis-path.sh`, `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- Environment: local dev plus retained CI-style proof scripts over Spring MVC, Spring Kafka, Docker-backed example services, and Node analyzer/report paths
- Live dependencies involved: Spring MVC example service, Spring Kafka example services, Kafka broker, Docker Compose, local JSONL artifacts

## Completion Class

- Contract complete means: additive event-model fields, parser/normalizer behavior, AsyncAPI/OpenAPI semantics, and report/gate outputs are pinned by focused unit/contract suites with explicit recorder-omission vs semantic-drift expectations.
- Integration complete means: the real Spring MVC and Spring Kafka recorder paths emit the richer evidence into JSONL and the analyzer/report paths consume it without regressing existing green proofs.
- Operational complete means: retained green/red proof artifacts and version-sensitive recorder seams remain inspectable through the existing verification scripts and, where needed, a version-matrix smoke boundary.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a live Spring MVC recorder → JSONL → OpenAPI analyzer pass exposes recorder provenance for captured vs omitted payload evidence without regressing the current green HTTP proof;
- a live Spring Kafka recorder → JSONL → AsyncAPI analyzer pass retains POJO payloads and verifiable headers while keeping suite/run attribution and fail-closed async semantics truthful;
- the retained proof bundles and docs describe the stronger truth boundary without implying new brokers, schema registries, or a mandatory combined HTTP+async report.

## Risks and Unknowns

- Widening `HttpEvent` / `KafkaEvent` can accidentally break JSONL round-trip compatibility or existing analyzer/report expectations if the new fields are not strictly additive.
- Retaining Kafka headers can leak secrets or high-cardinality values unless allowlisting, size limits, and redaction are designed before the evidence becomes first-class.
- Supporting AsyncAPI v3 multi-message operations can create ambiguous contract matching on the stable `kafka <action> <channel>` identity unless message discrimination is explicit and fail-closed.
- The Spring Kafka recorder still relies on reflection-based wiring, so even a better logic path can stay brittle across framework version drift.

## Existing Codebase / Prior Art

- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — current Kafka payload capture boundary; today it omits unsupported object payloads instead of retaining them.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — current suite/run/message-hint propagation seam and the natural entry point for retained header evidence.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` — current HTTP JSON-first payload capture boundary with hard-coded omission rules.
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java` and `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — authoritative JSONL event model.
- `yanote-js/src/events/readJsonl.ts` and `yanote-js/src/events/readAsyncEventsJsonl.ts` — normalization boundary where additive evidence must remain backward compatible.
- `yanote-js/src/spec/asyncapi.ts` and `yanote-js/src/coverage/asyncSchemaConformance.ts` — current Kafka-only AsyncAPI semantic surface, including header-verification limitations and the multi-message v3 gap.
- `yanote-js/src/spec/openapi.ts` and `yanote-js/src/coverage/httpPayloadConformance.ts` — current HTTP/OpenAPI semantic surface where recorder-policy omissions still need cleaner differentiation from contract drift.
- `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, and `scripts/ci/verify-m005-s02-async-acceptance.sh` — retained proof entrypoints this milestone should strengthen rather than replace.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R049` — async payload validation already exists; this milestone deepens evidence truth so recorder omissions and real payload drift stop looking the same.
- `R065` — async typed diagnostics already exist; this milestone turns retained Kafka headers and multi-message resolution into stronger, more truthful async diagnostics.
- `R066` — HTTP payload validation already exists; this milestone hardens recorder-policy and schema-normalization truth inside that boundary.
- `R067` — HTTP semantic surfaces already distinguish observation and conformance; this milestone clarifies when conformance failed because of recorder policy vs real semantic mismatch.
- `R063` — deferred version-matrix hardening becomes a candidate supporting requirement for the final slice if the milestone is accepted.
- `R052` — schema-registry support remains explicitly later work; this milestone only prepares the evidence and semantics layer beneath it.

### Draft Requirement Deltas

Proposed additions for `REQUIREMENTS.md` if this milestone is accepted:

- **Proposed R068** — Yanote retains payload capture provenance across HTTP and Kafka recorder → JSONL → analyzer boundaries so omitted evidence is distinguishable from absent or invalid contract data.
- **Proposed R069** — Yanote retains redaction-safe Kafka header evidence and validates it against AsyncAPI header contracts instead of reporting headers as broadly unverifiable.
- **Proposed R070** — Yanote supports Kafka-only AsyncAPI v3 operations with multiple declared messages and resolves message contracts deterministically or fails closed with typed ambiguity diagnostics.
- **Proposed R071** — Yanote’s HTTP and async report/gate surfaces distinguish recorder-policy omission from semantic contract drift so users can trust fail-closed results.

Proposed status change if this milestone is accepted:

- **R063** — deferred → active, owned by `M009/S05`, because the reflection-based Spring Kafka seam remains the main operational hardening risk.

Explicitly not activated here:

- **R052** stays deferred; schema registry and schema-evolution support are still follow-on work after evidence truth is stronger.

## Scope

### In Scope

- additive HTTP/Kafka event-model provenance for payload/header capture outcomes;
- Kafka POJO/record payload retention inside the existing Spring Kafka-first path;
- retained Kafka headers with allowlist/redaction boundaries and AsyncAPI header validation;
- AsyncAPI v3 multi-message support inside the current Kafka-only semantic scope;
- HTTP/OpenAPI schema/media-type hardening and recorder-policy-aware semantics;
- retained proof and compatibility hardening for the stronger truth boundary.

### Out of Scope / Non-Goals

- RabbitMQ, ActiveMQ, or any broker expansion beyond the current Kafka-only async scope;
- a mandatory combined HTTP+async report or gate surface;
- schema registry integration, Avro/Protobuf rollout, or schema-evolution policy as a milestone deliverable;
- DLT, lag, retry, partition-awareness, or broader operational Kafka analytics.

## Technical Constraints

- Keep the async product boundary Kafka-only and Spring Kafka-first.
- Keep HTTP and async report/gate surfaces separate.
- Preserve additive compatibility in JSONL event formats where practical; widening evidence must not silently break existing readers.
- Never retain raw sensitive headers without a redaction/allowlist boundary.
- Preserve stable public proof artifact names unless a rename is itself part of the contract change.

## Integration Points

- Spring MVC recorder — source of HTTP payload evidence and omission reasons.
- Spring Kafka recorder — source of Kafka payload/header evidence and attribution metadata.
- `yanote-core` event records — canonical JSONL contract boundary between JVM recorders and Node analyzer.
- Node analyzer/report/gate path — semantic normalization, drift classification, and user-visible truth surfaces.
- Existing proof scripts/docs — retained green/red runtime evidence and public wording boundary.

## Open Questions

- Header retention policy — default allowlist vs explicit opt-in allowlist needs a decision before headers become first-class evidence.
- Event-model compatibility — whether provenance should live as top-level additive fields or a nested capture-status object needs one stable choice to avoid churn.
- Multi-message discrimination — the preferred ordering among explicit message hint, message name/id, and fail-closed ambiguity still needs to be pinned before execution.
- HTTP schema normalization depth — how much OpenAPI-to-JSON-Schema normalization belongs in this milestone vs later follow-on hardening should be kept explicit during slice planning.
