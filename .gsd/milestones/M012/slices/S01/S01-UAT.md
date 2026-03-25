# S01: Security Semantics Through Report, CLI, And CI — UAT

**Milestone:** M012
**Written:** 2026-03-25T21:52:40.120Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice widens analyzer semantics and report/CLI/CI rendering on deterministic OpenAPI and retained-event fixtures; no live runtime or human UX judgment is required to prove the contract.

## Preconditions

- From the repo root, ensure dependencies are available and the analyzer is built: `npm -C yanote-js run build`.
- Have the security fixture corpus present at `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` and `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`.
- Create a temporary output directory for the report artifacts.

## Smoke Test

1. Run:
   `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out "$TMPDIR/yanote-m012-s01" --profile local`
2. Confirm the command exits with code `5`.
3. **Expected:** stdout includes `HTTP Security Conformance`, `- observations: declared=12 observed_operations=12 evaluations=12`, `- truths: satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1`, and the report file `yanote-report.json` is written to the output directory.

## Test Cases

### 1. Effective security semantics are extracted without changing legacy coverage math

1. Run the smoke-test command above.
2. Open the generated `yanote-report.json`.
3. Inspect `coverage.operations`, `coverage.status`, `coverage.parameters`, and `coverage.aggregate`.
4. Inspect `httpSecurityConformance.summary` and `httpSecurityConformance.perOperation` for `http GET /root-inherited`, `http GET /override-query`, `http GET /optional`, and `http GET /clear`.
5. **Expected:** `coverage.operations.percent` is `100`, `coverage.status.percent` is `100`, `coverage.parameters.state` remains `N/A`, `coverage.aggregate.state` remains `N/A`, and the security section shows inherited, overridden, optional, and clear behavior additively rather than changing legacy coverage numerators.

### 2. Security drift fails closed with typed governance precedence

1. Run:
   `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts`
2. Re-run the smoke-test CLI command and inspect stderr.
3. **Expected:** the test command passes, and stderr begins with `YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_MISSING_SECURITY` followed by secondary `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` lines; there should be no threshold/regression failure taking precedence over security drift.

### 3. CLI and machine-summary surfaces expose security truth without secret leakage

1. Run:
   `npm -C yanote-js test -- src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`
2. Re-run the smoke-test CLI command and inspect stdout/stderr.
3. Verify the final `YANOTE_SUMMARY` line contains `security_declared_operations=12`, `security_observed_operations=12`, `security_observed_evaluations=12`, and `security_truths=satisfied:3,missing:1,unavailable:2,unsupported:4,optional:1,clear:1`.
4. Search stdout/stderr for raw retained secret values such as `header-secret-123`, `query-secret-456`, `oauth-secret`, or `Basic dXNlcjpzZWNyZXQ=`.
5. **Expected:** the CLI contract tests pass, the summary tokens are present exactly once, Top Issues show only typed security failures, and none of the retained secret literals appear in stdout or stderr.

### 4. GitHub summary rendering matches governance-driven security truth

1. Run:
   `node --test scripts/ci/render-yanote-summary.test.mjs`
2. Inspect the passing test names.
3. **Expected:** the renderer test that covers HTTP security summaries passes, proving the GitHub summary path reports the same primary security failure and additive counts without parsing or leaking raw secret-bearing values.

## Edge Cases

### Optional and clear branches stay green

1. Open `yanote-report.json` from the smoke test.
2. Inspect diagnostics/per-operation entries for `http GET /optional` and `http GET /clear`.
3. **Expected:** `/optional` reports overall truth `optional` and `/clear` reports truth `clear`; neither operation appears as a failing Top Issue or a governance failure.

### Unsupported security stays explicit, not silently satisfied

1. Open `yanote-report.json` from the smoke test.
2. Inspect `http GET /unsupported-http`, `http GET /unsupported-oauth`, `http GET /unsupported-openid`, and `http GET /unsupported-location`.
3. **Expected:** each operation reports `truth: "unsupported"` with `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`; none are counted as satisfied.

### Redacted and omitted evidence become unavailable, not missing

1. Open `yanote-report.json` from the smoke test.
2. Inspect diagnostics for `http GET /redacted` and `http GET /unavailable`.
3. **Expected:** both entries report `truth: "unavailable"` and carry `evidenceState` / `evidenceReason` showing `redacted:sensitive` and `omitted:unavailable` respectively.

## Failure Signals

- The smoke-test command exits `0` or another non-`5` status despite missing/unavailable/unsupported security drift in the fixture.
- `yanote-report.json` is missing `httpSecurityConformance`, changes legacy `coverage.parameters` or `coverage.aggregate` numerators, or reorders governance failures inconsistently.
- CLI stdout/stderr or the GitHub summary path includes raw secret values or duplicates raw security diagnostics outside the typed governance failures.
- Optional/clear branches show up as failing issues, or unsupported security schemes/locations are treated as satisfied.

## Requirements Proved By This UAT

- R001 — the analyzer/report path still produces deterministic HTTP coverage while adding separate security truth.
- R002 — security drift fails closed with explicit typed semantic diagnostics instead of false-green output.
- R003 — the same security truth is visible through CLI, machine summary tokens, and the CI summary renderer.

## Not Proven By This UAT

- Public README/support/release documentation for the supported-vs-deferred security boundary; that is S02 work.
- Truthful support for `http`, `oauth2`, `openIdConnect`, or unsupported `apiKey` locations beyond the current apiKey query/header/cookie subset.
- Any live-runtime recorder capture changes; this slice reuses existing retained request evidence rather than introducing a new runtime capture path.

## Notes for Tester

- This fixture is intentionally semantically red even though operation/status coverage is fully green; exit code `5` is the correct result because the slice proves fail-closed security behavior.
- The `HTTP Security Conformance` human-readable block only appears when the report has security observations; the machine-readable `YANOTE_SUMMARY` security tokens are still expected on every HTTP report run.
