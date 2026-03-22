# S02: Metadata Propagation And Republish Attribution — Research

**Date:** 2026-03-14

## Requirement Focus

- **Primary owner:** R044 — Kafka test metadata propagation via headers
- **Supporting:** R042 — Spring Kafka producer evidence capture
- **Supporting:** R043 — Spring Kafka consumer evidence capture
- **Supporting:** R046 — Async verification stack at OpenAPI-quality depth
- **Explicitly not closing here:** R045 two-service live proof remains S03; R048 final CI/release-grade async trust surface remains M005/S02

## Summary

S02 is much narrower than a fresh Kafka-recorder design slice. S01 already landed most of the hard runtime seams: explicit Yanote Kafka headers, a ThreadLocal metadata context, producer-side truthful `send` recording on ack/failure, consumer-side truthful `receive` recording on listener success/failure, and a mixed JSONL handoff that the existing `yanote async-report` command already accepts. The main missing capability is attribution propagation, not event normalization. Today the Spring MVC recorder reads `X-Test-Run-Id` / `X-Test-Suite` only to write `HttpEvent`; it does not expose that metadata to downstream Kafka sends. The current example works only because controller code manually passes those headers into a publisher that manually sets `YanoteKafkaContextHolder` around `KafkaTemplate.send(...)`.

The biggest surprise is how easy it is for attribution to look healthy while actually being broken. On the analyzer side, missing async `test.run_id` / `test.suite` values normalize to `"unknown"`, so coverage can still appear valid even when metadata propagation silently failed. That means S02 cannot treat `yanote async-report` output as sufficient proof. It needs raw JSONL contract assertions that the Kafka `send` and `receive` facts still carry the expected suite/run values after HTTP-triggered publish and listener-triggered republish.

The cleanest path is to promote the current Kafka-only ThreadLocal into a tiny shared JVM test-metadata context used by both Spring MVC ingress and Kafka listener scopes, keep Kafka propagation on the existing narrow explicit header contract, and extend the single-service example into a real republish flow. The slice should stay deliberately in-thread and same-service: prove HTTP → Kafka and Kafka → Kafka metadata survival honestly, pin overwrite rules, and leave cross-thread propagation, retries, and two-service collection to later slices.

## Recommendation

1. **Introduce one shared JVM test-metadata context and use it as the only automatic bridge.**
   - Extract or generalize the current `YanoteKafkaContextHolder` into a shared carrier reachable from both Spring MVC and Spring Kafka integration code.
   - Scope it to the current thread and document that boundary explicitly.
   - Set/clear it in the MVC request lifecycle and in Kafka listener interception, so producer instrumentation can stay generic.

2. **Keep Kafka propagation narrow and explicit.**
   - Continue using the existing Yanote Kafka header names rather than broad Spring header mapping.
   - Preserve current precedence as `explicit outbound header > current context > absent`.
   - Treat automatic propagation as applying to suite/run attribution; `yanote.message` should remain explicit and must not become a hidden heuristic channel.

3. **Replace the example app’s manual HTTP → Kafka bridge with framework-driven propagation.**
   - The current `examples/springmvc-service` controller/publisher plumbing is useful as proof-of-gap, but it should not remain the product posture.
   - Extend the example with a listener-triggered republish path so the same service proves `HTTP → Kafka → Kafka` attribution survival using the real runtime hooks.
   - Prefer one example app with two topics and deterministic per-step assertions over a second demo tree.

4. **Add verifier surfaces that check attribution at the evidence boundary, not only at report level.**
   - Add contract tests for header extraction, header write rules, context cleanup, and precedence.
   - Add integration tests that assert raw JSONL `KafkaEvent` lines contain the expected `test.run_id` / `test.suite` values for both the first publish and the republished record.
   - Keep `yanote async-report` as downstream acceptance, but not the only proof, because the analyzer normalizes missing metadata to `unknown`.

