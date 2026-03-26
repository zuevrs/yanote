---
id: T04
parent: S02
milestone: M013
key_files:
  - scripts/ci/verify-m013-s02-deprecated-operations.sh
  - scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs
  - .yanote-ci/deprecated-operations-proof/artifact-manifest.txt
  - .yanote-ci/deprecated-operations-proof/cli-report/stdout.txt
  - .yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json
key_decisions:
  - Pin the retained proof bundle to an exact six-file HTTP-only layout so async or dashboard artifact leakage fails locally instead of being noticed later by inspection.
  - Record the rerun command and the preserved denominator/deprecated claims directly in `artifact-manifest.txt` so future agents can verify the proof from one retained surface without an extra source-path note.
duration: ""
verification_result: passed
completed_at: 2026-03-26T01:24:01.671Z
blocker_discovered: false
---

# T04: Add a retained deprecated-operations CLI proof bundle and contract test

**Add a retained deprecated-operations CLI proof bundle and contract test**

## What Happened

Implemented `scripts/ci/verify-m013-s02-deprecated-operations.sh` as a rerunnable retained proof for the canonical HTTP CLI path. The script rebuilds `yanote-js/dist/yanote.cjs`, runs `yanote report` against `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` plus `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`, captures stdout/stderr/exit-code/report artifacts under `.yanote-ci/deprecated-operations-proof/cli-report/`, and writes `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` with the rerun command plus the preserved `legacy_operations=2/3` and deprecated counts. The proof asserts additive deprecated JSON and CLI truth (`summary.deprecatedOperations`, `coverage.perOperation[].deprecated`, deprecated summary line, and `YANOTE_SUMMARY` deprecated tokens) while failing if denominator stability drifts. It also pins the retained bundle to an exact HTTP-only file layout so async/dashboard artifact leakage fails locally. Added `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` to source-contract the stable artifact path, real CLI entrypoint, retained claims, and HTTP-only bundle layout. During execution I hit one false-negative in the proof because the first summary assertion overfit the full `summary` object; I corrected that by asserting the legacy/deprecated subset explicitly and by moving the bundle-layout check to run after manifest creation. I then read back `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`, `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt`, and `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json` to verify the observability surfaces promised by the task.

## Verification

Verified the new proof in layers: `bash -n scripts/ci/verify-m013-s02-deprecated-operations.sh` passed for shell syntax; `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` rebuilt the real CLI, produced the retained proof bundle, and confirmed `covered=2/3` plus deprecated summary/tokens/flags with no async or dashboard artifacts; `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` passed and pinned the retained bundle layout plus source-level claims. Finally, the full slice verification stack passed: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts`, followed by the proof script and the new contract test. I also directly inspected the retained manifest/stdout/report files to confirm the promised observability surfaces were actually present on disk.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts` | 0 | ✅ pass | 2195ms |
| 2 | `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` | 0 | ✅ pass | 584ms |
| 3 | `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` | 0 | ✅ pass | 190ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/verify-m013-s02-deprecated-operations.sh`
- `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`
- `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`
- `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt`
- `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json`
