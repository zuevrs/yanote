# S01: Security Semantics Through Report, CLI, And CI

**Goal:** Turn effective OpenAPI security requirements into deterministic analyzer truth by evaluating a truthful apiKey-only security subset against retained request evidence and surfacing the result additively through report, CLI, and CI without changing legacy HTTP coverage numerators.
**Demo:** Run `yanote report` on security-focused OpenAPI fixtures and see inherited/overridden apiKey security requirements surface as additive per-operation truth plus typed semantic failures in `yanote-report.json`, CLI output, and CI summary while `coverage.operations/status/parameters/aggregate` stay unchanged.
**Active requirements:** None directly assigned to S01 in `.gsd/REQUIREMENTS.md`; this slice preserves validated requirements `R001`, `R002`, `R003`, and `R022` while delivering the M012 security-semantics contract.

## Must-Haves

- Resolve `components.securitySchemes` plus effective per-operation `security` deterministically, including root inheritance, operation override, `security: []` clear semantics, `{}` optional branches, OR across requirement objects, and AND within a requirement object.
- Support only the truthful first security subset: `apiKey` schemes in `query`, `header`, or `cookie` evaluated from retained request evidence presence/provenance; unsupported scheme types or locations must stay explicit instead of silently passing.
- Publish additive `httpSecurityConformance` truth in `yanote-report.json` with deterministic ordering and stable schema version `1.0.0`, while `coverage.operations/status/parameters/aggregate` remain unchanged.
- Route fail-closed typed security drift through governance diagnostics, CLI stdout/stderr + `YANOTE_SUMMARY`, and the GitHub summary renderer without leaking retained secret values.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`
- `node --test scripts/ci/render-yanote-summary.test.mjs`
- `npm -C yanote-js run build`

## Observability / Diagnostics

- Runtime signals: additive `httpSecurityConformance` summary/per-operation/diagnostics, typed `SEMANTIC_HTTP_*SECURITY` governance failures, and security-specific `YANOTE_SUMMARY` tokens.
- Inspection surfaces: focused Vitest suites, `yanote-report.json`, CLI stdout/stderr, `YANOTE_SUMMARY`, and `scripts/ci/render-yanote-summary.mjs`.
- Failure visibility: failing operation key, requirement branch, scheme name/location, truth (`missing`, `unavailable`, `unsupported`), evidence provenance (`captured`, `redacted`, `omitted`), and deterministic primary-failure ordering.
- Redaction constraints: raw header/query/cookie secret values must stay out of stdout/stderr/CI summary and out of the new security diagnostics surface; only presence/provenance truth is allowed.

## Integration Closure

- Upstream surfaces consumed: request evidence maps from `yanote-js/src/model/httpEvent.ts` and `yanote-js/src/events/readJsonl.ts`, OpenAPI extraction in `yanote-js/src/spec/openapi.ts` / `yanote-js/src/spec/semantics.ts`, and the existing report/gates/CLI summary pipelines.
- New wiring introduced in this slice: effective security extraction → `httpSecurityConformance` evaluator → additive `httpSecurityConformance` report section → `httpSecuritySemantics` governance failures → CLI `HTTP Security Conformance` block + security `YANOTE_SUMMARY` tokens + GitHub summary primary-failure handling.
- What remains before the milestone is truly usable end-to-end: S02 still needs the public docs, retained proof scripts, and support-boundary closeout for supported vs deferred security semantics.

## Tasks

- [x] **T01: Extract effective security requirements and prove apiKey conformance on fixtures** `est:1h30m`
  - Why: The slice needs one honest security contract before touching user-visible surfaces.
  - Files: `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/semantics.ts`, `yanote-js/src/coverage/httpSecurityConformance.ts`, `yanote-js/src/spec/openapi.security.test.ts`, `yanote-js/src/coverage/httpSecurityConformance.test.ts`, `yanote-js/test/fixtures/openapi/http-security-api-key.yaml`, `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`
  - Do: add a security fixture corpus, extract effective per-operation requirements from OpenAPI, and evaluate only the truthful `apiKey` subset from retained request evidence without changing canonical HTTP operation keys or legacy coverage math.
  - Verify: `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts`
  - Done when: inheritance/override/clear/optional security semantics are deterministic and supported `apiKey` truth is fixture-proven without secret leakage.
- [x] **T02: Fail closed on security drift with typed governance precedence** `est:1h`
  - Why: R002-style fail-closed behavior is not real until security drift stops CI through the existing semantic-failure layer.
  - Files: `yanote-js/src/gates/httpSecuritySemantics.ts`, `yanote-js/src/gates/evaluator.ts`, `yanote-js/src/gates/failureOrder.ts`, `yanote-js/src/gates/httpSecuritySemantics.test.ts`, `yanote-js/src/gates/failureOrder.test.ts`
  - Do: map missing/unavailable/unsupported security diagnostics to typed semantic failures, wire them ahead of threshold math, and lock deterministic precedence versus request, payload, and gate failures.
  - Verify: `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts`
  - Done when: security semantic drift exits 5 with stable, secret-safe primary failure ordering while satisfied/optional/cleared security stays green.
- [x] **T03: Publish additive httpSecurityConformance report contracts** `est:1h20m`
  - Why: The new security truth must become a stable machine-readable artifact without mutating legacy coverage surfaces.
  - Files: `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/report.security.contract.test.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`
  - Do: add a dedicated `httpSecurityConformance` section to the report, keep schema version `1.0.0`, and pin deterministic ordering plus unchanged `coverage.*` numerators.
  - Verify: `npm -C yanote-js test -- src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts`
  - Done when: `yanote-report.json` carries additive security summary/per-operation/diagnostics truth with stable ordering and no raw secret values.
- [x] **T04: Expose security truth through CLI output and GitHub summary** `est:1h10m`
  - Why: Preserving R003 means the new security surface must appear on the same CLI and CI summary paths teams already consume.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.security.report.test.ts`, `yanote-js/src/cli.security.summary.contract.test.ts`, `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/render-yanote-summary.test.mjs`
  - Do: add an `HTTP Security Conformance` CLI block, additive security `YANOTE_SUMMARY` tokens, deduped Top Issues/stderr handling, and GitHub-summary coverage for typed security failures.
  - Verify: `npm -C yanote-js test -- src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts && node --test scripts/ci/render-yanote-summary.test.mjs && npm -C yanote-js run build`
  - Done when: CLI stdout/stderr, `YANOTE_SUMMARY`, and GitHub summary all expose typed security drift once, remain secret-safe, and keep legacy coverage tokens unchanged.

## Files Likely Touched

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/semantics.ts`
- `yanote-js/src/coverage/httpSecurityConformance.ts`
- `yanote-js/src/spec/openapi.security.test.ts`
- `yanote-js/src/coverage/httpSecurityConformance.test.ts`
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml`
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`
- `yanote-js/src/gates/httpSecuritySemantics.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/httpSecuritySemantics.test.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.security.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.security.report.test.ts`
- `yanote-js/src/cli.security.summary.contract.test.ts`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
