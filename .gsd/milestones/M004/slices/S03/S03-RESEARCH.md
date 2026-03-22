# S03: Live Multi-Service Kafka Proof Stack — Research

**Date:** 2026-03-14

## Requirement Focus

- **Primary owner:** R045 — Real Kafka integration proof for single-service and two-service scenarios
- **Primary owner:** R046 — Async verification stack at OpenAPI-quality depth
- **Supporting:** R042 — Spring Kafka producer evidence capture
- **Supporting:** R043 — Spring Kafka consumer evidence capture
- **Supporting:** R044 — Kafka test metadata propagation via headers
- **Supporting:** R048 — CI-ready end-to-end async proof and release-grade trust surface
- **Explicitly not closing here:** R047 onboarding/support remains M005/S01; final public/release-grade async trust surface for R048 remains M005/S02

## Summary

S03 is no longer a recorder-design slice. S01 and S02 already landed the hard runtime contract: `KafkaEvent` exists in `yanote-core`, `yanote-recorder-spring-kafka` records truthful producer ack/failure and listener success/failure, the shared test-metadata carrier is in `yanote-core`, the example service proves HTTP → Kafka → Kafka republish on a real broker, and `scripts/ci/verify-m004-s02-metadata-propagation.sh` already passes end to end against `yanote async-report`. The remaining gap is not event shape or metadata vocabulary. It is the **proof topology**: there is still no two-service runtime surface, no deterministic per-service merge helper, and no CI wiring that treats the live Kafka proof stack as part of the normal required automation.

The biggest surprises are all about drift and orchestration. First, the old S01 verifier is now stale: `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` fails because it still expects the pre-republish 3-event mixed file, while the current example truthfully emits 5 mixed events. Second, the repo has decision-level agreement that two services must write separate JSONL and merge deterministically, but there is still no implementation of that merge contract anywhere in code or scripts. Third, the current example app is not yet role-separated: `example.kafka.enabled=true` enables both publishers and both listeners together, which is fine for same-service republish proof but not enough for a deterministic “service A produces, service B consumes” proof.

The strongest S03 path is therefore to treat the **passing S02 republish verifier as the authoritative single-service live proof**, then add one **two-service proof built from two differently configured instances of the existing example app**, each writing its own JSONL, followed by a **simple deterministic merge step that preserves per-file order and concatenates files in explicit path order**. Because the async analyzer already ignores non-Kafka lines and normalizes report ordering, the merge helper does not need to invent global chronology; it only needs to produce one stable analyzer input file from separately truthful service outputs.

## Recommendation

1. **Adopt the S02 republish proof as the current single-service acceptance owner and stop treating the old S01 verifier as authoritative.**
   - `scripts/ci/verify-m004-s02-metadata-propagation.sh` is the truthful single-service proof today: it covers one service that publishes, consumes, republishes, preserves metadata, and feeds `yanote async-report`.
   - `scripts/ci/verify-m004-s01-kafka-recorder.sh` should either be refreshed to the current 5-event reality or demoted from any final S03 composition. Composing it unchanged will create false red failures.
   - For S03 milestone acceptance, the single-service leg should be “current truthful republish proof,” not “historical pre-republish shape.”

2. **Prefer one example app run in two role-scoped configurations over creating a second demo module.**
   - Reuse `examples/springmvc-service` and start **two logically separate service instances** with different `yanote.recorder.service-name`, `YANOTE_EVENTS_PATH`, ports, and Kafka role flags.
   - Add explicit role gating so the same app can run as:
     - **producer service**: HTTP ingress + `users.created` publisher enabled, listeners disabled
     - **consumer service**: `users.created` listener enabled, producer-only HTTP path either unused or disabled
   - The current `example.kafka.enabled` switch is too coarse. S03 needs narrower toggles for publisher/listener roles, otherwise two instances can self-consume or race on the same topic.
   - This keeps one code path, one demo app, and one docs story while still producing truthful per-service evidence.

