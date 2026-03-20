# Project

## What This Is

Yanote is a Java-first contract-coverage product for engineering teams that need trustworthy evidence that their API contracts are exercised by tests before shipping. Today it proves HTTP/OpenAPI coverage by recording runtime facts, matching them to canonical specification operations, computing deterministic coverage, and enforcing CI-ready governance rules through a standalone Node analyzer, Java delivery surfaces, recorder/test-tagging modules, and GitHub workflow/release automation. It also now has a complete Kafka-oriented AsyncAPI foundation: supported AsyncAPI v2/v3 Kafka specs normalize into canonical `kafka <action> <channel>` identities with adjacent message-contract metadata, normalized Kafka evidence can drive deterministic async coverage semantics plus explicit unmatched/mismatched drift diagnostics, and a separate async CLI/report/gate path is shipped for the first async release.

## Core Value

Any engineering team running Java services can reliably prove that their scoped contract surface is covered by executable tests before shipping.

## Current State

Yanote v1 delivery, the M002 repository-maturity pass, M003 async coverage foundations, M004 Kafka evidence capture/integration, M005 async productization, and M006 runtime/public-boundary hardening are now complete in the codebase and on `main`. The public demo path is repaired, delivery-sensitive proof now runs earlier through the existing required CI topology, the default branch no longer tracks `.bg-shell/` or bundle-centric `dist/`, `.gsd/` now lives as a project-local artifact tree with only runtime/database state ignored, the follow-up `v1-e2e` cold-run runtime gap was closed before cutting `v1.0.125`, and release `v1.0.125` is now published through the signed tag-driven pipeline.

What exists now:
- Deterministic OpenAPI semantic extraction and event-to-operation matching across Node and Java.
- Layered HTTP operation, status-code, and parameter coverage with strict versioned JSON reports.
- Fail-closed governance gates for thresholds, regressions, exclusions, and invalid evidence.
- Java-first delivery surfaces through `yanoteReport` / `yanoteCheck` Gradle tasks, recorder modules, and GitHub CI/release workflows.
- Runnable example and offline distribution bundles for recorder and analyzer usage in restricted environments.
- 100% validated v1 requirement traceability with publishable release artifacts.
- Concept-first Russian-first documentation maps at the root, `docs/`, `examples/`, maintainer/traceability/history branches, and release assets, with leaf-level recovery links and a machine-checked guide-first verifier stack.
- Release/support boundaries, secondary navigation, maintained-product trust surfaces, and the local-only maintainer `AGENTS.md` contract are machine-checked as part of the public trust path.
- Supported AsyncAPI v2/v3 Kafka contracts normalize into canonical `kafka <action> <channel>` identities with adjacent message-contract metadata and deterministic invalid/unsupported diagnostics.
- Normalized Kafka evidence drives separate async coverage semantics for channels, send/receive operations, and message-contract identity, with explicit unmatched and mismatched async drift diagnostics.
- A dedicated `yanote async-report` path loads AsyncAPI specs plus normalized async evidence, writes deterministic `yanote-async-report.json`, emits typed `YANOTE_ASYNC_*` summary/error lines, and keeps the existing HTTP `yanote report` path separate.
- Spring Kafka producer and consumer recorder seams emit truthful normalized `kafka send` / `kafka receive` evidence against a real broker, including suite/run header propagation across HTTP → Kafka and Kafka → Kafka flows.
- The example service proves both the single-service republish path and a split producer-only → consumer-only Kafka handoff, with deterministic per-service JSONL merge and direct `yanote async-report` analyzer handoff.
- The live Kafka proof stack runs inside the existing `build-and-test` required GitHub check and is backed by workflow contract tests plus retained-failure diagnostics.
- Payload-bearing Kafka evidence now survives Spring Kafka recorder capture, mixed JSONL round-trip, and Node async ingestion, and AsyncAPI v2/v3 semantics bundles retain payload schema metadata beside canonical Kafka operation keys.
- The hardened `run-v1-e2e.sh` path explicitly prewarms runtime dependencies into a shared Gradle home before the offline test-container leg.

Current product-level gap:
- The hardened `v1.0.125` line is published; remaining outward-facing work is ordinary follow-on hardening rather than a blocked release.
- The compose surface still assumes host-prepared Gradle/Node assets via `run-v1-e2e.sh`; if the project wants raw `docker compose up` to be a cold-start supported entrypoint too, that expectation needs an explicit follow-up rather than an implicit promise.
- A truly empty local dependency cache still depends on successful network/TLS access during the host prebuild phase of `run-v1-e2e.sh`; the current guarantee is runtime truth on supported runners, not zero-network bootstrap.
- Observed Kafka payloads now survive recorder → JSONL → analyzer boundaries and AsyncAPI bundles retain payload schema metadata, but actual payload validation against AsyncAPI schemas and schema-level drift diagnostics remain follow-on M007 work.

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
- [x] M003: AsyncAPI Coverage Foundations — Extend the analyzer and report model so Yanote can understand Kafka-oriented AsyncAPI contracts, compute async coverage semantics, and expose a separate async report/gate path.
- [x] M004: Kafka Evidence Capture And Java Integration — Add Spring Kafka producer/consumer evidence capture, Kafka test-metadata propagation, and live runtime proof paths for normalized async evidence.
- [x] M005: Async Productization And End-to-End Proof — Turn the new async capability into a trustable product surface with docs, support boundaries, CI proof, and release-grade acceptance.
- [x] M006: Runtime Delivery Hardening And Public Repo Hygiene — Restore trust in the public demo and CI surfaces, then remove tracked technical artifact trees from the default branch without leaving broken docs or trust contracts behind.
- [ ] M007: AsyncAPI Schema Conformance And Contract Depth — Strengthen the async contract surface by carrying payload-bearing evidence through runtime capture, validating payloads against AsyncAPI schemas, and surfacing schema-level drift truthfully.
- [ ] M008: OpenAPI Contract Depth And Payload Conformance — Extend the HTTP path from operation/status/parameter truth into request/response payload conformance with explicit report and gate semantics.
