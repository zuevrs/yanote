---
id: M004
provides:
  - A complete Spring Kafka runtime evidence path for Yanote: truthful normalized `kafka send` / `kafka receive` JSONL, suite/run attribution across HTTP and Kafka headers, and reproducible single-service plus two-service live proofs that feed `yanote async-report` unchanged.
key_decisions:
  - Keep the Kafka truth seams narrow and explicit: producer header enrichment plus `ProducerListener` outcome callbacks, listener interceptor success/failure hooks, automatic suite/run propagation only, and explicit-only `yanote.message` hints.
  - Reuse one role-scoped example service for the single-service republish proof and the two-service producer/consumer proof, then merge per-service JSONL lexicographically while preserving in-file order.
patterns_established:
  - Close async runtime milestones vertically: sealed analyzer-facing evidence contract first, shared metadata bridge second, then composed live proof and CI wiring over the same example-service runtime.
  - Assert raw JSONL ownership and attribution before running `yanote async-report`, and keep retained failure artifacts for analyzer/gate regressions.
observability_surfaces:
  - ./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test
  - ./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'
  - node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure
  - YANOTE_ASYNC_SUMMARY / YANOTE_ASYNC_ERROR plus retained proof artifacts (`01-producer.events.jsonl`, `02-consumer.events.jsonl`, `merged-two-service.events.jsonl`, `merge.log`, `async-report.stdout`, `async-report.stderr`)
requirement_outcomes:
  - id: R042
    from_status: active
    to_status: validated
    proof: S01 recorder proofs plus the fresh S03 live proof stack passed, showing broker-acknowledged `kafka send` evidence from a real Spring Kafka runtime and direct `yanote async-report` acceptance without translation.
  - id: R043
    from_status: active
    to_status: validated
    proof: S01 listener-outcome proofs plus the fresh single-service and two-service real-broker tests passed, showing truthful `kafka receive` evidence separated from producer facts.
  - id: R044
    from_status: active
    to_status: validated
    proof: S02 raw-evidence republish proof and the fresh composed live proof passed, preserving `test.run_id` / `test.suite` through HTTP → Kafka → Kafka and producer → consumer handoff into normalized evidence.
  - id: R045
    from_status: active
    to_status: validated
    proof: The fresh example-service integration stack and `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` passed, covering both one service that publishes and consumes and a split producer-only → consumer-only flow.
  - id: R046
    from_status: active
    to_status: validated
    proof: Fresh unit, integration, example, merge-contract, workflow-contract, live-broker, and retained-failure verifiers all passed, including the expected `YANOTE_ASYNC_ERROR` failure-path simulation.
duration: 13h 00m
verification_result: passed
completed_at: 2026-03-14 12:17:53 +0300
---

# M004: Kafka Evidence Capture And Java Integration

**Delivered a full Spring Kafka async evidence path: Yanote now records truthful producer and consumer Kafka facts on a real broker, preserves suite/run attribution through HTTP and Kafka handoffs, and proves both the single-service and two-service analyzer paths in CI-grade automation.**

## What Happened

M004 closed the gap between the async analyzer foundation from M003 and a real Java runtime path.

S01 built the runtime truth surface from the inside out. `yanote-core` gained a shared `KafkaEvent`/`YanoteEvent` JSONL boundary that can round-trip HTTP and Kafka facts together, `yanote-recorder-spring-kafka` was added as a dedicated recorder module, and the recorder hooks landed on the truthful Spring Kafka seams: producer outcomes are recorded on broker callback paths and consumer outcomes are recorded on listener success/failure paths. The slice closed with a real-broker single-service proof on `examples/springmvc-service` and a verifier that feeds the unchanged mixed events file directly into `yanote async-report`.

S02 made attribution survive real async handoffs. Suite/run metadata was moved into a tiny shared core carrier that bridges Spring MVC ingress and Kafka listener scopes automatically. Kafka propagation was narrowed to explicit Yanote suite/run headers, while `yanote.message` was locked to explicit-only per hop. The example service was then extended into an HTTP → Kafka → Kafka republish proof that asserts raw `test.run_id`, `test.suite`, and per-hop message ownership before running the analyzer.

S03 turned the slice-level proofs into a milestone-grade live stack. The same example app can now run as producer-only, consumer-only, or single-service republisher via role-scoped configuration. Per-service evidence is collected into deterministic files, merged by lexicographic path order, and passed directly to `yanote async-report`. The repo now has both the authoritative single-service republish proof and a split producer→consumer proof against one real Testcontainers broker, all wired into the existing `build-and-test` required CI job with workflow contract protection.

The only closure gap I found while completing the milestone was documentary, not product-level: `S01-SUMMARY.md` and `S02-SUMMARY.md` were missing even though the task summaries, verifier scripts, and finished runtime surfaces already existed. I recreated those slice summaries from task evidence and fresh milestone verification before marking M004 complete.

## Cross-Slice Verification

### Success criteria

- **A Spring Kafka service can emit separate normalized `kafka send` and `kafka receive` facts on a real broker, and `yanote async-report` accepts them without translation** — verified by the fresh live stack:
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Fresh result: passed.
  - Evidence: the command reran the authoritative single-service republish proof, then ran the two-service proof and reported `Async analyzer proof passed: channels=1/1 operations=2/2 messages=2/2` for the merged live Kafka JSONL.

- **Producer evidence reflects broker-acknowledged send success/failure and consumer evidence reflects listener success/failure, so one service that both publishes and consumes shows both directions honestly** — verified by the fresh JVM recorder stack:
  - `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
  - `./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest'`
  - Fresh result: passed.
  - Evidence: the recorder-module tests stayed green, and the example-service single-service proof exercised the real-broker send/receive path on one application instance.

- **Suite/run metadata injected through HTTP or inbound Kafka headers survives onto outbound Kafka headers and appears in normalized async evidence** — verified by the fresh republish and two-service proof surfaces:
  - `./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Fresh result: passed.
  - Evidence: the verifier reported `suite=m004-s03-single-service-suite` for the single-service republish proof and `suite=m004-s03-two-service-suite` for the split producer→consumer proof after raw evidence assertions succeeded.

- **The repo contains a reproducible single-service proof and a reproducible two-service proof that collect per-service evidence, merge it deterministically, and feed the async analyzer path** — verified by the fresh example and merge/workflow stack:
  - `./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
  - `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Fresh result: passed.
  - Evidence: the role-scoped contexts stayed green, the merge helper tests proved deterministic concatenation and actionable missing-input failure behavior, and the live verifier reported `ordered_inputs=.../01-producer.events.jsonl,.../02-consumer.events.jsonl` before analyzer handoff.

- **The Kafka recorder path is protected by unit, integration, example, and CI-grade verifiers at the project’s fail-closed quality bar** — verified by the full fresh milestone stack:
  - `./gradlew --no-daemon :yanote-core:test :yanote-recorder-spring-mvc:test :yanote-recorder-spring-kafka:test`
  - `./gradlew --no-daemon :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest' --tests 'dev.yanote.examples.service.KafkaRecorderSingleServiceIntegrationTest' --tests 'dev.yanote.examples.service.KafkaRecorderTwoServiceIntegrationTest'`
  - `node --test scripts/ci/merge-async-events-jsonl.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` (expected failure)
  - Fresh result: all required success-path commands passed; the simulated failure exited 1 as expected and surfaced `YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE` with retained artifacts.

### Definition of done

- **All M004 slices are `[x]`** — verified from the inlined roadmap; S01, S02, and S03 were all already marked complete.
- **All slice summaries exist** — verified after writing the missing `.gsd/milestones/M004/slices/S01/S01-SUMMARY.md` and `.gsd/milestones/M004/slices/S02/S02-SUMMARY.md`; S03 summary already existed.
- **All M004-relevant active requirements remain truthfully mapped** — verified from the inlined requirements inventory: R042–R046 are now validated, while R048 remains active and mapped to M005/S02 with M004/S03 as supporting proof.
- **Cross-slice integration points work correctly** — verified by the fresh live proof stack, which composes the S02 authoritative single-service verifier with the S03 two-service merge/analyzer path, and by the fresh JVM/module tests that keep the S01 recorder plus S02 metadata bridge green.
- **No milestone success criterion failed** — all success criteria were met with fresh passing evidence.

## Requirement Changes

- R042: active → validated — Fresh S01/S03 proof surfaces showed broker-acknowledged producer `kafka send` evidence on a real broker and unchanged analyzer acceptance.
- R043: active → validated — Fresh recorder and example-service proofs showed listener-outcome `kafka receive` evidence stays separate from producer facts in both single-service and two-service flows.
- R044: active → validated — Fresh republish and two-service raw-evidence proofs preserved `test.run_id` and `test.suite` across HTTP and Kafka boundaries.
- R045: active → validated — Fresh integration tests and the live proof script covered the required one-service and two-service Kafka scenarios.
- R046: active → validated — Fresh unit, integration, example, merge, workflow, live-broker, and retained-failure verifiers proved OpenAPI-quality async trust depth.

`REQUIREMENTS.md` already reflected these validated transitions when I closed the milestone, so no additional status correction was needed there.

## Forward Intelligence

### What the next milestone should know
- M005 should start from `scripts/ci/verify-m004-s03-live-kafka-proof.sh` and `scripts/ci/verify-m004-s02-metadata-propagation.sh`; they are already the truthful end-to-end runtime proofs for the async Kafka path and should be composed into onboarding and final trust surfaces rather than duplicated.

### What's fragile
- The live Kafka proof depends on role-scoped example-service configuration plus the explicit Testcontainers core override. Configuration cleanup in M005 must preserve those runtime boundaries or rerun the full live proof stack immediately.

### Authoritative diagnostics
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure` — this is the fastest trustworthy diagnostic path because it proves raw evidence ownership, deterministic merge order, analyzer invocation, structured async gate failure, and retained artifact locations in one run.

### What assumptions changed
- “A second demo service is needed for the two-service proof” — false; one role-scoped example app was sufficient and kept the milestone smaller and more deterministic.
- “Metadata propagation can safely stay ad hoc or broad-header-based” — false; the milestone only closed once suite/run propagation was narrowed to an explicit shared context and header contract.

## Files Created/Modified

- `.gsd/milestones/M004/slices/S01/S01-SUMMARY.md` — restored the missing S01 slice summary from completed task evidence and fresh verification.
- `.gsd/milestones/M004/slices/S02/S02-SUMMARY.md` — restored the missing S02 slice summary from completed task evidence and fresh verification.
- `.gsd/milestones/M004/M004-SUMMARY.md` — recorded milestone-level closure, success-criteria verification, and validated requirement transitions.
- `.gsd/PROJECT.md` — refreshed the project snapshot so M005 is explicitly the next product frontier after the now-closed M004 milestone.
- `.gsd/STATE.md` — advanced the tracker from M004 completion to M005 ready-for-planning.
