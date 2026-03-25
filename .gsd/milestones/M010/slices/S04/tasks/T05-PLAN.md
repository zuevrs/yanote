---
estimated_steps: 4
estimated_files: 5
skills_used:
  - bash-scripting
  - openapi-specification-v3.2
  - asyncapi-design
  - review
---

# T05: Assemble the final boundary verifier and release/support surface

**Slice:** S04 — Final Boundary Assembly And Docs Hardening
**Milestone:** M010

## Description

Tie the milestone together with one final owner-facing surface. This task refreshes `docs/release-and-support.md` to the latest stable tag and the now-true HTTP/async boundary, then adds a milestone-level verifier that reruns the assembled proof/doc stack and checks retained manifests so M010 can be closed on evidence rather than prose alone.

## Steps

1. Update `docs/release-and-support.md` so the latest stable tag, the supported HTTP core boundary, and the supported Kafka header boundary all match the assembled retained bundles.
2. Refresh `scripts/docs/verify-s04-boundaries.sh` so it enforces the updated release/support wording and no longer depends on stale payload-era or async-underclaim text.
3. Add `scripts/docs/verify-m010-s04-final-boundary.sh` to rerun the assembled HTTP and async proof/doc verification stack and assert the expected retained manifest/artifact contents.
4. Tighten `README.md` and `docs/README.md` only where the final release/support pointers or public boundary summary changed after T03/T04, keeping public docs Russian-first.

## Must-Haves

- [ ] `docs/release-and-support.md` points at the latest stable tag and describes the final supported core boundary truthfully.
- [ ] `scripts/docs/verify-s04-boundaries.sh` passes against the updated owner doc without stale payload-era or async-underclaim clauses.
- [ ] A new milestone-level assembly verifier exists and reruns the assembled HTTP + Kafka + docs stack instead of relying on one surface in isolation.
- [ ] No public landing or owner doc still contradicts the retained proof artifacts after T03 and T04.

## Verification

- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-m010-s04-final-boundary.sh`

## Observability Impact

- Signals added/changed: the final boundary verifier emits one authoritative pass/fail surface for the assembled HTTP bundle, async bundle, and public owner docs.
- How a future agent inspects this: run `bash scripts/docs/verify-m010-s04-final-boundary.sh` and inspect the failing sub-command plus the retained `.yanote-ci/v1-e2e/` and `.yanote-ci/live-kafka-proof/` manifests it checks.
- Failure state exposed: regressions should identify whether the mismatch is release/support wording, HTTP proof assembly, async proof assembly, or retained manifest shape.

## Inputs

- `docs/release-and-support.md` — current owner-facing release/boundary surface that still has the stale release tag and partially stale HTTP/async wording.
- `scripts/docs/verify-s04-boundaries.sh` — current owner-doc verifier that must be updated to the final assembled boundary.
- `scripts/docs/verify-s02-analysis-path.sh` — HTTP proof verifier output that the final assembly script must compose.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — async proof verifier output that the final assembly script must compose.
- `README.md` — root landing that may still need final boundary pointer tightening after T03/T04.
- `docs/README.md` — docs landing that may still need final boundary pointer tightening after T03/T04.

## Expected Output

- `docs/release-and-support.md` — final owner-facing release/support boundary document for M010.
- `scripts/docs/verify-s04-boundaries.sh` — updated owner-doc verifier aligned with the final boundary wording.
- `scripts/docs/verify-m010-s04-final-boundary.sh` — milestone-level final boundary verifier that composes the assembled proof/doc stack.
- `README.md` — root landing aligned with the final release/support owner surface.
- `docs/README.md` — docs landing aligned with the final release/support owner surface.