5. **Do not widen S02 beyond same-thread propagation.**
   - Avoid `@Async`, Reactor, executor-hop, retry, DLT, or batch-listener semantics in this slice.
   - Those are real future concerns, but they would blur whether S02 actually solved the narrow metadata attribution problem.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Outbound Kafka attribution headers | `yanote-recorder-spring-kafka` `YanoteKafkaHeaders` | The exact header names and `apply-if-absent` behavior already exist; reusing them avoids header-contract drift and Spring header-mapper noise. |
| Producer/consumer truth recording | `YanoteKafkaProducerListener` + `YanoteKafkaRecordInterceptor` | S01 already picked truthful producer ack/failure and listener success/failure seams; S02 should extend attribution on top of them instead of inventing new hooks. |
| Shared metadata carrier seed | `YanoteKafkaContextHolder` | The current ThreadLocal already proves the minimal shape needed for run/suite/message hint propagation; generalize it instead of creating a second parallel context story. |
| HTTP ingress proof surface | `yanote-recorder-spring-mvc` filter/tests | The MVC recorder already owns the `X-Test-*` extraction contract; extend that lifecycle rather than pushing more responsibility into controller code. |
| Live single-service proof | `examples/springmvc-service` + existing Kafka Testcontainers tests | The repo already has the right app and real-broker harness for S02; adding attribution/republish coverage there is safer than creating a new sample stack. |
| Async analyzer acceptance | Existing `yanote async-report` mixed-JSONL path | The Node async reader already ignores non-Kafka lines and consumes the current Kafka JSONL shape, so S02 should keep one analyzer handoff boundary. |

