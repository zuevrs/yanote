# S03: Live Multi-Service Kafka Proof Stack — UAT

**Milestone:** M004
**Written:** 2026-03-14

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S03 is a CI/runtime proof slice, so acceptance depends on executable live-broker verification plus direct inspection of generated evidence and retained failure artifacts rather than on manual UI behavior.

## Preconditions

- Docker/Testcontainers can start a Kafka broker locally.
- Java 21 and Node/npm are available in the repo environment.
- The working tree contains the S03 implementation, including `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/merge-async-events-jsonl.mjs`, and the `examples/springmvc-service` Kafka integration tests.
- No external Kafka cluster or secrets are required.

## Smoke Test

Run:

`bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

Expected: the command exits 0 and prints all four proof milestones in order: authoritative single-service proof passed, two-service raw proof passed, deterministic merge proof passed, and async analyzer proof passed.

## Test Cases

### 1. Role-scoped example service wiring stays deterministic

1. Run:
   `./gradlew :examples:springmvc-service:test --tests 'dev.yanote.examples.service.KafkaRoleScopedConfigurationTest'`
2. Inspect the passing test output.
3. **Expected:** the producer-only configuration boots without listener beans/self-consume wiring, the consumer-only configuration boots without producer/republish wiring, and the role-scoped Spring context contract passes.

### 2. Deterministic multi-service JSONL merge stays locked

1. Run:
   `node --test scripts/ci/merge-async-events-jsonl.test.mjs`
2. Confirm both subtests pass.
3. **Expected:** the helper proves lexicographic input ordering, preserves original per-file line order, and reports a clear error if invoked without input files.

### 3. Live single-service republish proof still passes inside the composed verifier

1. Run:
   `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
2. Watch the first phase of output.
3. **Expected:** the verifier first runs the authoritative single-service republish proof and reports `Single-service proof passed.` before starting the two-service path.

### 4. Live two-service Kafka handoff produces truthful per-service evidence and merged analyzer input

1. Run:
   `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
2. Confirm the output includes:
   - `Two-service raw proof passed: producer_records=2 consumer_records=1 ...`
   - `Deterministic merge proof passed: merged_records=3 ordered_inputs=...01-producer.events.jsonl,...02-consumer.events.jsonl`
   - `Async analyzer proof passed: channels=1/1 operations=2/2 messages=2/2 ...`
3. **Expected:**
   - the producer role contributes exactly one HTTP record and one `kafka send` record
   - the consumer role contributes exactly one `kafka receive` record
   - the merged file is deterministic concatenation, not timestamp re-sorted output
   - `yanote async-report` accepts the merged file directly with full async coverage for the two-service fixture.

### 5. Required CI workflow wiring remains merge-blocking and topology-stable

1. Run:
   `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`
2. Review the passing assertions.
3. **Expected:** the workflow contract confirms that `Run live Kafka proof stack` exists inside `build-and-test`, appears after `Run JVM tests` and `Run analyzer tests`, and keeps the `build-and-test` → `yanote-validation` → `v1-e2e` dependency chain intact.

## Edge Cases

### Retained analyzer failure diagnostics stay inspectable

1. Run:
   `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --retain-temp-on-failure --simulate-analyzer-failure`
2. Confirm the command exits with status 1.
3. Inspect the reported retained paths.
4. **Expected:**
   - raw producer/consumer assertions and deterministic merge pass before failure
   - stderr contains `YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE`
   - retained artifacts include `01-producer.events.jsonl`, `02-consumer.events.jsonl`, `merged-two-service.events.jsonl`, `merge.log`, `async-report.stdout`, and `async-report.stderr`.

### Two-service raw evidence preserves suite/run attribution across the broker hop

1. In the retained temp directory from the previous test, open `01-producer.events.jsonl` and `02-consumer.events.jsonl`.
2. Verify the JSON lines include the same `test.run_id` and `test.suite` values in both files.
3. **Expected:** producer and consumer files both carry `m004-s03-two-service-run` and `m004-s03-two-service-suite`, proving attribution survived HTTP → Kafka → consumer handling.

## Failure Signals

- `KafkaRoleScopedConfigurationTest` fails because producer-only or consumer-only mode still boots the wrong beans/listeners.
- `merge-async-events-jsonl.test.mjs` fails because file ordering or per-file line preservation changed.
- `verify-m004-s03-live-kafka-proof.sh` exits non-zero on the happy path, or no longer prints all four proof milestones.
- Two-service raw proof reports the wrong record counts, missing `test.*` attribution, or swapped/mixed service names.
- `merge.log` no longer exposes deterministic `ordered_inputs=` with `01-producer` before `02-consumer`.
- Workflow contract tests fail because the live Kafka proof step moved, disappeared, or was split into a new job.

## Requirements Proved By This UAT

- R042 — producer-side Kafka evidence capture reaches analyzer-ready normalized evidence on a real broker.
- R043 — consumer-side Kafka evidence capture reaches analyzer-ready normalized evidence on a real broker.
- R044 — suite/run metadata survives the supported Kafka propagation paths into raw async evidence.
- R045 — both required live Kafka scenarios are proven: single-service republish and two-service producer→consumer.
- R046 — the async stack is protected by merge/helper tests, integration tests, end-to-end verifier composition, retained failure diagnostics, and required CI workflow coverage.

## Not Proven By This UAT

- R047 — async user-facing onboarding/support documentation and public boundary communication still belong to M005.
- R048 — final release-grade async product trust surface is only advanced here; M005 still owns final composed acceptance and public-facing hardening.
- Payload validation against AsyncAPI schemas is intentionally not covered.

## Notes for Tester

- The simulated failure path is intentional; it uses the wrong AsyncAPI fixture on purpose so that retained artifacts show a real analyzer gate rejection after upstream proof stages already passed.
- Ignore ordinary Gradle/Testcontainers startup noise unless it changes the proof result or hides the structured `YANOTE_ASYNC_*` lines.
- If the happy-path verifier fails, rerun with `--retain-temp-on-failure` first; that is the fastest route to the authoritative raw evidence and merge diagnostics for this slice.
