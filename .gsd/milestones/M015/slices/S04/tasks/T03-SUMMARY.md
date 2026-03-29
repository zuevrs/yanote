---
id: T03
parent: S04
milestone: M015
provides: []
requires: []
affects: []
key_files: ["README.md", "docs/README.md", "examples/README.md", "docs/guides/asyncapi-kafka.md", "docs/release-and-support.md", "docs/requirements.md", "SUPPORT.md", "scripts/docs/verify-m015-s04-delivery-surfaces.sh"]
key_decisions: ["Document the combined-report surface as a child-attributed additive proof family instead of a blended HTTP plus async denominator or dashboard.", "Keep support intake surface-specific by asking for Kafka, RabbitMQ, or combined retained bundles according to the failing proof path."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran bash syntax verification for the new focused doc gate and then executed the task verifier. The focused verifier passed and confirmed that the updated public docs, requirements, and support intake all align on the Kafka + RabbitMQ + combined child-proof contract without stale deferred wording, missing retained bundle names, or broken relative markdown links."
completed_at: 2026-03-26T23:03:08.489Z
blocker_discovered: false
---

# T03: Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.

> Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.

## What Happened
---
id: T03
parent: S04
milestone: M015
key_files:
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m015-s04-delivery-surfaces.sh
key_decisions:
  - Document the combined-report surface as a child-attributed additive proof family instead of a blended HTTP plus async denominator or dashboard.
  - Keep support intake surface-specific by asking for Kafka, RabbitMQ, or combined retained bundles according to the failing proof path.
duration: ""
verification_result: passed
completed_at: 2026-03-26T23:03:08.490Z
blocker_discovered: false
---

# T03: Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.

**Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.**

## What Happened

Rewrote the outward-facing documentation and support boundary so the repo now truthfully describes three current proof families: retained Kafka bundles, retained RabbitMQ/AMQP bundles, and the child-attributed combined-report bundle. Updated README/docs/examples landings, the async guide, the release/support boundary, the public requirements inventory, and SUPPORT intake wording to promote RabbitMQ and combined-report support from deferred follow-ons into additive current surfaces while keeping the explicit no-dashboard, no blended denominator, and no broker-agnostic clauses. Added a focused shell verifier that pins the widened delivery wording, bundle names, rerun commands, and relative markdown links across the touched public/support docs.

## Verification

Ran bash syntax verification for the new focused doc gate and then executed the task verifier. The focused verifier passed and confirmed that the updated public docs, requirements, and support intake all align on the Kafka + RabbitMQ + combined child-proof contract without stale deferred wording, missing retained bundle names, or broken relative markdown links.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -n scripts/docs/verify-m015-s04-delivery-surfaces.sh` | 0 | ✅ pass | 4ms |
| 2 | `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` | 0 | ✅ pass | 108ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m015-s04-delivery-surfaces.sh`


## Deviations
None.

## Known Issues
None.

## Must-Haves Covered

- Public docs describe RabbitMQ/AMQP and combined-report support as additive current proof families, not deferred follow-ons, while preserving explicit no-dashboard, no blended denominator, and no broker-agnostic clauses.
- Support intake points operators to `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` artifacts according to the failing surface and never asks for raw retained headers or payload bodies.

