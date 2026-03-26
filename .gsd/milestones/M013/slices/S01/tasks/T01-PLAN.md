---
estimated_steps: 7
estimated_files: 6
skills_used:
  - vitest
---

# T01: Enable supported remote spec resolution on the real CLI entrypoints

**Slice:** S01 — Supported Remote Spec Inputs With Sanitized Provenance
**Milestone:** M013

## Description

Make remote spec loading a first-class analyzer input while preserving the deterministic local file/directory baseline.

## Steps

1. Add a shared resolver in `yanote-js/src/spec` that classifies `local-file`, `local-directory`, and `remote-url` sources, accepts only supported single-document public `http(s)` URLs, materializes remote documents safely for the existing loaders, and keeps local directory discovery filesystem-only.
2. Wire `yanote report` and `yanote async-report` through the resolver so they keep current local-file/local-directory behavior, use the resolved source for loading, and return typed input failures for unsupported schemes, credential-bearing URLs, fetch failures, or ambiguous remote forms.
3. Add focused contract tests with a localhost fixture server that prove local file, local directory, and remote URL inputs on the real CLI entrypoints and pin rejection of unsafe remote forms.

## Must-Haves

- [ ] Supported remote inputs stay narrow: public single-document `http(s)` URLs only.
- [ ] Local directory discovery remains local-only instead of trying to treat remote prefixes as directories.
- [ ] Unsafe remote inputs fail before any persisted surface can echo the original URL.

## Verification

- `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts`
- CLI contract cases prove local file, local directory, and localhost-served remote URL success plus credential-bearing/unsupported remote rejection.

## Observability Impact

- Signals added/changed: typed source-resolution failure codes and shared resolver metadata for later retained provenance surfaces.
- How a future agent inspects this: rerun `npm -C yanote-js test -- src/spec/specSource.test.ts src/cli.remote-spec.contract.test.ts` and inspect the localhost fixture cases in `yanote-js/src/cli.remote-spec.contract.test.ts`.
- Failure state exposed: unsupported remote scheme, unsafe URL shape, fetch failure, or load failure localizes to the resolver path instead of surfacing as a generic filesystem error.

## Inputs

- `yanote-js/src/spec/discover.ts` — current local-only discovery logic that must be widened without losing file/directory behavior.
- `yanote-js/src/spec/openapi.ts` — existing OpenAPI loader contract the resolver must continue to feed.
- `yanote-js/src/spec/asyncapi.ts` — existing AsyncAPI loader contract that must also accept resolved remote inputs.
- `yanote-js/src/cli.ts` — real CLI entrypoints that currently assume local spec paths.
- `yanote-js/package.json` — confirms the Node/Vitest test surface the task will use.

## Expected Output

- `yanote-js/src/spec/specSource.ts` — shared local-vs-remote resolver with the supported remote subset encoded explicitly.
- `yanote-js/src/spec/specSource.test.ts` — focused resolver tests for source classification, safety checks, and localhost fetch behavior.
- `yanote-js/src/spec/discover.ts` — discovery path updated to consume resolved sources instead of raw local-only assumptions.
- `yanote-js/src/spec/asyncapi.ts` — loader entrypoint updated to accept the resolver’s materialized remote result.
- `yanote-js/src/cli.ts` — `report` and `async-report` commands wired through the shared resolver.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — real CLI contract tests for local file, local directory, remote URL, and unsafe-remote rejection.
