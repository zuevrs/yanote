---
estimated_steps: 4
estimated_files: 5
skills_used:
  - openapi-specification-v3.2
  - vitest
---

# T04: Expose security truth through CLI output and GitHub summary

**Slice:** S01 — Security Semantics Through Report, CLI, And CI
**Milestone:** M012

## Description

Close the user-visible surfaces by adding a dedicated CLI security block, stable machine tokens, and GitHub-summary coverage for typed security failures.

## Steps

1. Update `yanote-js/src/cli.ts` to print an `HTTP Security Conformance` block and additive machine tokens such as `security_observed_operations` and `security_truths` from the new report section while keeping legacy coverage percentages unchanged.
2. Keep Top Issues and stderr deduped so typed security failures appear once, optional and cleared security stays green, and raw secret values never surface in stdout/stderr.
3. Extend `scripts/ci/render-yanote-summary.test.mjs` and make any minimal `scripts/ci/render-yanote-summary.mjs` adjustment needed so GitHub summaries pick up security semantic failures and report facts deterministically from governance-driven data.
4. Add focused CLI contract tests that run `yanote report` on the security fixtures and pin stdout/stderr/report/class-count behavior for inherited, cleared, optional, missing, unavailable, and unsupported cases.

## Must-Haves

- [ ] CLI human output gets a dedicated `HTTP Security Conformance` block plus security-aware Top Issues without renaming existing coverage tokens.
- [ ] `YANOTE_SUMMARY` gains additive security tokens while preserving the existing machine-readable coverage, payload, and request fields.
- [ ] GitHub summary rendering surfaces the primary security failure from governance/report data without custom secret-bearing parsing.

## Verification

- Focused CLI and CI-summary tests prove security output is additive, deterministic, and buildable.
- `npm -C yanote-js test -- src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts && node --test scripts/ci/render-yanote-summary.test.mjs && npm -C yanote-js run build`

## Observability Impact

- Signals added/changed: CLI `HTTP Security Conformance` block, security `YANOTE_SUMMARY` tokens, and GitHub-summary handling for security semantic failures.
- How a future agent inspects this: run the focused CLI tests, inspect stdout/stderr + `YANOTE_SUMMARY`, and render a GitHub summary from the fixture outputs.
- Failure state exposed: the primary security failure stays visible across CLI and CI summary surfaces without exposing raw credential values.

## Inputs

- `yanote-js/src/report/report.ts` — additive report surface that will feed CLI output.
- `yanote-js/src/cli.ts` — current HTTP summary and `YANOTE_SUMMARY` renderer.
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` — security fixture corpus for CLI coverage.
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` — retained evidence used by the CLI tests.
- `scripts/ci/render-yanote-summary.mjs` — current GitHub-summary renderer.
- `scripts/ci/render-yanote-summary.test.mjs` — current summary-rendering contract coverage.

## Expected Output

- `yanote-js/src/cli.ts` — security-aware CLI summary/stderr/machine-token output.
- `yanote-js/src/cli.security.report.test.ts` — focused CLI report coverage for security cases.
- `yanote-js/src/cli.security.summary.contract.test.ts` — focused summary-contract coverage for security cases.
- `scripts/ci/render-yanote-summary.mjs` — GitHub-summary support for security semantic failures.
- `scripts/ci/render-yanote-summary.test.mjs` — security-aware summary-renderer coverage.