3. **Implement deterministic merge as explicit path-ordered concatenation, not timestamp sorting.**
   - `EventJsonlWriter` is append-only and not a cross-process coordination surface, so per-service files are mandatory.
   - Do **not** sort merged events only by `ts`. The current single-service file already shows same-millisecond Kafka events, so timestamp-only ordering is not stable enough for cross-service merge.
   - The simplest honest rule is:
     1. collect named per-service files (`01-producer.events.jsonl`, `02-consumer.events.jsonl`)
     2. concatenate them in lexicographic file order
     3. preserve original line order inside each file
   - This is deterministic, requires no reserialization, and is sufficient because the async analyzer does not depend on input ordering for coverage correctness.

4. **Use a two-context Spring Boot integration test as the primary two-service truth surface, then wrap it in a shell verifier.**
   - Start one real `KafkaContainer`.
   - Launch two differently configured `ExampleServiceApplication` contexts against it, each with its own `yanote.recorder.events-path` and `yanote.recorder.service-name`.
   - Drive the producer instance via HTTP, let the consumer instance observe Kafka, then assert:
     - producer file contains the expected `send` fact(s)
     - consumer file contains the expected `receive` fact(s)
     - metadata survives on both sides
     - no service writes into the other service’s file
   - After that, a shell verifier should merge those files deterministically and run `yanote async-report` against a dedicated two-service AsyncAPI fixture.
   - This gives S03 a stable CI-grade operational proof without immediately paying the flakiness cost of OS-level multi-process orchestration.

5. **Wire the live Kafka proof stack into existing CI job names instead of inventing a new required-check topology.**
   - `.github/workflows/yanote-ci.yml` currently does not call any M004 verifier scripts.
   - Existing required check names are already locked at `build-and-test` and `yanote-validation`.
   - S03 should extend one of those existing jobs to run the live Kafka proof stack, or a composed S03 script, instead of adding a new required job name.
   - This closes more of R046 now while keeping the release/public hardening boundary for M005 intact.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Single-service live Kafka proof | `scripts/ci/verify-m004-s02-metadata-propagation.sh` | It already proves the current truthful single-service HTTP → Kafka → Kafka path and analyzer handoff; S03 should compose or extend it instead of reviving stale pre-S02 expectations. |
| Real broker runtime for proofs | Testcontainers `KafkaContainer` already used in module and example integration tests | The repo already proved this path on the supported Spring Boot / Kafka stack, and Context7 docs still favor it for CI-friendly real broker tests. |
| Truthful producer/consumer hooks | `YanoteKafkaProducerListener` + `YanoteKafkaRecordInterceptor` | The recorder contract is already settled; S03 should reuse the same truthful seams rather than inventing any new send/receive recording path. |
| Per-service evidence format | Raw JSONL from `EventJsonlWriter` + `readAsyncEventsJsonl.ts` | The async reader already ignores non-Kafka lines and accepts the current shape, so merge can stay as raw line concatenation rather than translating events. |
| Deterministic report ordering | `yanote-js/src/report/asyncNormalize.ts` | Channels, operations, messages, diagnostics, and suites are already sorted at report time, so merge only needs stable collection order, not semantic reordering logic. |
| CI job topology | Existing `build-and-test` / `yanote-validation` jobs in `.github/workflows/yanote-ci.yml` | Required check names are already frozen; extending current jobs avoids governance drift while adding async proof depth. |
| Two-service proof base app | `examples/springmvc-service` with property overrides | Reusing one example app as two differently configured instances avoids a second demo tree and keeps docs/build surfaces smaller. |

## Existing Code and Patterns

- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — writes one JSONL line per call in append mode and creates directories, but offers no cross-process locking; this is why S03 must keep per-service files separate.
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — the normalized JVM Kafka evidence shape is already frozen around metadata-only fields, optional `message`, service attribution, and `test.*` values.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java` — settled producer truth seam: record only when send succeeds or fails with the original `ProducerRecord` still available.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java` — settled consumer truth seam: seed listener context from headers, record on listener success/failure, and clear context after handling.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current demo app already proves HTTP + Kafka + republish in one service, but its bean gating is too coarse for deterministic two-service roles.
- `examples/springmvc-service/src/main/resources/application.properties` — shows which knobs already exist (`yanote.recorder.service-name`, topic names, listener auto-startup), and also shows the current missing piece: there are no separate role flags for producer-only vs consumer-only service instances.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — current real-broker example proof already writes the 5-event mixed file and validates raw JSONL fields before any report generation.
- `scripts/ci/verify-m004-s01-kafka-recorder.sh` — historical single-service verifier now drifted from the example’s real behavior; it still expects exactly 3 mixed events and therefore fails on today’s truthful example output.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — current best pattern for S03 shell verification: run the example proof, assert raw JSONL contract, then feed live evidence into `yanote async-report`.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — async reader accepts mixed files by skipping non-Kafka lines, which makes raw-file merge via concatenation viable.
- `yanote-js/src/coverage/asyncCoverage.ts` — coverage and diagnostics are set-based and keyed by canonical operation identity, not by event order.
- `yanote-js/src/report/asyncNormalize.ts` — report output sorts channels, operations, messages, diagnostics, and suites, reducing the need for any complicated merge-time ordering logic.
- `.github/workflows/yanote-ci.yml` — current required workflow does not invoke the M004 verifier scripts yet, so live Kafka proof depth is present in repo scripts but not in required CI execution.
- `examples/docker-compose.yml` — useful only as a general artifact-collection/orchestration pattern; it is HTTP/OpenAPI-oriented and not yet a Kafka/two-service proof harness.

## Constraints

- The example app is still **role-coupled**: `example.kafka.enabled=true` turns on both publishers and both listeners, which is not enough for a deterministic producer-service / consumer-service split.
- `EventJsonlWriter` is safe for one process writing one file, but not for two independent services sharing a file path.
- `yanote async-report` currently accepts a single `--events` file path, so S03 must define an explicit pre-analysis merge step for multi-service evidence.
- The JS analyzer normalizes missing `test.run_id` / `test.suite` to `unknown`, so S03 proof cannot rely on report output alone to validate metadata survival.
- Existing required GitHub check names are already locked; S03 should extend current jobs, not create a new required check topology.
- Testcontainers JUnit 5 guidance still assumes sequential execution; parallelizing multi-service Kafka tests would add avoidable flake.
- The current single-service example already produces same-millisecond Kafka timestamps, so timestamp-only merge ordering is not deterministic enough.
- `yanote-recorder-spring-kafka` is implemented as a publishable module but is still outside the root release allowlist; S03 should finish proof/CI, not reopen M005 release-surface work.

## Common Pitfalls

- **Composing the stale S01 verifier unchanged** — it now fails on truthful example output because it still expects the pre-republish 3-event surface.
- **Sorting merged multi-service evidence only by `ts`** — same-millisecond events already exist, so this produces unstable byte ordering.
- **Launching two identical listener-enabled service instances and expecting deterministic ownership of consumed records** — without role gates or distinct listener enablement, the two-service proof can self-consume or race.
- **Pointing two services at the same `YANOTE_EVENTS_PATH`** — this violates the milestone decision to keep per-service evidence separate and reintroduces cross-process write ambiguity.
- **Verifying only the merged file or only the async report** — S03 needs raw per-service assertions first, otherwise lost service attribution or metadata gaps can hide downstream.
- **Expanding Docker Compose into a second proof harness in parallel with Testcontainers** — this creates two runtime stories and doubles flake/debug surface without solving the missing merge contract.
- **Changing GitHub required-check names to surface async proof** — the safer move is to extend `build-and-test` or `yanote-validation`, not to create a new governance contract.
- **Keeping republish behavior enabled in the two-service scenario by accident** — that can widen the proof into a different contract than the intended “A sends, B receives” topology and complicate fixture/report expectations.

