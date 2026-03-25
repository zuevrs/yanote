---
id: T05
parent: S02
milestone: M011
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/openapi/request-evidence-openapi.yaml
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java
  - scripts/ci/verify-m011-s02-request-semantics.sh
key_decisions:
  - Declare the focused live proof around supported repeated query-array `tags` plus unsupported query-schema `meta`, while keeping secret-bearing Authorization/SESSION values in the live request only for redaction and no-leakage assertions.
  - Make the retained verifier assert all three localization surfaces explicitly: recorder capture in `events.jsonl`, analyzer/governance truth in `yanote-report.json`, and fail-closed publication in CLI stdout/stderr.
duration: ""
verification_result: passed
completed_at: 2026-03-25T17:00:20.912Z
blocker_discovered: false
---

# T05: Prove supported query-array request semantics end to end on the focused Spring MVC route

**Prove supported query-array request semantics end to end on the focused Spring MVC route**

## What Happened

Extended the focused Spring MVC request-evidence route to bind a repeated `tags` query array and surface `metaProvided` in the JSON response while preserving the secret-bearing Authorization header and SESSION cookie on the live request for recorder redaction checks. Updated the OpenAPI proof spec so the public request contract now declares `tags` as the supported repeated query-array case and `meta` as an explicitly unsupported query schema, while leaving the response contract additive with `tags` and `metaProvided`. Reworked the RestAssured integration proof to send one live request carrying repeated `tags`, unsupported `meta`, supported header/cookie scalars, and secret-bearing header/cookie values; the test now asserts ordered retained query-array evidence, unsupported query retention, recorder redaction, and secret-safe raw artifacts. Added `scripts/ci/verify-m011-s02-request-semantics.sh` as the retained end-to-end verifier that builds the service and analyzer, boots the example app, runs the focused RestAssured proof, asserts `events.jsonl`, `yanote-report.json`, CLI stdout/stderr, governance diagnostics, fail-closed exit behavior, and absence of secret or retained-value leakage on public CLI surfaces. During verification I found and fixed a shell bug in the new verifier where `if ! command; then exit_code=$?; fi` captured the inverted status; the script now records the analyzer exit code correctly before asserting the expected fail-closed exit 5.

## Verification

Passed the slice Vitest stack for OpenAPI request-support parsing, request conformance, governance precedence, report contract, and CLI request-semantic surfacing. Passed the retained live verifier script, which compiled the Spring MVC example and RestAssured proof, exercised the focused route, confirmed ordered repeated query-array capture in `events.jsonl`, confirmed supported-array and unsupported-schema request truth plus governance publication in `yanote-report.json`, confirmed `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` fail-closed CLI behavior, and confirmed that secret Authorization/SESSION values and retained non-secret request values stayed out of stdout/stderr.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` | 0 | ✅ pass | 1039ms |
| 2 | `bash ./scripts/ci/verify-m011-s02-request-semantics.sh` | 0 | ✅ pass | 26369ms |


## Deviations

Kept Authorization and SESSION only as live-request redaction/no-leakage proof inputs instead of declared request-conformance parameters so the focused public failure path remains the unsupported `meta` contract rather than an unavailable secret-bearing parameter. No slice-plan rework was needed.

## Known Issues

None.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s02-request-semantics.sh`
