# S04 — Research

**Date:** 2026-03-20

## Summary

There are **no Active GSD requirement IDs** left for S04 to newly own; this slice is closing the milestone’s runtime-trust and public-boundary gap for already-validated async schema work (`R049` / `R065`) by proving it on the real Spring Kafka path and making the docs truthful again. The codebase already has the analyzer semantics, public async diagnostics, gate behavior, CI summary fallback, and artifact export stack from S03. What is still missing is a live proof that actually exercises those schema-depth semantics instead of only proving routing.

The biggest finding is that the current live Kafka proofs are **not yet a trustworthy schema-depth runtime proof** even though they stay green. `examples/springmvc-service` publishes plain string payloads (`"alice"`), while both live-proof AsyncAPI specs (`yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` and `.../spring-kafka-two-service.yaml`) declare **inline anonymous `type: object` payload schemas**. That mismatch does not surface publicly because `yanote-js/src/coverage/asyncCoverage.ts` only publishes schema diagnostics when `schemaId` is a retained non-anonymous parser id; inline payloads normalize to `<anonymous-schema-N>` and stay internal-only. So the current live proof can pass green without proving the shipped schema-depth contract.

The least-invasive fix is **spec-first, not runtime-first**. Keep the current Spring example payloads as strings, switch the happy-path live-proof specs to **named component payload schemas** that match the real string evidence, and add a second intentional schema-failure analyzer run inside `scripts/ci/verify-m004-s03-live-kafka-proof.sh` using a dedicated named-schema spec that mismatches the same evidence and must emit `invalid-payload`. That gives one truthful green proof, one inspectable red proof artifact, and avoids unnecessary churn in Spring Kafka serializers/deserializers, Java example tests, and README snippets.

## Recommendation

Take a **named-schema proof refresh** approach:

