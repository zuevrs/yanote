# Контракты артефактов / Artifact contracts

Этот файл объясняет, какие Yanote artifacts считаются machine-facing contract, какие остаются human-facing, а какие являются support/provenance surfaces.

## Core artifacts

| Artifact | Producer | Audience | Stability |
|---|---|---|---|
| `events.jsonl` | recorder path | input evidence | Stable evidence shape for supported recorder paths; user-facing as captured evidence, not as normalized public API schema. |
| `yanote-report.json` | `bin/yanote report` | machine + CI | Strongest public artifact contract; schema versioned (`schemaVersion = 1.0.0`). |
| `yanote-report.html` | `bin/yanote report` | human | Stable sibling output surface; presentation may evolve without changing JSON contract. |
| `yanote-async-report.json` | `bin/yanote async-report` | machine + CI | Narrow public contract for current async surface. |
| `yanote-async-report.html` | `bin/yanote async-report` | human | Human-facing async companion. |
| `yanote-combined-report.json` | `bin/yanote combined-report` | machine + CI | Child-attributed combined contract; not a blended denominator artifact. |
| `yanote-combined-report.html` | `bin/yanote combined-report` | human | Human-facing combined companion. |

## Provenance and support artifacts

| Artifact | Role |
|---|---|
| `artifact-manifest.txt` | Deterministic list of delivered files in retained proof bundles. |
| `artifact-source-paths.txt` | Provenance / source-path breadcrumb surface. |
| `*.stdout` / `*.stderr` in proof bundles | Diagnostic/support surface, not stable user API. |
| retained `runtime-selected-*` / `schema-failure-*` companions | Narrow proof artifacts for the current async/Kafka path; public support inputs, not broad machine contracts. |

## Bundle-level delivery contracts

| Bundle | Purpose |
|---|---|
| `yanote-validation-artifacts` | Public HTTP validation bundle in CI. |
| `build-and-test-artifacts/live-kafka-proof/` | Kafka async proof bundle. |
| `build-and-test-artifacts/live-rabbitmq-proof/` | RabbitMQ/AMQP async proof bundle. |
| `build-and-test-artifacts/combined-proof/` | Combined child-attributed proof bundle. |

## Stability rules

1. **JSON reports carry the strongest compatibility expectation.**
   If a field/meaning changes in a way that would break automation, that is a contract change and must be documented through release notes + changelog + upgrading path.
2. **HTML reports are human-facing siblings, not the primary machine contract.**
3. **Support/provenance artifacts are intentionally diagnostic.**
   They should remain truthful and deterministic, but are not promised as broad public APIs.
4. **Raw secret-bearing material is never a public artifact contract.**
   Raw retained headers, private keys, unredacted secret-bearing payload fragments and similar data must stay out of the public support surface.

## What is not a public artifact contract

- raw `node yanote-js/dist/yanote.cjs` output shape as a public integration seam;
- clone-local rerun roots under `.yanote-ci/`;
- implementation marker versions from `yanote-js/package.json`;
- arbitrary internal log formats outside documented support/proof bundles.
