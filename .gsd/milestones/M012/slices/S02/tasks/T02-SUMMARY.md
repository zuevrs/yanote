---
id: T02
parent: S02
milestone: M012
key_files:
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/guides/analyzer-coverage.md
  - docs/release-and-support.md
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s02-doc-links.sh
  - scripts/docs/verify-s04-boundaries.sh
key_decisions:
  - Publish the security matrix as fixture-backed proof from retained `security-semantics.*` sidecars and fixture provenance instead of describing it as an emergent property of the live Spring MVC demo.
  - Treat `httpSecurityConformance`, the CLI `HTTP Security Conformance` block, and security `YANOTE_SUMMARY` tokens as additive public surfaces that must not mutate legacy `coverage.operations/status/parameters/aggregate` numerators.
duration: ""
verification_result: passed
completed_at: 2026-03-25T22:38:32.206Z
blocker_discovered: false
---

# T02: Published the explicit fixture-backed security boundary across public docs and doc verifiers

**Published the explicit fixture-backed security boundary across public docs and doc verifiers**

## What Happened

Rewrote the public analyzer guide to publish the M012 security boundary literally instead of implying it from the live demo: root security inheritance, operation-level override, `security: []` clear semantics, `{}` optional branches, OR across Security Requirement objects, AND within one object, the truthful `apiKey` query/header/cookie subset, fail-closed `SEMANTIC_HTTP_MISSING_SECURITY` / `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` / `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`, additive `httpSecurityConformance`, CLI `HTTP Security Conformance` block rules, security `YANOTE_SUMMARY` tokens, unchanged legacy `coverage.operations/status/parameters/aggregate` numerators, and explicit defers for broader OpenAPI objects `examples`, `links`, `callbacks`, and `webhooks`. I then propagated the same wording into `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`, including the new focused verifier command `bash scripts/ci/verify-m012-s02-security-semantics.sh`, the retained `security-semantics.stdout` / `security-semantics.stderr` / `security-semantics-yanote-report.json` sidecars, and the truthful fixture provenance from `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` plus `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` without claiming that the live Spring MVC demo proves the security matrix by itself. Finally, I rewrote the three docs verifier scripts to pin the new exact strings, local markdown links, additive legacy-numerator wording, security-sidecar references, and deferred broader-object clauses without depending on git-driven release introspection inside the boundary verifier.

## Verification

Passed the slice verification stack except for the explicitly forbidden git check. `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` confirmed the retained public bundle contract still includes the widened request/security/red proof surfaces. `bash scripts/ci/verify-m012-s02-security-semantics.sh` proved the focused fixture-backed security semantics path end to end, including the `HTTP Security Conformance` block and the expected fail-closed codes. `bash scripts/ci/run-v1-e2e.sh` rebuilt the retained public bundle and regenerated the `security-semantics.*` sidecars plus manifest/source-path provenance. The docs stack `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` all passed against the final wording. I also directly inspected `.yanote-ci/v1-e2e/artifact-manifest.txt` and `.yanote-ci/v1-e2e/artifact-source-paths.txt` to confirm the observability surfaces recorded `security_semantics_expected_exit=5`, `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY`, and the exact spec/events provenance for the retained security sidecars.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 229ms |
| 2 | `bash scripts/ci/verify-m012-s02-security-semantics.sh` | 0 | ✅ pass | 7138ms |
| 3 | `bash scripts/ci/run-v1-e2e.sh` | 0 | ✅ pass | 26231ms |
| 4 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 102ms |
| 5 | `bash scripts/docs/verify-s02-doc-links.sh` | 0 | ✅ pass | 84ms |
| 6 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 110ms |
| 7 | `bash -lc "test -f .yanote-ci/v1-e2e/security-semantics.stdout && test -f .yanote-ci/v1-e2e/security-semantics.stderr && test -f .yanote-ci/v1-e2e/security-semantics-yanote-report.json && rg -n 'security_semantics_expected_exit=5|security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY|source_paths_note=artifact-source-paths.txt' .yanote-ci/v1-e2e/artifact-manifest.txt && rg -n 'security-semantics\\.(stdout|stderr)|security-semantics-yanote-report.json|security_semantics_spec=yanote-js/test/fixtures/openapi/http-security-api-key.yaml|security_semantics_events=yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl' .yanote-ci/v1-e2e/artifact-source-paths.txt"` | 0 | ✅ pass | 33ms |


## Deviations

Did not run `git diff --check` because this auto-mode turn explicitly forbade git commands; all non-git slice verification commands passed.

## Known Issues

Pre-existing `npm audit` vulnerability warnings from `npm -C yanote-js ci` and Gradle deprecation warnings emitted during `bash scripts/ci/run-v1-e2e.sh` remain unchanged and were not addressed in this documentation/verifier task.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s04-boundaries.sh`
