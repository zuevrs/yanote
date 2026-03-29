# Project

## What This Is

Yanote is a Java-first API contract coverage toolchain for teams that want proof of what their tests and live traffic actually exercised. Recorder modules write portable evidence to `events.jsonl`, the analyzer evaluates that evidence against OpenAPI and AsyncAPI contracts, and Yanote publishes deterministic JSON/HTML reports plus CI/release surfaces that show what is covered, what is only partially proven, and where fail-closed contract drift starts.

## Core Value

A team should be able to connect Yanote to a real service, run tests or live calls, and get a truthful answer about what part of the contract was actually proven.

## Current State

Through M015, Yanote has a broad validated product surface: deterministic HTTP/OpenAPI coverage and semantics, a protocol-aware async path covering Kafka and the first RabbitMQ/AMQP runtime proof, separate HTTP/async reports plus a child-attributed combined report, JVM publication surfaces, and tag-driven release infrastructure.

The current weakness is not core product semantics but product packaging. The public repository face is noisier than it should be: internal planning/process/proof residue competes with the product story, some temporary/runtime artifacts have leaked into tracked state, docs are longer and more proof-heavy than desired for a first-time user, and the analyzer still reads too much like an internal `yanote-js` build seam instead of an official shipped CLI surface. M016 is planned to fix that public/product boundary.

## Architecture / Key Patterns

- Recorder-first product model: record runtime facts to `events.jsonl`, then analyze against canonical specs.
- Separate truthful report families: HTTP, async, and child-attributed combined reporting without a blended denominator.
- JVM modules for recorder/plugin/test-tagging/publication surfaces; Node-based analyzer implementation currently built from `yanote-js`.
- CI and release automation are part of the product trust surface, not an afterthought.
- Public docs are Russian-first; internal planning artifacts may remain English-first.
- Internal GSD/process/proof/runtime surfaces should support local work without dictating the public repository face.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, active milestone work, deferred items, and validated product boundary.

## Milestone Sequence

- [x] M001: Yanote v1 Delivery — Deterministic HTTP coverage, governance, JVM delivery surfaces, and the initial OSS release baseline.
- [x] M002: Repository Product Maturity — Product/trust surface hardening for docs, releases, support boundaries, and maintainer workflow.
- [x] M003: AsyncAPI Coverage Foundations — First Kafka-oriented async analysis and separate async reporting.
- [x] M004: Kafka Evidence Capture And Java Integration — Spring Kafka evidence capture and live runtime proof.
- [x] M005: Async Productization And End-to-End Proof — Async docs, support, CI proof, and release-grade acceptance.
- [x] M006: Runtime Delivery Hardening And Public Repo Hygiene — Delivery-path hardening and earlier public-artifact cleanup.
- [x] M007: AsyncAPI Schema Conformance And Contract Depth — Async payload/schema depth on the proven Kafka path.
- [x] M008: OpenAPI Payload Conformance And Contract Depth — HTTP payload conformance beyond route/status truth.
- [x] M009: HTTP And Kafka Evidence Truth Hardening — Better distinction between omitted evidence and real semantic drift.
- [x] M010: Core Contract Coverage Completeness For HTTP And Kafka — Broader supported core HTTP and Kafka conformance truth.
- [x] M011: OpenAPI Parameter, Cookie, And Media Semantics — Request serialization, cookies, media specificity, and payload-format semantics.
- [x] M012: OpenAPI Surface Expansion Beyond Request/Response Core — Truthful broader-object support through OpenAPI security semantics.
- [x] M013: Analyzer Delivery, Remote Spec, And Report UX — Remote spec loading, deprecated-operation truth, and static HTML report delivery.
- [x] M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries — Trait-aware declared semantics, runtime correlation/reply truth, and Kafka binding support.
- [x] M015: Async Platform Expansion And Cross-Surface Reporting — Protocol-aware AMQP support, live RabbitMQ proof, and combined HTTP+async reporting.
- [ ] M016: Product-First Repository Surface And Shipping Automation — Clean public repo boundary, official analyzer shipping surface, short product docs, and fail-closed tag-driven publication.
