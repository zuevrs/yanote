---
id: T01
parent: S01
milestone: M013
key_files:
  - yanote-js/src/spec/specSource.ts
  - yanote-js/src/spec/discover.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/spec/specSource.test.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Resolve CLI spec inputs once into a shared `ResolvedSpecSource` object and clean remote temp files in a `finally` block so local and remote paths share one entrypoint contract.
  - Bypass the worktree’s env-configured HTTP proxy for localhost fixture fetches with direct HTTP(S) requests (`agent: false`) so remote-spec tests exercise the in-process fixture server instead of the proxy.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T23:42:47.137Z
blocker_discovered: false
---

# T01: Added shared remote spec resolution for CLI report entrypoints with typed safe-failure contracts.

**Added shared remote spec resolution for CLI report entrypoints with typed safe-failure contracts.**

## What Happened

Implemented a new shared resolver at `yanote-js/src/spec/specSource.ts` that classifies `local-file`, `local-directory`, and `remote-url` inputs, rejects unsupported or unsafe remote URL shapes before any artifact write, materializes supported remote documents into temp files, and returns source metadata for later provenance work. To keep local directory discovery filesystem-only, `yanote-js/src/spec/discover.ts` now consumes a resolved source object instead of probing raw strings.

Wired both `yanote report` and `yanote async-report` through the resolver in `yanote-js/src/cli.ts`, mapped source-resolution failures to typed CLI input errors, sanitized remote load failures, and cleaned up remote temp materializations in `finally` blocks. I also updated `yanote-js/src/spec/asyncapi.ts` so the async loader can consume the resolver’s materialized-path shape directly.

Added focused tests in `yanote-js/src/spec/specSource.test.ts` and `yanote-js/src/cli.remote-spec.contract.test.ts` covering local file, local directory, localhost-served remote URL success, and unsafe remote rejection without secret echo. During verification I discovered the worktree environment sets `NODE_USE_ENV_PROXY=1`, so localhost fixture fetches were being sent through the proxy and returning 502s; the resolver now opts out with direct one-shot HTTP(S) requests (`agent: false`), and I recorded that gotcha in `.gsd/KNOWLEDGE.md`.

## Verification

Passed the task verifier `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts` after wiring the shared resolver and CLI entrypoints. The slice-level JS verifier `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` also exited 0, but it only executed the two T01 files because the later-slice remote report contract test files are not in the tree yet. The remaining slice verifiers are not ready at T01: `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` failed with `No tests found for given includes`, and `bash scripts/ci/verify-m013-s01-remote-spec.sh` failed because the script does not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts` | 0 | ✅ pass | 1644ms |
| 2 | `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts` | 0 | ✅ pass | 1374ms |
| 3 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 1 | ❌ fail | 9411ms |
| 4 | `bash scripts/ci/verify-m013-s01-remote-spec.sh` | 127 | ❌ fail | 77ms |


## Deviations

None.

## Known Issues

Later-slice proof surfaces are not implemented yet: `yanote-js/src/report/report.remote-spec.contract.test.ts`, `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`, the Gradle `*YanoteRemoteSpecContractTest` target, and `scripts/ci/verify-m013-s01-remote-spec.sh` are still absent, so the full slice proof stack is incomplete at T01.

## Files Created/Modified

- `yanote-js/src/spec/specSource.ts`
- `yanote-js/src/spec/discover.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/specSource.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `.gsd/KNOWLEDGE.md`
