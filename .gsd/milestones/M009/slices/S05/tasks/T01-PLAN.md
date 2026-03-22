---
estimated_steps: 7
estimated_files: 5
skills_used:
  - kafka-engineer
---

# T01: Add compatibility smoke coverage and refresh retained live proof bundles

**Slice:** S05 — Retained Proof And Compatibility Hardening
**Milestone:** M009

## Description

Add a version-sensitive recorder smoke boundary for the reflection-based Spring Kafka seam and refresh the retained live HTTP/async proof scripts so the stronger provenance/header/multi-message truths are visible in the artifacts users and future agents actually inspect.

## Steps

1. Identify the lightest compatibility smoke surface that meaningfully exercises the reflection-based Kafka recorder seam.
2. Add or tighten that smoke coverage in tests or scripts without changing the project’s required-check shape gratuitously.
3. Refresh live Kafka and async proof scripts to assert retained headers and multi-message/provenance semantics.
4. Refresh the HTTP proof bundle expectations to include the stronger provenance truth.
5. Re-run all retained live proof scripts.
6. Confirm the retained artifacts remain inspectable and stable in naming.
7. Document any version constraints discovered through the smoke boundary.

## Must-Haves

- [ ] A version-sensitive recorder smoke boundary exists for future Spring Boot / Spring Kafka drift.
- [ ] Live HTTP and async proof bundles reflect the stronger truth surfaces.
- [ ] Retained artifact names stay stable unless an intentional contract change is required.

## Verification

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `bash scripts/ci/run-v1-e2e.sh`

## Observability Impact

- Signals added/changed: compatibility smoke output and richer retained proof artifacts.
- How a future agent inspects this: live proof scripts, retained `.yanote-ci/` bundles, and the recorder auto-configuration smoke surface.
- Failure state exposed: framework-version drift and live-proof regressions become visible before they silently reach `main`.

## Inputs

- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — natural seam for version-sensitive recorder proof.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — retained live Kafka proof.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — retained live async acceptance proof.
- `scripts/ci/run-v1-e2e.sh` — retained live HTTP proof bundle.
- `.github/workflows/yanote-ci.yml` — current CI contract surface if a smoke path is promoted.

## Expected Output

- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java` — stronger version-sensitive recorder smoke proof.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — retained Kafka proof updated for richer truth surfaces.
- `scripts/ci/verify-m005-s02-async-acceptance.sh` — retained async proof updated for headers/multi-message semantics.
- `scripts/ci/run-v1-e2e.sh` — retained HTTP proof updated for provenance truth.
- `.github/workflows/yanote-ci.yml` — CI wiring only if needed to keep the smoke boundary continuously exercised.
