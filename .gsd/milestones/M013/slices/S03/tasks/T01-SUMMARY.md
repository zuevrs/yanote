---
id: T01
parent: S03
milestone: M013
key_files:
  - yanote-js/src/report/htmlDocument.ts
  - yanote-js/src/report/reportHtml.ts
  - yanote-js/src/report/writeReport.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - yanote-js/src/report/report.remote-spec.contract.test.ts
key_decisions:
  - Render yanote-report.html from the same normalized, schema-valid DTO used for yanote-report.json instead of creating a second analysis path.
  - Whitelist human-facing HTML sections and exclude retained request observedValues/raw dumps while escaping all dynamic text.
  - Show specSource provenance as escaped text inside a stable Provenance section rather than as external links or assets.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T02:08:48.827Z
blocker_discovered: false
---

# T01: Render self-contained sibling HTTP HTML reports from normalized canonical report truth

**Render self-contained sibling HTTP HTML reports from normalized canonical report truth**

## What Happened

Added a shared static HTML shell in yanote-js/src/report/htmlDocument.ts with inline CSS, a skip link, semantic section navigation, tables, and consistent escaping helpers for offline-safe artifacts. Added yanote-js/src/report/reportHtml.ts to render the HTTP report from the normalized canonical DTO, exposing explicit Overview, Provenance, Coverage summary, Deprecated operations, Per-operation coverage, HTTP payload/request/security conformance, Diagnostics, and Governance sections without dumping raw objects or retained request values. Updated writeYanoteReport() to normalize and validate once, then emit sibling yanote-report.json and yanote-report.html while preserving the JSON path return contract. Extended deterministic writer tests to assert byte-stable HTML, explicit provenance/deprecated/security sections, escaped dynamic text, and the absence of script tags, remote asset attributes, CSS url() usage, or SECRET_ sentinel leakage from excluded request observedValues. Extended the remote spec provenance contract test so local-file, local-directory, and remote-url specSource truth is now asserted through the real writer against both sibling JSON and HTML artifacts.

## Verification

Focused HTTP report verification passed: npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.test.ts. The broader JS slice test bundle also passed, confirming the new HTTP HTML writer did not break current CLI/async contracts. Gradle remote-spec verification passed unchanged. The two retained-proof commands failed because their T04 proof surfaces do not exist yet, which is expected at this task boundary rather than a T01 implementation regression. Observability for this task was verified through writer tests that assert the sibling yanote-report.html artifact exists and carries stable Provenance, Deprecated operations, and HTTP security conformance section labels while rejecting external asset references and SECRET_ leakage.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.test.ts` | 0 | ✅ pass | 854ms |
| 2 | `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/writeAsyncReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts` | 0 | ✅ pass | 2106ms |
| 3 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 0 | ✅ pass | 849ms |
| 4 | `bash scripts/ci/verify-m013-s03-static-html-reports.sh` | 127 | ❌ fail | 6ms |
| 5 | `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` | 1 | ❌ fail | 85ms |


## Deviations

None.

## Known Issues

Slice-level retained-proof commands still fail because scripts/ci/verify-m013-s03-static-html-reports.sh and scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs are not created until T04.

## Files Created/Modified

- `yanote-js/src/report/htmlDocument.ts`
- `yanote-js/src/report/reportHtml.ts`
- `yanote-js/src/report/writeReport.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
