# S02: Public Boundary Closure And Retained Proof — UAT

**Milestone:** M012
**Written:** 2026-03-25T22:46:13.939Z

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: this slice closes public proof and documentation surfaces, so confidence comes from rerunning the retained verifier/bundle and checking the published wording and retained artifacts together.

## Preconditions

- Worktree contains the final M012 S02 changes.
- Host can run Node, Gradle, and Docker/Compose used by `bash scripts/ci/run-v1-e2e.sh`.
- `.yanote-ci/v1-e2e/` is writable.

## Smoke Test

1. Run `bash scripts/ci/verify-m012-s02-security-semantics.sh`.
2. Confirm the script exits successfully.
3. **Expected:** The script prints `Focused security semantics verifier passed.` after proving analyzer exit `5`, the `HTTP Security Conformance` block, ordered security semantic failures, additive `YANOTE_SUMMARY` security tokens, unchanged legacy coverage behavior, and secret-safe outputs.

## Test Cases

### 1. Retained public bundle includes fixture-backed security sidecars and provenance

1. Run `bash scripts/ci/run-v1-e2e.sh`.
2. Open `.yanote-ci/v1-e2e/artifact-manifest.txt`.
3. Open `.yanote-ci/v1-e2e/artifact-source-paths.txt`.
4. Verify `.yanote-ci/v1-e2e/` contains `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json`.
5. **Expected:** The manifest records `security_semantics_expected_exit=5` and `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY`; the source-path notes record `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` and `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`; the raw `http-security-api-key.fixture.jsonl` file is not copied into `.yanote-ci/v1-e2e/`.

### 2. Public docs publish the supported security boundary literally

1. Run `bash scripts/docs/verify-s03-landing.sh`.
2. Run `bash scripts/docs/verify-s02-doc-links.sh`.
3. Run `bash scripts/docs/verify-s04-boundaries.sh`.
4. Inspect `README.md`, `docs/guides/analyzer-coverage.md`, and `docs/release-and-support.md` around the security sections.
5. **Expected:** The published docs literally describe root inheritance, operation override, `security: []`, optional `{}`, OR across Security Requirement objects, AND within one object, supported `apiKey` query/header/cookie semantics, additive `httpSecurityConformance` / CLI / `YANOTE_SUMMARY` / retained CI surfaces, unchanged legacy coverage numerators, and explicit defers for `examples`, `links`, `callbacks`, and `webhooks`.

### 3. Bundle contract tests pin widened inventory deterministically

1. Run `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`.
2. Review the passing test names for security bundle coverage.
3. **Expected:** Contract tests pass and include assertions for the security verifier rerun, deterministic manifest entries, source-path provenance, and secret-safe retained sidecars.

### 4. Focused security outputs fail closed without leaking fixture secrets

1. Open `.yanote-ci/v1-e2e/security-semantics.stdout`.
2. Open `.yanote-ci/v1-e2e/security-semantics.stderr`.
3. Open `.yanote-ci/v1-e2e/security-semantics-yanote-report.json`.
4. Verify the retained outputs show `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`.
5. **Expected:** Outputs show additive `HTTP Security Conformance` truth and fail-closed diagnostics while retaining only scheme/key names and reasons, not raw fixture secret-like values.

## Edge Cases

### Fixture-backed proof remains separate from the live example service

1. Compare `artifact-source-paths.txt` entries for `security-semantics.*` with the live bundle entries for `events.jsonl` and `out/yanote-report.json`.
2. **Expected:** Security sidecars are sourced from the focused OpenAPI/event fixtures, while the happy-path bundle remains sourced from the live Compose demo; the public docs describe this distinction explicitly.

### Legacy coverage numerators stay unchanged when security truth is added

1. Re-run `bash scripts/ci/verify-m012-s02-security-semantics.sh`.
2. Inspect the summary lines in `security-semantics.stdout`.
3. **Expected:** The focused proof shows additive security truth while legacy `coverage.operations` and `coverage.status` remain `100.00%`, and `parameters` / `aggregate` remain `N/A` for the focused fixture set instead of being redefined by security semantics.

## Failure Signals

- `verify-m012-s02-security-semantics.sh` stops passing or no longer proves analyzer exit `5`.
- `artifact-manifest.txt` is missing `security_semantics_expected_exit=5` or `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY`.
- `.yanote-ci/v1-e2e/` contains the raw `http-security-api-key.fixture.jsonl` file.
- Docs verifiers fail or published docs stop naming deferred broader OpenAPI objects and supported `apiKey` locations explicitly.
- `security-semantics.stdout`, `security-semantics.stderr`, or `security-semantics-yanote-report.json` begin to expose raw fixture secret-like values.

## Requirements Proved By This UAT

- R001 — The recorder/analyzer/report contract remains deterministic while additive HTTP security truth is published on separate public proof surfaces.
- R002 — Missing, unavailable, and unsupported security semantics fail closed with explicit diagnostics and expected non-zero analyzer behavior.
- R003 — CLI, retained CI bundle, and public support/documentation surfaces publish the same security boundary consistently.

## Not Proven By This UAT

- Live Spring MVC demo coverage of the full security matrix; the published security proof is fixture-backed by design.
- Support for broader OpenAPI objects or unsupported security subtypes/locations beyond the documented `apiKey` query/header/cookie subset.

## Notes for Tester

- `bash scripts/ci/run-v1-e2e.sh` is the slowest check and may emit existing npm audit and Gradle deprecation warnings; those warnings are not slice regressions.
- This auto-mode turn intentionally skipped `git diff --check` because git commands were forbidden, so the non-git verifier stack above is the authoritative slice proof.
