# M004 — Research

**Date:** 2026-03-13

## Summary

M004 is not blocked on analyzer semantics; that work is already done in `yanote-js`. The repo already has a stable async contract on the Node side: metadata-only Kafka JSONL, canonical `kafka <action> <channel>` identities, separate channel/operation/message coverage, and fail-closed unmatched/mismatched diagnostics. What is missing is the JVM runtime half: a shared Java async event model, Spring Kafka recorder seams that emit that exact shape truthfully, metadata propagation across Kafka headers, and a real-broker proof path. The strongest first move is therefore **not** another report or CLI change — it is a recorder contract slice anchored in Spring Kafka interception points and the existing Spring MVC recorder patterns.

The cleanest Spring Kafka seam is split by responsibility. On the **consumer** side, use `RecordInterceptor` success/failure hooks on the listener container so receive evidence reflects the listener outcome instead of merely an attempted poll. On the **producer** side, do **not** rely on `ProducerInterceptor` alone for evidence recording: it is good for mutating outbound headers before send, but `onAcknowledgement()` does not give you the original `ProducerRecord`. For truthful producer evidence, record on `ProducerListener` (or equivalent send callback) because it sees both the `ProducerRecord` and the ack/failure result. That split keeps direction semantics honest and avoids fragile record-correlation hacks.

The main architectural recommendation is to introduce one small shared **test-metadata context** on the JVM side and use it to bridge ingress surfaces into producer sends. Today the HTTP filter reads `X-Test-Run-Id` / `X-Test-Suite` only to write `HttpEvent`; it does not expose that metadata to downstream Kafka sends. Likewise, a Kafka consumer can read run/suite headers, but without a shared context a republished record cannot automatically preserve them. M004 should therefore define explicit Kafka metadata headers, expose a scoped context set by the Spring MVC filter and Kafka consumer interceptor, and let producer instrumentation copy those values onto outgoing Kafka records when present. Prove that in one single-service app first, then prove the same contract across two services on a real broker. Leave async Gradle/CI productization to M005, where it already belongs.

## Recommendation

1. **Add a shared Java async event contract before building any Spring Kafka auto-configuration.**
   - `yanote-core` currently only models `HttpEvent` and `YanoteEvent permits HttpEvent`.
   - Add a `KafkaEvent`/equivalent record whose JSON field names match the Node async reader exactly: `kind`, `action`, `channel`, optional `message`, optional `service`/`instance`/`error`, and `test.run_id` / `test.suite`.
   - Update the sealed event boundary and JSONL writer/reader helpers so the recorder modules are not forced to hand-roll JSON.

2. **Split producer instrumentation into header enrichment and evidence recording.**
   - Use a producer seam that can **mutate headers before send**.
   - Use `ProducerListener` or a send callback to **record evidence on ack success/failure** because it has the original `ProducerRecord` plus the outcome.
   - Treat producer evidence as “send acknowledged / failed”, not merely “send attempted”.

3. **Use `RecordInterceptor` success/failure on the consumer side.**
   - `intercept()` alone is too early if Yanote wants truthful receive success/failure semantics.
   - `success()` / `failure()` let the recorder emit receive evidence after listener execution without forcing app code changes in every `@KafkaListener`.
   - Keep the first cut on **record listeners**, not batch listeners; Spring Kafka has separate `BatchInterceptor` behavior and that is additional surface, not table stakes for the first trustworthy path.

4. **Make Kafka metadata propagation explicit and narrow.**
   - Reuse the current logical fields `test.run_id` and `test.suite` as the evidence truth.
   - For Kafka headers, define one explicit raw string/byte header contract instead of leaning on blanket Spring header mapping.
   - Avoid mapping the full `MessageHeaders` surface because Spring’s default header mappers can add extra type headers such as `spring_json_header_types`, which is noise for Yanote’s truth model.

