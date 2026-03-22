---
id: T01
parent: S04
milestone: M007
provides:
  - Truthful named payload-schema fixtures for the live Spring Kafka proof path, plus a dedicated two-service mismatch spec that produces retained `invalid-payload` diagnostics against the same evidence.
key_files:
  - yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml
  - yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml
  - .gsd/milestones/M007/slices/S04/tasks/T01-PLAN.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Kept the Spring example runtime on string Kafka payloads and made the AsyncAPI proof fixtures truthful by moving to named component schemas instead of changing the Java example to object payloads.
patterns_established:
  - For live Kafka proof fixtures, use named `components.schemas` payload refs on the happy path and reuse the same named schema id in a dedicated mismatch fixture when you need retained public schema-drift diagnostics later.
observability_surfaces:
  - `.yanote-ci/live-kafka-proof/merged-two-service.events.jsonl`, `.yanote-ci/live-kafka-proof/yanote-async-report.json`, `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, and direct `async-report` runs against `spring-kafka-two-service-invalid-payload.yaml`
duration: ~1h
verification_result: passed
completed_at: 2026-03-20T19:28:41+03:00
blocker_discovered: false
---

# T01: Make the live AsyncAPI proof specs truthful with named schemas

**Replaced the live Spring Kafka proof fixtures with truthful named string payload schemas and added a dedicated invalid-payload mismatch spec.**

## What Happened

I loaded the `asyncapi-design` and `spring-kafka` skills, confirmed in `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` that the authoritative runtime still publishes and consumes plain `String` Kafka payloads, and left that Java path unchanged.

I then rewrote the two happy-path AsyncAPI fixtures so their message payloads now point at named `components.schemas` entries instead of anonymous inline object schemas: `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` now uses `UserCreatedPayload` and `UserRepublishedPayload`, and `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` now uses `UserCreatedPayload`. All three happy-path payload schemas are truthful `type: string` contracts, and I kept header schemas out of the green path.

To prepare the later retained red proof without touching the Spring runtime, I added `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`. It keeps the same two-service operation/message structure and the same retained schema id (`UserCreatedPayload`), but intentionally defines that payload as an object so the same merged Kafka evidence produces public `invalid-payload` diagnostics with a named schema id.

I also patched `.gsd/milestones/M007/slices/S04/tasks/T01-PLAN.md` to add the missing `## Observability Impact` section before implementation, updated `.gsd/STATE.md` to point at T02, marked T01 done in the slice plan, and recorded one operational gotcha in `.gsd/KNOWLEDGE.md`: these two Kafka-heavy verifier scripts should be run sequentially from one worktree, not in parallel.

## Verification

I ran the task verifiers against the real Spring Kafka path after the fixture rewrite:

- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

Both passed with the truthful named string payload schemas in place.

I also ran the broader slice automation stack from this intermediate task state, and all automated checks currently pass:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `git diff --check`

As an extra targeted proof for the new mismatch fixture, I ran `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml --events .yanote-ci/live-kafka-proof/merged-two-service.events.jsonl --out <temp> --min-coverage 100` and confirmed the analyzer exited non-zero with `diagnostics.counts.invalid-payload = 2` and retained `schemaId: "UserCreatedPayload"` in the generated report. That gives T02 a real named-schema failure surface to wire into exported artifacts.

The slice’s manual review item remains for the later docs/support refresh task, because T01 intentionally did not change the public docs named in that review checklist.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 0.22s |
| 2 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 0 | ✅ pass | 38.40s |
| 3 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 73.65s |
| 4 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 0.18s |
| 5 | `bash scripts/ci/verify-m005-s02-async-acceptance.sh` | 0 | ✅ pass | 111.37s |
| 6 | `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 0.23s |
| 7 | `git diff --check` | 0 | ✅ pass | 0.01s |

## Diagnostics

For the green path, inspect:

- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `.yanote-ci/live-kafka-proof/async-report.stdout`
- `.yanote-ci/live-kafka-proof/yanote-async-report.json`

For the future red path already enabled by this task, inspect:

- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`
- `.yanote-ci/live-kafka-proof/merged-two-service.events.jsonl`
- a direct analyzer run using the invalid fixture, which now yields `invalid-payload` diagnostics with retained `schemaId: UserCreatedPayload`

If the Spring runtime payload shape drifts away from strings, the happy-path verifier scripts will now fail in the async-report phase instead of silently passing through anonymous inline object payloads.

## Deviations

None.

## Known Issues

None in the implemented scope. My first verification attempt failed because I launched the single-service and two-service Kafka verifiers in parallel from the same worktree; rerunning them sequentially passed, and I documented that repo-specific gotcha in `.gsd/KNOWLEDGE.md`.

## Files Created/Modified

- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — replaced anonymous happy-path payload definitions with named string component schemas.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — replaced the anonymous happy-path payload definition with a named string component schema.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` — added a dedicated named-schema mismatch fixture for future retained `invalid-payload` proofing.
- `.gsd/milestones/M007/slices/S04/tasks/T01-PLAN.md` — added the missing `## Observability Impact` section required by the execution contract.
- `.gsd/milestones/M007/slices/S04/S04-PLAN.md` — marked T01 complete.
- `.gsd/STATE.md` — advanced the next action to T02.
- `.gsd/KNOWLEDGE.md` — recorded the sequential-only verifier gotcha for the Kafka proof scripts.
