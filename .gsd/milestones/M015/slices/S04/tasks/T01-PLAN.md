---
estimated_steps: 25
estimated_files: 4
skills_used: []
---

# T01: Collect and summarize the RabbitMQ and combined proof bundles alongside the existing CI artifacts

Why: The current collector and summary renderer only know how to publish the Kafka proof family, so CI cannot expose the RabbitMQ/AMQP or combined proof surfaces that S02 and S03 already shipped.
Do: extend the artifact collector to retain `live-rabbitmq-proof/` and `combined-proof/` beside the existing Kafka and HTTP bundles, teach the summary renderer to produce redaction-safe markdown for the RabbitMQ async and combined report families, and pin the new inventories plus failure diagnostics in Node tests.
Done when: `build-and-test-artifacts/` can retain Kafka, RabbitMQ, and combined proof families without fabricating absent AMQP companions, and the targeted collector/summary tests pass with explicit `protocols=amqp`, child-path, and fail-closed error assertions.

## Description

Publish the widened async and combined proof families through the same collected-artifact and summary surfaces that operators already inspect in CI, while keeping RabbitMQ optional-companion absences explicit and the combined surface visibly child-attributed.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Retained proof bundle directories (`.yanote-ci/live-kafka-proof`, `.yanote-ci/live-rabbitmq-proof`, `.tmp/m015-s03-combined-proof`) | Refuse to invent missing bundle members and keep manifest/source-path notes explicit | N/A | Treat malformed or swapped JSON/HTML/stdout inputs as summary-render failures, not green output |
| Summary rendering over async and combined artifacts | Surface actionable validation errors naming the missing or drifted artifact family | N/A | Fail closed if combined child attribution or AMQP protocol metadata is missing |

## Load Profile

- **Shared resources**: three retained proof bundle families plus their manifests, stdout/stderr logs, and summary markdown outputs.
- **Per-operation cost**: file-copy and JSON parse work over already-generated artifacts; no spec or event re-analysis.
- **10x breakpoint**: bundle size and repeated file-system scans dominate before markdown formatting becomes expensive.

## Negative Tests

- **Malformed inputs**: missing combined JSON/HTML outputs, malformed RabbitMQ async report JSON, or stale copied directories from prior collector runs.
- **Error paths**: RabbitMQ bundle with intentionally absent `runtime-selected-*` / `schema-failure-*` companions, combined proof missing child paths, or summary rendering without a valid machine-summary fallback.
- **Boundary conditions**: existing Kafka bundle remains intact, RabbitMQ bundle keeps `protocols=amqp`, and combined bundle preserves separate HTTP-vs-async child report paths instead of a blended denominator.

## Steps

1. Extend `scripts/ci/collect-yanote-artifacts.sh` so it copies `.yanote-ci/live-rabbitmq-proof` and `.tmp/m015-s03-combined-proof` into deterministic bundle directories and records their manifest/source-path provenance beside the existing Kafka and HTTP families.
2. Teach `scripts/ci/render-yanote-summary.mjs` to summarize the retained RabbitMQ async family with optional-companion absences and to summarize the combined report family with explicit child attribution, AMQP protocol visibility, and fail-closed malformed-bundle diagnostics.
3. Add contract tests that pin the widened collected inventory, the RabbitMQ optional-artifact rules, the combined summary markdown shape, and the failure messages produced when bundles drift or go missing.

## Must-Haves

- [ ] `build-and-test-artifacts/` retains `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` without fabricating missing AMQP companions or losing existing HTTP bundle collection.
- [ ] Collected markdown summaries stay redaction-safe while surfacing `protocols=amqp`, combined child report paths, and fail-closed bundle drift.

## Inputs

- ``scripts/ci/collect-yanote-artifacts.sh` — current CI artifact collector that only understands the existing Kafka and HTTP bundle families.`
- ``scripts/ci/collect-yanote-artifacts.test.mjs` — collector contract tests that pin bundle layout, manifest fields, and source-path notes.`
- ``scripts/ci/render-yanote-summary.mjs` — current summary renderer for HTTP and Kafka async artifact families.`
- ``scripts/ci/render-yanote-summary.test.mjs` — summary renderer contract coverage for redaction-safe markdown output.`
- ``scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` — retained RabbitMQ async bundle contract that the collector must publish faithfully.`
- ``scripts/ci/verify-m015-s03-combined-report.sh` — retained combined proof bundle contract that the collector and summary renderer must consume truthfully.`

## Expected Output

- ``scripts/ci/collect-yanote-artifacts.sh` — widened collector that copies Kafka, RabbitMQ, combined, and HTTP proof families with deterministic provenance notes.`
- ``scripts/ci/collect-yanote-artifacts.test.mjs` — collector contract coverage for widened bundle layout and manifest/source-path metadata.`
- ``scripts/ci/render-yanote-summary.mjs` — summary renderer that can emit redaction-safe RabbitMQ async and combined-report markdown surfaces.`
- ``scripts/ci/render-yanote-summary.test.mjs` — renderer tests that pin `protocols=amqp`, combined child attribution, and fail-closed malformed-bundle diagnostics.`

## Verification

node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs

## Observability Impact

- Signals added/changed: collected `async-summary.md` and `combined-summary.md`, widened collector manifest/source-path fields, and summary-render validation errors for drifted bundles.
- How a future agent inspects this: run the targeted Node tests or open `build-and-test-artifacts/live-rabbitmq-proof/` and `build-and-test-artifacts/combined-proof/` after a CI run.
- Failure state exposed: missing proof families, malformed combined child inputs, and accidental AMQP companion fabrication become explicit in collector manifests and markdown summaries.
