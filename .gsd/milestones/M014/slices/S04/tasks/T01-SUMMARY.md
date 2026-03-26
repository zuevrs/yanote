---
id: T01
parent: S04
milestone: M014
provides: []
requires: []
affects: []
key_files: ["examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java", "examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java", "yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml", "yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml", "scripts/ci/verify-m004-s03-live-kafka-proof.sh", ".gsd/milestones/M014/slices/S04/tasks/T01-SUMMARY.md"]
key_decisions: ["Use stable non-sensitive `correlation_id` and `reply_to` Kafka headers derived from the message/topic so live runtime semantics are provable without introducing secret-bearing values.", "Keep additive binding support limited to `channel.bindings.kafka.topic` so canonical `kafka <action> <channel>` identities and legacy coverage numerators remain unchanged."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed the authoritative live Kafka verifier, the slice-level CI artifact/summary workflow contract tests, the slice-level docs boundary verifier stack, and an explicit exported-bundle inspection of `.yanote-ci/live-kafka-proof/yanote-async-report.json` / `.html` confirming `supportedBindings=2`, `operationsWithCorrelationId=2`, `operationsWithReply=2`, and `satisfiedSemantics=4`."
completed_at: 2026-03-26T13:33:12.402Z
blocker_discovered: false
---

# T01: Added stable live Spring Kafka proof headers plus fixture/verifier coverage so the authoritative async bundle now proves binding, declared, and runtime semantics on canonical Kafka operations.

> Added stable live Spring Kafka proof headers plus fixture/verifier coverage so the authoritative async bundle now proves binding, declared, and runtime semantics on canonical Kafka operations.

## What Happened
---
id: T01
parent: S04
milestone: M014
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - .gsd/milestones/M014/slices/S04/tasks/T01-SUMMARY.md
key_decisions:
  - Use stable non-sensitive `correlation_id` and `reply_to` Kafka headers derived from the message/topic so live runtime semantics are provable without introducing secret-bearing values.
  - Keep additive binding support limited to `channel.bindings.kafka.topic` so canonical `kafka <action> <channel>` identities and legacy coverage numerators remain unchanged.
duration: ""
verification_result: passed
completed_at: 2026-03-26T13:33:12.402Z
blocker_discovered: false
---

# T01: Added stable live Spring Kafka proof headers plus fixture/verifier coverage so the authoritative async bundle now proves binding, declared, and runtime semantics on canonical Kafka operations.

**Added stable live Spring Kafka proof headers plus fixture/verifier coverage so the authoritative async bundle now proves binding, declared, and runtime semantics on canonical Kafka operations.**

## What Happened

Updated the Spring Kafka example publisher to emit stable non-sensitive `correlation_id` and `reply_to` headers, aligned the authoritative two-service and single-service AsyncAPI fixtures to declare matching topic binding plus correlation/reply semantics, and strengthened the two-service integration test and live-proof verifier so the happy-path bundle must expose additive bindingSupport, declaredSemantics, and runtimeSemantics while keeping the focused runtime-selected and schema-failure companions. Verified the exported bundle from the active worktree and preserved redaction-safe delivery surfaces by checking that the raw correlation proof value does not appear in the JSON/HTML/stdout/stderr report artifacts.

## Verification

Passed the authoritative live Kafka verifier, the slice-level CI artifact/summary workflow contract tests, the slice-level docs boundary verifier stack, and an explicit exported-bundle inspection of `.yanote-ci/live-kafka-proof/yanote-async-report.json` / `.html` confirming `supportedBindings=2`, `operationsWithCorrelationId=2`, `operationsWithReply=2`, and `satisfiedSemantics=4`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 60710ms |
| 2 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 421ms |
| 3 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 577ms |
| 4 | `python3 - <<'PY' ... inspect .yanote-ci/live-kafka-proof/yanote-async-report.{json,html} ... PY` | 0 | ✅ pass | 0ms |


## Deviations

Used foreground `bash` for authoritative worktree verification after confirming the background runner was not trustworthy for this worktree-scoped proof path. The implementation scope and verification targets stayed the same.

## Known Issues

None.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `.gsd/milestones/M014/slices/S04/tasks/T01-SUMMARY.md`


## Deviations
Used foreground `bash` for authoritative worktree verification after confirming the background runner was not trustworthy for this worktree-scoped proof path. The implementation scope and verification targets stayed the same.

## Known Issues
None.
