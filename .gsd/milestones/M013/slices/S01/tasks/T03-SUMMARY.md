---
id: T03
parent: S01
milestone: M013
key_files:
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
  - scripts/ci/run-yanote-gradle-check.sh
  - scripts/ci/verify-m013-s01-remote-spec.sh
  - scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Persist Gradle remote-spec sidecars with a `<remote-url>` display placeholder plus explicit `spec_source_kind` / `spec_source_ref` lines while keeping the real analyzer invocation on the sanitized URL.
  - Reuse one parameterized `scripts/ci/run-yanote-gradle-check.sh` helper for both remote `yanoteCheck` and remote `yanoteReport`, and let the end-to-end proof build `distNodeAnalyzer` once before invoking the helper in skip-rebuild mode.
duration: ""
verification_result: passed
completed_at: 2026-03-26T00:24:37.521Z
blocker_discovered: false
---

# T03: Support remote spec URLs on Gradle surfaces and retain sanitized remote proof artifacts

**Support remote spec URLs on Gradle surfaces and retain sanitized remote proof artifacts**

## What Happened

Implemented shared Gradle-side remote-spec classification and sanitized command-surface rendering in a new `SpecInputSupport.kt` helper, then wired both `YanoteCheckTask` and `YanoteReportTask` through it. `yanoteCheck` now keeps local-path validation fail-closed while allowing only the supported remote `http(s)` single-document subset, and both tasks persist command sidecars that expose `spec_source_kind` / `spec_source_ref` while replacing the remote `--spec` display value with a `<remote-url>` placeholder.

Added focused Gradle contract coverage in `YanoteRemoteSpecContractTest.kt` using a fake Node analyzer to prove remote acceptance, sanitized args persistence, analyzer invocation, and unchanged local-path failure behavior. I also parameterized `scripts/ci/run-yanote-gradle-check.sh` so it can target local or remote spec inputs and either `yanoteCheck` or `yanoteReport`, which let the retained proof use one helper for both Gradle delivery surfaces.

Built `scripts/ci/verify-m013-s01-remote-spec.sh` plus a Node contract test for it. The verifier rebuilds the real analyzer once, serves the OpenAPI fixture over localhost, proves CLI local-file/local-directory/remote-url runs, exercises Gradle remote check/report runs, retains `.yanote-ci/remote-spec-proof/` with `artifact-manifest.txt` and `artifact-source-paths.txt`, and asserts that the retained Gradle arg sidecars show only the sanitized remote provenance surface. While building the proof I found a non-obvious repo rule—directory discovery only matches filenames beginning with `openapi`/`asyncapi`—and recorded it in `.gsd/KNOWLEDGE.md`.

## Verification

Passed the slice JavaScript verifier `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`, the focused Gradle verifier `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`, and the retained localhost proof `bash scripts/ci/verify-m013-s01-remote-spec.sh`. I also ran `node --test scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` to pin the new proof script structure. After the proof passed, I inspected `.yanote-ci/remote-spec-proof/artifact-manifest.txt`, `.yanote-ci/remote-spec-proof/artifact-source-paths.txt`, `.yanote-ci/remote-spec-proof/gradle-remote-check/out/yanote-check-command.args`, and `.yanote-ci/remote-spec-proof/gradle-remote-report/out/yanote-report-command.args` to confirm the retained surfaces expose `remote-url` provenance with the `<remote-url>` placeholder and sanitized `spec_source_ref` lines only.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` | 0 | ✅ pass | 2427ms |
| 2 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 0 | ✅ pass | 567ms |
| 3 | `bash scripts/ci/verify-m013-s01-remote-spec.sh` | 0 | ✅ pass | 22979ms |
| 4 | `node --test scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` | 0 | ✅ pass | 177ms |


## Deviations

Added a shared `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt` helper and exercised `yanoteReport` alongside `yanoteCheck` in the retained proof so both Gradle command-sidecar surfaces named in the slice observability contract are covered.

## Known Issues

None.

## Files Created/Modified

- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/verify-m013-s01-remote-spec.sh`
- `scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs`
- `.gsd/KNOWLEDGE.md`
