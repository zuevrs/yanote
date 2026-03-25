# Project

## What This Is

Yanote is a Java-first contract-coverage product for engineering teams that need trustworthy evidence that their API contracts are exercised by tests before shipping. Today it proves HTTP/OpenAPI coverage by recording runtime facts, matching them to canonical specification operations, computing deterministic coverage, and enforcing CI-ready governance rules through a standalone Node analyzer, Java delivery surfaces, recorder/test-tagging modules, and GitHub workflow/release automation. It also now has a complete Kafka-oriented AsyncAPI foundation: supported AsyncAPI v2/v3 Kafka specs normalize into canonical `kafka <action> <channel>` identities with adjacent message-contract metadata, normalized Kafka evidence can drive deterministic async coverage semantics plus explicit unmatched/mismatched drift diagnostics, and a separate async CLI/report/gate path is shipped for the first async release.

## Core Value

Any engineering team running Java services can reliably prove that their scoped contract surface is covered by executable tests before shipping.

## Current State

Yanote delivery through M009 is now closed in the codebase: repository maturity, Kafka/AsyncAPI coverage, async schema-depth validation, runtime/public-boundary hardening, HTTP payload-conformance depth, and evidence-truth hardening are all complete and backed by retained proof artifacts or surviving repo history. The published stable line remains `v1.0.126`; the current repository state is stronger than that release on both async and HTTP contract depth and on recorder/analyzer evidence truth.

What exists now:
- Deterministic OpenAPI semantic extraction and event-to-operation matching across Node and Java.
- Layered HTTP operation, status-code, parameter, and JSON-first request/response payload conformance with strict versioned JSON reports.
- Fail-closed governance gates for thresholds, regressions, exclusions, invalid evidence, async schema drift, and HTTP payload drift.
- Java-first delivery surfaces through `yanoteReport` / `yanoteCheck` Gradle tasks, recorder modules, and GitHub CI/release workflows.
- Runnable example and offline distribution bundles for recorder and analyzer usage in restricted environments.
- 100% validated mapped requirement traceability across the shipped v1 + contract-depth scope.
- Concept-first Russian-first documentation maps at the root, `docs/`, `examples/`, maintainer/traceability/history branches, and release assets, with leaf-level recovery links and a machine-checked guide-first verifier stack.
- Release/support boundaries, secondary navigation, maintained-product trust surfaces, and the local-only maintainer `AGENTS.md` contract are machine-checked as part of the public trust path.
- Supported AsyncAPI v2/v3 Kafka contracts normalize into canonical `kafka <action> <channel>` identities with adjacent message-contract metadata and deterministic invalid/unsupported diagnostics.
- Normalized Kafka evidence drives separate async coverage semantics for channels, send/receive operations, and message-contract identity, with explicit unmatched, mismatched, schema, header, and reference-level async drift diagnostics.
- A dedicated `yanote async-report` path loads AsyncAPI specs plus normalized async evidence, writes deterministic `yanote-async-report.json`, emits typed `YANOTE_ASYNC_*` summary/error lines, and keeps the existing HTTP `yanote report` path separate.
- Spring Kafka producer and consumer recorder seams emit truthful normalized `kafka send` / `kafka receive` evidence against a real broker, including suite/run header propagation across HTTP → Kafka and Kafka → Kafka flows.
- Payload-bearing Kafka evidence now survives Spring Kafka recorder capture, mixed JSONL round-trip, Node async ingestion, and AsyncAPI schema validation, with retained live-proof `schema-failure-*` artifacts proving fail-closed async contract depth end to end.
- Retained Kafka header evidence now survives into async analysis/proof surfaces, and AsyncAPI multi-message runtime selection is proven through retained redacted sidecars and typed ambiguity diagnostics instead of remaining an implicit runtime behavior.
- Payload-bearing HTTP evidence now survives Spring MVC recorder capture, JSONL round-trip, and Node ingestion for supported JSON request/response flows, and the example `POST /users` path plus OpenAPI contract are aligned on a real JSON `201` request/response operation.
- `yanote report` now carries a separate `httpPayloadConformance` section and CLI summary block for supported HTTP payload truth without changing the established operation/status/parameter coverage numerators.
- The HTTP payload-conformance model now classifies invalid, missing-body, missing-content-type, unsupported-media, unsupported-schema, no-declared-content, and mixed `PARTIAL` request/response outcomes deterministically across fixtures and the retained live Spring MVC proof path.
- HTTP report, gate, CLI, and retained artifact-summary surfaces now fail closed on typed `SEMANTIC_HTTP_*` payload drift while preserving operation/status/parameter observation numerators and keeping benign `NO_DECLARED_CONTENT` paths green.
- HTTP and async truth surfaces now distinguish recorder-policy omission from semantic contract drift more explicitly through additive payload/header provenance, retained header-aware async diagnostics, and stronger fail-closed ordering in the proof/report path.
- The public `bash scripts/ci/run-v1-e2e.sh` bundle retains both the stable happy-path `out/yanote-report.json` artifact and semantic-red sidecars (`semantic-red.stdout`, `semantic-red.stderr`, `semantic-red-yanote-report.json`) derived from the same live Spring MVC events, with docs/verifiers aligned to that boundary.
- The hardened `run-v1-e2e.sh` path prewarms runtime dependencies into a shared Gradle home before the offline test-container leg and now copies wrapper distributions into the mounted Gradle home so the containerized public proof can rerun reliably.

