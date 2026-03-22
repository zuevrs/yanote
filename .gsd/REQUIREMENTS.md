# Requirements

This file is the recovered capability and coverage contract for the project.

Recovery note:
- The repository previously blanket-ignored `.gsd/`, so this file was reconstructed on 2026-03-22 from tracked repo docs (`README.md`, `docs/requirements.md`, `docs/release-and-support.md`, and `docs/traceability/v1-requirements-tests.md`).
- Requirement status below reflects the surviving public documentation and traceability surfaces, not a fresh full-repo proof run in this session.

## Validated

### R001 — Teams can prove supported HTTP contract coverage from recorded evidence
- Class: core-capability
- Status: validated
- Description: A Java service team can record live HTTP evidence, analyze it against OpenAPI, and see deterministic operation/status/parameter coverage plus file/CLI outputs that show what was actually proven.
- Why it matters: This is the core product promise.
- Source: execution
- Primary owning slice: docs phase 1-2 equivalent
- Supporting slices: docs phase 3-5 equivalent
- Validation: validated
- Notes: Recovered from the checked public requirements inventory where SPEC-01..03 and COVR-01..05 are complete, plus traceability mappings in `docs/traceability/v1-requirements-tests.md`.

### R002 — Governance gates fail closed on insufficient or invalid evidence
- Class: failure-visibility
- Status: validated
- Description: Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Why it matters: Coverage tooling is only trustworthy if bad evidence or insufficient proof cannot silently pass.
- Source: execution
- Primary owning slice: docs phase 3 equivalent
- Supporting slices: docs phase 4-5 equivalent
- Validation: validated
- Notes: Recovered from `docs/requirements.md` (GATE-01..04 complete) and the traceability map that points to dedicated contract tests for threshold, regression, exclusions, and fail-closed behavior.

### R003 — Delivery surfaces work in local and CI workflows
- Class: launchability
- Status: validated
- Description: The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Why it matters: The tool has to fit actual team delivery paths, not just a local demo.
- Source: execution
- Primary owning slice: docs phase 4 equivalent
- Supporting slices: docs phase 2-5 equivalent
- Validation: validated
- Notes: Recovered from DELV-01..03 and QUAL-02..03 in `docs/requirements.md`, plus the traceability map to CLI, Gradle plugin, CI, and Java 21 contract tests.

### R004 — Public release and support truth is versioned and explicit
- Class: operability
- Status: validated
- Description: Public support/release truth is defined by signed tags, GitHub Releases, Maven Central publication, and reproducible release verification rather than by workspace snapshot markers.
- Why it matters: Teams need a stable release truth surface they can trust separately from repository HEAD.
- Source: execution
- Primary owning slice: docs phase 5 equivalent
- Supporting slices: docs phase 4 equivalent
- Validation: validated
- Notes: Recovered from RELS-01..03 in `docs/requirements.md` and the release-boundary rules in `docs/release-and-support.md`.

### R005 — The current async surface stays narrow, truthful, and separate from HTTP reporting
- Class: constraint
- Status: validated
- Description: The supported async path remains Kafka-only, Spring-Kafka-first, and reported through a separate `async-report` / `yanote-async-report.json` surface without pretending to offer a broker-agnostic or combined HTTP+async report contract.
- Why it matters: The async path is valuable only if it stays explicit about what is and is not proven today.
- Source: execution
- Primary owning slice: M005/M009 equivalent
- Supporting slices: retained proof/docs boundary
- Validation: validated
- Notes: The current docs and retained proof surfaces explicitly preserve this narrow async boundary, and the recovered M009 closeout confirms stronger evidence truth inside that boundary without widening the public promise.

## Deferred

### R020 — Combined HTTP + async report/gate surface
- Class: admin/support
- Status: deferred
- Description: Produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`.
- Why it matters: It may reduce operator overhead later, but the current truthful split is explicit and supported.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred in `docs/requirements.md` as ASYNC-02.

### R021 — Broker-agnostic or non-Kafka async coverage
- Class: differentiator
- Status: deferred
- Description: Extend the async path beyond the current Kafka-only boundary to non-Kafka brokers or a broker-agnostic runtime promise.
- Why it matters: Useful later, but outside the current public support boundary.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred in `docs/requirements.md` as ASYNC-03.

## Out of Scope

### R030 — Web dashboard/UI as a required product surface
- Class: anti-feature
- Status: out-of-scope
- Description: A web dashboard/report UI is not required for the current product value; CLI plus file reports are the supported surfaces.
- Why it matters: Prevents scope creep away from the current recorder/analyzer/report contract.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Explicitly out of scope in `docs/requirements.md`.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | docs phase 1-2 equivalent | docs phase 3-5 equivalent | validated |
| R002 | failure-visibility | validated | docs phase 3 equivalent | docs phase 4-5 equivalent | validated |
| R003 | launchability | validated | docs phase 4 equivalent | docs phase 2-5 equivalent | validated |
| R004 | operability | validated | docs phase 5 equivalent | docs phase 4 equivalent | validated |
| R005 | constraint | validated | M005/M009 equivalent | retained proof/docs boundary | validated |
| R020 | admin/support | deferred | none | none | unmapped |
| R021 | differentiator | deferred | none | none | unmapped |
| R030 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 5
- Validated: 5
- Unmapped active requirements: 0
