---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - spring-kafka
  - testcontainers
---

# T01: Extend the authoritative Spring Kafka proof to carry live binding and runtime-semantic truth

**Slice:** S04 — Live Kafka proof and support-surface closeout
**Milestone:** M014

## Description

Turn the existing live Spring Kafka proof into the authoritative source for M014’s richer async semantics. Reuse the real example service and retained-header path, add only non-sensitive proof metadata, and make the happy-path bundle itself prove additive `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` without disturbing canonical Kafka operation identity or legacy coverage numerators.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Spring Kafka example service + Testcontainers-backed live proof | Fail the verifier immediately, retain temp artifacts, and keep the existing proof path authoritative instead of inventing synthetic success. | Treat the live proof as failed, preserve logs / JSONL / report paths, and require a rerun after stabilizing broker or example startup timing. | Fail closed when retained headers or live AsyncAPI declarations do not match the supported subset; do not coerce malformed semantics into covered truth. |

## Load Profile

- **Shared resources**: Embedded Kafka broker, example-service JVMs, retained JSONL evidence files, and the built async CLI.
- **Per-operation cost**: One real send/receive proof flow plus additive async report assertions over the generated bundle.
- **10x breakpoint**: Broker startup and end-to-end verifier runtime dominate first; over-broad assertions or non-deterministic header values will make the proof flaky before analyzer logic changes.

## Negative Tests

- **Malformed inputs**: Missing or malformed retained correlation/reply headers in the live proof should downgrade semantics instead of silently passing.
- **Error paths**: The verifier must fail if the happy-path report loses `bindingSupport`, `declaredSemantics`, or `runtimeSemantics`, or if raw retained values leak into stdout/stderr/artifacts.
- **Boundary conditions**: Canonical `kafka <action> <channel>` keys and legacy channel/operation/message numerators must remain unchanged even after adding the richer semantics.

## Steps

1. Add stable non-sensitive headers on the Spring Kafka example publish path that can truthfully back live `correlationId` / `reply.address` semantics without changing recorder boundaries or leaking secrets.
2. Update the authoritative Spring Kafka AsyncAPI fixtures so they declare matching correlation/reply/binding semantics on the existing live channels while preserving canonical channel addresses and operation identity.
3. Strengthen the two-service integration test and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` so the regenerated happy-path bundle proves non-zero `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` and still retains focused runtime-selected / schema-failure companions.
4. Keep all verifier assertions redaction-safe: no raw retained header values in exported paths, stdout/stderr, or bundle artifacts.

## Must-Haves

- [ ] The live Spring Kafka example emits only non-sensitive retained metadata needed to prove the supported binding / declared / runtime semantics subset.
- [ ] `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` fails closed unless the happy-path live report exposes non-zero additive `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` on canonical Kafka operations.
- [ ] The authoritative proof bundle still keeps focused runtime-selected and schema-failure companions and does not leak raw retained values.

## Verification

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- Inspect `.yanote-ci/live-kafka-proof/yanote-async-report.json` and `.html` after the verifier run to confirm non-zero additive `bindingSupport`, `declaredSemantics`, and `runtimeSemantics` on the happy-path artifact.

## Observability Impact

- Signals added/changed: The main live Kafka proof report gains non-zero binding / declared / runtime semantics surfaces in `yanote-async-report.json` and `.html`.
- How a future agent inspects this: Re-run `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and inspect the retained `.yanote-ci/live-kafka-proof/` bundle plus verifier stderr.
- Failure state exposed: Missing live semantics, leaked raw values, or canonical identity drift show up as verifier failures with retained logs, JSONL, report files, and typed async stderr.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — live Spring Kafka publish/listener path that already drives the authoritative proof.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — integration test asserting the current real-broker evidence contract.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — authoritative live two-service AsyncAPI fixture consumed by the proof.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — companion republish fixture that should stay aligned with live semantics wording.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative live Kafka verifier and bundle producer.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — live Kafka example emits stable non-sensitive proof headers for richer async semantics.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — integration assertions cover the new retained live-semantics contract.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — live two-service AsyncAPI fixture declares binding / declared / runtime semantics truthfully.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — single-service companion fixture stays aligned with the same supported subset.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — verifier fails closed unless the authoritative live bundle proves the richer async semantics and keeps redaction-safe companions.
