---
id: S02
parent: M004
milestone: M004
provides:
  - A shared JVM suite/run metadata bridge across Spring MVC and Spring Kafka, a narrow Kafka header contract, and a single-service HTTP → Kafka → Kafka republish proof that validates raw attribution before analysis.
requires:
  - slice: S01
    provides: Truthful Spring Kafka producer/consumer evidence capture plus the single-service analyzer handoff surface.
affects:
  - M004/S03
  - M005/S01
  - M005/S02
key_files:
  - yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadata.java
  - yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadataContextHolder.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java
  - scripts/ci/verify-m004-s02-metadata-propagation.sh
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
key_decisions:
  - Put automatic suite/run propagation in a core-scoped shared metadata carrier while keeping `yanote.message` explicit-only on each outbound Kafka hop.
  - Prove republish attribution at the raw JSONL boundary before running `yanote async-report` so lost metadata or stale message reuse cannot hide behind analyzer normalization.
patterns_established:
  - Seed shared test metadata at MVC and Kafka ingress, clear it in `finally` / listener cleanup hooks, and protect no-bleed behavior with focused contract tests.
  - Validate metadata-sensitive flows twice: raw evidence ownership first, analyzer acceptance second.
observability_surfaces:
  - ./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test
  - ./gradlew :examples:springmvc-service:test
  - bash scripts/ci/verify-m004-s02-metadata-propagation.sh
  - raw `events.jsonl` plus generated `yanote-async-report.json` from the verifier temp directory
drill_down_paths:
  - .gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S02/tasks/T02-SUMMARY.md
duration: 1h 50m
verification_result: passed
completed_at: 2026-03-14 10:47:30 +0300
---

# S02: Metadata Propagation And Republish Attribution

**Closed the attribution gap in the Spring MVC → Kafka path: suite/run metadata now crosses HTTP and Kafka scopes automatically through one narrow header contract, and a real-broker republish proof shows that metadata survives into raw Kafka evidence and `yanote async-report`.**

## What Happened

S02 took the truthful recorder path from S01 and made attribution survive real async handoffs.

T01 moved the ambient suite/run carrier into `yanote-core`. `TestMetadata` and `TestMetadataContextHolder` now form the only automatic bridge between the Spring MVC recorder and the Spring Kafka recorder. `HttpEventRecordingFilter` seeds that shared context from `X-Test-Run-Id` / `X-Test-Suite`, clears it in a `finally` block, and keeps the HTTP recorder behavior otherwise unchanged.

On the Kafka side, `YanoteKafkaHeaders.applyContextIfAbsent(...)` now auto-populates only `yanote.test.run_id` and `yanote.test.suite`. Explicit outbound headers still win. `yanote.message` is no longer ambient metadata: it must be set explicitly per publish hop, and inbound listener imports clear any old message hint so republished sends cannot accidentally reuse stale message identity.

T01 also hardened the cleanup and precedence contract. `HttpMetadataContextBridgeTest` proves MVC request-scope seeding and cleanup. `KafkaMetadataPropagationContractTest` proves explicit-header precedence, suite/run-only auto-propagation, listener cleanup, no bleed between listener invocations, and fail-safe cleanup even when the recorder drops a write.

T02 then turned that contract into a live republish proof on the existing example service. `POST /users` now relies on the framework-driven MVC → Kafka bridge for suite/run propagation, publishes to `users.created`, consumes that topic, republishes to `users.created.republished`, and finally consumes the republished topic. Each outbound hop sets its own explicit `yanote.message` hint (`UserCreated` first, `UserRepublished` second), which makes message identity truthful across the republish boundary.

The example integration test was rewritten to assert the raw JSONL rather than only a typed reader view. It waits for exactly five lines (one HTTP plus four Kafka facts), checks `test.run_id` / `test.suite` on both Kafka hop pairs, and proves that the republished topic carries only `UserRepublished` instead of leaking the first hop’s message hint. The slice closes with `scripts/ci/verify-m004-s02-metadata-propagation.sh`, which reruns the live broker flow, validates raw evidence first, then feeds the same file into `yanote async-report` against a matching AsyncAPI fixture.

## Verification

- `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test` — passed.
- `./gradlew :examples:springmvc-service:test` — passed.
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` — passed.
- `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test :examples:springmvc-service:test` — passed as the final slice-wide JVM stack.
- `git diff --check` — passed at slice close.

The passing proof stack verified:

- shared suite/run metadata is visible in both MVC and Kafka recorder scopes;
- automatic Kafka propagation stays limited to `yanote.test.run_id` and `yanote.test.suite`;
- explicit outbound headers keep precedence over ambient context;
- `yanote.message` never propagates implicitly and does not bleed across republish hops;
- a real-broker HTTP → Kafka → Kafka flow preserves raw attribution and feeds `yanote async-report` unchanged.

## Requirements Advanced

- R046 — Advanced the async quality bar by adding focused MVC/Kafka metadata contract tests, raw-evidence republish assertions, and an end-to-end verifier that checks attribution before analysis.

## Requirements Validated

- R044 — Validated by the shared metadata carrier, narrow Kafka header contract, raw JSONL republish assertions, and the live verifier proving suite/run attribution across HTTP → Kafka → Kafka.

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- The local repo was missing `S02-SUMMARY.md` even though both task summaries and the finished verifier surfaces already existed. The slice is being closed from task evidence plus fresh milestone verification.

## Known Limitations

- The milestone still needs S03’s split producer-only → consumer-only proof, deterministic per-service merge, and CI workflow placement to close the full end-to-end runtime story.
- `yanote.message` remains explicit-only by design; automatic propagation is intentionally limited to suite/run attribution.
- Payload validation against AsyncAPI message schemas remains deferred.

## Follow-ups

- Treat `scripts/ci/verify-m004-s02-metadata-propagation.sh` as the authoritative single-service proof for future milestone work; do not fork a competing republish verifier.
- Compose the S03 multi-service proof on top of the raw-evidence-first attribution contract established here.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadata.java` — added the shared suite/run carrier record.
- `yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadataContextHolder.java` — added the shared core-scoped metadata holder.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — bridged HTTP request metadata into the shared context and cleared it safely.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java` — pinned MVC metadata visibility and cleanup.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — narrowed automatic Kafka propagation to suite/run only.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — pinned precedence, cleanup, and no-bleed behavior.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — rewired the example proof to assert raw five-event republish evidence.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — added the AsyncAPI contract for the republish proof.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — added the raw-evidence-first republish verifier.

## Forward Intelligence

### What the next slice should know
- The single-service republish story is already authoritative in `scripts/ci/verify-m004-s02-metadata-propagation.sh`; S03 and M005 should compose it rather than rebuilding a parallel single-service acceptance surface.

### What's fragile
- Metadata truth now depends on cleanup discipline. Any future change that stops clearing the shared carrier or listener-imported message hint can create silent attribution bleed across requests or listener invocations.

### Authoritative diagnostics
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` — this is the right first stop because it regenerates live evidence, checks raw `test.*` attribution and message ownership directly, and then runs the analyzer on the same file.

### What assumptions changed
- “The example app needs manual controller/service context plumbing for async attribution” — false; the shared MVC/Kafka bridge is sufficient once suite/run lives in a core-scoped carrier.
- “Inbound Kafka message hints can safely stay ambient for republish” — false; message identity had to become explicit-only per hop to avoid stale reuse.
