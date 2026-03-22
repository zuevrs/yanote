---
estimated_steps: 4
estimated_files: 7
---

# T02: Retain intentional invalid-payload artifacts in the live Kafka proof stack

**Slice:** S04 — Live Kafka Proof And Boundary Refresh
**Milestone:** M007

## Description

Load the `bash-scripting`, `spring-kafka`, and `asyncapi-design` skills, then extend the authoritative two-service live proof in place. This task must keep the canonical happy-path async artifact names stable for CI/workflow readers, add a second intentional schema-drift analyzer pass against the named mismatch fixture from T01, retain inspectable `schema-failure-*` artifacts, and widen the exact bundle inventory tests so the live proof remains the single trusted delegate for runtime triage.

## Steps

1. Update `scripts/ci/verify-m004-s03-live-kafka-proof.sh` to run the current happy-path analyzer pass first, then rerun `async-report` against `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`, asserting a non-zero exit plus typed `invalid-payload` truth in stderr and `yanote-async-report.json` for that second pass.
2. Retain the second pass as additional files such as `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, and `schema-failure-yanote-async-report.json`, but preserve the canonical happy-path names `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json` for workflow summary and artifact readers.
3. Widen `scripts/ci/export-async-proof-artifacts.sh` so the export manifest/source-path bookkeeping and allowlist include the extra retained schema-failure files without inventing them on failure exports that abort before the second pass runs.
4. Update `scripts/ci/export-async-proof-artifacts.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs` to pin the widened deterministic bundle inventory and prove stale bundles are still replaced cleanly.

## Must-Haves

- [ ] The authoritative live proof keeps the canonical happy-path artifact trio stable while also retaining inspectable `schema-failure-*` stdout/stderr/report files for the intentional schema-drift pass.
- [ ] The intentional second analyzer pass proves public `invalid-payload` truth on merged two-service Kafka evidence and that widened bundle shape is locked down by exact tests.

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals added/changed: the live Kafka proof bundle gains retained `schema-failure-*` stdout/stderr/report artifacts alongside the canonical happy-path files.
- How a future agent inspects this: run `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and inspect `.yanote-ci/live-kafka-proof/`, `artifact-manifest.txt`, and `artifact-source-paths.txt`.
- Failure state exposed: typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` stderr output, non-zero schema-failure analyzer exit, and report diagnostics counts/items become inspectable without disturbing the canonical happy-path filenames.

## Inputs

- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` — named mismatch fixture produced by T01.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative two-service live proof delegate to widen in place.
- `scripts/ci/export-async-proof-artifacts.sh` — current allowlisted exporter for `.yanote-ci/live-kafka-proof`.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exact export-bundle inventory test that must widen with the new retained files.
- `scripts/ci/collect-yanote-artifacts.sh` — collector behavior that must continue copying the entire widened live-proof bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — exact collector inventory test that must widen with the new retained files.
- `.github/workflows/yanote-ci.yml` — canonical happy-path filenames and summary wiring that must remain unchanged.

## Expected Output

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — live proof delegate widened for the intentional schema-failure pass and retained artifacts.
- `scripts/ci/export-async-proof-artifacts.sh` — exporter allowlist/manifest logic widened for retained `schema-failure-*` files.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — export contract test updated for the widened deterministic bundle inventory.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector contract test updated for the widened live-proof bundle shape.
