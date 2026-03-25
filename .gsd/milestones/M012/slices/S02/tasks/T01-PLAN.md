---
estimated_steps: 4
estimated_files: 4
skills_used:
  - bash-scripting
  - openapi-specification-v3.2
---

# T01: Retain fixture-backed security proof in the public v1 bundle

**Slice:** S02 — Public Boundary Closure And Retained Proof
**Milestone:** M012

## Description

Add a fixture-backed security proof surface that makes the S01 contract public without pretending the live Spring MVC demo proves the entire security matrix.

## Steps

1. Create `scripts/ci/verify-m012-s02-security-semantics.sh` around the security fixtures and assert exit `5`, `HTTP Security Conformance`, additive `YANOTE_SUMMARY` security tokens, ordered missing → unavailable → unsupported diagnostics, unchanged legacy coverage numerators, and no secret-like fixture values in stdout/stderr/report JSON.
2. Update `scripts/ci/run-v1-e2e.sh` to retain `security-semantics.stdout`, `security-semantics.stderr`, and `security-semantics-yanote-report.json` from the fixture command, add manifest/source-note keys such as `security_semantics_expected_exit=5`, and keep the raw `http-security-api-key.fixture.jsonl` file out of `.yanote-ci/v1-e2e/`.
3. Update `scripts/ci/run-v1-e2e.contract.test.mjs` and `scripts/ci/collect-yanote-artifacts.test.mjs` so the widened bundle inventory, primary code `SEMANTIC_HTTP_MISSING_SECURITY`, and fixture provenance are pinned deterministically.
4. Keep the bundle secret-safe: public retained outputs may name fixture source paths and machine truth, but they must not leak fake captured values from the security fixture corpus.

## Must-Haves

- [ ] Focused security verifier proves the exact public contract and fails on secret leakage, changed failure ordering, or changed legacy coverage numerators.
- [ ] Public v1 bundle retains `security-semantics.*` sidecars and manifest/source-note metadata without adding the raw security fixture JSONL to the retained bundle.
- [ ] Bundle contract tests pin the widened inventory, primary failure code, and fixture provenance.

## Verification

- Focused verifier, bundle contract tests, and the public v1 bundle command all pass after the change.
- `bash scripts/ci/verify-m012-s02-security-semantics.sh && node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs && bash scripts/ci/run-v1-e2e.sh`

## Observability Impact

- Signals added/changed: `.yanote-ci/v1-e2e/security-semantics.stdout`, `.yanote-ci/v1-e2e/security-semantics.stderr`, `.yanote-ci/v1-e2e/security-semantics-yanote-report.json`, `artifact-manifest.txt`, `artifact-source-paths.txt`.
- How a future agent inspects this: rerun `bash scripts/ci/run-v1-e2e.sh` or `bash scripts/ci/verify-m012-s02-security-semantics.sh` and inspect retained sidecars, manifest keys, and stderr ordering.
- Failure state exposed: bundle wiring drift, fixture provenance drift, exit-code/diagnostic ordering drift, and secret-leak regressions become explicit.

## Inputs

- `scripts/ci/run-v1-e2e.sh` — current public bundle exporter that already retains happy-path, request, and payload sidecars.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — bundle contract test that must pin the widened retained artifact surface.
- `scripts/ci/collect-yanote-artifacts.sh` — collector that copies the retained `.yanote-ci/v1-e2e/` bundle into the durable artifact bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector regression test that must reflect the widened bundle inventory.
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` — focused security spec fixture reused for the retained proof.
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` — fixture-backed retained evidence that proves supported, unavailable, missing, optional, clear, and unsupported security cases.

## Expected Output

- `scripts/ci/verify-m012-s02-security-semantics.sh` — focused retained verifier for the public security boundary.
- `scripts/ci/run-v1-e2e.sh` — public bundle exporter widened with fixture-backed `security-semantics.*` sidecars and provenance notes.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — contract assertions for the widened public bundle inventory and security provenance.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — collector regression coverage aligned with the widened `.yanote-ci/v1-e2e/` bundle.
