---
id: T02
parent: S03
milestone: M010
provides:
  - Durable resume notes for the live Kafka header-drift proof task, including the concrete sidecar/export wiring plan and the exact repository surfaces already verified.
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.test.mjs
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
key_decisions:
  - No product code was changed in this cutoff unit; the next executor should resume from the inspected publisher/proof/export surfaces instead of re-researching the slice.
patterns_established:
  - The live proof already has a stable happy-path plus runtime-selection and schema-failure sidecars; T02 should extend that exact pattern with four additive header-drift sidecars and matching exporter coverage rather than inventing a new proof flow.
observability_surfaces:
  - .yanote-ci/live-kafka-proof/
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java
duration: 0h32m
verification_result: not-run
completed_at: 2026-03-25T00:15:14+03:00
blocker_discovered: false
---

# T02: Extend the live Kafka proof bundle with additive header-drift sidecars

**Captured durable T02 resume notes for the live Kafka header-drift proof before the context-budget cutoff.**

## What Happened

I followed the required startup flow for this unit: activated the requested skills, read `.gsd/STATE.md`, the S03 slice plan, the T02 task plan, and the T01 handoff summary, then inspected the exact implementation surfaces called out by the plan.

I verified the current publisher/runtime side of the proof in:

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/YanoteKafkaHeaders.java`
- `scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`

I also traced the real header-diagnostic triggers in the async analyzer/runtime stack:

- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.diagnostics.test.ts`
- `yanote-js/src/model/asyncEvent.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`

The concrete local finding is that T02 is still fully open, but the implementation path is now narrow and specific:

1. **Sensitive-header runtime proof** should be added in `KafkaMessagePublisher.publish()` with a proof-only Kafka header whose key contains a redaction trigger such as `secret`/`token`, because `YanoteKafkaHeaders.isSensitiveHeader()` redacts any header whose normalized key contains `authorization`, `cookie`, `token`, `secret`, `password`, `api-key`, `apikey`, `credential`, `session`, or `jwt`.
2. **Missing-header sidecar** can be authored as a two-service AsyncAPI variant that requires one extra `yanote.*` header that the proof does not emit.
3. **Invalid-header sidecar** can be authored deterministically against an existing retained header such as `yanote.message` by declaring a wrong `const` value, which should yield `ASYNC_SEMANTIC_INVALID_HEADER` without depending on environment-specific run IDs.
4. **Unavailable-header sidecar** should depend on the new proof-only sensitive header so the live retained evidence shows `state=redacted` and `reason=sensitive` rather than a synthetic mutation.
5. **Unverifiable-headers sidecar** does not need an in-memory override: the analyzer already emits `unverifiable-headers` for real header schemas that cannot be compiled into validation-ready JSON Schema. A practical spec-side trigger is a header schema that compiles to an invalid AJV schema, e.g. a property regex pattern that is syntactically invalid, which should drive the `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS` path truthfully from authored AsyncAPI input.
6. **Exporter/test wiring** should remain additive: the live proof already exports happy-path, runtime-selection, and schema-failure sidecars. T02 should mirror that exact artifact pattern for `missing-header`, `invalid-header`, `unavailable-header`, and `unverifiable-headers`, and extend `scripts/ci/export-async-proof-artifacts.test.mjs` counts/file lists accordingly.

I intentionally stopped before editing any code or running proof verification because the context-budget warning arrived while I was still in the inspection/design phase. I did not want to start partial file edits without enough room left to verify them.

## Verification

No task verification commands were run in this cutoff unit.

I only performed repository inspection and code-path tracing with `read` plus focused `rg` searches to establish the exact runtime/export surfaces and the truthful diagnostic triggers the next executor should implement.

## Verification Evidence

No verification commands were run in this unit because implementation was intentionally stopped at the context-budget warning before code changes were started.

## Diagnostics

The next executor should resume directly from these already-confirmed local facts:

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` currently exports exactly three retained proof surfaces: happy path, runtime selection, and schema failure.
- `scripts/ci/export-async-proof-artifacts.sh` and `scripts/ci/export-async-proof-artifacts.test.mjs` are the places that must be widened for any new sidecar stdout/stderr/report files.
- `YanoteKafkaHeaders.retainHeaderValue()` will produce the real unavailable-header proof if the emitted header key includes a sensitive token such as `secret` or `token`; the retained evidence becomes `{ state: "redacted", reason: "sensitive" }` and the raw value is removed.
- `computeAsyncSchemaConformance()` emits:
  - `missing-header` when a required declared header is absent from captured and unavailable evidence,
  - `unavailable-header` when a declared header is present but retained as `redacted` or `omitted`,
  - `invalid-header` when captured header values fail AJV validation,
  - `unverifiable-headers` when header validation capability is unsupported or AJV compilation fails.
- `yanote-js/src/gates/asyncEvaluator.ts` maps the four target diagnostics to the concrete stderr codes the proof script should assert:
  - `ASYNC_SEMANTIC_MISSING_HEADER`
  - `ASYNC_SEMANTIC_UNAVAILABLE_HEADER`
  - `ASYNC_SEMANTIC_INVALID_HEADER`
  - `ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS`

Recommended resume order for the next executor:

1. Edit `ExampleServiceApplication.java` to emit one proof-only sensitive header.
2. Add the four AsyncAPI sidecar specs under `yanote-js/test/fixtures/asyncapi/`.
3. Extend `scripts/ci/verify-m004-s03-live-kafka-proof.sh` to run and assert the four sidecars.
4. Extend `scripts/ci/export-async-proof-artifacts.sh` and `scripts/ci/export-async-proof-artifacts.test.mjs` for the new files.
5. Run `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`.

## Deviations

- No implementation work landed in this unit because the context-budget warning arrived during the inspection phase.
- I did not start speculative edits or partial script rewrites without enough remaining context to verify them.

## Known Issues

- T02 remains unimplemented in the repository at the end of this cutoff unit.
- The slice plan checkbox for T02 is still intentionally unchecked because no product changes were landed.
- The repository still lacks the four authored two-service header-drift sidecar specs and the matching exported proof artifacts.

## Files Created/Modified

- `.gsd/milestones/M010/slices/S03/tasks/T02-SUMMARY.md` — durable wrap-up summary with exact inspected surfaces, truthful diagnostic triggers, and a concrete resume sequence for the next executor.
