---
estimated_steps: 25
estimated_files: 8
skills_used: []
---

# T03: Rewrite public docs, requirements, and support intake around the widened async and combined surfaces

Why: The public landings, release/support boundary, requirements inventory, and support guide still describe RabbitMQ and combined reporting as deferred or unsupported, which contradicts the real proof bundles and would send operators to the wrong artifacts.
Do: update the Russian-first public docs and support intake so they describe the first RabbitMQ/AMQP path and the combined report surface as additive current proof families, keep the no-dashboard / no blended denominator / no broker-agnostic promise clauses explicit, and add one focused doc verifier that pins the new wording and retained artifact paths.
Done when: the public docs no longer call RabbitMQ or combined reporting deferred, support intake asks for the correct retained proof bundles, and the focused M015 S04 doc verifier passes against the new delivery-surface wording.

## Description

Close the milestone on the outward-facing boundary: make the main README, docs landings, requirements/support surfaces, and async guide tell one truthful story about what is now supported, what remains explicitly out of scope, and which retained artifacts operators should inspect when Kafka, RabbitMQ, or combined proof paths fail.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public boundary markdown surfaces | Fail the focused verifier on stale wording rather than publishing mixed Kafka-only vs RabbitMQ/combined guidance | N/A | Reject broken links or missing artifact names before the task is considered complete |
| Support intake guidance | Refuse to keep asking for the wrong proof bundle or raw secret-bearing headers | N/A | Fail verification if the docs imply a dashboard, a blended denominator, or a broker-agnostic promise |

## Load Profile

- **Shared resources**: multiple cross-linked public/support markdown surfaces plus one focused shell verifier.
- **Per-operation cost**: static content rewrite and exact-string verification; runtime cost is trivial.
- **10x breakpoint**: wording drift across multiple surfaces becomes the main risk before verification time matters.

## Negative Tests

- **Malformed inputs**: broken local markdown links, missing retained bundle names, or missing proof commands in the updated docs.
- **Error paths**: stale `Kafka-only` / `combined deferred` wording, support intake that still points only to `.yanote-ci/live-kafka-proof/`, or docs that collapse combined child truth into one denominator.
- **Boundary conditions**: RabbitMQ stays the first concrete AMQP path, Kafka proof guidance remains present, and no touched surface promises a hosted dashboard or broker-agnostic coverage.

## Steps

1. Rewrite `README.md`, `docs/README.md`, `examples/README.md`, and `docs/guides/asyncapi-kafka.md` so the user-facing path points to separate Kafka, RabbitMQ, and combined proof families with explicit retained artifact names and rerun commands.
2. Update `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` so the public boundary and support intake promote the first RabbitMQ/AMQP and combined-report surfaces from deferred follow-ons into additive current support while keeping no-dashboard, no blended denominator, and no broker-agnostic clauses explicit.
3. Add one focused shell verifier that checks the widened delivery-surface wording, retained artifact paths, and support intake expectations across the touched public docs.

## Must-Haves

- [ ] Public docs describe RabbitMQ/AMQP and combined-report support as additive current proof families, not deferred follow-ons, while preserving explicit no-dashboard, no blended denominator, and no broker-agnostic clauses.
- [ ] Support intake points operators to `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` artifacts according to the failing surface and never asks for raw retained headers or payload bodies.

## Inputs

- ``README.md` — public root landing that currently points readers only to the Kafka async path and still rejects combined reporting as a current surface.`
- ``docs/README.md` — docs landing page that must direct readers to the widened async and combined proof families.`
- ``examples/README.md` — runnable-demo landing that should point to the retained proof bundles operators actually inspect.`
- ``docs/guides/asyncapi-kafka.md` — current async guide that still frames RabbitMQ and combined reporting as outside the current support boundary.`
- ``docs/release-and-support.md` — public release/support boundary owner surface that must reflect the widened async and combined contracts.`
- ``docs/requirements.md` — public requirements inventory that still marks combined and non-Kafka async follow-ons as deferred.`
- ``SUPPORT.md` — support intake contract that currently asks only for Kafka-first async artifacts.`
- ``.github/workflows/yanote-ci.yml` — widened build-and-test delivery surface from T02 that the docs must describe truthfully.`

## Expected Output

- ``README.md` — root landing updated for separate Kafka, RabbitMQ, and combined proof surfaces.`
- ``docs/README.md` — docs landing updated for the widened async and combined delivery surfaces.`
- ``examples/README.md` — examples landing updated with the retained proof bundle pointers operators should inspect.`
- ``docs/guides/asyncapi-kafka.md` — async guide rewritten to describe the current Kafka + RabbitMQ + combined boundary truthfully.`
- ``docs/release-and-support.md` — release/support owner doc aligned to the widened async and combined public boundary.`
- ``docs/requirements.md` — public requirements inventory updated for the current M015 support boundary.`
- ``SUPPORT.md` — support intake updated to request the right retained artifacts per failing surface.`
- ``scripts/docs/verify-m015-s04-delivery-surfaces.sh` — focused shell verifier for the widened public delivery and support wording.`

## Verification

bash scripts/docs/verify-m015-s04-delivery-surfaces.sh
