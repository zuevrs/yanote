---
estimated_steps: 4
estimated_files: 7
skills_used:
  - debug-like-expert
  - bash-scripting
  - vitest
---

# T01: Build a versioned standalone analyzer bundle with a stable launcher

**Slice:** S01 — Standalone analyzer shipping contract
**Milestone:** M016

## Description

Build the actual standalone bundle contract that S02 can later publish without forcing users through the `yanote-js` source-build seam. This task makes the staged bundle itself the first-class surface and pins launcher/version behavior before release, Gradle, or docs start depending on it.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `npm -C yanote-js run build` | Fail the standalone bundle build and keep the version/launcher contract tests red until the runtime bundle is complete | Treat as a broken bundle build; do not fall back to a pre-existing `dist/node-analyzer` output | Reject the bundle if version metadata or runtime files are incomplete |
| `./gradlew distStandaloneAnalyzer` | Stop before release/consumer wiring; no silent fallback to the old `distAll` contract | Surface the exact staging task and partial output directory for inspection | Refuse to publish a launcher missing required runtime companions |

## Load Profile

- **Shared resources**: staged `dist/standalone-analyzer/` output, version metadata, launcher script, and bundled Node dependencies.
- **Per-operation cost**: one `yanote-js` build plus file copy/packaging work.
- **10x breakpoint**: repeated dependency reinstalls and bundle file copying dominate before analyzer runtime work does.

## Negative Tests

- **Malformed inputs**: missing release version metadata or stale default `0.0.0` leaking into the staged bundle.
- **Error paths**: launcher exists but cannot resolve the bundled CJS/runtime files, or the staging task silently reuses the old `dist/node-analyzer` layout.
- **Boundary conditions**: `bin/yanote --version` matches staged version while `report` / `async-report` / `combined-report` still resolve the same CLI implementation.

## Steps

1. Add a stable tracked launcher source (for example `yanote-js/bin/yanote`) and update the staging task in `build.gradle.kts` so the repo can build one standalone analyzer directory instead of exposing raw `yanote.cjs` as the public contract.
2. Make version metadata injectable into the staged bundle so release-tagged builds can expose a real standalone CLI version without requiring source-built `yanote-js` markers to become public truth.
3. Keep the internal runtime seam private: the launcher should resolve bundled implementation files relative to itself, not ask the user to run `node yanote-js/dist/yanote.cjs`.
4. Add focused contract coverage for launcher path, bundle layout, and version behavior.

## Must-Haves

- [ ] The staged standalone bundle exposes one stable launcher path for users and automation.
- [ ] Version output can come from staged bundle metadata rather than the raw `yanote-js` HEAD marker.
- [ ] The standalone bundle contract stays explicit and test-pinned instead of inferred from ad hoc `dist/` contents.

## Verification

- `./gradlew distStandaloneAnalyzer && dist/standalone-analyzer/bin/yanote --version && node --test scripts/release/analyzer-standalone.contract.test.mjs && npm -C yanote-js test -- src/cli.test.ts`
- Expect a staged standalone bundle, a working launcher path, and focused tests that pin bundle layout plus version behavior.

## Observability Impact

- Signals added/changed: staged bundle layout and launcher/version surfaces become explicit proof outputs instead of implicit `dist/node-analyzer` residue.
- How a future agent inspects this: run the build command, inspect `dist/standalone-analyzer/`, and check the focused contract test output.
- Failure state exposed: missing launcher, version mismatch, or malformed runtime contents localize to the bundle stage rather than later release/doc tasks.

## Inputs

- `build.gradle.kts` — current dist task wiring and release bundle staging logic.
- `yanote-js/esbuild.config.mjs` — current CLI bundle output definition.
- `yanote-js/package.json` — analyzer package metadata and executable surface.
- `yanote-js/src/version.ts` — current hardcoded tool-version source.
- `yanote-js/src/cli.test.ts` — existing CLI behavior contract tests.

## Expected Output

- `build.gradle.kts` — standalone bundle staging task and layout contract.
- `yanote-js/esbuild.config.mjs` — build output aligned with the standalone bundle layout.
- `yanote-js/package.json` — metadata aligned with the staged CLI surface.
- `yanote-js/src/version.ts` — version sourcing updated for staged builds.
- `yanote-js/src/cli.test.ts` — CLI tests covering launcher/version behavior.
- `yanote-js/bin/yanote` — tracked standalone launcher source.
- `scripts/release/analyzer-standalone.contract.test.mjs` — deterministic contract test for bundle layout/version behavior.
