---
estimated_steps: 4
estimated_files: 7
---

# T03: Rewrite the public async boundary around the proven Kafka schema surface

**Slice:** S04 — Live Kafka Proof And Boundary Refresh
**Milestone:** M007

## Description

Load the `asyncapi-design` and `bash-scripting` skills, then align the public boundary with the runtime proof from T01/T02. This task must rewrite the guide/owner/support surfaces so they claim payload-schema drift only for the proven Kafka path, keep routing percentages and header limits honest, narrow deferred follow-ons to the remaining gaps, and update the doc verifiers so stale “payload-schema enforcement пока нет” wording cannot come back.

## Steps

1. Update `docs/guides/asyncapi-kafka.md` so it explains the truthful happy-path plus retained schema-failure proof, supported raw/merged JSONL inputs, routing-first coverage percentages, payload-schema drift visibility, and the still-unverifiable header boundary.
2. Update `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` so the owner/support surfaces stop saying payload-schema enforcement is absent, keep Kafka-only / Spring Kafka-first / separate async report-gate wording explicit, and narrow deferred async follow-ons to what is still genuinely unshipped.
3. Rewrite `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` so they reject the stale payload-schema wording and assert the new truthful clauses plus the remaining header/broker boundaries and canonical proof links.
4. Re-run the docs verifiers, the composed async acceptance script, and the acceptance/workflow contract tests to prove the published boundary and delegated runtime proof stack still agree.

## Must-Haves

- [ ] Public docs claim payload-schema drift is surfaced for the proven Kafka evidence path without implying broker-agnostic support, retained Kafka headers, or a combined HTTP+async report surface.
- [ ] The async docs verifier scripts mechanically enforce the new truthful wording and the composed acceptance stack still delegates to the same proof scripts and workflow artifact names.

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh && node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs && git diff --check`

## Inputs

- `docs/guides/asyncapi-kafka.md` — current async guide that still says payload-schema enforcement is absent.
- `docs/release-and-support.md` — public owner boundary surface that still underclaims async schema truth.
- `docs/requirements.md` — public requirements surface whose deferred async follow-ons still treat payload validation as unshipped.
- `SUPPORT.md` — public support intake surface that must match the updated async runtime truth.
- `scripts/docs/verify-m005-s01-async-path.sh` — path verifier that currently enforces the stale payload-schema wording.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — boundary verifier that currently enforces the stale payload-schema wording.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative runtime proof surface that the docs must describe truthfully after T02.

## Expected Output

- `docs/guides/asyncapi-kafka.md` — async guide rewritten around the proven Kafka payload-schema boundary and retained failure artifacts.
- `docs/release-and-support.md` — owner boundary wording updated for the new runtime truth without overclaiming broker scope.
- `docs/requirements.md` — deferred async follow-ons narrowed to the still-unshipped gaps instead of payload validation itself.
- `SUPPORT.md` — support intake wording updated for the new async runtime truth and retained artifacts.
- `scripts/docs/verify-m005-s01-async-path.sh` — path verifier rewritten for the new truthful async guide wording.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — boundary verifier rewritten for the new truthful owner/support wording.

## Observability Impact

- The public async guide/owner/support surfaces now become inspection surfaces for the retained Kafka proof bundle, so future agents should compare `docs/guides/asyncapi-kafka.md`, `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` against `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` plus `.yanote-ci/live-kafka-proof/`.
- The doc verifier scripts must make stale `payload-schema enforcement пока нет` wording fail closed while positively checking the new truthful claims about retained `schema-failure-*` artifacts, routing-first coverage, header non-retention, and the Kafka-only / separate-report boundary.
- Failure becomes visible as docs verifier stderr that points at the missing truthful clause, or as a mismatch between the published wording and the retained `schema-failure-async-report.stderr` / `schema-failure-yanote-async-report.json` artifacts exported by the live proof.
