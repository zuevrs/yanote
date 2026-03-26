---
estimated_steps: 4
estimated_files: 3
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T04: Ship the live RabbitMQ proof script and retained artifact bundle

**Slice:** S02 — Live RabbitMQ recorder and proof path
**Milestone:** M015

## Description

Close the slice with a rerunnable proof command and exported bundle that turns the new live RabbitMQ evidence into inspectable AMQP async artifacts without pretending Kafka-only companions exist.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `node yanote-js/dist/yanote.cjs async-report` | Fail closed and retain stdout/stderr/report paths; no bundle success without a valid AMQP report | Proof script timeouts on tests or CLI runs retain the temp dir and exact source paths for inspection | Invalid report or manifest shape aborts export and surfaces the exact missing artifact |
| `scripts/ci/export-async-proof-artifacts.sh` | Refuse to call the bundle complete when primary AMQP artifacts are missing | N/A | Mark Kafka-only companion files as explicit `none` for AMQP instead of fabricating outputs |

## Load Profile

- **Shared resources**: temp proof directories, merged JSONL, and exported `.yanote-ci/live-rabbitmq-proof` artifacts.
- **Per-operation cost**: one example test run, one merge, one `async-report` invocation, and one bundle export.
- **10x breakpoint**: repeated proof runs mostly stress container startup and file I/O rather than analyzer CPU.

## Negative Tests

- **Malformed inputs**: missing merged events file or missing primary report/HTML outputs.
- **Error paths**: analyzer non-zero exit, exporter missing required happy-path artifacts, or unexpected stderr on the AMQP happy path.
- **Boundary conditions**: AMQP success bundles with intentionally absent `runtime-selected-*` and `schema-failure-*` companions, and manifest/source-path notes that record those absences as `none`.

## Steps

1. Add `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` that runs the RabbitMQ two-service example test, merges producer/consumer events, invokes the built `async-report`, and asserts `protocols=amqp`, covered send/receive operations, and zero or empty Kafka-only additive sections.
2. Adapt `scripts/ci/export-async-proof-artifacts.sh` plus its test coverage so AMQP happy-path bundles can succeed while recording runtime-selected/schema-failure companions as intentional absence.
3. Export a deterministic `.yanote-ci/live-rabbitmq-proof/` bundle with retained JSONL, stdout/stderr, `yanote-async-report.json`, `yanote-async-report.html`, `artifact-manifest.txt`, and `artifact-source-paths.txt`.
4. Ensure proof output and exported artifacts stay redaction-safe and print high-signal failure locations when the live RabbitMQ path drifts.

## Must-Haves

- [ ] One command reruns the live RabbitMQ proof end to end from Spring-generated AMQP evidence to retained async report artifacts.
- [ ] Exported AMQP bundles make Kafka-only companions explicitly absent rather than falsely present or silently ignored.

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
- `npm -C yanote-js run build && bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`
- Expect the retained bundle to show `protocols=amqp`, full coverage for the live send/receive proof, and explicit `none` markers for Kafka-only companions.

## Observability Impact

- Signals added/changed: `.yanote-ci/live-rabbitmq-proof/artifact-manifest.txt`, `.yanote-ci/live-rabbitmq-proof/artifact-source-paths.txt`, merged AMQP JSONL, and `async-report.stdout` with the final `YANOTE_ASYNC_SUMMARY` line.
- How a future agent inspects this: rerun the exporter contract tests or the live proof script, then inspect the retained bundle and temp dir paths it prints.
- Failure state exposed: missing primary artifacts, analyzer drift, or accidental companion fabrication appears as exact manifest/source-path mismatches and explicit proof-script errors.

## Inputs

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — existing live async proof structure to adapt honestly.
- `scripts/ci/export-async-proof-artifacts.sh` — current async bundle exporter that assumes Kafka companions.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exporter contract coverage to extend for AMQP absence semantics.
- `scripts/ci/merge-async-events-jsonl.mjs` — deterministic merge utility for split async evidence.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java` — live RabbitMQ evidence producer from T03.
- `yanote-js/test/fixtures/asyncapi/spring-rabbitmq-two-service.yaml` — live proof analyzer fixture from T03.

## Expected Output

- `scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` — rerunnable live RabbitMQ proof command.
- `scripts/ci/export-async-proof-artifacts.sh` — exporter updated for AMQP companion absence semantics.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — deterministic contract coverage for the updated exporter.