## Open Risks

- The repo still needs one clean decision on **two-service topology shape**: same app with role flags vs separate example module. The wrong choice could create lasting docs/build sprawl.
- A two-context in-JVM proof is likely the most deterministic, but it is slightly less operationally “real” than separate OS processes. S03 needs to decide how much realism is enough for milestone proof without introducing avoidable flake.
- The merge contract still needs a stable naming rule for per-service files; if file order is left implicit, future agents can produce analyzer inputs that differ byte-for-byte while remaining semantically similar.
- If two-service proof reuses the current republish-capable listener without narrowing it, the acceptance surface may drift from “producer-to-consumer” into a more complex topology than R045 actually requires.
- Wiring the live proof into required CI will increase runtime cost. If the final S03 script rebuilds `yanote-js` multiple times or reruns overlapping single-service proofs naively, CI latency may become noticeable.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Spring Kafka | `claude-dev-suite/claude-dev-suite@spring-kafka` | installed |
| Testcontainers | `claude-dev-suite/claude-dev-suite@testcontainers` | installed |
| Kafka integration | `404kidwiz/claude-supercode-skills@kafka-engineer` | installed |
| Spring Boot event-driven patterns | `giuseppe-trisciuoglio/developer-kit@spring-boot-event-driven-patterns` | available, not installed |

## Sources

- The Kafka event contract, writer behavior, and shared test-metadata carrier are already implemented; S03 does not need a new recorder design (source: `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `EventJsonlWriter.java`, `yanote-core/src/main/java/dev/yanote/core/testmetadata/TestMetadataContextHolder.java`).
- Truthful producer and consumer recording seams are already fixed in the Spring Kafka module (source: `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java`, `YanoteKafkaRecordInterceptor.java`, `YanoteKafkaInstrumentationBeanPostProcessor.java`).
- The current example service already proves HTTP → Kafka → Kafka on one service, but its bean gating is too coarse for two-service role separation (source: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `src/main/resources/application.properties`).
- The current example integration test is already the live raw-evidence owner for the 5-event single-service republish path (source: `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`).
- `bash scripts/ci/verify-m004-s01-kafka-recorder.sh` fails today with `Expected exactly 3 mixed events, got 5`, proving the old S01 verifier is stale against the current example truth surface (source: live command run on 2026-03-14).
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` passes today end to end, proving the single-service republish path and analyzer handoff are already operational (source: live command run on 2026-03-14).
- The retained failing S01 events file shows same-millisecond Kafka timestamps and the current mixed-file truth surface, which is why timestamp-only merge is unsafe and why S03 should not use the stale 3-event expectation (source: `/var/folders/6n/q9s0qd4d5b92jqqf9kk_0kdm0000gn/T/yanote-m004-s01-kafka.KzqZtP/events.jsonl` from the live failed verifier run).
- The async reader ignores non-Kafka lines, and async coverage/report output is already normalized and sorted, so deterministic merge can stay simple (source: `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/report/asyncNormalize.ts`).
- Current workflow wiring does not yet invoke the M004 verifier scripts, even though required job names are already stable (source: `.github/workflows/yanote-ci.yml`, `scripts/ci/yanote-ci-workflow.contract.test.mjs`).
- Spring Kafka docs still support chaining `RecordInterceptor`s and configuring `ProducerListener` / `KafkaTemplate` producer interceptors in the exact way this repo already uses them (source: Context7 `/spring-projects/spring-kafka`, query: `RecordInterceptor success failure hooks listener container factory ProducerListener KafkaTemplate setProducerListener setProducerInterceptor Boot 3.x`).
- Testcontainers docs still recommend static/shared JUnit 5 containers and note that the Jupiter extension is only tested with sequential execution, reinforcing a deterministic non-parallel proof design (source: Context7 `/testcontainers/testcontainers-java`, query: `KafkaContainer JUnit 5 lifecycle multiple containers integration tests deterministic bootstrap servers reuse`).
