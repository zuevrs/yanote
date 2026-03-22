---
estimated_steps: 6
estimated_files: 6
skills_used:
  - best-practices
---

# T02: Refresh docs and public boundary wording around the stronger truth surface

**Slice:** S05 — Retained Proof And Compatibility Hardening
**Milestone:** M009

## Description

Update public docs and boundary verifiers so the documented product story matches the stronger recorder provenance, retained Kafka headers, and multi-message AsyncAPI support without implying broader broker or schema-registry scope.

## Steps

1. Identify the public docs surfaces that still describe the older truth boundary.
2. Update wording around recorder provenance, retained Kafka headers, and supported multi-message AsyncAPI behavior.
3. Preserve explicit non-goals: Kafka-only async scope, separate report surfaces, no schema registry support yet.
4. Tighten docs verifiers to pin the new wording where it matters.
5. Re-run entry-path and boundary verifiers.
6. Manually compare retained artifacts and docs wording for consistency.

## Must-Haves

- [ ] Public docs describe the stronger truth surface accurately.
- [ ] Docs do not imply RabbitMQ, schema registry, or a mandatory combined report.
- [ ] Boundary verifiers pin the new wording mechanically.

## Verification

- `bash scripts/docs/verify-s08-entry-paths.sh`
- `git diff --check`
- `Manual review — retained HTTP/async artifacts and docs wording match the stronger boundary`

## Inputs

- `README.md` — public landing surface.
- `docs/guides/asyncapi-kafka.md` — async boundary guide.
- `docs/guides/analyzer-coverage.md` — HTTP/OpenAPI analyzer guide.
- `docs/release-and-support.md` — support/release boundary wording.
- `scripts/docs/verify-s04-boundaries.sh` — docs boundary verifier.
- `scripts/docs/verify-s08-entry-paths.sh` — broad entry-path verifier.

## Expected Output

- `README.md` — refreshed public product boundary wording.
- `docs/guides/asyncapi-kafka.md` — async guide aligned to retained headers and multi-message support.
- `docs/guides/analyzer-coverage.md` — HTTP guide aligned to provenance-aware omission truth.
- `docs/release-and-support.md` — support boundary aligned to the strengthened milestone.
- `scripts/docs/verify-s04-boundaries.sh` — boundary verifier pins the updated wording.
- `scripts/docs/verify-s08-entry-paths.sh` — entry-path verifier still passes with the refreshed docs story.
