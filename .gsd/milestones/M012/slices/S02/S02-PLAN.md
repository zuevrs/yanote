# S02: Public Boundary Closure And Retained Proof

**Goal:** Publish the M012 security boundary by retaining a fixture-backed public proof in `.yanote-ci/v1-e2e/` and updating README/support surfaces so supported security semantics, additive report/CLI/CI truth, unchanged legacy coverage numerators, and deferred broader OpenAPI objects are explicit and rerunnable.
**Demo:** Run the retained milestone proof scripts and inspect the updated README/support docs to see the published Yanote boundary explicitly describe supported security semantics, fail-closed/unavailable cases, and deferred broader OpenAPI objects.
**Active requirements:** There are no active requirements owned only by S02; this slice closes the public/doc/proof surfaces for validated `R001`, `R002`, and `R003`.

## Must-Haves

- `bash scripts/ci/verify-m012-s02-security-semantics.sh` proves fixture-backed security truth end to end: exit code `5`, `HTTP Security Conformance`, ordered `SEMANTIC_HTTP_MISSING_SECURITY` → `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` → `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`, additive `httpSecurityConformance`, unchanged legacy `coverage.operations/status/parameters/aggregate`, and secret-safe stdout/stderr/report output.
- `bash scripts/ci/run-v1-e2e.sh` retains additive `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json` plus manifest/source-path provenance from `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` and `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`, without copying raw security fixture JSONL into `.yanote-ci/v1-e2e/`.
- `README.md`, `docs/README.md`, `examples/README.md`, `docs/guides/analyzer-coverage.md`, and `docs/release-and-support.md` publish literal root inheritance, operation override, `security: []` clear semantics, `{}` optional branches, OR across requirement objects, AND within one requirement object, the truthful `apiKey` query/header/cookie subset, fail-closed unavailable/unsupported behavior, additive security summary surfaces, unchanged legacy coverage numerators, and explicit defers for `examples`, `links`, `callbacks`, and `webhooks`.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m012-s02-security-semantics.sh`
- `bash scripts/ci/run-v1-e2e.sh`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: `.yanote-ci/v1-e2e/security-semantics.stdout`, `.yanote-ci/v1-e2e/security-semantics.stderr`, `.yanote-ci/v1-e2e/security-semantics-yanote-report.json`, `artifact-manifest.txt`, `artifact-source-paths.txt`, the CLI `HTTP Security Conformance` block, and additive `YANOTE_SUMMARY` security tokens.
- Inspection surfaces: `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m012-s02-security-semantics.sh`, `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, and the exact-string docs verifier stack.
- Failure visibility: contract tests and retained sidecars should pinpoint whether drift came from fixture-backed CLI/report output, public bundle wiring, provenance-note keys, or stale public wording.
- Redaction constraints: public docs and retained bundle outputs must not leak fake secret-like fixture values and must not redistribute the raw `http-security-api-key.fixture.jsonl` artifact.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/cli.ts`, `yanote-js/src/report/report.ts`, `scripts/ci/render-yanote-summary.mjs`, `scripts/ci/run-v1-e2e.sh`, `README.md`, and `docs/guides/analyzer-coverage.md`.
- New wiring introduced in this slice: fixture-backed `security-semantics.*` retained artifacts inside `.yanote-ci/v1-e2e/`, manifest/source-path provenance for those artifacts, and exact-string docs verifiers that pin the public security boundary.
- What remains before the milestone is truly usable end-to-end: nothing.

## Tasks

- [x] **T01: Retain fixture-backed security proof in the public v1 bundle** `est:1h45m`
  - Why: Public proof currently stops at request/payload semantics; M012 needs a rerunnable security proof that reuses the stable S01 fixtures instead of widening the live example service.
  - Files: `scripts/ci/verify-m012-s02-security-semantics.sh`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/run-v1-e2e.contract.test.mjs`, `scripts/ci/collect-yanote-artifacts.test.mjs`
  - Do: add the focused security verifier, widen `scripts/ci/run-v1-e2e.sh` with `security-semantics.*` sidecars and manifest/source-note keys from the security fixtures, keep raw fixture JSONL out of the public bundle, and pin the new inventory/provenance in the bundle contract tests.
  - Verify: `bash scripts/ci/verify-m012-s02-security-semantics.sh && node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs && bash scripts/ci/run-v1-e2e.sh`
  - Done when: the focused security verifier, public v1 bundle, and bundle contract tests all pass with stable security sidecars, expected exit code `5`, deterministic failure ordering, unchanged legacy coverage numerators, and no secret-like fixture values or raw fixture JSONL in retained public outputs.
- [x] **T02: Publish the explicit security and defer boundary across docs** `est:1h45m`
  - Why: After the proof artifacts are stable, the public docs and exact-string verifiers must publish the security boundary literally so users do not infer broader OpenAPI support or live-demo security coverage that does not exist.
  - Files: `README.md`, `docs/README.md`, `examples/README.md`, `docs/guides/analyzer-coverage.md`, `docs/release-and-support.md`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s04-boundaries.sh`
  - Do: rewrite the Russian-first landing/analyzer/support docs to name security inheritance/override/clear/optional/OR/AND semantics, `apiKey` query/header/cookie support, fail-closed unavailable/unsupported behavior, additive `httpSecurityConformance` / CLI / `YANOTE_SUMMARY` / CI surfaces, unchanged legacy coverage numerators, explicit defers for `examples`, `links`, `callbacks`, `webhooks`, and the fixture-backed provenance of the new `security-semantics.*` sidecar; then update the exact-string docs verifiers to pin that wording.
  - Verify: `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s04-boundaries.sh`
  - Done when: root/docs/examples/support surfaces all point to the security proof truthfully, mention the new focused verifier and sidecar names, explicitly defer unsupported broader OpenAPI objects, and the docs verifier stack passes.

## Files Likely Touched

- `scripts/ci/verify-m012-s02-security-semantics.sh`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s04-boundaries.sh`
