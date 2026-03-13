# Project

## What This Is

Yanote is a Java-first contract-coverage product for engineering teams that need trustworthy evidence that their API contracts are exercised by tests before shipping. Today it proves HTTP/OpenAPI coverage by recording runtime facts, matching them to canonical specification operations, computing deterministic coverage, and enforcing CI-ready governance rules through a standalone Node analyzer, Java delivery surfaces, recorder/test-tagging modules, and GitHub workflow/release automation.

## Core Value

Any engineering team running Java services can reliably prove that their scoped contract surface is covered by executable tests before shipping.

## Current State

Yanote v1 delivery is complete, and the M002 repository-maturity pass is proven end to end.

What exists now:
- Deterministic OpenAPI semantic extraction and event-to-operation matching across Node and Java.
- Layered HTTP operation, status-code, and parameter coverage with strict versioned JSON reports.
- Fail-closed governance gates for thresholds, regressions, exclusions, and invalid evidence.
- Java-first delivery surfaces through `yanoteReport` / `yanoteCheck` Gradle tasks, recorder modules, and GitHub CI/release workflows.
- Runnable example and offline distribution bundles for recorder and analyzer usage in restricted environments.
- 100% validated v1 requirement traceability with publishable release artifacts.
- Concept-first Russian-first documentation maps at the root, `docs/`, `examples/`, maintainer/traceability/history branches, and `dist/`, with leaf-level recovery links and a machine-checked guide-first verifier stack.
- The full concept → recorder → events → analyzer → interpretation journey is re-proven from the docs by `bash scripts/docs/verify-s08-entry-paths.sh`, with live evidence captured in `.gsd/milestones/M002/slices/S08/S08-UAT.md`.
- Release/support boundaries, secondary navigation, maintained-product trust surfaces, and the local-only maintainer `AGENTS.md` contract are all machine-checked as part of that final proof path.

Current product-level gap:
- Yanote still validates only the HTTP/OpenAPI contract path. Teams with Kafka/AsyncAPI-driven services cannot yet prove event-driven contract coverage at the same trust level.
- AsyncAPI/Kafka support is planned as the next product expansion and must reach the same fixture/unit/integration/end-to-end proof depth as the current OpenAPI path.

## Architecture / Key Patterns

- **Monorepo split by responsibility:** JVM modules for recorder/core/plugin surfaces, `yanote-js` for analyzer/reporting, `examples/` for runnable integration proof, and `scripts/` / `.github/` for CI and release automation.
- **One semantic contract across runtimes:** canonical identities, shared fixtures, and fail-closed diagnostics prevent Java/Node drift.
- **Thin adapters over one engine:** Gradle and CI surfaces wrap the analyzer/governance contract instead of re-implementing coverage logic.
- **Deterministic artifacts everywhere:** stable report schema, ordered diagnostics, fixed CI job names, and reproducible release bundles.
- **Public docs should be concept-first and Russian-first:** the target reader is a Russian-speaking engineer evaluating and integrating the product, not a casual open-source contributor browsing for novelty.
- **Historical proof stays available but should not own the entry path:** release notes, traceability, and plan artifacts are valuable reference material, but they should not compete with the primary user journey.
- **Async expansion should preserve the product’s trust posture:** new Kafka/AsyncAPI capability must be explicit, separately reportable at first, and verified at the same depth as the HTTP/OpenAPI path.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Yanote v1 Delivery — Deliver deterministic coverage semantics, governance, Java/CI delivery surfaces, and OSS release automation for the full v1 scope.
- [x] M002: Repository Product Maturity — Present a concept-first, trustable product surface with verified integration guidance, clear release/support boundaries, maintained-product trust signals, and a local-only maintainer agent workflow.
- [ ] M003: AsyncAPI Coverage Foundations — Extend the analyzer and report model so Yanote can understand Kafka-oriented AsyncAPI contracts, compute async coverage semantics, and expose a separate async report/gate path.
- [ ] M004: Kafka Evidence Capture And Java Integration — Add Spring Kafka producer/consumer evidence capture, Kafka test-metadata propagation, and live runtime proof paths for normalized async evidence.
- [ ] M005: Async Productization And End-to-End Proof — Turn the new async capability into a trustable product surface with docs, support boundaries, CI proof, and release-grade acceptance.
