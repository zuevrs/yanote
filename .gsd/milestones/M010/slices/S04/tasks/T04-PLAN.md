---
estimated_steps: 4
estimated_files: 8
skills_used:
  - asyncapi-design
  - spring-kafka
  - bash-scripting
  - java-junit
  - test
---

# T04: Export Kafka header-drift sidecars and promote the async public boundary

**Slice:** S04 — Final Boundary Assembly And Docs Hardening
**Milestone:** M010

## Description

Finish the async half of the milestone by making the retained Kafka proof bundle tell the same story as the analyzer and tests. This task widens the exported bundle to retain header-drift sidecars, enforces those artifacts in the live proof script, and updates the public async owner/support surfaces so Kafka header diagnostics become supported public truth without widening to broker-agnostic promises.

## Steps

1. Finish `scripts/ci/export-async-proof-artifacts.sh` and `scripts/ci/export-async-proof-artifacts.test.mjs` so success exports retain missing/invalid/unavailable/unverifiable header sidecars with deterministic manifest counts.
2. Update `scripts/ci/verify-m004-s03-live-kafka-proof.sh` so the live Kafka proof asserts those sidecars and the corresponding typed `ASYNC_SEMANTIC_*` codes while preserving the happy path, runtime-selected sidecar, and schema-failure sidecar.
3. Rewrite `docs/guides/asyncapi-kafka.md`, `docs/requirements.md`, and `SUPPORT.md` so Kafka header diagnostics are described as supported public truth on the proven Kafka path.
4. Refresh the M005 async path/boundary verifiers to enforce the new wording and artifact expectations while keeping Kafka-only, Spring-Kafka-first, and separate async reporting explicit.

## Must-Haves

- [ ] A successful `.yanote-ci/live-kafka-proof/` export retains the header-drift sidecars and records them in `artifact-manifest.txt`.
- [ ] The live Kafka proof script fails if the header sidecars or their typed semantic codes are missing or wrong.
- [ ] Public async docs/support/requirements no longer claim that retained Kafka headers are unverifiable.
- [ ] The async public boundary remains Kafka-only, Spring-Kafka-first, and separate from HTTP reporting.

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`

## Observability Impact

- Signals added/changed: `.yanote-ci/live-kafka-proof/` now retains header-sidecar stdout/stderr/report artifacts plus widened manifest metadata.
- How a future agent inspects this: rerun the async export/live-proof commands above and inspect `.yanote-ci/live-kafka-proof/artifact-manifest.txt`, `missing-header-*`, `invalid-header-*`, `unavailable-header-*`, and `unverifiable-header-*` files.
- Failure state exposed: regressions should show whether the break is exporter allowlisting, live-proof assertions, or public boundary wording.

## Inputs

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live Kafka proof script that already knows the sidecar paths but does not yet export a truthful retained bundle.
- `scripts/ci/export-async-proof-artifacts.sh` — allowlisted async exporter that still omits the widened header sidecars on success.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exporter contract test that already sketches the widened bundle expectations.
- `docs/guides/asyncapi-kafka.md` — public async guide that still says retained Kafka headers remain unverifiable.
- `docs/requirements.md` — public requirements owner doc that still treats retained header validation as deferred.
- `SUPPORT.md` — support intake doc that still tells users retained Kafka headers are unverifiable.
- `scripts/docs/verify-m005-s01-async-path.sh` — async path verifier that still expects the old under-claim.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — async boundary verifier that still expects the old under-claim.

## Expected Output

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live Kafka proof script aligned to widened header-sidecar exports.
- `scripts/ci/export-async-proof-artifacts.sh` — async exporter that retains header-drift sidecars on success.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — deterministic contract test for the widened async proof bundle.
- `docs/guides/asyncapi-kafka.md` — public async guide updated to the supported Kafka header boundary.
- `docs/requirements.md` — public requirements surface updated to treat Kafka header diagnostics as current supported truth.
- `SUPPORT.md` — support intake guidance updated to request the widened retained sidecars and redacted header evidence states.
- `scripts/docs/verify-m005-s01-async-path.sh` — async path verifier updated to the widened public boundary.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — async boundary verifier updated to the widened public boundary.