1. **Make the existing happy-path live proofs truthful** by replacing the current anonymous inline payload schemas in:
   - `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`
   - `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
   with **named component schemas** that describe the actual current string payloads.
2. **Add one dedicated schema-failure spec** (new fixture) that uses retained named payload schemas and intentionally mismatches the same live string evidence so `async-report` must fail closed with public `invalid-payload` diagnostics.
3. **Extend `scripts/ci/verify-m004-s03-live-kafka-proof.sh` in place** to run that intentional schema-failure step, assert the typed stderr/report truth, and retain the failure artifacts alongside the existing happy-path bundle.
4. **Refresh public async docs and grep-based doc verifiers together** so the published boundary changes from “payload-schema enforcement пока нет” to the now-truthful boundary: payload schema drift is surfaced for supported Kafka evidence, routing percentages remain routing-first, headers are still not retained and therefore remain unverifiable/fail-closed, and the path is still Kafka-only / Spring Kafka-first / separate async report-gate.

Why this approach:

- It fixes the real blind spot: today’s live proof uses anonymous schemas that cannot produce public schema-depth drift.
- It keeps CI and workflow topology stable because `.github/workflows/yanote-ci.yml` and `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` already hard-code `scripts/ci/verify-m004-s03-live-kafka-proof.sh` as the authoritative delegate.
- It avoids a wider Spring rewrite. `yanote-recorder-spring-kafka` already supports JSON-safe structured payload capture (`KafkaPayloadCapture` handles `Map`, iterables, arrays, `JsonNode`, primitives), but changing the example service to emit object payloads would also require serializer/deserializer changes in `examples/springmvc-service/src/main/resources/application.properties`, Java type changes in `ExampleServiceApplication`, and assertion updates across both example integration tests.
- It follows the loaded skills: the Spring Kafka skill favors staying on the existing integration-test/Testcontainers seam instead of inventing a new broker harness, and the Bash/Vitest/test skills all favor preserving the current verifier/test patterns rather than introducing a parallel proof runner.

## Implementation Landscape

### Key Files

- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — **primary execution seam** for S04. Today it runs: single-service proof → two-service Gradle test → deterministic merge → one happy-path `async-report` run → artifact export. Extend this file rather than creating a new top-level proof script, because acceptance and CI already delegate to it.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — authoritative single-service live proof. It builds `yanote-js` and runs `async-report` against `spring-kafka-single-service-republish.yaml`. If the happy-path spec is made truthful, this script becomes a real schema-validation green proof instead of a routing-only green proof.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml` — current single-service live-proof contract. Right now it uses inline anonymous `type: object` payloads, which do **not** generate public schema-depth diagnostics.
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml` — current two-service live-proof contract with the same anonymous-inline problem.
- `yanote-js/test/fixtures/asyncapi/schema-depth-v3.yaml` and `.../schema-depth-v2.yaml` — existing examples of the **right AsyncAPI pattern** for public schema-depth diagnostics: named component schemas (`OrderCreatedPayload`, `OrderEventHeaders`) that survive parsing as retained `x-parser-schema-id` values.
- `yanote-js/src/coverage/asyncCoverage.ts` — critical boundary reference. `isPublicSchemaDiagnostic()` only lets schema diagnostics through when `schemaId` is a retained non-anonymous id; inline `<anonymous-schema-N>` payload ids stay internal.
- `yanote-js/src/coverage/asyncSchemaConformance.ts` — critical boundary reference for live-proof design. Any retained `headersSchemaId` produces `unverifiable-headers` because Kafka evidence still does not retain observed headers. Happy-path live specs must therefore avoid header schemas unless the goal is an intentional fail-closed header proof.
- `scripts/ci/export-async-proof-artifacts.sh` — exports the live Kafka bundle to `.yanote-ci/live-kafka-proof`. It is a **flat allowlist** with exact required-on-success names. If S04 retains extra failure artifacts, this allowlist must grow deliberately.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — exact file-count/file-name contract for the exported bundle. Any new retained failure files require updating the expected inventory and manifest assertions.
- `scripts/ci/collect-yanote-artifacts.sh` — copies `.yanote-ci/live-kafka-proof` into the build artifact directory. It already copies the whole directory, so extra files can ride through unchanged once the exporter emits them.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — exact bundle-shape contract for the collector; must be updated if bundle contents grow.
- `.github/workflows/yanote-ci.yml` — the build job’s async summary wiring is still pinned to:
  - `live-kafka-proof/yanote-async-report.json`
  - `live-kafka-proof/async-report.stdout`
  - `live-kafka-proof/async-report.stderr`
  Keep those canonical happy-path filenames stable unless willing to update workflow + contract tests.
- `scripts/ci/render-yanote-summary.mjs` — reads the canonical async report/stdout/stderr and only lists the first four flat files from the bundle. Extra retained failure artifacts are safe, but they will not be summarized unless explicitly promoted.
- `docs/guides/asyncapi-kafka.md` — public async guide; currently still says `payload-schema enforcement пока нет` and explains 100% message coverage as not implying payload validation. This is the most important public wording refresh.
- `docs/release-and-support.md` — public owner surface with the same stale async clause.
- `docs/requirements.md` — public requirements owner surface. It still says first-wave async has no payload-schema enforcement, keeps `ASYNC-01` deferred, and keeps current-wave payload validation explicitly out of scope. This needs the most careful rewrite.
- `SUPPORT.md` — public support intake surface with the same stale clause.
- `scripts/docs/verify-m005-s01-async-path.sh` — grep-based contract for the async guide and landing pointers. It hard-codes the stale phrase and must be updated with the docs.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — grep-based contract for `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`. It also hard-codes the stale phrase and the deferred payload-validation wording.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — only touch this if choosing the broader runtime payload-shape change. It currently publishes and consumes `String` payloads and sets the `yanote.message` header.
- `examples/springmvc-service/src/main/resources/application.properties` — only touch this if switching the example service to JSON object payloads; it currently pins `StringSerializer` / `StringDeserializer` for Kafka values.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderSingleServiceIntegrationTest.java` — asserts string payloads and the republish path. Needed only for the broader runtime-change option.
- `examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java` — asserts producer/consumer split and string payload semantics. Also only needed for the broader runtime-change option.
- `yanote-recorder-spring-kafka/src/main/java/dev/yanote/recorder/springkafka/KafkaPayloadCapture.java` — proof that the recorder already supports structured JSON-safe payloads if later slices want live object payloads; not required for the recommended S04 path.
- `yanote-recorder-spring-kafka/src/test/java/dev/yanote/recorder/springkafka/KafkaMetadataPropagationContractTest.java` — existing recorder test showing map payload capture works and test metadata survives. Useful if the executor decides to widen the example runtime instead of staying spec-first.

### Build Order

1. **Retire the hidden false-green live-proof risk first.**
   - Update the current live-proof specs so the green path uses **named schemas that match actual string evidence**.
   - Add one dedicated named-schema failure spec that must produce public `invalid-payload` truth.
   This is the highest-risk seam because everything else (docs/support wording) depends on what the runtime actually proves.

