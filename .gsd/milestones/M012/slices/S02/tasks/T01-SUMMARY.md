---
id: T01
parent: S02
milestone: M012
key_files:
  - scripts/ci/verify-m012-s02-security-semantics.sh
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - .yanote-ci/v1-e2e/artifact-manifest.txt
  - .yanote-ci/v1-e2e/artifact-source-paths.txt
key_decisions:
  - Retain derived fixture-backed security sidecars and provenance in the public v1 bundle instead of widening the live Spring MVC demo to fake broader security coverage.
  - Keep the raw http-security-api-key.fixture.jsonl artifact out of .yanote-ci/v1-e2e/ and enforce secret-safety by checking retained stdout/stderr/report outputs for captured fixture values.
duration: ""
verification_result: passed
completed_at: 2026-03-25T22:24:14.092Z
blocker_discovered: false
---

# T01: Retain fixture-backed security proof sidecars and provenance in the public v1 bundle

**Retain fixture-backed security proof sidecars and provenance in the public v1 bundle**

## What Happened

Implemented the missing focused security proof surface for the public M012 bundle. I added `scripts/ci/verify-m012-s02-security-semantics.sh`, which rebuilds `yanote-js`, runs the analyzer against `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` plus `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`, and asserts the exact public contract: exit code `5`, the `HTTP Security Conformance` block, ordered governance diagnostics from missing → unavailable → unsupported, unchanged legacy coverage numerators, additive `YANOTE_SUMMARY` security tokens, and secret-safe stdout/stderr/report output. I then widened `scripts/ci/run-v1-e2e.sh` so the retained `.yanote-ci/v1-e2e/` bundle now publishes `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json`, records fixture provenance in `artifact-source-paths.txt`, records `security_semantics_expected_exit=5` and `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY` in `artifact-manifest.txt`, and still excludes the raw `http-security-api-key.fixture.jsonl` artifact from the retained public bundle. Finally, I updated the bundle contract tests and collector regression test so the widened inventory, security primary code, and fixture provenance are pinned deterministically.

## Verification

Passed the targeted contract and runtime verification stack. `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` confirmed the widened bundle inventory and collector expectations. `bash scripts/ci/verify-m012-s02-security-semantics.sh` proved the fixture-backed security boundary end to end, including exit `5`, exact failure ordering, additive summary tokens, unchanged legacy coverage numerators, and secret-safe outputs. `bash scripts/ci/run-v1-e2e.sh` rebuilt the live demo bundle and retained the new `security-semantics.*` sidecars plus manifest/source-path provenance without copying the raw security fixture JSONL file. The slice-level doc verifiers and `git diff --check` also passed after the change, and direct inspection of `.yanote-ci/v1-e2e/` confirmed the new observability surfaces were present with the expected metadata.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 232ms |
| 2 | `bash scripts/ci/verify-m012-s02-security-semantics.sh` | 0 | ✅ pass | 2974ms |
| 3 | `bash scripts/ci/run-v1-e2e.sh` | 0 | ✅ pass | 23907ms |
| 4 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 164ms |
| 5 | `bash scripts/docs/verify-s02-doc-links.sh` | 0 | ✅ pass | 113ms |
| 6 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 185ms |
| 7 | `git diff --check` | 0 | ✅ pass | 17ms |


## Deviations

None.

## Known Issues

Pre-existing `npm -C yanote-js ci` audit warnings (11 vulnerabilities reported by npm audit) remain unchanged and were not addressed in this task.

## Files Created/Modified

- `scripts/ci/verify-m012-s02-security-semantics.sh`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `.yanote-ci/v1-e2e/artifact-manifest.txt`
- `.yanote-ci/v1-e2e/artifact-source-paths.txt`
