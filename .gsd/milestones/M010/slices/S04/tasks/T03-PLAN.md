---
estimated_steps: 4
estimated_files: 8
skills_used:
  - bash-scripting
  - openapi-specification-v3.2
  - test
---

# T03: Retarget the live HTTP proof bundle and docs to the HTTP core boundary

**Slice:** S04 — Final Boundary Assembly And Docs Hardening
**Milestone:** M010

## Description

Move the public HTTP retained proof from the old payload-era red path to the real HTTP core boundary that M010 set out to prove. This task keeps the green denominator intact, retargets the retained red proof to `/evidence/users/{id}`, and updates the analyzer guide plus landing/verifier surfaces so the public story matches the new CLI/runtime truth.

## Steps

1. Update `scripts/docs/verify-s02-analysis-path.sh` and `scripts/ci/run-v1-e2e.sh` so the happy path stays green while the retained red path proves undeclared-status, parameter-value, and response-header drift on `/evidence/users/{id}`.
2. Refresh `scripts/ci/run-v1-e2e.contract.test.mjs` so the retained HTTP bundle contract pins the new semantic-red behavior and artifact expectations.
3. Rewrite `docs/guides/analyzer-coverage.md`, `README.md`, `docs/README.md`, and `examples/README.md` so they describe `HTTP Core Conformance` as the public red-path showcase while preserving JSON payload validation as an additive supported surface.
4. Update the landing/doc-link verifiers to enforce the new wording and proof-bundle links without regressing Russian-first public docs.

## Must-Haves

- [ ] The HTTP happy-path proof remains green and still exports a deterministic retained bundle.
- [ ] The retained HTTP red path now demonstrates `/evidence/users/{id}` core drift instead of payload-only unsupported schema drift.
- [ ] Analyzer and landing docs describe `HTTP Core Conformance` truthfully and stop implying that the public red path is payload-era only.
- [ ] The updated verifier stack enforces the new retained bundle contract and landing wording.

## Verification

- `node --test scripts/ci/run-v1-e2e.contract.test.mjs`
- `bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/ci/run-v1-e2e.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability Impact

- Signals added/changed: `.yanote-ci/v1-e2e/` manifests/stdout/stderr/report artifacts now showcase HTTP core red-path truth instead of payload-era-only semantics.
- How a future agent inspects this: rerun the HTTP proof/verifier commands above and inspect `.yanote-ci/v1-e2e/semantic-red.stdout`, `.yanote-ci/v1-e2e/semantic-red.stderr`, and `.yanote-ci/v1-e2e/artifact-manifest.txt`.
- Failure state exposed: regressions should show whether the break is in the green denominator, retained red-path semantic code, or public landing/analyzer-guide wording.

## Inputs

- `scripts/docs/verify-s02-analysis-path.sh` — current HTTP proof verifier that still checks payload-era summary wording and red-path semantics.
- `scripts/ci/run-v1-e2e.sh` — retained HTTP bundle exporter that still records payload-era semantic-red expectations.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — contract test for the retained HTTP bundle metadata.
- `docs/guides/analyzer-coverage.md` — public HTTP guide that still centers the retained red path on payload-era wording.
- `README.md` — root landing that still describes the retained red proof as `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`.
- `docs/README.md` — docs landing that still points readers to payload-era retained proof wording.
- `examples/README.md` — examples landing that still frames the retained red proof around unsupported payload schema.

## Expected Output

- `scripts/docs/verify-s02-analysis-path.sh` — HTTP proof verifier aligned to the new HTTP core red path.
- `scripts/ci/run-v1-e2e.sh` — retained HTTP bundle exporter aligned to the new semantic-red contract.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — contract test pinned to the updated HTTP bundle/manifests.
- `docs/guides/analyzer-coverage.md` — public HTTP guide rewritten around the HTTP core boundary.
- `README.md` — root landing updated to the new retained HTTP proof story.
- `docs/README.md` — docs landing aligned with the updated HTTP guide/proof surface.
- `examples/README.md` — examples landing aligned with the new retained HTTP proof bundle.
- `scripts/docs/verify-s03-landing.sh` — landing verifier assertions updated to the HTTP core boundary wording.