2. **Extend the authoritative two-service proof script in place.**
   - Keep the current happy-path `async-report` canonical output names unchanged for CI summary compatibility.
   - Add the intentional schema-failure analyzer run after the happy-path proof and assert the failure artifact contents.
   - If extra failure files are retained, widen the exporter/collector allowlists and their exact-shape tests in the same task.

3. **Refresh public boundary docs and doc verifiers together.**
   - Update `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` in one pass.
   - Immediately update `scripts/docs/verify-m005-s01-async-path.sh` and `...async-boundaries.sh` to enforce the new truthful wording instead of the stale first-wave clause.

4. **Run the acceptance composition last.**
   - `scripts/ci/verify-m005-s02-async-acceptance.sh` remains the authoritative composed verifier and should stay delegation-only.

### Verification Approach

Proof/runtime stack:

- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`

Shell/export/collector contracts:

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs`
- `node --test scripts/ci/collect-yanote-artifacts.test.mjs`
- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs`
- `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs`

Docs/boundary contracts:

- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`

Finish with:

- `git diff --check`

Observable behaviors to assert after S04:

- the happy-path single-service and two-service live proofs still pass green;
- the happy-path live specs no longer rely on anonymous inline payload schemas to stay green;
- the two-service proof also produces a retained intentional schema-failure artifact set with typed `invalid-payload` truth in `stderr` and `yanote-async-report.json`;
- public docs no longer claim `payload-schema enforcement пока нет`, but still explicitly preserve Kafka-only / Spring Kafka-first / separate async report-gate / non-broker-agnostic boundaries and the current header limitation.

## Constraints

- **No Active GSD requirement IDs remain for S04.** This slice is proving and documenting already-validated async schema behavior, not adding a new analyzer semantic family.
- **Public async schema diagnostics require retained named parser schema ids.** Inline payload schemas normalize to `<anonymous-schema-N>` and are filtered out by `isPublicSchemaDiagnostic()` in `yanote-js/src/coverage/asyncCoverage.ts`.
- **Observed Kafka headers are still not retained in evidence.** Any live proof spec that declares named headers will emit `unverifiable-headers` and fail closed via `yanote-js/src/coverage/asyncSchemaConformance.ts`.
- **The authoritative proof delegate is already stable.** `scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs` and `.github/workflows/yanote-ci.yml` hard-code `scripts/ci/verify-m004-s03-live-kafka-proof.sh` and the canonical async artifact names.
- **Export/collector tests assert exact file inventories.** Growing the live-kafka bundle requires synchronized updates to `scripts/ci/export-async-proof-artifacts.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs`.
- **The example Spring service currently emits string Kafka values.** A runtime-payload-shape rewrite is possible, but it is broader than the minimum S04 need because it spills into serializer/deserializer config, Java types, and example assertions.

## Common Pitfalls

- **Fixing the docs before fixing the proof specs** — this would overclaim support while the live proof still passes through anonymous schema ids that cannot publish public schema drift.
- **Keeping named header schemas in a happy-path live spec** — the analyzer will correctly fail closed as `unverifiable-headers` because observed headers are still absent from retained Kafka evidence.
- **Replacing the canonical async artifact trio with failure-run files** — `.github/workflows/yanote-ci.yml` and the async summary renderer are pinned to `yanote-async-report.json`, `async-report.stdout`, and `async-report.stderr`. Keep those names as the happy-path canonical files and add new filenames for extra failure artifacts.
- **Choosing the Java/runtime rewrite by default** — moving the example service from `String` Kafka values to object payloads is doable, but it is not the cheapest way to prove S04. The spec-first path gets truthful runtime proof with much less blast radius.

## Open Risks

- If product wants the **GitHub Step Summary itself** to surface the intentional schema-failure run (not just upload the artifacts), then `scripts/ci/render-yanote-summary.mjs` or workflow wiring will also need widening; extra bundle files alone are retained but not interpreted.
- `docs/requirements.md` needs careful wording because it currently mixes “first-wave async boundary” language with deferred `ASYNC-01`. The remaining deferred scope will likely need to be narrowed to what is still genuinely deferred (for example: combined HTTP+async report, non-Kafka brokers, header capture, or broader schema-depth breadth), not the now-shipped payload-validation truth.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| AsyncAPI | `asyncapi-design` | available |
| Spring Kafka | `spring-kafka` | available |
| Bash CI/verifier scripts | `bash-scripting` | available |
| Node/Vitest contract tests | `vitest` | available |

No additional skill installs were needed; the directly relevant skills were already available in the environment.
