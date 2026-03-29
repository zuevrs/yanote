---
id: T01
parent: S02
milestone: M016
provides: []
requires: []
affects: []
key_files: ["scripts/release/preflight.sh", "scripts/release/preflight.runtime.contract.test.mjs", ".github/workflows/release.yml", "scripts/release/maven-central-preflight.contract.test.mjs", "scripts/release/release-failclosed.contract.test.mjs", "scripts/release/release-workflow.contract.test.mjs", "scripts/release/fixtures/preflight-runtime/preflight-signed-main.tar.gz.base64", "scripts/release/fixtures/preflight-runtime/preflight-unsigned-annotated.tar.gz.base64", "scripts/release/fixtures/preflight-runtime/preflight-lightweight.tar.gz.base64", "scripts/release/fixtures/preflight-runtime/preflight-signed-off-main.tar.gz.base64", "scripts/release/fixtures/preflight-runtime/preflight-signed-prerelease.tar.gz.base64", "scripts/release/fixtures/test-release-signing-public.asc", "scripts/release/fixtures/test-release-signing.fingerprint", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Use archive-backed git fixture repositories for signed/unsigned/off-main/prerelease runtime preflight coverage instead of creating signed tags inside node:test.", "Source release_tag in the release workflow from preflight output so the workflow consumes the same runtime-tested contract surface as downstream publish steps."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Passed the task-owned verifier command: node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs. Also ran the broader slice verification stack to capture intermediate state: node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs passed, while bash scripts/ci/verify-m016-s02-release-pipeline.sh failed because that T02-owned script does not exist yet."
completed_at: 2026-03-28T23:56:41.624Z
blocker_discovered: false
---

# T01: Added archive-backed runtime preflight contract coverage for signed release tags and aligned the release workflow with the tested release-tag/retry output surface.

> Added archive-backed runtime preflight contract coverage for signed release tags and aligned the release workflow with the tested release-tag/retry output surface.

## What Happened
---
id: T01
parent: S02
milestone: M016
key_files:
  - scripts/release/preflight.sh
  - scripts/release/preflight.runtime.contract.test.mjs
  - .github/workflows/release.yml
  - scripts/release/maven-central-preflight.contract.test.mjs
  - scripts/release/release-failclosed.contract.test.mjs
  - scripts/release/release-workflow.contract.test.mjs
  - scripts/release/fixtures/preflight-runtime/preflight-signed-main.tar.gz.base64
  - scripts/release/fixtures/preflight-runtime/preflight-unsigned-annotated.tar.gz.base64
  - scripts/release/fixtures/preflight-runtime/preflight-lightweight.tar.gz.base64
  - scripts/release/fixtures/preflight-runtime/preflight-signed-off-main.tar.gz.base64
  - scripts/release/fixtures/preflight-runtime/preflight-signed-prerelease.tar.gz.base64
  - scripts/release/fixtures/test-release-signing-public.asc
  - scripts/release/fixtures/test-release-signing.fingerprint
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Use archive-backed git fixture repositories for signed/unsigned/off-main/prerelease runtime preflight coverage instead of creating signed tags inside node:test.
  - Source release_tag in the release workflow from preflight output so the workflow consumes the same runtime-tested contract surface as downstream publish steps.
duration: ""
verification_result: mixed
completed_at: 2026-03-28T23:56:41.624Z
blocker_discovered: false
---

# T01: Added archive-backed runtime preflight contract coverage for signed release tags and aligned the release workflow with the tested release-tag/retry output surface.

**Added archive-backed runtime preflight contract coverage for signed release tags and aligned the release workflow with the tested release-tag/retry output surface.**

## What Happened

Tightened scripts/release/preflight.sh where runtime execution exposed real gaps: the script is now Bash-3.2-safe under the repo's actual bash invocation, preserves deterministic diagnostic rendering when arrays are empty, emits exact unsigned-tag vs non-annotated-tag failures, and avoids extra signature checks once a tag is already known to be lightweight. Added scripts/release/preflight.runtime.contract.test.mjs as a process-level harness that restores prebuilt git fixture repositories and executes bash scripts/release/preflight.sh against real signed-main, unsigned, lightweight, off-main, prerelease, and mixed-failure cases. Refreshed the source-level preflight/workflow contract tests so they pin the runtime gate surface, and updated .github/workflows/release.yml so release_tag is sourced from the script's own output instead of bypassing preflight with GITHUB_REF_NAME.

## Verification

Passed the task-owned verifier command: node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs. Also ran the broader slice verification stack to capture intermediate state: node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs passed, while bash scripts/ci/verify-m016-s02-release-pipeline.sh failed because that T02-owned script does not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/release/preflight.runtime.contract.test.mjs scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs scripts/release/release-workflow.contract.test.mjs` | 0 | ✅ pass | 2092ms |
| 2 | `node --test scripts/release/github-release.contract.test.mjs scripts/release/traceability.contract.test.mjs scripts/ci/verify-m016-s02-release-pipeline.contract.test.mjs` | 0 | ✅ pass | 499ms |
| 3 | `bash scripts/ci/verify-m016-s02-release-pipeline.sh` | 127 | ❌ fail | 3ms |


## Deviations

Used archive-backed git fixture repositories for signed-tag runtime coverage instead of generating signed tags during node --test execution because the Node test runner could hit gpg-agent startup failures even when the gate logic itself was correct.

## Known Issues

bash scripts/ci/verify-m016-s02-release-pipeline.sh still fails with exit 127 because the script is not present yet in this worktree. That is expected intermediate-task slice state and is owned by T02, not a blocker for T01.

## Files Created/Modified

- `scripts/release/preflight.sh`
- `scripts/release/preflight.runtime.contract.test.mjs`
- `.github/workflows/release.yml`
- `scripts/release/maven-central-preflight.contract.test.mjs`
- `scripts/release/release-failclosed.contract.test.mjs`
- `scripts/release/release-workflow.contract.test.mjs`
- `scripts/release/fixtures/preflight-runtime/preflight-signed-main.tar.gz.base64`
- `scripts/release/fixtures/preflight-runtime/preflight-unsigned-annotated.tar.gz.base64`
- `scripts/release/fixtures/preflight-runtime/preflight-lightweight.tar.gz.base64`
- `scripts/release/fixtures/preflight-runtime/preflight-signed-off-main.tar.gz.base64`
- `scripts/release/fixtures/preflight-runtime/preflight-signed-prerelease.tar.gz.base64`
- `scripts/release/fixtures/test-release-signing-public.asc`
- `scripts/release/fixtures/test-release-signing.fingerprint`
- `.gsd/KNOWLEDGE.md`


## Deviations
Used archive-backed git fixture repositories for signed-tag runtime coverage instead of generating signed tags during node --test execution because the Node test runner could hit gpg-agent startup failures even when the gate logic itself was correct.

## Known Issues
bash scripts/ci/verify-m016-s02-release-pipeline.sh still fails with exit 127 because the script is not present yet in this worktree. That is expected intermediate-task slice state and is owned by T02, not a blocker for T01.
