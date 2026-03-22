# S05: Retained Proof And Compatibility Hardening

**Goal:** Re-prove the stronger HTTP/Kafka truth boundary through the retained live proof entrypoints, harden the reflection-based Spring Kafka seam with a version-sensitive smoke boundary, and refresh public docs/artifacts so the new evidence story is the documented one.
**Demo:** Running the retained HTTP and async proof scripts plus the new compatibility smoke boundary produces inspectable green/red artifacts that reflect recorder provenance, retained Kafka headers, multi-message async truth, and no implied expansion to new brokers or schema registries.

## Must-Haves

- The strengthened recorder/analyzer semantics are exercised again through the existing live HTTP and async proof entrypoints rather than only by new unit fixtures.
- A version-sensitive Spring Boot / Spring Kafka smoke boundary exists for the reflection-based recorder seam so future upgrades fail loudly instead of silently drifting.
- Public docs and retained artifacts describe the stronger evidence truth accurately while preserving the current Kafka-only / separate-report product boundary.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `bash scripts/ci/run-v1-e2e.sh`
- `bash scripts/docs/verify-s08-entry-paths.sh`
- `git diff --check`
- Manual review — retained HTTP and async artifacts plus docs wording match the strengthened recorder-provenance / header-verification / multi-message boundaries without implying broader scope.

## Observability / Diagnostics

- Runtime signals: retained `.yanote-ci/` bundles, compatibility-matrix smoke output, updated artifact manifests/summaries, and refreshed docs verifier output.
- Inspection surfaces: existing live Kafka/HTTP proof scripts, new version-sensitive recorder smoke command, retained public artifacts, and entry-path/boundary docs verifiers.
- Failure visibility: recorder version drift, live proof regressions, stale public wording, or mismatched retained artifacts fail through separate scripts/artifacts instead of one generic CI error.
- Redaction constraints: retain enough contract identity and omission reason to debug failures, but do not publish newly retained headers or payload values without the redaction rules defined in earlier slices.

## Integration Closure

- Upstream surfaces consumed: S02 header-verification path, S03 multi-message async semantics, S04 provenance-aware HTTP semantics, existing live proof scripts, docs boundary verifiers, and the Spring Kafka recorder auto-configuration seam.
- New wiring introduced in this slice: final retained artifact/docs truth and a version-sensitive recorder smoke boundary for the reflection-based Spring Kafka path.
- What remains before the milestone is truly usable end-to-end: nothing inside M009; after this slice, the stronger evidence truth should be proven across live entrypoints and public wording.

## Tasks

- [ ] **T01: Add compatibility smoke coverage and refresh retained live proof bundles** `est:1h30m`
  - Why: the reflection-based Spring Kafka seam is the main operational risk left after the semantic slices; it needs a version-sensitive check alongside the existing live proof scripts.
  - Files: `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/verify-m005-s02-async-acceptance.sh`, `scripts/ci/run-v1-e2e.sh`, `.github/workflows/yanote-ci.yml`
  - Do: Add or tighten a recorder compatibility smoke boundary, refresh the retained Kafka/HTTP proof scripts to assert the richer provenance/header/multi-message truths, and wire the most important smoke path into the existing CI contract only if it remains within the current required-check shape.
  - Verify: `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh && bash scripts/ci/run-v1-e2e.sh`
  - Done when: live proof bundles stay inspectable, the upgraded truth surfaces are visible in retained artifacts, and a version-sensitive recorder seam check exists for future framework drift.
- [ ] **T02: Refresh docs and public boundary wording around the stronger truth surface** `est:1h`
  - Why: a milestone like this only lands cleanly if README/guides/support text describes the strengthened boundary accurately instead of repeating the old limitations.
  - Files: `README.md`, `docs/guides/asyncapi-kafka.md`, `docs/guides/analyzer-coverage.md`, `docs/release-and-support.md`, `scripts/docs/verify-s04-boundaries.sh`, `scripts/docs/verify-s08-entry-paths.sh`
  - Do: Update public wording around recorder provenance, retained Kafka headers, multi-message AsyncAPI support, and continued Kafka-only / separate-report boundaries, then tighten the docs verifiers so future regressions fail mechanically.
  - Verify: `bash scripts/docs/verify-s08-entry-paths.sh && git diff --check`
  - Done when: docs verifiers pass, public wording matches the retained artifacts, and nothing in the docs implies new brokers, schema registry support, or a mandatory combined report.

## Files Likely Touched

- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaRecorderAutoConfigurationTest.java`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`
- `scripts/ci/run-v1-e2e.sh`
- `.github/workflows/yanote-ci.yml`
- `README.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/docs/verify-s08-entry-paths.sh`
