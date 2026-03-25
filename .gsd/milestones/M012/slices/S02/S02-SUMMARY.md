---
id: S02
parent: M012
milestone: M012
provides:
  - A rerunnable public v1 security proof bundle with retained `security-semantics.*` sidecars and fixture provenance.
  - Literal README/docs/examples/release-support wording for the supported `apiKey` security subset, additive security surfaces, unchanged legacy coverage numerators, and deferred broader OpenAPI objects.
  - A focused verifier and contract-test stack that localize drift across retained artifacts, provenance notes, and public support wording.
requires:
  - slice: S01
    provides: Additive HTTP security semantics through report/CLI/CI, typed `SEMANTIC_HTTP_*SECURITY` governance failures, and the focused security fixtures for the supported `apiKey` subset.
affects:
  []
key_files:
  - scripts/ci/verify-m012-s02-security-semantics.sh
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/guides/analyzer-coverage.md
  - docs/release-and-support.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s02-doc-links.sh
  - scripts/docs/verify-s04-boundaries.sh
  - .yanote-ci/v1-e2e/artifact-manifest.txt
  - .yanote-ci/v1-e2e/artifact-source-paths.txt
key_decisions:
  - Retain fixture-backed security proof sidecars and provenance in the public v1 bundle instead of widening the live Spring MVC demo to fake broader security coverage.
  - Keep the raw `http-security-api-key.fixture.jsonl` artifact out of `.yanote-ci/v1-e2e/` and enforce secret-safety by checking retained stdout/stderr/report outputs for captured fixture values.
  - Publish the security matrix as fixture-backed proof from retained `security-semantics.*` sidecars and fixture provenance instead of describing it as an emergent property of the live Spring MVC demo.
  - Treat `httpSecurityConformance`, the CLI `HTTP Security Conformance` block, and security `YANOTE_SUMMARY` tokens as additive public surfaces that must not mutate legacy `coverage.operations/status/parameters/aggregate` numerators.
patterns_established:
  - Public broader-object proof can widen `.yanote-ci/v1-e2e/` additively through derived sidecars plus manifest/source-path provenance without widening the live example service.
  - Public docs and exact-string verifiers should publish the supported/deferred boundary literally instead of implying it from runtime behavior or release lore.
  - A new semantic family closes cleanly when the focused verifier, retained public bundle, contract tests, and docs verifier stack all pin the same truth contract.
observability_surfaces:
  - `.yanote-ci/v1-e2e/security-semantics.stdout`
  - `.yanote-ci/v1-e2e/security-semantics.stderr`
  - `.yanote-ci/v1-e2e/security-semantics-yanote-report.json`
  - `.yanote-ci/v1-e2e/artifact-manifest.txt`
  - `.yanote-ci/v1-e2e/artifact-source-paths.txt`
  - CLI `HTTP Security Conformance` block and additive `YANOTE_SUMMARY` security tokens
  - `bash scripts/ci/verify-m012-s02-security-semantics.sh`
  - `bash scripts/ci/run-v1-e2e.sh`
drill_down_paths:
  - .gsd/milestones/M012/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M012/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T22:46:13.938Z
blocker_discovered: false
---

# S02: Public Boundary Closure And Retained Proof

**Retained fixture-backed HTTP security proof in the public v1 bundle and published the exact supported/deferred security boundary across README, docs, examples, and release/support surfaces without changing legacy coverage numerators.**

## What Happened

S02 closed the public boundary for M012 by turning the already-implemented S01 security semantics into a rerunnable retained proof and a literal published support contract. On the proof side, the slice added `scripts/ci/verify-m012-s02-security-semantics.sh`, widened `scripts/ci/run-v1-e2e.sh` to retain `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json`, and recorded deterministic provenance in `.yanote-ci/v1-e2e/artifact-manifest.txt` and `.yanote-ci/v1-e2e/artifact-source-paths.txt`. The retained bundle now proves analyzer exit code `5`, ordered `SEMANTIC_HTTP_MISSING_SECURITY` → `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` → `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`, additive `HTTP Security Conformance` / `YANOTE_SUMMARY` security truth, unchanged legacy `coverage.operations/status/parameters/aggregate` behavior, and secret-safe retained outputs, while intentionally keeping the raw `http-security-api-key.fixture.jsonl` file out of the public bundle.

On the public-boundary side, the slice rewrote README/docs/examples/release-support surfaces and their exact-string verifier stack so users now see the supported security contract literally instead of inferring it from the live Spring MVC demo. The published wording names root inheritance, operation override, explicit `security: []` clear semantics, `{}` optional branches, OR across Security Requirement objects, AND within one object, the truthful `apiKey` query/header/cookie subset, additive `httpSecurityConformance` / CLI `HTTP Security Conformance` / `YANOTE_SUMMARY` / retained CI sidecars, fail-closed unavailable and unsupported behavior, unchanged legacy coverage numerators, and explicit defers for `examples`, `links`, `callbacks`, `webhooks`, and unsupported security subtypes/locations. Contract tests and docs verifiers now pin that wording and the widened bundle inventory deterministically, so future slices can detect drift in either retained artifacts or public support messaging quickly.

## Verification

