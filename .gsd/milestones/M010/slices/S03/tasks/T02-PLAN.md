---
estimated_steps: 4
estimated_files: 7
skills_used:
  - spring-kafka
  - kafka-engineer
  - bash-scripting
  - test
---

# T02: Extend the live Kafka proof bundle with additive header-drift sidecars

**Slice:** S03 — Async Kafka Header Validation As A Supported Core Surface
**Milestone:** M010

## Description

Turn the existing two-service Kafka proof into the public source of truth for header diagnostics. This task keeps the happy path green while adding retained sidecars for missing, invalid, unavailable, and unverifiable header drift against real Spring Kafka evidence.

## Steps

1. Add one deterministic proof-only sensitive Kafka header in `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` so recorder redaction can produce real unavailable-header evidence without leaking secrets.
2. Author additive two-service AsyncAPI sidecar specs for missing, invalid, unavailable, and unverifiable header drift, reusing the existing `yanote.*` retained headers wherever possible instead of inventing a separate runtime.
3. Extend `scripts/ci/verify-m004-s03-live-kafka-proof.sh` so the happy path still proves zero diagnostics, but header-drift sidecars retain typed stdout/stderr/report artifacts under `.yanote-ci/live-kafka-proof/`.
4. Update `scripts/ci/export-async-proof-artifacts.sh` so the new sidecars are exported deterministically and a future agent can inspect the retained proof bundle without rerunning the live stack first.

## Must-Haves

- [ ] The live happy path remains green and still exports the existing proof artifacts.
- [ ] At least one sidecar proves `unavailable-header` from real redacted or omitted retained evidence, not from a fake report mutation.
- [ ] The retained proof bundle contains distinct sidecars for header drift while preserving Kafka-only scope and redaction safety.

## Verification

- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals added/changed: `.yanote-ci/live-kafka-proof/` gains retained header-drift sidecars with typed `YANOTE_ASYNC_ERROR*` output, `yanote-async-report.json` diagnostics, and redacted header capture state/reason context.
- How a future agent inspects this: rerun the two proof scripts above or inspect the exported bundle under `.yanote-ci/live-kafka-proof/` for `*-async-report.stdout`, `*-async-report.stderr`, and `*-yanote-async-report.json` sidecars.
- Failure state exposed: proof failures should identify whether the break is in live header emission, recorder redaction, sidecar spec expectations, or artifact export wiring.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current nested `KafkaMessagePublisher` path that only emits captured `yanote.*` headers.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java` — redaction/omission rules the live proof must exercise truthfully.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — current happy-path two-service AsyncAPI contract.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — current live proof/export harness that only retains happy-path, runtime-selection, and payload-failure sidecars.
- `scripts/ci/export-async-proof-artifacts.sh` — artifact exporter that must retain the new header sidecars.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — single-service proof that should stay green while the example publisher changes.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — proof-only sensitive header emission added in the live publisher path.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-missing-header.yaml` — additive missing-header sidecar spec.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-header.yaml` — additive invalid-header sidecar spec.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unavailable-header.yaml` — additive unavailable-header sidecar spec.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unverifiable-header.yaml` — additive unverifiable-header sidecar spec.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live proof script extended for retained header sidecars without regressing the happy path.
- `scripts/ci/export-async-proof-artifacts.sh` — exporter updated so the header sidecars are retained under `.yanote-ci/live-kafka-proof/`.
