# S01: Trait-aware declared semantics on async-report

**Goal:** Extend the AsyncAPI semantic model and async report contract so trait-applied Kafka declarations for supported richer semantics normalize the same as inline declarations and flow through `async-report` JSON/HTML/CLI surfaces without changing canonical `kafka <action> <channel>` identities or existing channel/operation/message coverage numerators.
**Demo:** After this: Run `async-report` against richer Kafka AsyncAPI specs and see trait-applied declarations normalize the same as inline declarations, with additive richer-semantic fields visible in `yanote-async-report.json`/`.html` while canonical operation keys and existing coverage numerators stay unchanged.

## Tasks
- [x] **T01: Normalize trait-applied correlation and reply declarations into Kafka contracts** — 
  - Files: yanote-js/src/model/operationKey.ts, yanote-js/src/spec/asyncapi.ts, yanote-js/src/spec/asyncapi.test.ts, yanote-js/src/spec/asyncapi.parity.test.ts, yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v2.yaml, yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v2.yaml, yanote-js/test/fixtures/asyncapi/trait-declarations-inline-v3.yaml, yanote-js/test/fixtures/asyncapi/trait-declarations-trait-v3.yaml
  - Verify: `npm -C yanote-js test -- src/spec/asyncapi.test.ts src/spec/asyncapi.parity.test.ts`
- [x] **T02: Publish declared async semantics in canonical JSON and HTML reports** — 
  - Files: yanote-js/src/report/asyncReport.ts, yanote-js/src/report/asyncSchema.ts, yanote-js/src/report/asyncNormalize.ts, yanote-js/src/report/asyncReportHtml.ts, yanote-js/src/report/asyncReport.test.ts, yanote-js/src/report/asyncReport.contract.test.ts, yanote-js/src/report/asyncReport.remote-spec.contract.test.ts, yanote-js/src/report/writeAsyncReport.determinism.test.ts
  - Verify: `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts`
- [x] **T03: Surface declared semantics through async-report summaries without breaking JSON-centered delivery** — 
  - Files: yanote-js/src/cli.ts, yanote-js/src/cli.async-report.contract.test.ts, yanote-js/src/cli.async-report.test.ts, yanote-js/src/cli.remote-spec.contract.test.ts
  - Verify: `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts`
