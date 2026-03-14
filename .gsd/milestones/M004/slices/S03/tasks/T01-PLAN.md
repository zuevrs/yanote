---
estimated_steps: 4
estimated_files: 5
---

# T01: Split the example service into deterministic Kafka roles and lock merge semantics

**Slice:** S03 — Live Multi-Service Kafka Proof Stack
**Milestone:** M004

## Description

Refactor the existing Spring MVC example so the same app can run in deterministic producer-only, consumer-only, and current single-service republish roles, then lock the multi-service merge rule in one small helper with an executable contract test.

## Steps

1. Replace the coarse `example.kafka.enabled` switch with narrower producer/listener/republish role flags that let one app instance publish without also consuming, while keeping the current single-service republish defaults intact.
2. Update the example configuration surface so producer-role and consumer-role instances can set distinct service names, ports, group IDs, and per-service events paths without sharing one output file.
3. Add `KafkaRoleScopedConfigurationTest.java` to prove the example app boots with the intended role-specific beans/listeners enabled and disabled in producer-only vs consumer-only configurations.
4. Add `scripts/ci/merge-async-events-jsonl.mjs` plus a Node contract test that concatenates service event files in deterministic path order and preserves original line order within each file.

## Must-Haves

- [ ] The example app still supports the current single-service republish flow while also exposing deterministic producer-only and consumer-only runtime roles.
- [ ] Producer-role and consumer-role configurations cannot accidentally share one events file or self-enable the wrong listener path.
- [ ] The merge helper has one explicit deterministic contract: stable file ordering plus preserved in-file line ordering.

## Verification

- `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest'`
- `node --test scripts/ci/merge-async-events-jsonl.test.mjs`

## Observability Impact

- Signals added/changed: the example’s config surface now exposes explicit producer/consumer role state, and the merge helper makes analyzer input ordering inspectable instead of implicit.
- How a future agent inspects this: run the focused configuration test for bean/listener role gating, then run the merge-helper contract test to confirm path-order concatenation behavior.
- Failure state exposed: accidental self-consume wiring, shared-events-path regressions, or unstable merge ordering becomes visible before any live broker proof runs.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current single-app Kafka proof surface with one coarse enable switch.
- `examples/springmvc-service/src/main/resources/application.properties` — current default topic/listener/service configuration that must remain truthful for the single-service scenario.
- `.gsd/milestones/M004/slices/S03/S03-RESEARCH.md` — requires role-scoped reuse of one example app and deterministic per-service JSONL merge.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — role-scoped producer/listener/republish bean gating.
- `examples/springmvc-service/src/main/resources/application.properties` — deterministic producer-role and consumer-role property surface.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRoleScopedConfigurationTest.java` — focused role-scoping proof.
- `scripts/ci/merge-async-events-jsonl.mjs` — deterministic multi-service JSONL merge helper.
- `scripts/ci/merge-async-events-jsonl.test.mjs` — contract test for merge ordering and line preservation.
