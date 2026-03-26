# S04: Live Kafka proof and support-surface closeout

**Goal:** Close M014 on the authoritative Spring Kafka path by turning the live Kafka proof bundle, CI summaries, and public docs into truthful delivery surfaces for the richer AsyncAPI semantics already implemented in S02 and S03.
**Demo:** After this: The authoritative Spring Kafka proof bundle retains widened async JSON/HTML artifacts plus focused companions, and docs/CI summaries explain the richer semantics while still saying Kafka-only, Spring-Kafka-first, and separate async reporting.

## Tasks
- [x] **T01: Added stable live Spring Kafka proof headers plus fixture/verifier coverage so the authoritative async bundle now proves binding, declared, and runtime semantics on canonical Kafka operations.** — 1. Update the Spring Kafka example path to emit stable non-sensitive correlation/reply metadata on the same live send/receive flow that already powers the authoritative proof.
2. Revise the live AsyncAPI proof specs and the two-service verifier so the happy-path report proves non-zero `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` from real Spring Kafka evidence while keeping canonical operation identities and legacy coverage numerators unchanged.
3. Strengthen integration assertions so the retained proof bundle fails closed if those widened async sections disappear, reorder unexpectedly, or leak raw retained values.
  - Estimate: 2h
  - Files: examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java, examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java, yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml, yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml, scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - Verify: bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
- [x] **T02: Preserved widened live Kafka proof metadata and fail-closed semantics through exported artifacts, collected CI bundles, and async GitHub summaries.** — 1. Widen the async proof exporter / collector contracts so build-and-test artifacts retain the live JSON/HTML report pair plus focused runtime-selected and schema-failure companions without inventing stale files.
2. Teach the summary renderer and its contract tests to surface the richer live async semantics counts from the collected bundle while keeping output redaction-safe and `report=` JSON-centered.
3. Keep workflow contracts aligned so the build-and-test job still publishes one deterministic async artifact family and summary path for downstream operators.
  - Estimate: 1h45m
  - Files: scripts/ci/export-async-proof-artifacts.sh, scripts/ci/export-async-proof-artifacts.test.mjs, scripts/ci/collect-yanote-artifacts.sh, scripts/ci/collect-yanote-artifacts.test.mjs, scripts/ci/render-yanote-summary.mjs, scripts/ci/render-yanote-summary.test.mjs, scripts/ci/yanote-ci-workflow.contract.test.mjs
  - Verify: node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs
- [x] **T03: Refreshed public async boundary docs and drift verifiers around the authoritative live Spring Kafka proof bundle.** — 1. Update the public async/boundary docs so they explain the richer live proof surfaces (binding support plus declared/runtime semantics, JSON/HTML companions, CI bundle) without overselling beyond Kafka-only and Spring-Kafka-first scope.
2. Align branch-protection / landing copy and boundary verifier scripts with the new live-proof wording so documentation drift fails mechanically.
3. Keep the existing redaction and no combined-report / no hosted-dashboard / no broker-agnostic promises explicit on every touched surface.
  - Estimate: 1h15m
  - Files: README.md, docs/README.md, docs/guides/asyncapi-kafka.md, docs/release-and-support.md, .github/BRANCH_PROTECTION.md, scripts/docs/verify-m005-s01-async-path.sh, scripts/docs/verify-m005-s01-async-boundaries.sh, scripts/docs/verify-s04-boundaries.sh
  - Verify: bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh
