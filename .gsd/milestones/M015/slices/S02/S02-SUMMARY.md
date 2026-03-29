---
id: S02
parent: M015
milestone: M015
provides:
  - A supported live RabbitMQ proof path from Spring AMQP runtime evidence to canonical `yanote-async-report.json` / `.html` artifacts.
  - A reusable `yanote-recorder-spring-amqp` recorder seam and shared example-service RabbitMQ role wiring that downstream CI/docs work can reuse.
  - A deterministic `.yanote-ci/live-rabbitmq-proof/` export contract with explicit `none` markers for Kafka-only companions that S03/S04 can aggregate and publish honestly.
requires:
  - slice: S01
    provides: Protocol-aware AMQP operation identities, `kind: "amqp"` event contracts, and explicit Kafka-only zero/none async-report sections that this live RabbitMQ proof path consumes unchanged.
affects:
  - S03
  - S04
key_files:
  - yanote-recorder-spring-amqp/build.gradle.kts
  - yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpRecorderAutoConfiguration.java
  - yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpEventRecorder.java
  - yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java
  - yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java
  - yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java
  - yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml
  - scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
key_decisions:
  - Build the reusable runtime seam on Spring AMQP abstractions (`yanote-recorder-spring-amqp`) while keeping the first end-to-end proof and retained bundle explicitly RabbitMQ-named.
  - Instrument `RabbitTemplate` and listener-container seams additively so recorder hooks compose with existing user customization instead of replacing it.
  - Export AMQP happy-path proof bundles with explicit `none` markers for Kafka-only companion artifacts instead of failing closed or fabricating parity outputs.
patterns_established:
  - Separate producer and consumer AMQP evidence files first, then merge deterministically for analyzer input.
  - Treat protocol-specific optional proof artifacts as explicit manifest/source-path absences rather than silent omissions.
  - Keep AMQP declared semantics and AMQP runtime semantics as distinct report surfaces; green AMQP coverage does not imply Kafka runtime-semantic parity.
  - Use one rerunnable shell verifier to connect live broker tests, deterministic merge, analyzer execution, and retained bundle export.
observability_surfaces:
  - `.yanote-ci/live-rabbitmq-proof/async-report.stdout` publishes human summary lines and `YANOTE_ASYNC_SUMMARY ... protocols=amqp ... covered_operations=2/2 ... binding_total=0`.
  - `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` and `.html` publish the canonical AMQP async-report artifact with explicit zero/none Kafka-only sections.
  - `.yanote-ci/live-rabbitmq-proof/01-producer.events.jsonl` and `02-consumer.events.jsonl` preserve separate service attribution before merge.
  - `.yanote-ci/live-rabbitmq-proof/artifact-manifest.txt` and `artifact-source-paths.txt` localize proof-bundle drift and spell optional Kafka-only artifacts as `none`.
  - `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` retains `two-service-test.log`, `merge.log`, `async-report.stdout`, and `async-report.stderr` on failure for focused diagnosis.
drill_down_paths:
  - .gsd/milestones/M015/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M015/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M015/slices/S02/tasks/T03-SUMMARY.md
  - .gsd/milestones/M015/slices/S02/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T18:43:18.379Z
blocker_discovered: false
---

# S02: Live RabbitMQ recorder and proof path

**Delivered Yanote’s first live RabbitMQ/AMQP proof path end to end: Spring AMQP recorder capture, separate producer/consumer runtime evidence, deterministic merge/export plumbing, and retained async-report artifacts that truthfully show AMQP coverage without implying Kafka-only parity.**

## What Happened

## What this slice delivered

S02 turned the protocol-aware AMQP analyzer contract from S01 into a real RabbitMQ runtime path that Yanote can rerun and inspect end to end.

- Added a new `yanote-recorder-spring-amqp` module that records Spring AMQP `RabbitTemplate` sends and listener receives as first-class `kind: "amqp"` JSONL, with safe payload/header capture, suite/run attribution, and opt-in auto-configuration.
- Kept the recorder seams additive instead of invasive: `RabbitTemplate` before-publish processing and listener-container instrumentation compose with existing Spring customization rather than replacing user hooks.
- Hardened failure behavior for the AMQP recorder path. Targeted module tests now prove broker-down send handling, listener-error receive recording, metadata propagation, safe omission/redaction behavior, and no cross-request metadata bleed.
- Extended the shared Spring example service with RabbitMQ producer and consumer roles so one real `POST /users` flow now yields separate producer and consumer evidence files instead of a module-local only AMQP demo.
- Added `RabbitMqRecorderTwoServiceIntegrationTest` plus the aligned AsyncAPI fixture `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml`, proving the exact live path S03/S04 need: HTTP-triggered publish on the producer side, AMQP receive on the consumer side, stable suite/run headers, and canonical `amqp send users.created` / `amqp receive users.created` analyzer coverage.
- Added `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` so one command reruns the live proof, merges producer/consumer JSONL deterministically, invokes `node yanote-js/dist/yanote.cjs async-report`, and exports a retained `.yanote-ci/live-rabbitmq-proof/` bundle.
- Hardened `scripts/ci/export-async-proof-artifacts.sh` so AMQP happy-path bundles succeed without Kafka-only companions while still recording every intentionally absent file as `none` in `artifact-manifest.txt` and `artifact-source-paths.txt`.

