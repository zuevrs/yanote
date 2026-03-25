# S03: Async Kafka Header Validation As A Supported Core Surface

**Goal:** Promote Kafka header diagnostics from partly hidden analyzer behavior into a proven Kafka-only async surface by making missing, invalid, unavailable, and unverifiable header outcomes reachable from real AsyncAPI inputs, live proof bundles, CI summaries, and support docs.
**Demo:** Running `async-report` against authored header-drift fixtures and the live Spring Kafka proof bundle yields deterministic typed header diagnostics, the retained `.yanote-ci/live-kafka-proof/` artifacts expose redacted failure context without leaking secrets, GitHub summary rendering selects the correct async semantic code, and the docs/verifier stack describes the same Kafka-only boundary.
**Active requirements:** Owns `R034`; supports `R002`, `R003`, `R005`.

## Must-Haves

- Real AsyncAPI fixtures loaded through `loadAsyncApiSemanticsBundle()` prove the public reachability of `missing-header`, `invalid-header`, `unavailable-header`, and `unverifiable-headers` without relying on in-memory contract mutation.
- The live Kafka proof bundle stays additively green on its happy path while exporting retained header-drift sidecars that fail closed on missing, invalid, unavailable, and unverifiable header diagnostics.
- CI/user-facing summary surfaces map header diagnostics to the right async semantic codes and precedence instead of omitting them behind payload-era summary logic.
- Public docs, support guidance, and async boundary verifiers describe Kafka header diagnostics as supported Kafka-only async truth without widening into broker-agnostic or combined HTTP+async promises.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/cli.async-report.test.ts src/cli.async-report.contract.test.ts src/gates/asyncEvaluator.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh`

## Observability / Diagnostics

- Runtime signals: `yanote-async-report.json` diagnostics counts/items, `YANOTE_ASYNC_ERROR*` lines, GitHub summary markdown from `scripts/ci/render-yanote-summary.mjs`, and retained `.yanote-ci/live-kafka-proof/` sidecars for happy-path plus header-drift cases.
- Inspection surfaces: authored AsyncAPI fixtures in `yanote-js/test/fixtures/asyncapi/`, async CLI/report tests, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, exported proof artifacts, and the M005 async boundary verifier scripts.
- Failure visibility: failing header paths should expose `operationKey`, `schemaId`, `pointer`, header capture `state`/`reason`, `selectionMode` when relevant, and the typed async semantic code chosen by summary/gate output.
- Redaction constraints: proof artifacts may show header capture state and reason text, but must never emit raw sensitive header values or broaden support claims beyond Kafka-only retained evidence.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/gates/asyncEvaluator.ts`, `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, and the M005 async docs/verifier stack.
- New wiring introduced in this slice: real-input header-drift fixtures, additive live Kafka header sidecars and exported artifacts, summary-renderer code mapping for header semantics, and boundary verifiers/docs that pin the supported async header contract.
- What remains before the milestone is truly usable end-to-end: S04 still needs the final combined HTTP+Kafka boundary assembly; the Kafka header surface itself should be fully truthful after this slice.

## Tasks

- [x] **T01: Prove real-input async header diagnostics and authored unverifiable coverage** `est:1h30m`
  - Why: S03 cannot claim supported header truth until authored AsyncAPI fixtures, not in-memory mutations, can drive all four public header outcomes through the existing async analyzer/report/CLI path.
  - Files: `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/spec/asyncapi.test.ts`, `yanote-js/src/coverage/asyncSchemaConformance.ts`, `yanote-js/src/coverage/asyncSchemaConformance.test.ts`, `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`, `yanote-js/src/report/asyncReport.test.ts`, `yanote-js/src/cli.async-report.test.ts`, `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml`
  - Do: add or adjust authored AsyncAPI fixture coverage so `loadAsyncApiSemanticsBundle()` can produce real supported/unverifiable header capabilities, make any minimal extractor/conformance change needed to keep that path truthful, and replace stale diagnostics/report/CLI expectations with fixture-backed missing/invalid/unavailable/unverifiable header assertions that still redact payload/header values.
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/coverage/asyncSchemaConformance.test.ts src/coverage/asyncCoverage.diagnostics.test.ts src/report/asyncReport.test.ts src/cli.async-report.test.ts`
  - Done when: a fresh executor can point to authored AsyncAPI fixtures and passing tests for all four header diagnostics without relying on mutated in-memory contracts.
- [x] **T02: Extend the live Kafka proof bundle with additive header-drift sidecars** `est:1h45m`
  - Why: the async header surface is not publicly supported until the real Spring Kafka proof path exports retained happy-path and red-path artifacts that demonstrate the new diagnostics end to end.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-missing-header.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-header.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unavailable-header.yaml`, `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unverifiable-header.yaml`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`
  - Do: emit one proof-only sensitive Kafka header through the example publisher so recorder redaction can be observed safely, author additive two-service AsyncAPI sidecar specs for missing/invalid/unavailable/unverifiable header drift, and extend the live proof/export scripts so the happy path stays green while the new sidecars retain typed stderr/stdout/report artifacts.
  - Verify: `bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
  - Done when: `.yanote-ci/live-kafka-proof/` includes stable header-drift sidecars with typed async diagnostics, the happy path remains green, and unavailable-header proof shows redacted/omitted state plus reason text without leaking the sensitive value.
- [x] **T03: Align CI summary rendering with async header failure order** `est:45m`
  - Why: even with analyzer and proof coverage in place, the GitHub summary surface remains stale unless it can rank and label missing/unavailable/invalid header failures like the async gate path already does.
  - Files: `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`
  - Do: add missing/unavailable/invalid header code mapping and precedence to the summary renderer, make the issue formatter/primary-failure selection surface schema/pointer/reason context for those diagnostics, and pin the ordering against mixed async diagnostic reports in the node test suite.
  - Verify: `node --test scripts/ci/render-yanote-summary.test.mjs`
  - Done when: the summary renderer chooses the same primary async semantic failure a human would expect from the report and no header diagnostic kind is silently dropped from the CI summary.
- [x] **T04: Refresh async boundary docs and verifier contracts for header support** `est:1h10m`
  - Why: the slice is incomplete if public docs and verifier scripts still describe supported Kafka header truth as unverifiable or hidden implementation behavior.
  - Files: `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, `scripts/ci/verify-m005-s02-async-acceptance.sh`
  - Do: rewrite the async boundary wording so the guide/release/support surfaces describe supported header diagnostics and retained proof artifacts truthfully, keep the Kafka-only/separate-report constraint explicit, and update the M005 verifier scripts plus acceptance wrapper to assert the new wording and artifact expectations.
  - Verify: `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/ci/verify-m005-s02-async-acceptance.sh`
  - Done when: no stale under-claim remains in the public async boundary surfaces, the verifier stack enforces the new wording/artifact contract, and the acceptance wrapper passes against the updated live proof path.

## Files Likely Touched

- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/asyncapi.test.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.ts`
- `yanote-js/src/coverage/asyncSchemaConformance.test.ts`
- `yanote-js/src/coverage/asyncCoverage.diagnostics.test.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/test/fixtures/asyncapi/schema-header-unverifiable-v3.yaml`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-missing-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-invalid-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unavailable-header.yaml`
- `yanote-js/test/fixtures/asyncapi/spring-kafka-two-service-unverifiable-header.yaml`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `scripts/ci/verify-m005-s02-async-acceptance.sh`
