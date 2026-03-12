# Project

## What This Is

Yanote is a Java-first OpenAPI coverage product that records HTTP test traffic, matches it to canonical specification operations, computes deterministic coverage, and enforces CI-ready governance rules. It ships through a standalone Node analyzer, a Gradle plugin for Java builds, recorder/test-tagging modules, and GitHub workflow/release automation.

## Core Value

Any engineering team running Java HTTP services can reliably prove that their scoped API contract is covered by executable tests before shipping.

## Current State

Yanote v1 delivery is complete and release-verified.

What exists now:
- Deterministic OpenAPI semantic extraction and event-to-operation matching across Node and Java.
- Layered operation, status-code, and parameter coverage with strict versioned JSON reports.
- Fail-closed governance gates for thresholds, regressions, exclusions, and invalid evidence.
- Java-first delivery surfaces through `yanoteReport` / `yanoteCheck` Gradle tasks, recorder modules, and GitHub CI/release workflows.
- Runnable example and offline distribution bundles for recorder and analyzer usage in restricted environments.
- 100% validated v1 requirement traceability with publishable release artifacts.
- Concept-first Russian-first documentation maps at the root, `docs/`, `examples/`, maintainer/traceability/history branches, and `dist/`, with leaf-level recovery links and a machine-checked S01-S05 verifier stack.
- Maintained-product trust surfaces and a local-only maintainer `AGENTS.md` contract are now in place, with public-boundary verifiers plus clone-local Git ignore proof commands.

Current repo-level gap:
- Public entry points, integration guidance, release/support boundaries, trust surfaces, and the local-only maintainer agent workflow are now in place and machine-checked. The remaining repository-maturity work is to re-proof the full entry path end to end in S08.

## Architecture / Key Patterns

- **Monorepo split by responsibility:** JVM modules for recorder/core/plugin surfaces, `yanote-js` for analyzer/reporting, `examples/` for runnable integration proof, and `scripts/` / `.github/` for CI and release automation.
- **One semantic contract across runtimes:** canonical `METHOD + templated route` identity with parity fixtures to prevent Java/Node drift.
- **Thin adapters over one engine:** Gradle and CI surfaces wrap the analyzer/governance contract instead of re-implementing coverage logic.
- **Deterministic artifacts everywhere:** stable report schema, ordered diagnostics, fixed CI job names, and reproducible release bundles.
- **Public docs should be concept-first and Russian-first:** the target reader is a Russian-speaking engineer evaluating and integrating the product, not a casual open-source contributor browsing for novelty.
- **Historical proof stays available but should not own the entry path:** release notes, traceability, and plan artifacts are valuable reference material, but they should not compete with the primary user journey.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Yanote v1 Delivery — Deliver deterministic coverage semantics, governance, Java/CI delivery surfaces, and OSS release automation for the full v1 scope.
- [ ] M002: Repository Product Maturity — Turn the repository into a concept-first, trustable product surface with verified integration guidance, clear release/support boundaries, and a local-only maintainer agent workflow.