The retained proof bundle now shows the exact delivered boundary:

- `01-producer.events.jsonl` contains one AMQP send plus the triggering HTTP `POST /users` record from `rabbitmq-proof-producer-service`.
- `02-consumer.events.jsonl` contains only the AMQP receive record from `rabbitmq-proof-consumer-service`.
- `merge.log` records deterministic ordered merge inputs and `merged-two-service.events.jsonl` preserves both services’ evidence for analyzer consumption.
- `async-report.stdout` prints `status: ok`, `protocols: amqp`, `channels: 1/1`, `operations: 2/2`, `messages: 2/2`, `declared_operations=2`, and a final `YANOTE_ASYNC_SUMMARY` line with `protocols=amqp`.
- `yanote-async-report.json` / `.html` publish `protocols: ["amqp"]`, covered `amqp send users.created` and `amqp receive users.created` operations, declared `correlationId` and `reply.address` semantics for both operations, zero Kafka binding rows, and explicit zero/none runtime-semantics coverage instead of pretending Kafka parity.
- `artifact-manifest.txt` and `artifact-source-paths.txt` explicitly record Kafka-only companions (`single-service-proof.log`, `runtime-selected-*`, `schema-failure-*`) as intentional absences rather than missing or fabricated outputs.

## Patterns established for downstream slices

1. **New async runtimes should land as recorder + proof-bundle pairs, not analyzer-only support.** S01 made AMQP analyzable; S02 made it operational by adding a live recorder seam, a real broker-backed example flow, and a retained artifact bundle.
2. **Separate service truth first, merge second.** Producer and consumer evidence stay in distinct JSONL files for attribution, then the proof script merges them deterministically for analyzer input. That preserves drill-down while still giving one canonical report artifact.
3. **Protocol-specific bundles must spell unsupported companions explicitly.** AMQP success paths should record Kafka-only extras as `none`, not silently drop them and not invent parity artifacts.
4. **Declared AMQP semantics can be proven before AMQP runtime semantics exist.** The live RabbitMQ bundle is fully green on routing/message coverage and declared `correlationId` / `reply.address` surfaces while `runtimeSemantics` remains `0/0` by design; downstream work must preserve that distinction.

## Operational Readiness (Q8)

- **Health signal:** `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` exits 0, exports `.yanote-ci/live-rabbitmq-proof/`, and `async-report.stdout` shows `status: ok`, `protocols: amqp`, `channels: 1/1`, `operations: 2/2`, `messages: 2/2`, and `YANOTE_ASYNC_SUMMARY ... protocols=amqp ... report=.../yanote-async-report.json`.
- **Failure signal:** the slice now fails loudly on missing AMQP recorder hooks, broker-down send/receive drift, missing report HTML siblings, or malformed bundle contents. The verifier keeps high-signal logs (`two-service-test.log`, `merge.log`, `async-report.stdout`, `async-report.stderr`) and the exporter fails closed if required happy-path artifacts are absent.
- **Recovery procedure:** rerun `npm -C yanote-js run build && bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`; if it fails, inspect `.yanote-ci/live-rabbitmq-proof/` and retained temp-path notes, then narrow with `./gradlew :yanote-recorder-spring-amqp:test --tests ...` for recorder seams or `./gradlew :examples:springmvc-service:test --tests ...RabbitMqRecorderTwoServiceIntegrationTest` for the live producer/consumer path.
- **Monitoring gaps:** AMQP runtime-semantic evaluation is still intentionally absent (`runtimeSemantics` stays `0/0`), the first live broker proof is RabbitMQ via Spring AMQP only, and combined HTTP plus async aggregation plus public CI/docs closure remain for S03/S04.


## Verification

### Slice-plan verification

- `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderAutoConfigurationTest --tests dev.yanote.recorder.springamqp.AmqpMetadataPropagationContractTest` ✅ passed
  - Proved the new AMQP recorder module stays opt-in, attaches send/listener hooks when enabled, and preserves explicit outbound metadata over ambient context.
- `./gradlew :yanote-recorder-spring-amqp:test --tests dev.yanote.recorder.springamqp.AmqpRecorderFailurePathTest --tests dev.yanote.recorder.springamqp.AmqpRecorderSingleServiceIntegrationTest` ✅ passed
  - Proved broker-down/listener-error paths, safe header handling, omission behavior, and single-service AMQP send/receive/error evidence.
