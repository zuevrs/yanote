# M005: Async Productization And End-to-End Proof — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

## Project Description

This milestone turns the new AsyncAPI/Kafka capability into a first-class Yanote product surface. It covers async onboarding docs, support boundaries, public limitations, CI-ready end-to-end proof, and the trust surfaces needed so engineers can adopt the new async path with the same confidence they already have for HTTP/OpenAPI.

## Why This Milestone

By the time M004 is complete, Yanote should be able to understand AsyncAPI contracts and capture real Kafka evidence. That is necessary but not sufficient. Without clear onboarding, explicit support boundaries, and a trustworthy final proof path, the async capability will still feel experimental.

The repository already learned this lesson in M002: strong technical capability is not enough if the product surface does not communicate what works, how to use it, and where the edges are. M005 applies the same discipline to the new async path.

## User-Visible Outcome

### When this milestone is complete, the user can:

- understand how to use the new AsyncAPI/Kafka path, what it supports, and how it differs from the existing HTTP path
- follow a documented async journey from contract and runtime evidence to separate async report and gate results
- trust the async path because the repository exposes current limitations, support boundaries, and CI-ready proof surfaces clearly

### Entry point / environment

- Entry point: root/docs async guides, support/release surfaces, verifier stack, CI-facing proof commands
- Environment: GitHub repository, local developer environment, CI/runtime verification
- Live dependencies involved: async analyzer/report surfaces, Spring Kafka runtime proofs, docs and trust surfaces, CI workflows

## Completion Class

- Contract complete means: user-facing async docs, support boundaries, and report/gate wording are explicit and internally consistent with the product’s actual async capability
- Integration complete means: the documented async path is exercised against the real proof surfaces from M003 and M004, not just linked abstractly
- Operational complete means: the async path has a final composed acceptance surface that can run in CI-grade environments and support future release confidence

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a fresh engineer can discover the AsyncAPI/Kafka capability, understand its current boundaries, and find the correct path to a separate async report
- the async proof stack closes from docs through live Kafka runtime evidence to CI-ready acceptance without hand-waving or broken links
- the async public story stays honest about first-wave scope: Kafka-only, Spring Kafka-first, separate async reporting, no payload-schema enforcement yet

## Risks and Unknowns

- Async docs can oversell capability if they imply broker-agnostic coverage or payload validation before those surfaces are real
- Final proof can become a second drift surface if it re-implements lower-level checks instead of composing them
- Support/release wording can become confusing if HTTP and async boundaries are mixed too early
- Separate async reporting is the right first step, but users still need a coherent overall product story that does not make Yanote feel split into two unrelated tools

## Existing Codebase / Prior Art

- M002 outputs — concept-first docs architecture, release/support owner surfaces, trust-surface verifier stack, and maintained-product repo posture
- M003 outputs — async contract ingestion, coverage semantics, and separate async report/gate path
- M004 outputs — live Spring Kafka evidence capture and runtime proof scenarios
- `docs/release-and-support.md` and current docs verifier stack — existing model for keeping product boundaries explicit and machine-checked
- `bash scripts/docs/verify-s08-entry-paths.sh` and `.gsd/milestones/M002/slices/S08/S08-UAT.md` — model for a final composed acceptance surface grounded in live proof rather than optimistic prose

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R041 — separate async report and gate path alongside HTTP
- R045 — real Kafka integration proof for single-service and two-service scenarios
- R046 — async verification stack at OpenAPI-quality depth
- R047 — productized AsyncAPI/Kafka onboarding and support surface
- R048 — CI-ready end-to-end async proof and release-grade trust surface
- R049 / R050 / R051 / R052 / R053 — deferred boundary reminders that the public async story must not overpromise

## Scope

### In Scope

- async user-facing docs and navigation
- release/support/limitation surfaces for the first async rollout
- final composed async acceptance path for CI-grade verification
- trust surfaces that make the async capability feel first-class and bounded honestly

### Out of Scope / Non-Goals

- changing the validated M001/M002 HTTP path
- combining HTTP and async into one mandatory report
- broadening beyond Kafka-only and Spring Kafka-first in this milestone
- payload-schema validation, Schema Registry, or deeper broker-operational coverage dimensions

## Technical Constraints

- Keep the async public story honest about current boundaries and deferred capabilities.
- Reuse the existing repo-maturity/trust-surface patterns from M002 instead of inventing a second docs/governance style.
- Final acceptance should compose lower-level async verifiers and live proofs instead of duplicating them.
- Maintain separate async report/gate surfaces in the first release while still explaining how they fit into the overall Yanote product.

## Integration Points

- root `README.md`, `docs/`, and support/release surfaces
- M003 async analyzer/report outputs and gate surfaces
- M004 live Kafka proof assets and verifier stack
- CI workflows and future release-proof surfaces that will need to understand async acceptance

## Open Questions

- Where should the async proof command live so it mirrors the successful M002 final-acceptance pattern without colliding with the existing HTTP/docs verifier stack?
- How much async detail belongs on the root landing versus deeper guides while the capability is still separate-report only?
- What is the cleanest way to express first-wave async limitations so the product looks strong, not vague or over-defensive?
