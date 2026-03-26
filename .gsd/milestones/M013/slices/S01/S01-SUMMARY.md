---
id: S01
parent: M013
milestone: M013
provides:
  - A shared local-vs-remote spec-source contract used by CLI/report/Gradle entrypoints.
  - Secret-safe retained provenance on canonical report, summary, and Gradle command-sidecar surfaces.
  - A rerunnable localhost proof bundle for the supported remote-input boundary and preserved local baseline.
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - yanote-js/src/spec/specSource.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
  - scripts/ci/verify-m013-s01-remote-spec.sh
  - scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs
key_decisions:
  - Resolve analyzer spec inputs once into a shared `ResolvedSpecSource` object and clean remote temp materialization in CLI `finally` blocks so local and remote runs share one entrypoint contract.
  - Publish retained report and CLI provenance from one shared `specSource { kind, reference }` contract and expose the same values as `spec_source_kind` / `spec_source_ref` machine tokens.
  - Persist Gradle command sidecars with `<remote-url>` placeholders plus explicit `spec_source_kind` / `spec_source_ref` lines so retained artifacts stay useful without storing replayable remote spec values.
patterns_established:
  - Centralize spec-source classification, sanitization, temp materialization, and provenance in one shared resolver instead of recomputing source metadata per delivery surface.
  - Treat sanitized provenance as a first-class additive report contract: canonical JSON, human summaries, machine summaries, and Gradle sidecars all publish the same source truth while legacy coverage numerators stay unchanged.
  - Retained proof bundles should pair copied artifacts with `artifact-manifest.txt` and `artifact-source-paths.txt` so future slices can localize whether a source-kind regression came from CLI execution, Gradle delivery, or proof-bundle assembly.
observability_surfaces:
  - `yanote-report.json` top-level `specSource { kind, reference }` block for local-file, local-directory, and remote-url runs.
  - `yanote-async-report.json` top-level `specSource { kind, reference }` block on the async analyzer path.
  - CLI `YANOTE_SUMMARY` with `spec_source_kind` and `spec_source_ref` tokens.
  - CLI `YANOTE_ASYNC_SUMMARY` with matching sanitized source tokens on `async-report`.
  - Gradle `yanote-check-command.args` sidecar with `<remote-url>` placeholder plus `spec_source_kind` / `spec_source_ref`.
  - Gradle `yanote-report-command.args` sidecar with the same sanitized provenance surface.
  - Retained `.yanote-ci/remote-spec-proof/artifact-manifest.txt` and `artifact-source-paths.txt` bundle notes for proof provenance.
drill_down_paths:
  - .gsd/milestones/M013/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M013/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M013/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T00:32:19.557Z
blocker_discovered: false
---

# S01: Supported Remote Spec Inputs With Sanitized Provenance

**Yanote now accepts supported local file, local directory, and sanitized remote single-document spec inputs through CLI and Gradle, and retains secret-safe spec-source provenance across report, summary, and command-argument surfaces.**

## What Happened

T01 introduced a shared `ResolvedSpecSource` resolver for analyzer entrypoints. The resolver classifies `local-file`, `local-directory`, and `remote-url` inputs, rejects unsafe remote forms before any artifact write, materializes supported remote specs into temp files, and lets both `yanote report` and `yanote async-report` share one typed input contract with cleanup in CLI `finally` blocks. Directory discovery stayed filesystem-only, and localhost fixture fetches now bypass the env-configured proxy so real remote-spec tests hit the in-process fixture server directly.

T02 threaded that resolved provenance into retained analyzer surfaces. HTTP and async canonical JSON reports now expose a shared top-level `specSource { kind, reference }` block, and CLI human/machine summaries publish the same truth via `spec_source_kind` / `spec_source_ref` without changing legacy coverage math. Focused contract tests proved local-file, local-directory, and remote-url provenance on report artifacts plus `YANOTE_SUMMARY` / `YANOTE_ASYNC_SUMMARY`. During that work the slice also fixed report-status resolution so semantic governance failures are evaluated from raw `GovernanceFailure.failureClass` instead of a post-normalization shape.

T03 extended the same narrow remote-spec contract to the Gradle delivery path. A shared Gradle helper now distinguishes local paths from supported remote URLs, keeps local validation fail-closed, and persists remote command sidecars with a `<remote-url>` display placeholder plus explicit `spec_source_kind` / `spec_source_ref` lines. The slice also added focused Gradle contract coverage and a retained `.yanote-ci/remote-spec-proof/` localhost bundle that proves CLI local-file/local-directory/remote-url runs plus Gradle remote check/report runs, along with deterministic `artifact-manifest.txt` and `artifact-source-paths.txt` notes for downstream debugging.

## Verification

Reran the slice proof stack successfully:
- `cd ./yanote-js && npm test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`
- `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`
- `bash scripts/ci/verify-m013-s01-remote-spec.sh`