Current product-level gap:
- The hardened `v1.0.127` line is published; remaining work is deferred or follow-on hardening rather than blocked core capability.
- The compose surface still assumes host-prepared Gradle/Node assets via `run-v1-e2e.sh`; if the project wants raw `docker compose up` to be a cold-start supported entrypoint too, that expectation needs an explicit follow-up rather than an implicit promise.
- A truly empty local dependency cache still depends on successful network/TLS access during the host prebuild phase of `run-v1-e2e.sh`; the current guarantee is runtime truth on supported runners, not zero-network bootstrap.
- Unified HTTP+async reporting, broader transport support, richer ecosystem onboarding, coverage/mutation hardening, and compatibility-matrix work remain explicitly deferred rather than silently promised.

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
See `.gsd/ARTIFACT-PROVENANCE.md` for the provenance classification of restored and recovered durable artifacts.

## Milestone Sequence

- [x] M001: Yanote v1 Delivery — Deliver deterministic coverage semantics, governance, Java/CI delivery surfaces, and OSS release automation for the full v1 scope.
- [x] M002: Repository Product Maturity — Present a concept-first, trustable product surface with verified integration guidance, clear release/support boundaries, maintained-product trust signals, and a local-only maintainer agent workflow.
- [x] M003: AsyncAPI Coverage Foundations — Extend the analyzer and report model so Yanote can understand Kafka-oriented AsyncAPI contracts, compute async coverage semantics, and expose a separate async report/gate path.
- [x] M004: Kafka Evidence Capture And Java Integration — Add Spring Kafka producer/consumer evidence capture, Kafka test-metadata propagation, and live runtime proof paths for normalized async evidence.
- [x] M005: Async Productization And End-to-End Proof — Turn the new async capability into a trustable product surface with docs, support boundaries, CI proof, and release-grade acceptance.
- [x] M006: Runtime Delivery Hardening And Public Repo Hygiene — Restore trust in the public demo and CI surfaces, then remove tracked technical artifact trees from the default branch without leaving broken docs or trust contracts behind.
- [x] M007: AsyncAPI Schema Conformance And Contract Depth — Strengthen the async contract surface by carrying payload-bearing evidence through runtime capture, validating payloads against AsyncAPI schemas, and surfacing schema-level drift truthfully.
- [x] M008: OpenAPI Payload Conformance And Contract Depth — Extend the HTTP path from operation/status/parameter truth into request/response payload conformance with explicit report and gate semantics.
- [x] M009: HTTP And Kafka Evidence Truth Hardening — Make recorder, JSONL, analyzer, report, and gate surfaces distinguish omitted evidence from true semantic drift across the existing HTTP/OpenAPI and Kafka/AsyncAPI product boundary.
- [ ] M010: Core Contract Coverage Completeness For HTTP And Kafka — Extend the supported core HTTP/OpenAPI and Kafka/AsyncAPI paths so real services get explicit truth for the main status/parameter/header/payload contract surfaces.
- [ ] M011: OpenAPI Parameter, Cookie, And Media Semantics — Broaden the supported HTTP contract surface beyond current core checks into cookie, serialization, and media/format semantics that the recorder path can prove truthfully.
- [ ] M012: OpenAPI Surface Expansion Beyond Request/Response Core — Decide and implement which broader OpenAPI objects become first-class supported analyzer surfaces after the request/response core is complete.
- [ ] M013: Analyzer Delivery, Remote Spec, And Report UX — Improve how teams load specs and consume analyzer truth through remote spec retrieval, deprecated-operation handling, and human-friendly report artifacts.
- [ ] M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries — Deepen the supported Kafka-only async path with richer AsyncAPI semantics that still fit the current truthful runtime boundary.
- [ ] M015: Async Platform Expansion And Cross-Surface Reporting — Revisit the explicitly deferred platform-boundary changes: broker expansion beyond Kafka and any intentional combined HTTP+async reporting surface.
yond Kafka and any intentional combined HTTP+async reporting surface.