Executed the non-git slice verification stack from the plan and confirmed the advertised observability surfaces. `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` passed and pinned the widened bundle contract. `bash scripts/ci/verify-m012-s02-security-semantics.sh` passed and proved the focused security boundary end to end, including analyzer exit `5`, the `HTTP Security Conformance` block, ordered semantic failures, additive security tokens, and secret-safe output. `bash scripts/ci/run-v1-e2e.sh` passed and regenerated the retained bundle with `security-semantics.*` sidecars plus manifest/source-path provenance. `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` all passed against the final wording. Direct inspection of `.yanote-ci/v1-e2e/artifact-manifest.txt`, `.yanote-ci/v1-e2e/artifact-source-paths.txt`, `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json` confirmed `security_semantics_expected_exit=5`, `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY`, the exact fixture provenance, additive security truth counts, and the absence of raw fixture secret-like values in the retained public outputs.

## Requirements Advanced

- R001 — Extended the public retained proof/report boundary so additive HTTP security truth is visible without changing the established operation/status/parameter coverage contract.
- R002 — Pinned fail-closed missing/unavailable/unsupported security behavior through a focused verifier, retained sidecars, and public support wording that forbids false green output.
- R003 — Closed the CLI/CI/public-doc delivery path for HTTP security semantics through retained bundle artifacts, `YANOTE_SUMMARY`/CLI messaging, and release/support documentation.

## Requirements Validated

- R001 — `bash scripts/ci/run-v1-e2e.sh` retained the new security sidecars and provenance while preserving legacy coverage numerators, and the docs verifier stack confirmed the additive public boundary.
- R002 — `bash scripts/ci/verify-m012-s02-security-semantics.sh` proved analyzer exit `5`, ordered `SEMANTIC_HTTP_MISSING_SECURITY` → `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` → `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`, additive `HTTP Security Conformance`, and secret-safe retained outputs.
- R003 — `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/ci/run-v1-e2e.sh`, and the docs verifier stack proved the same security boundary is delivered consistently through CLI, retained CI artifacts, and support/documentation surfaces.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Did not run `git diff --check` because this auto-mode turn explicitly forbade git commands; all non-git slice verification and observability checks passed.

## Known Limitations

Broader OpenAPI objects (`examples`, `links`, `callbacks`, `webhooks`) and unsupported security subtypes/locations remain explicitly deferred by design; only the truthful `apiKey` query/header/cookie subset is published as supported. The public `run-v1-e2e.sh` proof still depends on host-prepared Gradle/Node assets and continues to emit pre-existing npm audit and Gradle deprecation warnings.

## Follow-ups

M012 can now move to milestone validation/closeout. Separately, if the project ever wants raw `docker compose up` to be a supported cold-start entrypoint, that should be planned as explicit follow-up work rather than inferred from the current retained proof path.

## Files Created/Modified

- `scripts/ci/verify-m012-s02-security-semantics.sh` — Added the focused fixture-backed security verifier that asserts analyzer exit `5`, failure ordering, additive security truth, unchanged legacy coverage behavior, and secret-safe outputs.
- `scripts/ci/run-v1-e2e.sh` — Retained `security-semantics.*` sidecars in the public v1 bundle, recorded provenance, and kept the raw security fixture JSONL out of `.yanote-ci/v1-e2e/`.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — Pinned the widened public bundle inventory, expected security verifier behavior, and deterministic manifest/source-note wiring.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — Updated collector regression coverage for the widened retained bundle and deterministic replacement behavior.
- `README.md` — Published the supported security subset, additive public surfaces, unchanged legacy coverage numerators, and deferred broader OpenAPI boundary from the root landing surface.
- `docs/README.md` — Pointed the docs landing surface at the retained security proof and explicit analyzer/support boundary.
- `examples/README.md` — Clarified that the broader security matrix is proven by retained fixtures and sidecars rather than by widening the live Spring MVC demo.
- `docs/guides/analyzer-coverage.md` — Documented inheritance, override, clear/optional, OR/AND semantics, the supported `apiKey` query/header/cookie subset, fail-closed codes, and additive security reporting surfaces.
- `docs/release-and-support.md` — Published the security support/defer boundary, retained sidecar names, fixture provenance, and unchanged legacy coverage numerators on the release/support surface.
- `scripts/docs/verify-s03-landing.sh` — Pinned landing-surface wording for the retained security proof, additive surfaces, and deferred broader OpenAPI objects.
- `scripts/docs/verify-s02-doc-links.sh` — Pinned analyzer-guide security wording and local markdown link integrity.
- `scripts/docs/verify-s04-boundaries.sh` — Pinned release/support boundary wording for the security subset, retained proof artifacts, and explicit defers.
- `.yanote-ci/v1-e2e/artifact-manifest.txt` — Recorded the retained security sidecars, expected analyzer exit code, primary semantic failure, and bundle inventory.
- `.yanote-ci/v1-e2e/artifact-source-paths.txt` — Recorded exact fixture provenance for the retained security sidecars alongside the existing live bundle sources.
- `.gsd/KNOWLEDGE.md` — Recorded the pattern that fixture-backed broader-object proofs should publish derived sidecars plus provenance instead of raw fixture evidence.
- `.gsd/PROJECT.md` — Refreshed project state to show the M012 S02 public security boundary closeout and the remaining milestone-level closeout gap.