5. **Use Testcontainers as the primary real-broker verifier, then add a thin example proof on top.**
   - The repo has no Kafka harness today.
   - `KafkaContainer` is the smallest honest path to a real broker in module and example integration tests.
   - Start with one Spring Boot app that proves producer and consumer evidence plus metadata propagation. Only after that is stable should M004 add the two-service proof.

6. **Do not share one append-only evidence file across two JVM services.**
   - `EventJsonlWriter` opens the file in append mode per write but has no cross-process coordination.
   - For the two-service proof, each service should write its own JSONL and the verifier should merge them deterministically before `async-report`.
   - A shared file is acceptable for a single-service proof, but it is a risky default for two separate processes.

## Don’t Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Real Kafka broker for tests | Testcontainers `KafkaContainer` | It gives a real broker with dynamic bootstrap servers and fits Spring Boot `DynamicPropertySource` wiring without adding a long-lived local dependency. |
| Consumer-side interception | Spring Kafka `RecordInterceptor` | It already supports pre-listener inspection plus post-listener success/failure hooks, which is the right seam for truthful receive evidence. |
| Producer-side send outcome | Spring Kafka `ProducerListener` / `KafkaTemplate` callbacks | These callbacks provide both the original `ProducerRecord` and the ack/failure result; `ProducerInterceptor.onAcknowledgement()` does not. |
| Spring auto-config pattern | `yanote-recorder-spring-mvc` auto-configuration and tests | The current recorder module already proves the right product posture: disabled by default, fail-safe on IO errors, explicit properties, and focused auto-config tests. |
| Async analyzer contract | `yanote-js` async reader/coverage/report path | M003 already fixed the canonical Kafka evidence shape and fail-closed analyzer behavior; M004 should emit that shape, not invent a parallel one. |
| Metadata vocabulary | `docs/guides/test-tagging.md` and existing `test.run_id` / `test.suite` surfaces | The HTTP path already settled the logical metadata names and where they land; Kafka should extend that story, not rename it. |

## Relevant Code

