---
id: T01
parent: S04
milestone: M011
key_files:
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java
  - .gsd/STATE.md
key_decisions:
  - Derive the public request-semantics proof from the retained live `events.jsonl` and a filtered request-evidence subset instead of introducing a second runtime harness.
  - Publish request semantics as additive sidecars (`request-semantics.events.jsonl`, `request-semantics.stdout`, `request-semantics.stderr`, `request-semantics-yanote-report.json`) in the same `.yanote-ci/v1-e2e/` bundle as the existing happy-path and payload semantic-red artifacts.
  - Reuse the shared Gradle home for `run-v1-e2e.sh` host/container prebuilds so the public proof entrypoint can consume warmed dependencies and remain stable under flaky external Maven resolution.
duration: ""
verification_result: passed
completed_at: 2026-03-25T19:22:35.068Z
blocker_discovered: false
---

# T01: Add retained request-semantics sidecars to the public v1 e2e proof bundle

**Add retained request-semantics sidecars to the public v1 e2e proof bundle**

## What Happened

Updated `scripts/ci/run-v1-e2e.sh` so the public bundle now derives a filtered `request-semantics.events.jsonl` sidecar from the retained live `.yanote-ci/v1-e2e/events.jsonl`, reruns `node yanote-js/dist/yanote.cjs report` against `examples/openapi/request-evidence-openapi.yaml`, and retains additive request-semantics stdout, stderr, report JSON, manifest entries, and source-path notes beside the existing happy-path and `semantic-red.*` artifacts. To keep the public entrypoint actually runnable in this worktree, I also fixed two local execution blockers discovered during verification: the compose RestAssured request-evidence test now disambiguates its tagged event by method+route instead of assuming the run/suite tag pair is unique across the whole shared demo suite, and the v1 e2e script now reuses the shared Gradle home instead of a fresh temp cache so host prebuilds and the offline compose test container can consume already-warmed dependencies without Maven Central TLS flakiness. Contract coverage was widened in `scripts/ci/run-v1-e2e.contract.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs`; `collect-yanote-artifacts.sh` itself did not need code changes because it already copies the full `.yanote-ci/v1-e2e/` directory tree, so updating its regression inventory was sufficient. Finally, I advanced `.gsd/STATE.md` so the next action points at T02.

## Verification

Verified the widened bundle in three layers. First, `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` passed and pinned the additive request-sidecar inventory, manifest/source-note strings, secret-safe stdout/stderr expectations, and retained collector surface. Second, `bash scripts/ci/run-v1-e2e.sh` completed successfully and retained `.yanote-ci/v1-e2e/artifact-manifest.txt`, `.yanote-ci/v1-e2e/artifact-source-paths.txt`, `.yanote-ci/v1-e2e/request-semantics.events.jsonl`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, `.yanote-ci/v1-e2e/request-semantics-yanote-report.json`, plus the existing happy-path `out/yanote-report.json` and payload `semantic-red.*` artifacts. Third, `git diff --check` passed after the changes.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 213ms |
| 2 | `bash scripts/ci/run-v1-e2e.sh` | 0 | ✅ pass | 305000ms |
| 3 | `git diff --check` | 0 | ✅ pass | 50ms |


## Deviations

`scripts/ci/collect-yanote-artifacts.sh` itself did not require code changes because its existing directory-copy behavior already exported the widened `.yanote-ci/v1-e2e/` bundle; only its regression test was updated. I also fixed a pre-existing compose-suite tagging assumption in `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java` and hardened the Gradle-home selection inside `scripts/ci/run-v1-e2e.sh` so the task’s required public proof command could pass in local reality.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `.gsd/STATE.md`
