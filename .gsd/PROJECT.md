# Project

## What This Is

Yanote is a Java-first OpenAPI coverage product that records HTTP test traffic, matches it to canonical specification operations, computes deterministic coverage, and enforces CI-ready governance rules. It ships through a standalone Node analyzer, a Gradle plugin for Java builds, recorder/test-tagging modules, and GitHub workflow/release automation.

## Core Value

Any engineering team running Java HTTP services can reliably prove that their scoped API contract is covered by executable tests before shipping.

## Current State

Yanote v1 delivery is complete and the M002 repository-maturity pass is now proven end to end.

What exists now:
- Deterministic OpenAPI semantic extraction and event-to-operation matching across Node and Java.
- Layered operation, status-code, and parameter coverage with strict versioned JSON reports.
- Fail-closed governance gates for thresholds, regressions, exclusions, and invalid evidence.
- Java-first delivery surfaces through `yanoteReport` / `yanoteCheck` Gradle tasks, recorder modules, and GitHub CI/release workflows.
- Runnable example and offline distribution bundles for recorder and analyzer usage in restricted environments.
- 100% validated v1 requirement traceability with publishable release artifacts.
- Concept-first Russian-first documentation maps at the root, `docs/`, `examples/`, maintainer/traceability/history branches, and `dist/`, with leaf-level recovery links and a machine-checked guide-first verifier stack.
- The full concept → recorder → events → analyzer → interpretation journey is now re-proven from the docs by `bash scripts/docs/verify-s08-entry-paths.sh`, with live evidence captured in `.gsd/milestones/M002/slices/S08/S08-UAT.md`.
- Milestone closure is recorded in `.gsd/milestones/M002/M002-SUMMARY.md`, which points future work at the live S08 proof instead of the recovered placeholder slice summaries.
- Release/support boundaries, secondary navigation, maintained-product trust surfaces, and the local-only maintainer `AGENTS.md` contract are all machine-checked as part of that final proof path.
- The maintainer-only `AGENTS.md` contract is proven as clone-local Git state through `.git/info/exclude`, ignored-but-untracked rather than published repo content.

Current repo-level gap:
- Nothing remains open inside M001/M002. Deferred beyond the current milestone set: R032 (dedicated documentation site outside the repository) and R033 (broader ecosystem onboarding beyond the current Java-first surfaces).

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
- [x] M002: Repository Product Maturity — The repository now presents a concept-first, trustable product surface with verified integration guidance, clear release/support boundaries, maintained-product trust signals, and a local-only maintainer agent workflow proven by the final S08 acceptance path.
