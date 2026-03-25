---
estimated_steps: 4
estimated_files: 8
skills_used:
  - openapi-specification-v3.2
  - bash-scripting
---

# T02: Rewrite public docs and boundary verifiers for the widened HTTP semantics

**Slice:** S04 — Public Contract Closeout For HTTP Semantics
**Milestone:** M011

## Description

Once the public bundle shape is fixed, close the outward-facing contract. This task rewrites the stale analyzer guide, propagates concise boundary wording across landing and release docs, and updates the exact-string verifiers so the standard report/CI path and the focused S02/S03 proofs all tell one truthful story.

## Steps

1. Rewrite `docs/guides/analyzer-coverage.md` in Russian-first form so it publishes the additive request surface (`httpRequestConformance`, `declaredSupport*`, request `YANOTE_SUMMARY` tokens), the exact supported request serialization/cookie subset, the `email`-only payload format policy, most-specific media matching, and the public bundle plus focused proof commands without the current corrupted tail.
2. Propagate the final boundary wording into `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`, including the additive request sidecar from T01 and explicit pointers to `bash scripts/ci/verify-m011-s02-request-semantics.sh` and `bash scripts/ci/verify-m011-s03-format-media.sh` for deeper retained truth.
3. Update `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s03-landing.sh`, and `scripts/docs/verify-s04-boundaries.sh` so exact-string assertions and broken-link checks enforce the new request/payload wording and bundle artifact names.
4. Run the public-closeout verification stack so docs, retained bundle contracts, and the focused proof scripts all pass together before handoff.

## Must-Haves

- [ ] Public docs publish the exact supported request subset and payload format/media boundary without implying blanket OpenAPI support.
- [ ] Analyzer guide and release/support surfaces reference the additive request sidecar plus the focused S02/S03 proof commands truthfully.
- [ ] The doc and boundary verifiers are updated to enforce the final wording and pass against the new public bundle shape.

## Verification

- The landing and boundary verifier stack passes against the rewritten docs and widened public bundle wording.
- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s04-boundaries.sh`

## Inputs

- `docs/guides/analyzer-coverage.md` — stale analyzer guide that still omits the M011 request subset and has a corrupted duplicated tail.
- `README.md` — root landing doc that still frames the public HTTP boundary mostly in payload-era terms.
- `docs/README.md` — docs landing surface that must mirror the final analyzer-guide and proof-bundle story.
- `examples/README.md` — demo landing surface that must describe the additive request sidecar truthfully.
- `docs/release-and-support.md` — public support boundary doc that still under-publishes the widened HTTP semantics.
- `scripts/docs/verify-s02-doc-links.sh` — exact-string analyzer-guide verifier that must track the final request/payload wording.
- `scripts/docs/verify-s03-landing.sh` — landing-doc verifier that must track the final retained bundle story.
- `scripts/docs/verify-s04-boundaries.sh` — release/support boundary verifier that must publish the widened HTTP semantics truthfully.
- `scripts/ci/run-v1-e2e.sh` — widened public proof bundle from T01 that docs and verifiers must describe.
- `scripts/ci/verify-m011-s02-request-semantics.sh` — focused request-semantics proof path the public docs should reference explicitly.
- `scripts/ci/verify-m011-s03-format-media.sh` — focused format/media proof path the public docs should reference explicitly.
- `yanote-js/src/cli.summary.contract.test.ts` — canonical request and payload summary token surface that docs must name accurately.
- `yanote-js/src/report/schema.ts` — canonical additive report contract surface that docs must not rename or overclaim.

## Expected Output

- `docs/guides/analyzer-coverage.md` — rewritten analyzer guide for the widened HTTP semantics boundary.
- `README.md` — root landing aligned with the additive request sidecar and focused proof commands.
- `docs/README.md` — docs landing aligned with the final analyzer-guide and support-boundary wording.
- `examples/README.md` — examples landing aligned with the widened public bundle surface.
- `docs/release-and-support.md` — release/support owner doc updated to the final HTTP semantics boundary.
- `scripts/docs/verify-s02-doc-links.sh` — exact-string analyzer-guide verifier aligned with the new wording.
- `scripts/docs/verify-s03-landing.sh` — landing-doc verifier aligned with the widened public bundle surface.
- `scripts/docs/verify-s04-boundaries.sh` — release/support boundary verifier aligned with the final HTTP semantics story.