## Existing Code and Patterns

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — reads `X-Test-Run-Id` / `X-Test-Suite` and records `HttpEvent`, but currently stops there; this is the natural request-lifecycle place to set/clear shared test metadata for downstream Kafka sends.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java` — already proves HTTP headers land in recorded events; extend this surface instead of creating an unrelated ingress proof.
- `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java` — the normalized JVM async evidence contract already carries `test.run_id` / `test.suite`; S02 only needs to ensure propagation reaches this boundary truthfully.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaContextHolder.java` — current ThreadLocal carrier for suite/run/message hint; best seed for the shared context story.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — explicit raw Kafka header contract for `yanote.test.run_id`, `yanote.test.suite`, and `yanote.message`, with apply-if-absent semantics already implemented.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerInterceptor.java` — outbound mutation seam only; it should stay focused on enrichment and not take on recording or broad header copying.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaProducerListener.java` — producer-side truthful `send` evidence already records on broker ack/failure.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaRecordInterceptor.java` — listener-side header→context bridge plus `receive` recording and cleanup; this is the key republish-enabling seam S02 should build on.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaEventRecorder.java` — final JSONL builder for Kafka facts; S02 verifiers should assert against its serialized `test.*` output directly.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — already proves instrumentation hookup and basic context→header enrichment, but not real HTTP ingress or republish attribution.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderSingleServiceIntegrationTest.java` — real-broker proof exists, but it seeds headers directly and therefore does not yet prove the slice’s actual propagation path.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current single-service HTTP+Kafka example manually bridges request headers into Kafka context and therefore shows exactly what S02 should replace or minimize.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — current live example proves one HTTP request yields HTTP + Kafka `send` + Kafka `receive`; it is the right place to add the republish scenario.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — async reader ignores non-Kafka lines and normalizes `test.*`; useful acceptance surface, but not enough on its own.
- `yanote-js/src/model/httpEvent.ts` and `yanote-js/src/coverage/asyncCoverage.ts` — show the subtle failure mode: missing suite/run degrades to `unknown` rather than hard-failing, so evidence-level assertions are mandatory for S02.

## Constraints

- Spring Boot `3.2.2` / Spring Kafka `3.x` remains the compatibility line; S02 should stay on the S01 seams already proven there.
- The slice must preserve the recorder fail-safe posture: evidence write failures warn and drop, but do not break HTTP requests or Kafka listeners.
- The async truth model remains metadata-only; S02 must not leak Kafka payload bodies or arbitrary headers into normalized evidence.
- Automatic propagation is only trustworthy within the current thread. S02 should prove request-thread publishing and listener-thread republishing, not executor hops or reactive pipelines.
- Mixed HTTP+Kafka JSONL remains acceptable for the single-service proof because the async reader already skips non-Kafka lines.
- The analyzer normalizes missing `test.run_id` / `test.suite` to `unknown`, so report-level success is weaker than raw evidence-level success for this slice.
- Multi-process shared JSONL remains out of bounds here; per-service collection and deterministic merge belong to S03.

## Common Pitfalls

- **Leaving HTTP → Kafka propagation in controller or service code** — that preserves the demo but fails the product goal; S02 should move propagation into recorder lifecycle hooks.
- **Using `YanoteKafkaHeaders.setHeaders(...)` directly in tests and calling propagation proven** — that bypasses the actual ingress and republish paths the slice owns.
- **Verifying only `yanote async-report` output** — the report can still look correct while suite/run attribution silently collapsed to `unknown`.
- **Broadening the contract through Spring header mapping** — this introduces unrelated Spring headers and weakens the explicit Yanote truth model.
- **Blindly reusing inbound `yanote.message` on republish** — if the outbound message contract differs, stale message hints can create misleading message coverage.
- **Forgetting cleanup on exceptional paths** — ThreadLocal metadata bleed between requests/listeners would create false attribution and flaky tests.
- **Overwriting explicit outgoing headers with ambient context** — S02 should pin the current `apply-if-absent` behavior so explicit publisher intent still wins.

## Open Risks

- Extracting a shared metadata context may force module-boundary choices between `yanote-core`, `yanote-recorder-spring-mvc`, and `yanote-recorder-spring-kafka`; the carrier must stay tiny to avoid new dependency knots.
- Listener retry/redelivery semantics could multiply `receive` and republish facts in ways that complicate attribution; S02 should stay on straight-through success/failure paths and defer retry semantics.
- The Kafka instrumentation bean post-processor still relies on reflective wiring into Spring Kafka internals; S02 propagation tests should help protect against silent framework drift on supported versions.
- If the republish example changes topic or message contract, stale `yanote.message` inheritance could remain a correctness risk unless the outbound publisher explicitly overrides or clears it.
- Because missing metadata is normalized rather than treated as invalid by the analyzer, future regressions can hide unless evidence-level verifier coverage stays strict.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Spring Boot / Spring Kafka event flows | `giuseppe-trisciuoglio/developer-kit@spring-boot-event-driven-patterns` | installed |
| Testcontainers | `claude-dev-suite/claude-dev-suite@testcontainers` | installed |
| Kafka integration | `404kidwiz/claude-supercode-skills@kafka-engineer` | available, not installed |

## Sources

- HTTP metadata currently stops at recorded `HttpEvent`; there is no generic request-lifecycle bridge into downstream Kafka propagation yet (source: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`, `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`).
- Kafka-side propagation and truthful recording primitives already exist: explicit header contract, ThreadLocal context, producer ack/failure listener, and consumer record interceptor success/failure hooks (source: `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`, `YanoteKafkaContextHolder.java`, `YanoteKafkaProducerListener.java`, `YanoteKafkaRecordInterceptor.java`).
- The current example service proves HTTP → Kafka only through manual controller/publisher plumbing, which is the main slice gap (source: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`).
- The live example proof currently stops at one HTTP event plus one Kafka `send` and one Kafka `receive`; it does not yet prove listener-triggered republish attribution (source: `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java`).
- Async analyzer acceptance already exists, but missing metadata normalizes to `unknown`, so S02 needs evidence-level assertions in addition to report-level checks (source: `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/model/httpEvent.ts`, `yanote-js/src/coverage/asyncCoverage.ts`).
- Slice boundaries remain: shared JVM metadata context, explicit Kafka header propagation, single-service republish proof, and verifier surfaces before two-service/runtime finalization (source: preloaded `M004-ROADMAP.md`, `M004-RESEARCH.md`, and `.gsd/DECISIONS.md`).
