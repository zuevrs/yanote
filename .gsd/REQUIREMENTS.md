# Requirements

Current capability contract for the project.

## Active

### R031 — Observed HTTP statuses that are not declared in OpenAPI surface as first-class drift
- Class: contract-depth
- Status: active
- Description: When live HTTP traffic returns a status not declared by the OpenAPI contract, Yanote must surface it explicitly instead of silently preserving a green declared-status numerator.
- Why it matters: Teams need to know when implementation behavior has escaped the documented status surface.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: planned
- Notes: Activated for the M010 core contract completeness milestone.

### R032 — Supported HTTP path/query/header parameter values are validated from retained evidence
- Class: contract-depth
- Status: active
- Description: Yanote validates supported OpenAPI path/query/header parameter values against retained evidence instead of only counting key presence.
- Why it matters: Key presence alone is not enough to tell whether the main declared parameter contract was actually honored.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: planned
- Notes: M010 intentionally limits this to the retained evidence shapes the recorder path can prove truthfully.

### R033 — Supported HTTP response headers are checked as part of contract conformance
- Class: contract-depth
- Status: active
- Description: Yanote treats supported OpenAPI response-header declarations as a first-class HTTP conformance surface.
- Why it matters: Real API contracts often encode important semantics in response headers, not only in payloads.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: planned
- Notes: M010 covers the supported core header surface, not every possible OpenAPI response-header nuance.

### R034 — Kafka-first AsyncAPI header diagnostics are a supported public surface
- Class: contract-depth
- Status: active
- Description: On the proven Kafka-first async path, Yanote surfaces missing, invalid, unavailable, and unverifiable header diagnostics as a supported user-facing contract surface.
- Why it matters: Async header truth is already part of the implementation seam and should become explicit public contract truth on the proven Kafka path.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: planned
- Notes: This does not widen the product beyond Kafka-only or introduce broker-agnostic header promises.

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
- Notes: Supported by the current HTTP/OpenAPI recorder → JSONL → analyzer path and retained proof surfaces.

### R002 — Governance gates fail closed on insufficient or invalid evidence
- Class: failure-visibility
- Status: validated
- Description: Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Why it matters: Coverage tooling is only trustworthy if bad evidence or insufficient proof cannot silently pass.
- Source: execution
- Primary owning slice: docs phase 3 equivalent
- Supporting slices: docs phase 4-5 equivalent
- Validation: validated
- Notes: Supported by the current threshold, regression, exclusion, and semantic-failure contract tests and workflow gates.

### R003 — Delivery surfaces work in local and CI workflows
- Class: launchability
- Status: validated
- Description: The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Why it matters: The tool has to fit actual team delivery paths, not just a local demo.
- Source: execution
- Primary owning slice: docs phase 4 equivalent
- Supporting slices: docs phase 2-5 equivalent
- Validation: validated
- Notes: Supported by the current CLI, Gradle, CI, and release workflow surfaces.

### R004 — Public release and support truth is versioned and explicit
- Class: operability
- Status: validated
- Description: Public support/release truth is defined by signed tags, GitHub Releases, Maven Central publication, and reproducible release verification rather than by workspace snapshot markers.
- Why it matters: Teams need a stable release truth surface they can trust separately from repository HEAD.
- Source: execution
- Primary owning slice: docs phase 5 equivalent
- Supporting slices: docs phase 4 equivalent
- Validation: validated
- Notes: Release truth now includes published `v1.0.127` surfaces and the underlying release-proof workflow.

### R005 — The current async surface stays narrow, truthful, and separate from HTTP reporting
- Class: constraint
- Status: validated
- Description: The supported async path remains Kafka-only, Spring-Kafka-first, and reported through a separate `async-report` / `yanote-async-report.json` surface without pretending to offer a broker-agnostic or combined HTTP+async report contract.
- Why it matters: The async path is valuable only if it stays explicit about what is and is not proven today.
- Source: execution
- Primary owning slice: M005/M009 equivalent
- Supporting slices: retained proof/docs boundary
- Validation: validated
- Notes: The current docs and retained proof surfaces explicitly preserve this narrow async boundary while proving deeper truth inside it.

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

### R022 — Broader HTTP parameter, cookie, and media semantics
- Class: contract-depth
- Status: deferred
- Description: Extend the HTTP/OpenAPI path from key-presence truth into supported parameter serialization, cookie, media, and format semantics that can be proven through retained evidence.
- Why it matters: Teams eventually expect the main HTTP contract surface to include more than route hits, declared statuses, and JSON payloads.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M011 follow-on after core contract completeness lands in M010.

### R023 — Broader OpenAPI object support beyond request/response core
- Class: contract-depth
- Status: deferred
- Description: Support selected non-request/response OpenAPI constructs such as security schemes, examples, links, callbacks, or webhooks where they can be turned into truthful analyzer surfaces.
- Why it matters: Rich real-world OpenAPI documents contain important contract meaning outside the request/response core.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M012 follow-on and intentionally kept separate from the core HTTP surfaces in M010/M011.

### R024 — Analyzer delivery and human-facing report ergonomics
- Class: launchability
- Status: deferred
- Description: Improve analyzer consumption through supported remote spec loading, explicit deprecated-operation handling, and human-friendly report artifacts that reflect the same canonical truth as machine-readable outputs.
- Why it matters: Coverage tooling needs operator-friendly delivery surfaces once the semantic core is stable.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M013 follow-on after the HTTP/OpenAPI contract surfaces stabilize.

### R025 — Richer AsyncAPI semantics within the Kafka-first path
- Class: contract-depth
- Status: deferred
- Description: Extend the proven Kafka-first async path to selected richer AsyncAPI constructs such as bindings, traits, correlation, or reply semantics where they can be verified truthfully from runtime evidence.
- Why it matters: Teams using richer AsyncAPI contracts will eventually expect more than channels, operations, messages, payloads, and headers.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M014 follow-on before any broker expansion or combined HTTP+async reporting work.

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
| R031 | contract-depth | active | M010 | none | planned |
| R032 | contract-depth | active | M010 | none | planned |
| R033 | contract-depth | active | M010 | none | planned |
| R034 | contract-depth | active | M010 | none | planned |
| R001 | core-capability | validated | docs phase 1-2 equivalent | docs phase 3-5 equivalent | validated |
| R002 | failure-visibility | validated | docs phase 3 equivalent | docs phase 4-5 equivalent | validated |
| R003 | launchability | validated | docs phase 4 equivalent | docs phase 2-5 equivalent | validated |
| R004 | operability | validated | docs phase 5 equivalent | docs phase 4 equivalent | validated |
| R005 | constraint | validated | M005/M009 equivalent | retained proof/docs boundary | validated |
| R020 | admin/support | deferred | none | none | unmapped |
| R021 | differentiator | deferred | none | none | unmapped |
| R022 | contract-depth | deferred | none | none | unmapped |
| R023 | contract-depth | deferred | none | none | unmapped |
| R024 | launchability | deferred | none | none | unmapped |
| R025 | contract-depth | deferred | none | none | unmapped |
| R030 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 4
- Mapped to slices: 9
- Validated: 5
- Unmapped active requirements: 0
