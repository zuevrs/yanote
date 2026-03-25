# S04: Public Contract Closeout For HTTP Semantics

**Goal:** Close M011 by making the standard CI/proof entrypoints and public docs tell one truthful HTTP semantics story: the additive request-semantics bundle, analyzer guide, landing/release docs, and verifier stack must all publish the exact supported request serialization/cookie subset plus the payload format/media boundary through the existing report/CLI/CI surfaces.
**Demo:** After this slice, teams running the standard report/CI entrypoints and reading the analyzer guide see the widened supported HTTP boundary, retained proof scripts, and stable additive schema/CLI tokens for cookie/serialization/media/format truth.
**Active requirements:** Supports active requirement `R022`; preserves validated requirements `R001`, `R002`, and `R003`.

## Must-Haves

- `bash scripts/ci/run-v1-e2e.sh` retains the stable happy-path/report bundle plus an additive request-semantics sidecar derived from the existing live `events.jsonl`, without introducing a second live runtime harness.
- `docs/guides/analyzer-coverage.md`, `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md` publish the exact supported request subset (`path=simple`, `query=form`, `header=simple`, `cookie=form`, repeated arrays only for `query=form` + `explode=true` + scalar items), the additive `httpRequestConformance` / `declaredSupport*` / request `YANOTE_SUMMARY` tokens, the `email`-only format allowlist, and most-specific media matching without implying blanket OpenAPI support.
- Public verifiers and bundle contract tests keep the docs and retained CI surfaces aligned, while the focused truth scripts `bash scripts/ci/verify-m011-s02-request-semantics.sh` and `bash scripts/ci/verify-m011-s03-format-media.sh` remain the authoritative deep proofs behind the public summary path.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/ci/run-v1-e2e.sh`
- `bash scripts/ci/verify-m011-s02-request-semantics.sh`
- `bash scripts/ci/verify-m011-s03-format-media.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: `.yanote-ci/v1-e2e/` manifest/source-path notes plus request-semantics stdout/stderr/report artifacts, the retained `semantic-red.*` payload artifacts, `HTTP Request Conformance`, `HTTP Payload Conformance`, and the final `YANOTE_SUMMARY` line.
- Inspection surfaces: `bash scripts/ci/run-v1-e2e.sh`, `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, and the focused `verify-m011-s02-request-semantics.sh` / `verify-m011-s03-format-media.sh` proof scripts.
- Failure visibility: bundle contract tests and doc verifiers should pinpoint whether drift came from retained-event filtering, report/CLI publication, artifact manifest/source notes, or stale public wording.
- Redaction constraints: public docs and retained sidecars must not leak raw Authorization/session values or imply support beyond the published request/payload subset.

## Integration Closure

- Upstream surfaces consumed: `scripts/ci/run-v1-e2e.sh`, `examples/openapi/request-evidence-openapi.yaml`, `yanote-js/src/cli.ts`, `yanote-js/src/report/schema.ts`, the focused S02/S03 verifier scripts, and the current public doc/verifier surfaces.
- New wiring introduced in this slice: additive request-semantics sidecars in `.yanote-ci/v1-e2e/`, public-guide/release wording for the widened HTTP boundary, and exact-string contract tests that keep docs and retained artifacts aligned.
- What remains before the milestone is truly usable end-to-end: nothing.

## Tasks

- [x] **T01: Add request-semantics sidecars to the public v1 proof bundle** `est:1h30m`
  - Why: The standard public bundle currently proves the happy path plus payload semantic-red behavior only; this task widens it with request-semantics truth derived from the already-recorded live events so teams can see the M011 request boundary on the same entrypoint without spinning up a second runtime harness.
  - Files: `scripts/ci/run-v1-e2e.sh`, `scripts/ci/run-v1-e2e.contract.test.mjs`, `scripts/ci/collect-yanote-artifacts.sh`, `scripts/ci/collect-yanote-artifacts.test.mjs`, `examples/openapi/request-evidence-openapi.yaml`
  - Do: filter the retained live `.yanote-ci/v1-e2e/events.jsonl` down to the `/request-evidence/users/{userId}` records, rerun `yanote report` against `examples/openapi/request-evidence-openapi.yaml`, retain additive request-semantics artifacts plus manifest/source-path notes beside the existing happy-path and `semantic-red.*` files, and pin the new sidecar inventory and `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` outcome in the Node contract tests.
  - Verify: `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
  - Done when: `.yanote-ci/v1-e2e/` can retain additive request-semantics artifacts without regressing the current happy-path and payload semantic-red bundle, and the bundle contract tests pass with the new inventory.
- [x] **T02: Rewrite public docs and boundary verifiers for the widened HTTP semantics** `est:1h45m`
  - Why: The analyzer guide and public landing/release surfaces still narrate a payload-era boundary; this task closes the outward-facing contract so the standard report/CI path and the focused S02/S03 proofs all tell one truthful story.
  - Files: `docs/guides/analyzer-coverage.md`, `README.md`, `docs/README.md`, `examples/README.md`, `docs/release-and-support.md`, `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`
  - Do: rewrite `docs/guides/analyzer-coverage.md` in Russian-first form to publish the additive request surface, exact supported request subset, `email`-only format policy, and most-specific media matching without the corrupted tail; propagate the final wording into the root/docs/examples/release docs; and update the exact-string verifiers so they enforce the new request/payload wording and bundle artifact names while pointing to the focused S02/S03 proof scripts.
  - Verify: `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s04-boundaries.sh`
  - Done when: public docs publish the exact supported request and payload boundary without overclaiming, the analyzer guide and release/support surfaces reference the additive request sidecar plus the focused proof commands truthfully, and the doc/boundary verifiers pass against the new public bundle shape.

## Files Likely Touched

- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `examples/openapi/request-evidence-openapi.yaml`
- `docs/guides/analyzer-coverage.md`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
