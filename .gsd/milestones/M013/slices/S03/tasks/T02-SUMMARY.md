---
id: T02
parent: S03
milestone: M013
key_files:
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/writeAsyncReport.ts
  - yanote-js/src/report/writeAsyncReport.determinism.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - yanote-js/src/report/asyncReport.remote-spec.contract.test.ts
key_decisions:
  - Reuse the shared static HTML document shell for async reports but constrain the rendered sections to async-native overview, provenance, channel/operation/message coverage, and diagnostics.
  - Keep writeAsyncYanoteReport() JSON-centered by returning yanote-async-report.json even while emitting sibling yanote-async-report.html as a side effect.
  - Prove async specSource provenance through the real writer so both JSON and HTML artifacts stay aligned for local-file, local-directory, and remote-url inputs.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T02:18:21.863Z
blocker_discovered: false
---

# T02: Rendered sibling yanote-async-report.html artifacts from canonical async report truth

**Rendered sibling yanote-async-report.html artifacts from canonical async report truth**

## What Happened

Added yanote-js/src/report/asyncReportHtml.ts to render a self-contained offline async report page from the normalized AsyncYanoteReport DTO, reusing the shared HTML shell from T01 while keeping the surface strictly async-native: Overview, Provenance, Async coverage summary, Channel coverage, Operation coverage, Message coverage, and Diagnostics. Updated yanote-js/src/report/writeAsyncReport.ts so writeAsyncYanoteReport() now normalizes and validates once, writes sibling yanote-async-report.json and yanote-async-report.html in parallel, and still returns the JSON path to preserve the existing machine-facing contract. Added yanote-js/src/report/writeAsyncReport.determinism.test.ts to pin schema validation failures, deterministic JSON and HTML bytes across reordered equivalent DTOs, escaped provenance/diagnostic text, self-contained output, and the absence of HTTP-only sections. Extended yanote-js/src/report/asyncReport.contract.test.ts with direct async HTML surface assertions, and extended yanote-js/src/report/asyncReport.remote-spec.contract.test.ts so local-file, local-directory, and remote-url provenance are now proven through the real async writer against both sibling JSON and HTML artifacts.

## Verification

Focused async verification passed with npm -C yanote-js test -- src/report/writeAsyncReport.determinism.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts, covering sibling HTML emission, deterministic normalization, escaped specSource rendering, async-only section headings, and self-contained/offline constraints. The broader JS slice verification bundle also passed, confirming the new async HTML artifact did not regress HTTP report or CLI contracts. Gradle remote-spec verification still passed unchanged. The T04 retained-proof commands still fail at this task boundary because scripts/ci/verify-m013-s03-static-html-reports.sh and scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs do not exist yet. Observability for this task was verified through writer and provenance tests that assert sibling yanote-async-report.html exists beside yanote-async-report.json, contains async-only coverage/diagnostics sections plus sanitized specSource, and rejects external asset references and HTTP-only section leakage.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/writeAsyncReport.determinism.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` | 0 | ✅ pass | 873ms |
| 2 | `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/writeAsyncReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts` | 0 | ✅ pass | 1930ms |
| 3 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 0 | ✅ pass | 501ms |
| 4 | `bash scripts/ci/verify-m013-s03-static-html-reports.sh` | 127 | ❌ fail | 5ms |
| 5 | `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` | 1 | ❌ fail | 5ms |


## Deviations

None.

## Known Issues

Slice-level retained-proof commands remain unavailable until T04 creates scripts/ci/verify-m013-s03-static-html-reports.sh and scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs.

## Files Created/Modified

- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/writeAsyncReport.ts`
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