- `yanote-js/src/model/asyncEvent.ts` — canonical normalized Kafka evidence shape on the analyzer side: `kind:"kafka"`, `action`, `channel`, optional `message`, optional `service` / `instance` / `error`, and normalized `testRunId` / `testSuite`.
- `yanote-js/src/events/readAsyncEventsJsonl.ts` — reader boundary that normalizes Kafka evidence and drops malformed extra structures instead of leaking arbitrary headers/payloads downstream.
- `yanote-js/src/coverage/asyncCoverage.ts` — hard proof of the analyzer contract: action+channel is the operation match boundary, message contract is adjacent, and unmatched/mismatched drift is fail-closed.
- `yanote-js/src/cli.ts` — `async-report` already exists and emits typed `YANOTE_ASYNC_*` lines; M004 does not need a new analyzer delivery surface to start proving recorder truth.
- `yanote-js/test/fixtures/asyncapi/v3.yaml` and `yanote-js/test/fixtures/async-events/*.jsonl` — the current canonical proof corpus for channels `users.signedup` / `users.deleted`, message names, and drift cases.
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java` — sealed JVM event boundary; currently HTTP-only, so M004 likely needs the first shared Java async event type here.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java` — reusable JSONL persistence seam, but currently typed to `HttpEvent` and not safe as a cross-process shared file strategy.
- `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlReader.java` — currently reads only `HttpEvent`; useful evidence that the core Java side has not yet been generalized for async.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — the current recorder pattern to mirror: thin framework hook, explicit metadata extraction, fail-safe write path.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/YanoteRecorderAutoConfiguration.java` — current auto-config shape: disabled by default, explicit properties, single integration seam.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderDisabledByDefaultTest.java` — table-stakes module behavior to preserve in any Kafka recorder starter.
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderIoFailureDoesNotBreakRequestTest.java` — the right durability contract: IO failures must not break application behavior.
- `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java` — current source of `X-Test-Run-Id` / `X-Test-Suite` on HTTP requests.
- `docs/guides/test-tagging.md` — canonical explanation of the current metadata handoff and the important boundary that `YANOTE_SUITE` is only a demo bridge while `yanote.suite` is the real shared suite surface.
- `examples/docker-compose.yml` and `scripts/ci/run-v1-e2e.sh` — current real-runtime proof style for HTTP. Useful as an example of artifact collection and orchestration, but not yet an async/Kafka harness.
- `.github/workflows/yanote-ci.yml` and `scripts/ci/run-yanote-gradle-check.sh` — current CI only exercises HTTP delivery surfaces; there is no async Gradle/plugin/CI wrapper yet.

## Constraints

- **Current product boundary:** async analysis exists only as `yanote async-report`; there is no Gradle async task, no async CI job, and no example Kafka service yet.
- **Version baseline:** examples and recorder surfaces are on Spring Boot `3.2.2`; choose Spring Kafka APIs that are valid on the Boot 3.2 / Spring Kafka 3.x line, not only on newer 4.x surfaces.
- **Truth model boundary:** M003 intentionally made async evidence metadata-only. M004 should not leak payload bodies or arbitrary Kafka headers into normalized evidence.
- **Message-contract ambiguity:** unlike `channel` and `action`, the `message` field is not truthfully derivable from a generic Kafka record unless Yanote defines an explicit hint surface or accepts heuristics.
- **Propagation boundary:** thread-local or request/listener-scoped metadata propagation works for same-thread send paths; it does not automatically cover executor hops, `@Async`, Reactor pipelines, or other cross-thread publication paths.
- **Operational safety:** the new Kafka recorder module should inherit the Spring MVC recorder’s posture — disabled by default and non-breaking on evidence write failures.

## Common Pitfalls

- **Recording producer evidence in `ProducerInterceptor.onSend()` and calling it success** — that records an attempt, not a broker-acknowledged fact. Use it for header mutation only.
- **Using `RecordInterceptor.intercept()` as the only consumer evidence seam** — that records “message reached container” rather than “listener handled message successfully / failed.”
- **Letting Spring map arbitrary messaging headers by default** — this can introduce mapper/type headers and silently broaden the contract beyond Yanote’s tiny metadata surface.
- **Assuming message-contract names can be inferred from payload classes** — that is a heuristic, not a truthful contract boundary, and it will drift from AsyncAPI message names.
- **Turning `YANOTE_SUITE` into a product API for Kafka** — the current docs are explicit that it is only a demo/env bridge; do not spread that ambiguity into the async path.
- **Writing two services into the same JSONL file** — the current writer has no cross-process coordination; per-service files plus deterministic merge is safer.
- **Starting Kafka-dependent sends too early in app startup** — Spring Kafka docs explicitly warn that startup sends can race topic creation and produce `UnknownTopicOrPartitionException` on clean brokers.
- **Combining Singleton Testcontainers patterns with the wrong JUnit 5 lifecycle** — container reuse and Spring context reuse can fail in confusing ways; use a deliberate lifecycle model instead of ad hoc static test state.

## Open Risks

- **No explicit runtime message-contract hint yet.** If M004 wants live message coverage, it needs an explicit contract for where `message` comes from; otherwise live runs may honestly prove only channel+action coverage.
- **Metadata context scope may be too narrow for real apps.** Same-thread propagation is probably enough for the first path, but teams that publish off-thread will need a documented limitation or a deeper context-propagation mechanism later.
- **Consumer failure semantics can balloon quickly.** Basic success/failure is straightforward; retries, DLTs, and redelivery semantics are not, and should stay out of the first milestone cut.
- **Two-service proof can look simpler than it is.** The hard part is not just starting two apps — it is preserving metadata, collecting evidence without file races, and keeping the proof deterministic in CI.

## Candidate Requirements (advisory, not auto-binding)

- **Explicit Kafka metadata header contract.** R044 says metadata must propagate via headers, but it does not yet lock header names, encoding, or overwrite rules. M004 should define those explicitly.
- **Explicit runtime message-contract hint surface.** If live message coverage is expected, Yanote needs a non-heuristic way to populate `message` in `KafkaEvent` evidence.
- **Producer outcome truthfulness.** The product should say whether producer evidence means “send attempted” or “send acknowledged / failed.” The honest default is the latter.
- **Documented propagation boundary.** If the first cut only guarantees metadata propagation for in-thread Spring MVC request handling and in-thread Kafka listener republish flows, that boundary should be stated plainly.
- **Per-service evidence aggregation contract for multi-service proofs.** The analyzer already knows how to read normalized Kafka JSONL; the missing piece is an explicit merge/collection rule for two-service scenarios.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Spring Kafka | `giuseppe-trisciuoglio/developer-kit@spring-boot-event-driven-patterns` | available, not installed (`npx skills add giuseppe-trisciuoglio/developer-kit@spring-boot-event-driven-patterns`) |
| Kafka integration | `404kidwiz/claude-supercode-skills@kafka-engineer` | available, not installed (`npx skills add 404kidwiz/claude-supercode-skills@kafka-engineer`) |
| Spring Kafka | `claude-dev-suite/claude-dev-suite@spring-kafka` | available, not installed (`npx skills add claude-dev-suite/claude-dev-suite@spring-kafka`) |
| Testcontainers | `claude-dev-suite/claude-dev-suite@testcontainers` | available, not installed (`npx skills add claude-dev-suite/claude-dev-suite@testcontainers`) |

## Sources

- Async analyzer contract and current proof corpus from live repo code: `yanote-js/src/model/asyncEvent.ts`, `yanote-js/src/events/readAsyncEventsJsonl.ts`, `yanote-js/src/coverage/asyncCoverage.ts`, `yanote-js/src/cli.ts`, `yanote-js/test/fixtures/asyncapi/v3.yaml`, `yanote-js/test/fixtures/async-events/partial.fixture.jsonl`, `yanote-js/test/fixtures/async-events/drift.fixture.jsonl`.
- Current Java recorder/event boundaries from live repo code: `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`, `EventJsonlWriter.java`, `EventJsonlReader.java`, `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`, `YanoteRecorderAutoConfiguration.java`, and the Spring MVC recorder tests.
- Existing metadata propagation vocabulary from live repo docs and test helpers: `docs/guides/test-tagging.md`, `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java`, `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java`.
- CI and proof-surface gap from live repo code: `.github/workflows/yanote-ci.yml`, `scripts/ci/run-yanote-gradle-check.sh`, `scripts/ci/run-v1-e2e.sh`, `examples/docker-compose.yml`.
- Spring Kafka sending and producer outcome seams (source: Spring Kafka reference docs, “Sending Messages” and “Producer Interceptor Managed in Spring”: `https://docs.spring.io/spring-kafka/reference/kafka/sending-messages.html`, `https://docs.spring.io/spring-kafka/reference/kafka/producer-interceptor-managed-in-spring.html`).
- Spring Kafka consumer interception and listener-container constraints (source: Spring Kafka reference docs, “Message Listener Containers”: `https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html`).
- Spring Kafka header mapping behavior and the risk of broad header mapping noise (source: Spring Kafka reference docs, “Message Headers”: `https://docs.spring.io/spring-kafka/reference/kafka/headers.html`).
- Testcontainers Kafka/runtime guidance and JUnit 5 lifecycle caveats (source: Testcontainers docs and guides: Context7 `/testcontainers/testcontainers-java` query `KafkaContainer JUnit 5 integration test spring boot bootstrap servers wait strategy reusable container`, plus `https://testcontainers.com/guides/testcontainers-container-lifecycle/` and `https://testcontainers.com/guides/testing-spring-boot-kafka-listener-using-testcontainers/`).
