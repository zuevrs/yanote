# S04: Live Kafka Proof And Boundary Refresh

**Goal:** Make M007’s stronger async schema truth real on the authoritative Spring Kafka proof path and align the public async boundary docs/support surfaces with what that runtime path now actually proves.
**Demo:** Running `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` exports `.yanote-ci/live-kafka-proof/` with the canonical green `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json` trio plus retained `schema-failure-*` artifacts that show typed `invalid-payload` drift for the same merged Kafka evidence, while the public async docs/support verifiers pass with wording that claims payload-schema drift only for the proven Kafka path and still preserves the header, broker, and separate-report boundaries.

## Must-Haves

- Happy-path live AsyncAPI specs use retained named component payload schemas that truthfully match the current Spring string evidence, and one dedicated named-schema mismatch fixture exists so the real Kafka proof can surface public `invalid-payload` diagnostics instead of relying on anonymous false-green payload definitions, directly advancing S04’s support role for validated R065.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` keeps the canonical happy-path async artifact filenames stable for CI/workflow consumers while also retaining inspectable schema-failure stdout/stderr/report artifacts and exact bundle-contract tests.
- Public async docs/support surfaces stop claiming `payload-schema enforcement пока нет`, describe the now-proven payload-schema drift truth plus the still-unverifiable header boundary, and keep Kafka-only / Spring Kafka-first / separate async report-gate wording truthful and mechanically verified.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `git diff --check`
- Manual review — compare `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`, `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`, `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` to confirm payload-schema drift is claimed only for the proven Kafka path, headers are still described as unverifiable, and no broker-agnostic or combined-report promise was introduced.

## Observability / Diagnostics

- Runtime signals: canonical happy-path `async-report.*` / `yanote-async-report.json` artifacts plus retained `schema-failure-*` stdout/stderr/report files in `.yanote-ci/live-kafka-proof/`.
- Inspection surfaces: `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `.yanote-ci/live-kafka-proof/`, `scripts/ci/export-async-proof-artifacts.test.mjs`, `scripts/ci/collect-yanote-artifacts.test.mjs`, and the async docs verifier scripts.
- Failure visibility: proof phase logs, typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` stderr lines, `diagnostics.counts.invalid-payload`, artifact manifest/source-path notes, and the composed acceptance stack all stay inspectable when the live proof drifts.
- Redaction constraints: never print secret values, raw payload bodies, or unretained Kafka headers; keep public diagnostics limited to operation keys, schema ids, counters, and redacted reason text.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/test/fixtures/asyncapi/*.yaml`, `examples/springmvc-service`, `scripts/ci/verify-m004-s02-metadata-propagation.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/collect-yanote-artifacts.sh`, `.github/workflows/yanote-ci.yml`, and the public async docs/support surfaces.
- New wiring introduced in this slice: named-schema live proof fixtures and an intentional schema-failure analyzer pass exported beside the canonical happy-path artifacts, plus docs verifiers rewritten around that runtime truth.
- What remains before the milestone is truly usable end-to-end: nothing inside M007; retained header evidence, combined HTTP+async surfaces, and non-Kafka brokers remain future-scope outside this milestone.

## Tasks

- [x] **T01: Make the live AsyncAPI proof specs truthful with named schemas** `est:45m`
  - Why: The current green live proofs can pass through anonymous inline object payload schemas that never publish public schema drift, so S04 must first make the happy-path contract truthful before adding a real red proof.
  - Files: `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`
  - Do: Load the `asyncapi-design` and `spring-kafka` skills, replace the anonymous inline payload definitions in both live proof specs with named `components.schemas` payload refs that match the current Spring string evidence, keep header schemas out of the happy path because retained Kafka headers are still unavailable, and add one dedicated named-schema mismatch spec for the same two-service evidence so the later proof step can surface public `invalid-payload` diagnostics with retained schema ids.
  - Verify: `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: both live proof commands stay green against named string payload schemas and the repo contains a dedicated named-schema mismatch fixture for the same Kafka evidence.
- [x] **T02: Retain intentional invalid-payload artifacts in the live Kafka proof stack** `est:1h15m`
  - Why: After the green path is truthful, the authoritative live proof must prove that the stronger async contract really fails on real Kafka evidence without breaking the canonical CI summary/workflow filenames.
  - Files: `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.test.mjs`, `scripts/ci/collect-yanote-artifacts.test.mjs`
  - Do: Load the `bash-scripting`, `spring-kafka`, and `asyncapi-design` skills, extend `verify-m004-s03-live-kafka-proof.sh` so it runs the current happy-path analyzer pass first and then a second analyzer pass against the named mismatch spec, assert a non-zero exit with typed `invalid-payload` truth in stderr/report for that second pass, retain the extra artifacts as `schema-failure-*` files, keep the canonical happy-path `async-report.stdout`, `async-report.stderr`, and `yanote-async-report.json` filenames unchanged for workflow/summary readers, and widen the exporter/collector bundle tests to the new inventory.
  - Verify: `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: the exported live-kafka bundle contains both the stable happy-path artifact trio and retained `schema-failure-*` artifacts with typed `invalid-payload` truth, and the overall verifier still succeeds because the red sub-run is expected and asserted.
- [x] **T03: Rewrite the public async boundary around the proven Kafka schema surface** `est:1h`
  - Why: The docs/support surfaces still underclaim payload-schema truth and would become misleading once the runtime proof lands, so the published boundary must be refreshed in lockstep with the new proof.
  - Files: `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Do: Load the `asyncapi-design` and `bash-scripting` skills, rewrite the public async guide/support wording so it states that payload-schema drift is surfaced for the proven Kafka evidence path while routing percentages remain routing-first, headers remain unretained/unverifiable, and the surface stays Kafka-only / Spring Kafka-first / separate async report-gate; narrow deferred follow-ons in `docs/requirements.md` to the still-unshipped gaps instead of claiming payload validation is absent; and update the doc verifier scripts so they reject the stale “payload-schema enforcement пока нет” wording while still enforcing the remaining broker/header boundaries and canonical proof links.
  - Verify: `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh && node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs && git diff --check`
  - Done when: the public docs no longer claim payload schema is unsupported, still preserve the header and non-broker-agnostic boundaries, and the composed acceptance stack passes without changing its delegated stage topology or canonical happy-path filenames.

## Files Likely Touched

- `yanote-js/test/fixtures/asyncapi/spring-kafka-single-service-republish.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-payload.yaml`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
