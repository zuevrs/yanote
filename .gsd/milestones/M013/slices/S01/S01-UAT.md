# S01: Supported Remote Spec Inputs With Sanitized Provenance — UAT

**Milestone:** M013
**Written:** 2026-03-26T00:32:19.557Z

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: the slice promise is a delivery/artifact boundary. The HTTP CLI and Gradle paths are proven by a retained localhost bundle, while async provenance is proven by focused contract tests on the real `async-report` entrypoint.

## Preconditions

- The worktree has built dependencies available and `./gradlew` is runnable.
- Port `127.0.0.1` is available for the verifier’s temporary fixture server.
- Existing fixtures remain present under `yanote-js/test/fixtures/`.

## Smoke Test

1. Run `bash scripts/ci/verify-m013-s01-remote-spec.sh` from the worktree root.
2. Confirm the command exits `0` and prints `Remote spec proof bundle ready at .yanote-ci/remote-spec-proof.`
3. **Expected:** `.yanote-ci/remote-spec-proof/` exists with `artifact-manifest.txt`, `artifact-source-paths.txt`, CLI proof outputs, and Gradle proof outputs.

## Test Cases

### 1. CLI local file and local directory provenance stay deterministic

1. Open `.yanote-ci/remote-spec-proof/cli-local-file/out/yanote-report.json`.
2. Verify `specSource.kind` is `local-file` and `specSource.reference` points at `.yanote-ci/remote-spec-proof/fixtures/local-file/simple.yaml`.
3. Open `.yanote-ci/remote-spec-proof/cli-local-directory/out/yanote-report.json`.
4. Verify `specSource.kind` is `local-directory` and `specSource.reference` points at `.yanote-ci/remote-spec-proof/fixtures/local-directory`.
5. **Expected:** both retained reports still show 4/4 covered operations and preserve the local baseline without any remote-only formatting.

### 2. CLI remote URL runs publish sanitized retained provenance

1. Open `.yanote-ci/remote-spec-proof/cli-remote-url/stdout`.
2. Verify the human summary contains `spec source: remote-url (` and the machine line contains `spec_source_kind=remote-url` plus `spec_source_ref="http://127.0.0.1:`.
3. Open `.yanote-ci/remote-spec-proof/cli-remote-url/out/yanote-report.json`.
4. Verify `specSource.kind` is `remote-url` and `specSource.reference` equals the localhost fixture URL from `artifact-manifest.txt`.
5. **Expected:** the run succeeds, the retained report is schema-valid, and no userinfo, query string, fragment, or token-like secret appears in stdout/stderr/report surfaces.

### 3. Gradle sidecars keep remote provenance useful without persisting replayable `--spec` values

1. Open `.yanote-ci/remote-spec-proof/gradle-remote-check/out/yanote-check-command.args`.
2. Confirm the first line uses `report --spec <remote-url>` instead of the raw remote URL.
3. Confirm the file also includes `spec_source_kind=remote-url` and `spec_source_ref=http://127.0.0.1:`.
4. Repeat the same inspection for `.yanote-ci/remote-spec-proof/gradle-remote-report/out/yanote-report-command.args`.
5. **Expected:** both Gradle sidecars expose enough provenance to debug the source kind and sanitized reference, while never persisting a replayable credential-bearing `--spec` argument.

### 4. Async remote provenance follows the same contract

1. Run `cd ./yanote-js && npm test -- src/cli.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts`.
2. Confirm the suite exits `0`.
3. Review the assertions in the output for the `async-report` cases.
4. **Expected:** the real `async-report` entrypoint accepts local file, local directory, and remote URL specs, writes `yanote-async-report.json` with `specSource { kind, reference }`, and emits `YANOTE_ASYNC_SUMMARY` with matching sanitized `spec_source_kind` / `spec_source_ref` tokens.

## Edge Cases

### Unsafe remote URLs fail closed before fetch or artifact write

1. Run `cd ./yanote-js && npm test -- src/cli.remote-spec.contract.test.ts --testNamePattern "fails closed for credential-bearing remote URLs"`.
2. **Expected:** the command exits `0`, the tested CLI result uses `INPUT_SPEC_REMOTE_URL_UNSAFE`, stdout/stderr do not echo the secret-bearing URL, and no report artifact is written for the rejected run.

### Local directory proof fixtures must keep `openapi.yaml`/`asyncapi.yaml` naming

1. Inspect `.yanote-ci/remote-spec-proof/fixtures/local-directory/openapi.yaml`.
2. **Expected:** the proof fixture uses the discoverable filename prefix; renaming it to an arbitrary filename would break directory discovery and should be treated as a real regression signal.

## Failure Signals

- `bash scripts/ci/verify-m013-s01-remote-spec.sh` exits non-zero or does not create `.yanote-ci/remote-spec-proof/`.
- Any retained report is missing `specSource` or reports the wrong `kind` for local-file, local-directory, or remote-url cases.
- Any CLI summary or Gradle `.args` sidecar contains userinfo, query parameters, fragments, or token-like secret text from a remote URL.
- Gradle remote check/report runs reject the supported localhost URL or stop writing `spec_source_kind` / `spec_source_ref` lines.
- The async contract tests stop asserting `YANOTE_ASYNC_SUMMARY` provenance tokens or `yanote-async-report.json` `specSource` blocks.

## Requirements Proved By This UAT

- R001 — The analyzer still produces deterministic retained coverage/report truth when the supported spec source is local or sanitized remote.
- R003 — The supported delivery surfaces now include real CLI and Gradle remote-spec runs with secret-safe retained provenance.
- R024 — The remote-spec-loading portion of the queued analyzer-consumption requirement is now implemented and proven.

## Not Proven By This UAT

- Deprecated-operation reporting semantics planned for S02.
- Static offline HTML report artifacts planned for S03.
- CI/doc publication of the widened support boundary planned for S04.
- Any authenticated, multi-document, repository-backed, query-bearing, or fragment-bearing remote spec workflow.

## Notes for Tester

- The retained proof bundle intentionally uses a localhost fixture URL; seeing `http://127.0.0.1:<port>/simple.yaml` in sanitized provenance is expected.
- `status: partial` in the retained HTTP reports is expected here because aggregate/parameter dimensions remain `N/A` for the fixture, not because remote spec loading failed.
- For authoritative verification in this worktree, prefer plain `bash` over `async_bash`; background commands can resolve against the parent repo root instead of the active worktree.