- `./gradlew :examples:springmvc-service:test --tests dev.yanote.examples.service.RabbitMqRecorderTwoServiceIntegrationTest --tests dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest` ✅ passed
  - Proved the new RabbitMQ HTTP→AMQP handoff end to end without regressing the shared Kafka two-service proof.
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs && npm -C yanote-js run build && bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` ✅ passed
  - Export tests proved deterministic AMQP bundle behavior and fail-closed missing-HTML handling.
  - The live verifier exported `.yanote-ci/live-rabbitmq-proof/` with `protocols=amqp`, `channels=1/1`, `operations=2/2`, `messages=2/2`, zero Kafka binding rows, declared `correlationId` / `reply.address` on both AMQP operations, and explicit `none` markers for Kafka-only companion artifacts.

### Retained proof spot checks

- `.yanote-ci/live-rabbitmq-proof/01-producer.events.jsonl` contains one AMQP send and one HTTP `POST /users` event from `rabbitmq-proof-producer-service`.
- `.yanote-ci/live-rabbitmq-proof/02-consumer.events.jsonl` contains only the AMQP receive event from `rabbitmq-proof-consumer-service`.
- `.yanote-ci/live-rabbitmq-proof/async-report.stdout` ends with `YANOTE_ASYNC_SUMMARY ... protocols=amqp ... covered_operations=2/2 ... binding_total=0`.
- `.yanote-ci/live-rabbitmq-proof/artifact-source-paths.txt` records Kafka-only companions as `none`, proving the widened exporter treats them as intentional absences instead of missing required outputs.


## Requirements Advanced

- R021 — S02 turned the AMQP analyzer/report contract into a real RabbitMQ runtime path by capturing live Spring AMQP send/receive evidence, merging separate producer/consumer truth, and proving the retained AMQP async-report bundle end to end.
- R002 — S02 hardened failure visibility on the widened async path through broker-down and listener-error AMQP recorder tests plus fail-closed bundle export that records Kafka-only companions as explicit absences instead of silently dropping or inventing them.
- R003 — S02 added a rerunnable proof command and deterministic retained bundle (`.yanote-ci/live-rabbitmq-proof/`) so the widened async path is inspectable through real CLI/report artifacts rather than only module-local tests.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

- AMQP support in this slice proves the first live RabbitMQ path only; it is not a broad broker-agnostic runtime promise yet.
- `runtimeSemantics` remains intentionally empty on AMQP (`0/0` and `N/A`) because the header-backed runtime semantic evaluator is still Kafka-only.
- The retained RabbitMQ bundle exports explicit `none` markers for Kafka-only companion artifacts rather than parallel AMQP versions of `runtime-selected-*` or `schema-failure-*` outputs.
- Combined HTTP plus async aggregation and public CI/docs/support closure are still downstream work in S03/S04.

## Follow-ups

- S03 should aggregate the canonical HTTP and async child reports while preserving the new explicit AMQP-vs-Kafka attribution and `none` companion semantics.
- S04 should carry the live RabbitMQ proof bundle, manifest/source-path notes, and explicit AMQP boundary into CI summaries, docs, and support wording without implying broader RabbitMQ or broker-agnostic parity.
- Future async-depth work can add AMQP runtime-semantic evaluation, but it should remain additive and must not erase the current declared-vs-runtime distinction on AMQP bundles.

## Files Created/Modified

- `yanote-recorder-spring-amqp/build.gradle.kts` — Declared the new Spring AMQP recorder module and its test/runtime dependencies.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpRecorderAutoConfiguration.java` — Registered the opt-in AMQP recorder beans and auto-configuration surface.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpEventRecorder.java` — Implemented safe AMQP send/receive event capture, metadata propagation, and failure-path recording.
- `yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpInstrumentationBeanPostProcessor.java` — Attached additive RabbitTemplate and listener-container instrumentation without clobbering user customization.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderAutoConfigurationTest.java` — Proved default-disabled behavior and enablement wiring for the recorder module.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderFailurePathTest.java` — Covered broker-down send capture, listener-error behavior, and redaction/omission safety.
- `yanote-recorder-spring-amqp/src/test/java/dev/yanote/recorder/springamqp/AmqpRecorderSingleServiceIntegrationTest.java` — Proved live AMQP send/receive/error rows against RabbitMQContainer at the module level.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — Added RabbitMQ producer/consumer role wiring to the shared Spring example service.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java` — Added the two-service HTTP→RabbitMQ proof that emits separate producer and consumer evidence.
- `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml` — Defined the canonical AMQP AsyncAPI fixture aligned to `amqp send users.created` and `amqp receive users.created`.
- `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` — Added the one-command live RabbitMQ proof flow, deterministic merge, async-report invocation, and retained artifact export.
- `scripts/ci/export-async-proof-artifacts.sh` — Allowed AMQP success bundles to omit Kafka-only companions while recording explicit `none` markers in manifests/source paths.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — Added regression coverage for AMQP happy-path export and fail-closed missing-HTML behavior.
