# Project

## What This Is

`yanote` is a Java-first API coverage platform that records live HTTP evidence into `events.jsonl`, analyzes that evidence against OpenAPI specifications, and produces deterministic CLI/file reports that show what parts of the contract were actually observed and which surfaces remain only partially proven.

## Core Value

The one thing that must keep working is trustworthy contract coverage from real evidence: the team should be able to answer which HTTP and supported async surfaces were actually proven by events before shipping, without false green or opaque heuristics.

## Current State

- The repository documents a stable public v1 line for HTTP/OpenAPI coverage and a narrow first-wave async path for AsyncAPI/Kafka.
- The public operator surfaces are the CLI summary, `yanote-report.json`, and the async-side `yanote-async-report.json` for the supported Kafka path.
- `README.md`, `docs/requirements.md`, `docs/release-and-support.md`, and `docs/traceability/v1-requirements-tests.md` already act as the main product/source-of-truth documentation surfaces.
- The repository currently uses only `main` locally, with no additional worktrees.
- The repo had `.gsd` blanket-ignored and wired through a broken symlink into global project cache state; on 2026-03-22 it was switched to the `gsd-2` shared-project model so durable `.gsd` docs live in the repo while runtime/session state stays local-only.
- This `.gsd` registry is a recovered baseline from current repository docs, not a backfilled historical milestone archive.

## Architecture / Key Patterns

- Java-first recorder and Gradle surfaces live alongside a Node-based analyzer (`yanote-js`).
- The recorder writes portable `events.jsonl` evidence; the analyzer resolves coverage against OpenAPI and emits deterministic reports.
- The public release truth is defined by signed `vMAJOR.MINOR.PATCH` tags and GitHub Releases, not by workspace snapshot version markers.
- HTTP and async coverage/reporting are intentionally separated today: `yanote-report.json` for HTTP/OpenAPI, `yanote-async-report.json` for the current AsyncAPI/Kafka path.
- The repository already carries explicit requirement/traceability docs under `docs/requirements.md` and `docs/traceability/`.

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the recovered capability contract, current requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Specification semantics — canonical operation resolution and deterministic event/spec matching for the supported HTTP path.
- [x] M002: Coverage engine and CLI report — operation/status/parameter coverage plus deterministic JSON report output.
- [x] M003: Governance gates — fail-closed thresholds, regression, exclusions, and invalid/incomplete evidence handling.
- [x] M004: Delivery and quality gates — standalone CLI, Gradle plugin, GitHub Action, CI verification, and Java 21 baseline proof.
- [x] M005: Public release and async-first expansion — signed/public release path plus the current Kafka-only async report/gate surface.
