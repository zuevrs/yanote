---
estimated_steps: 4
estimated_files: 6
---

# T01: Make the live AsyncAPI proof specs truthful with named schemas

**Slice:** S04 — Live Kafka Proof And Boundary Refresh
**Milestone:** M007

## Description

Load the `asyncapi-design` and `spring-kafka` skills, then retire the hidden false-green live-proof risk first. This task must replace the anonymous inline payload schemas in the two authoritative happy-path AsyncAPI fixtures with named component schemas that match the current Spring string payloads, and add one dedicated named-schema mismatch fixture for the same two-service evidence so later proof code can surface public `invalid-payload` diagnostics with retained schema ids.

## Steps

1. Inspect `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` and keep the current Spring Kafka runtime payload shape unchanged: the live proof should stay string-based, not switch the example app to object payloads.
2. Rewrite `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` so both messages use named `components.schemas` payload refs that match the current string evidence and avoid header schemas on the happy path.
3. Rewrite `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` the same way, then add `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` with retained named payload schemas that intentionally mismatch the same two-service string evidence.
4. Re-run the single-service and two-service live proof commands to confirm the truthful named-schema happy path stays green before the intentional schema-failure pass is wired in.

## Must-Haves

- [ ] Both happy-path live proof specs use retained named component payload schemas that truthfully match the current Spring string payloads and keep header validation out of the green path.
- [ ] A dedicated named-schema mismatch fixture exists for the same two-service Kafka evidence so public `invalid-payload` drift can be proved later without rewriting the Spring example runtime.

## Verification

- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`

## Observability Impact

- Signals changed: the authoritative happy-path AsyncAPI fixtures now retain named payload schema ids instead of anonymous inline payload definitions, and the new mismatch fixture preserves named schema references that future proof runs can surface as public `invalid-payload` diagnostics without changing the Spring runtime payloads.
- How to inspect: compare the updated fixture YAML under `yanote-js/test/fixtures/asyncapi/`, then run the two verifier scripts to confirm the live Kafka proof still stays green on truthful named string payload schemas.
- Failure visibility: if the Spring payload shape drifts or the named schemas stop matching the emitted string evidence, the verifier stack will fail in the async-report phase instead of silently passing through anonymous object payloads.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current Spring Kafka example payload shape that should stay string-based.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — current single-service live proof spec with anonymous inline payloads.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — current two-service live proof spec with anonymous inline payloads.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` — named component schema pattern that already produces retained parser schema ids.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — authoritative single-service verifier that consumes the happy-path spec.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative two-service verifier that consumes the happy-path spec.

## Expected Output

- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — happy-path single-service spec updated to truthful named payload schemas.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — happy-path two-service spec updated to truthful named payload schemas.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml` — new named-schema mismatch fixture for intentional live `invalid-payload` proof.
