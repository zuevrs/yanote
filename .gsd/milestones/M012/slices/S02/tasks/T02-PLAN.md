---
estimated_steps: 4
estimated_files: 8
skills_used:
  - openapi-specification-v3.2
  - bash-scripting
---

# T02: Publish the explicit security and defer boundary across docs

**Slice:** S02 — Public Boundary Closure And Retained Proof
**Milestone:** M012

## Description

Once the proof artifacts are stable, publish the literal supported-vs-deferred boundary across the user-facing docs and exact-string verifiers so teams see the same security truth everywhere they already look.

## Steps

1. Rewrite `docs/guides/analyzer-coverage.md` in Russian-first form so it names root inheritance, operation override, `security: []`, `{}` optional branches, OR across requirement objects, AND within one requirement object, the truthful `apiKey` query/header/cookie subset, fail-closed `SEMANTIC_HTTP_MISSING_SECURITY` / `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` / `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`, additive `httpSecurityConformance`, CLI block rules, `YANOTE_SUMMARY` security tokens, and unchanged legacy `coverage.operations/status/parameters/aggregate` numerators.
2. Propagate the final wording into `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`, including the fixture-backed `security-semantics.*` sidecar provenance, the focused verifier command `bash scripts/ci/verify-m012-s02-security-semantics.sh`, and explicit defers for `examples`, `links`, `callbacks`, and `webhooks`.
3. Update `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s02-doc-links.sh`, and `scripts/docs/verify-s04-boundaries.sh` so exact-string assertions pin the new sidecar names, focused proof command, security semantics wording, unchanged legacy numerators, and deferred broader-object clauses.
4. Keep the public story truthful: docs may point to the live happy-path/request/payload demo bundle, but the security matrix must be described as fixture-backed proof rather than as an emergent property of the Spring MVC example service.

## Must-Haves

- [ ] Landing, analyzer, examples, and release/support docs publish the supported security semantics literally instead of implying them.
- [ ] Public docs state that `httpSecurityConformance` and the security summary surfaces are additive and must not mutate legacy `coverage.operations/status/parameters/aggregate` numerators.
- [ ] Public docs and exact-string verifiers explicitly defer `examples`, `links`, `callbacks`, and `webhooks` and describe the security proof provenance truthfully.

## Verification

- The public docs/verifier stack passes against the final wording and proof-surface references.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s04-boundaries.sh`

## Inputs

- `README.md` — root landing doc that still narrates the public boundary mainly through request/payload-era wording.
- `docs/README.md` — docs landing surface that must mirror the final analyzer-guide and release/support story.
- `examples/README.md` — examples landing surface that must describe the widened retained bundle truthfully.
- `docs/guides/analyzer-coverage.md` — canonical analyzer guide that must publish the security semantics and additive report surface literally.
- `docs/release-and-support.md` — public support boundary doc that must name supported security truth, unchanged coverage numerators, and deferred broader OpenAPI objects.
- `scripts/docs/verify-s03-landing.sh` — landing-doc verifier that must enforce the final proof-surface wording.
- `scripts/docs/verify-s02-doc-links.sh` — analyzer/doc-link verifier that must enforce the final security-boundary wording.
- `scripts/docs/verify-s04-boundaries.sh` — release/support verifier that must enforce the final supported/deferred boundary.
- `scripts/ci/run-v1-e2e.sh` — widened public proof bundle from T01 that the docs must describe accurately.
- `scripts/ci/verify-m012-s02-security-semantics.sh` — focused retained proof path the docs should reference explicitly.

## Expected Output

- `README.md` — root landing aligned with the additive security sidecar and focused security proof command.
- `docs/README.md` — docs landing aligned with the final analyzer-guide and release/support security wording.
- `examples/README.md` — examples landing aligned with the widened retained proof bundle and fixture-backed security provenance.
- `docs/guides/analyzer-coverage.md` — rewritten analyzer guide for the public HTTP security boundary.
- `docs/release-and-support.md` — release/support owner doc updated to the supported/deferred security boundary.
- `scripts/docs/verify-s03-landing.sh` — landing-doc verifier aligned with the widened public bundle surface.
- `scripts/docs/verify-s02-doc-links.sh` — analyzer-guide verifier aligned with the new security wording and proof command.
- `scripts/docs/verify-s04-boundaries.sh` — release/support boundary verifier aligned with the final security/defer story.