Also reran `node --test scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` to pin the proof-script contract. After the proof passed, I inspected `.yanote-ci/remote-spec-proof/artifact-manifest.txt`, `.yanote-ci/remote-spec-proof/artifact-source-paths.txt`, `.yanote-ci/remote-spec-proof/cli-local-file/out/yanote-report.json`, `.yanote-ci/remote-spec-proof/cli-local-directory/out/yanote-report.json`, `.yanote-ci/remote-spec-proof/cli-remote-url/out/yanote-report.json`, `.yanote-ci/remote-spec-proof/gradle-remote-check/out/yanote-check-command.args`, and `.yanote-ci/remote-spec-proof/gradle-remote-report/out/yanote-report-command.args`. These retained surfaces confirmed the three supported source kinds, remote `specSource.kind=remote-url`, preserved local baseline references, and sanitized Gradle sidecars that never persist a replayable remote `--spec` value.

## Requirements Advanced

- R001 — Extended the trusted analyzer delivery path so the same deterministic HTTP coverage/report contract still works when the spec comes from a supported sanitized remote URL instead of only local paths.
- R003 — Proved the standalone CLI and Gradle plugin tasks both accept the supported remote-spec subset while keeping retained command/report surfaces secret-safe and preserving the local baseline.
- R024 — Delivered the first M013 capability slice: supported remote spec loading with sanitized provenance is now implemented and proven, leaving deprecated-operation handling and human-friendly static report artifacts for later slices.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Added a shared Gradle `SpecInputSupport.kt` helper and expanded the retained proof to exercise both `yanoteCheck` and `yanoteReport` so every command-sidecar surface named in the slice observability contract is covered.

## Known Limitations

Remote support is intentionally narrow: only single-document public `http(s)` URLs are supported, and userinfo, query strings, fragments, unsupported schemes, and directory-like remote paths still fail closed. Local directory discovery remains local-only and still depends on filenames beginning with `openapi` or `asyncapi`. The retained proof bundle is HTTP/Gradle-focused; async remote provenance is proven by the focused CLI/report contract tests rather than a separate retained bundle in this slice.

## Follow-ups

S02 should layer deprecated-operation truth onto the same canonical report and summary surfaces without disturbing the new `specSource` contract. S03 should derive separate static HTTP/async HTML artifacts from the same canonical models now carrying source provenance. S04 should publish the narrow remote-support boundary, sanitized retained surfaces, and separate report outputs clearly across CI and docs.

## Files Created/Modified

- `yanote-js/src/spec/specSource.ts` — Added the shared spec-source resolver, remote URL sanitization/validation, temp materialization, and provenance metadata.
- `yanote-js/src/spec/discover.ts` — Updated spec discovery to consume resolved local file/directory inputs from the shared resolver.
- `yanote-js/src/spec/asyncapi.ts` — Adjusted async spec loading to work with resolver-produced materialized sources.
- `yanote-js/src/cli.ts` — Wired `report` and `async-report` through the shared resolver, emitted sanitized source summary tokens, and cleaned up remote temp files.
- `yanote-js/src/spec/specSource.test.ts` — Added resolver coverage for local file, local directory, supported localhost remote URLs, and unsafe remote rejection.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — Proved real CLI local/remote behavior for both HTTP and async entrypoints, including typed unsafe-remote failures and sanitized summaries.
- `yanote-js/src/report/report.ts` — Threaded `specSource` into HTTP reports and fixed raw governance failure-class handling for report status selection.
- `yanote-js/src/report/schema.ts` — Extended the HTTP report schema with deterministic `specSource` metadata.
- `yanote-js/src/report/normalize.ts` — Normalized additive report provenance on the canonical HTTP JSON surface.
- `yanote-js/src/report/asyncReport.ts` — Threaded `specSource` into async reports.
- `yanote-js/src/report/asyncSchema.ts` — Extended the async report schema with deterministic `specSource` metadata.
- `yanote-js/src/report/asyncNormalize.ts` — Normalized additive report provenance on the canonical async JSON surface.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — Added HTTP report contract tests that pin schema-valid provenance for all supported source kinds.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — Added async report contract tests that pin schema-valid provenance for all supported source kinds.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt` — Centralized Gradle-side local-vs-remote spec classification and sanitized sidecar rendering.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt` — Allowed supported remote specs on `yanoteCheck` while keeping local-path validation fail-closed and retained args sanitized.
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt` — Allowed supported remote specs on `yanoteReport` and retained sanitized command arguments.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — Added focused Gradle tests for remote acceptance, analyzer invocation, sanitized sidecars, and unchanged local-path failures.
- `scripts/ci/run-yanote-gradle-check.sh` — Parameterized the Gradle helper for local vs remote spec inputs and check vs report execution.
- `scripts/ci/verify-m013-s01-remote-spec.sh` — Built the retained localhost proof that exercises CLI local/remote runs and Gradle remote check/report runs into `.yanote-ci/remote-spec-proof/`.
- `scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` — Pinned the structure and guarantees of the retained remote-spec proof script.
- `.gsd/KNOWLEDGE.md` — Recorded the proxy-bypass, directory-discovery, and report-status gotchas uncovered while proving the slice.
