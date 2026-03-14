---
estimated_steps: 4
estimated_files: 3
---

# T01: Define the canonical async guide and guide-level verifier

**Slice:** S01 — Async Onboarding And Boundary Truth
**Milestone:** M005

## Description

Create the canonical Russian-first async onboarding guide before touching the landings. This task gives the slice one stable place that explains the first-wave AsyncAPI/Kafka path, its honest limits, and the authoritative live-proof commands, then locks that guide with a targeted verifier.

## Steps

1. Add `docs/guides/asyncapi-kafka.md` as the dedicated first-wave async guide, covering the supported Kafka evidence inputs, `node yanote-js/dist/yanote.cjs async-report`, `yanote-async-report.json`, and the exact live-proof commands from M004.
2. Keep the guide explicit about the first-wave boundary: Kafka-only, Spring Kafka-first, separate async report/gate, no payload-schema enforcement yet, and no broker-agnostic promise.
3. Update `docs/guides/analyzer-coverage.md` with a thin pointer so readers of the existing CLI guide can branch to the async guide without mixing HTTP `report` semantics and async `async-report` semantics into one blurred surface.
4. Add `scripts/docs/verify-m005-s01-async-path.sh` to assert the new guide title, required sections/links, artifact names, and boundary clauses, with any remaining failures limited to the root/docs landing pointers reserved for T03.

## Must-Haves

- [ ] `docs/guides/asyncapi-kafka.md` exists as a real user-facing guide and names `async-report`, `yanote-async-report.json`, raw or merged async JSONL, and both authoritative live-proof scripts.
- [ ] The guide keeps the first-wave async boundary explicit instead of implying payload-schema validation or broker-agnostic support.
- [ ] `docs/guides/analyzer-coverage.md` points readers to the dedicated async guide instead of absorbing async semantics into the HTTP guide.
- [ ] `scripts/docs/verify-m005-s01-async-path.sh` reports targeted failures and, after this task, only still complains about README/docs landing discoverability reserved for T03.

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh` — expected to fail only on root/docs landing-pointer checks until T03 completes.
- `rg -n 'async-report|yanote-async-report.json|verify-m004-s02-metadata-propagation.sh|verify-m004-s03-live-kafka-proof.sh' docs/guides/asyncapi-kafka.md docs/guides/analyzer-coverage.md`

## Observability Impact

- Signals added/changed: one dedicated async-guide verifier that names the exact missing clause, artifact, or proof-link drift.
- How a future agent inspects this: run `bash scripts/docs/verify-m005-s01-async-path.sh`, then inspect the required guide clauses and links in `docs/guides/asyncapi-kafka.md`.
- Failure state exposed: broken `async-report` path wording, missing live-proof references, or softened first-wave boundary language becomes a named verifier failure instead of a vague docs complaint.

## Inputs

- `docs/guides/analyzer-coverage.md` — current canonical CLI guide that needs a thin async branch without losing the HTTP contract explanation.
- `scripts/ci/verify-m004-s02-metadata-propagation.sh` — authoritative single-service async proof command the guide must reference truthfully.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — authoritative two-service live Kafka proof command the guide must reference truthfully.

## Expected Output

- `docs/guides/asyncapi-kafka.md` — canonical first-wave AsyncAPI/Kafka onboarding guide.
- `docs/guides/analyzer-coverage.md` — thin cross-link to the dedicated async guide.
- `scripts/docs/verify-m005-s01-async-path.sh` — guide-level async onboarding verifier with targeted diagnostics.
