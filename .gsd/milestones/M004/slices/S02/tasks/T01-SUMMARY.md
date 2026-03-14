---
id: T01
parent: S02
milestone: M004
provides:
  - Shared JVM suite/run metadata carrier in `yanote-core`
  - Spring MVC request-lifecycle bridging into downstream Kafka propagation
  - Kafka contract coverage for precedence, cleanup, no-bleed, and dropped-write fail-safe behavior
key_files:
  - yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadataContextHolder.java
  - yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java
  - yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java
key_decisions:
  - Suite/run attribution now lives in a core-scoped ThreadLocal bridge while `yanote.message` no longer auto-propagates from ambient context
patterns_established:
  - Seed shared test metadata at MVC/Kafka ingress and clear it in `finally`/listener cleanup hooks so later invocations cannot inherit stale attribution
observability_surfaces:
  - `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
  - `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java`
  - `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java`
duration: 38m
verification_result: passed
completed_at: 2026-03-14T10:33:00+03:00
blocker_discovered: false
---

# T01: Extract the shared metadata carrier and pin Kafka propagation rules

**Shared suite/run attribution now flows through one core ThreadLocal across MVC ingress and Kafka listener scopes, with contract tests pinning narrow Kafka propagation and cleanup semantics.**

## What Happened

I added `TestMetadata` and `TestMetadataContextHolder` under `yanote-core` and switched the runtime bridge to use that shared carrier for suite/run attribution.

On the MVC side, `HttpEventRecordingFilter` now reads `X-Test-Run-Id` / `X-Test-Suite`, seeds the shared carrier before the request runs, records the HTTP event exactly as before, and clears the carrier in a `finally` block so both normal and exceptional request paths drop ambient state.

On the Kafka side, `YanoteKafkaHeaders.applyContextIfAbsent(...)` now auto-populates only `yanote.test.run_id` and `yanote.test.suite` from the shared carrier. `yanote.message` remains explicit-only and is never inherited from ambient context. `YanoteKafkaContextHolder` was kept as a compatibility facade, but it now delegates suite/run to the shared core holder and clears any message hint when listener headers are imported so inbound `yanote.message` cannot leak into republished sends.

I added `HttpMetadataContextBridgeTest` to prove request-scope seed/clear behavior and `KafkaMetadataPropagationContractTest` to prove explicit outbound header precedence, suite/run-only auto-propagation, listener cleanup, no bleed between listener invocations, and fail-safe cleanup when Kafka recorder writes are dropped. I also updated `KafkaRecorderAutoConfigurationTest` to pin the new explicit-only `yanote.message` rule.

## Verification

- Passed `./gradlew :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`.
- Passed `git diff --check`.
- Ran `./gradlew :examples:springmvc-service:test` as a slice-level check; it failed at `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java:106` because the example still expects ambient `USER_CREATED_MESSAGE` propagation. That migration is the planned T02 surface.
- Ran `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` as a slice-level check; it failed with `No such file or directory` because the verifier script is also a planned T02 deliverable.

## Diagnostics

- Run `./gradlew :yanote-recorder-spring-mvc:test --tests dev.yanote.recorder.springmvc.HttpMetadataContextBridgeTest` to inspect request-lifecycle bridge assertions directly.
- Run `./gradlew :yanote-recorder-spring-kafka:test --tests dev.yanote.recorder.springkafka.KafkaMetadataPropagationContractTest` to inspect Kafka precedence, cleanup, and no-bleed assertions directly.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderFailurePathTest.java` still exercises the warning-log fail-safe path for dropped Kafka writes.

## Deviations

None.

## Known Issues

- `examples/springmvc-service` still uses the old manual context/message flow and its integration test still asserts ambient `yanote.message` propagation; T02 needs to replace that with framework-driven attribution and republish assertions.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` does not exist yet; creating it is part of T02.

## Files Created/Modified

- `yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadata.java` — new normalized suite/run carrier record shared across recorder modules.
- `yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadataContextHolder.java` — new core-scoped ThreadLocal holder for shared suite/run attribution.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — seeds and clears shared test metadata around the request lifecycle.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/HttpMetadataContextBridgeTest.java` — proves MVC bridge visibility and cleanup on success and recorder-write failure.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — narrows automatic Kafka propagation to suite/run only.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaContextHolder.java` — delegates suite/run to the shared core holder and prevents inbound message bleed.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — pins the explicit-only `yanote.message` rule.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — proves precedence, cleanup, no bleed, and dropped-write fail-safe behavior.
