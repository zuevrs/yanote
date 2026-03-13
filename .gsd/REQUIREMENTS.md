# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements should be atomic, testable, and stated in plain language.
- Every **Active** requirement should be mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Each requirement should have one accountable primary owner and may have supporting slices.
- Research may suggest requirements, but research does not silently make them binding.
- Validation means the requirement was actually proven by completed work and verification, not just discussed.

## Active

### R042 — Spring Kafka producer evidence capture
- Class: integration
- Status: active
- Description: Yanote can capture normalized producer-side Kafka evidence from Spring Kafka applications.
- Why it matters: Teams need proof for outbound event contracts, not only inbound consumption.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: M004/S02, M004/S03
- Validation: mapped
- Notes: Evidence should preserve enough metadata to link producer facts back to canonical async operations.

### R043 — Spring Kafka consumer evidence capture
- Class: integration
- Status: active
- Description: Yanote can capture normalized consumer-side Kafka evidence from Spring Kafka applications.
- Why it matters: Real services often both publish and consume, and Yanote must distinguish those directions honestly.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: M004/S02, M004/S03
- Validation: mapped
- Notes: Consumer evidence must not be conflated with producer evidence even when the same service does both.

### R044 — Kafka test metadata propagation via headers
- Class: operability
- Status: active
- Description: Suite/run metadata can propagate through Kafka headers and land in normalized async evidence so coverage attribution remains diagnosable.
- Why it matters: The current HTTP path already depends on trustworthy test metadata; the async path needs the same debugging and attribution surface.
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: M004/S03, M005/S01
- Validation: mapped
- Notes: The first version should preserve headers and evidence truth even if the final report surface stays minimal.

### R045 — Real Kafka integration proof for single-service and two-service scenarios
- Class: operability
- Status: active
- Description: Yanote proves its Kafka path in two live scenarios: one service that both publishes and consumes, and a two-service producer-to-consumer flow.
- Why it matters: The user wants both scenarios covered, and async confidence requires more than unit-only proof.
- Source: user
- Primary owning slice: M004/S03
- Supporting slices: M005/S02
- Validation: mapped
- Notes: These proofs should run against a real Kafka runtime, not only mocked broker abstractions.

### R046 — Async verification stack at OpenAPI-quality depth
- Class: quality-attribute
- Status: active
- Description: The async capability is protected by fixture, unit, integration, end-to-end, and CI checks at the same trust depth as the current OpenAPI path.
- Why it matters: A second-class async test story would make the new capability untrustworthy even if the happy path appears to work.
- Source: user
- Primary owning slice: M004/S03
- Supporting slices: M003/S01, M003/S02, M003/S03, M005/S02
- Validation: mapped
- Notes: This is a quality bar, not a stretch goal.

### R047 — Productized AsyncAPI/Kafka onboarding and support surface
- Class: primary-user-loop
- Status: active
- Description: Engineers can understand how to use the new AsyncAPI/Kafka capability, what it supports, and where its current boundaries are without reverse-engineering internal implementation notes.
- Why it matters: A strong async core still fails adoption if users cannot discover the right path or trust the limits.
- Source: inferred
- Primary owning slice: M005/S01
- Supporting slices: M005/S02
- Validation: mapped
- Notes: The first async public story should stay Kafka-only and Spring Kafka-first unless later milestones broaden it.

### R048 — CI-ready end-to-end async proof and release-grade trust surface
- Class: quality-attribute
- Status: active
- Description: The async path closes with machine-checked end-to-end proof, CI-ready acceptance, and trust surfaces that make it feel like a first-class product capability.
- Why it matters: Async support should ship with the same release confidence as the existing HTTP path.
- Source: inferred
- Primary owning slice: M005/S02
- Supporting slices: M004/S03
- Validation: mapped
- Notes: Final proof should compose the lower-level async verifiers instead of inventing a separate ungrounded acceptance story.

## Validated

### R037 — AsyncAPI contract ingestion for Kafka APIs
- Class: core-capability
- Status: validated
- Description: Yanote can ingest Kafka-oriented AsyncAPI specifications, validate them, and load them into the analyzer without treating async contracts as opaque attachments.
- Why it matters: Teams with event-driven services need the same contract entry point for AsyncAPI that HTTP teams already have for OpenAPI.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S03
- Validation: validated
- Notes: Proven by the S01 proof command covering Kafka-only AsyncAPI v2/v3 ingestion, explicit invalid/unsupported boundaries, and OpenAPI non-regression.

### R038 — Canonical async operation identity across AsyncAPI versions
- Class: core-capability
- Status: validated
- Description: Yanote can normalize supported AsyncAPI version shapes into one canonical async operation identity that distinguishes Kafka channel and direction reliably.
- Why it matters: Coverage, diagnostics, recorder evidence, and CI gates all depend on one stable async identity contract.
- Source: inferred
- Primary owning slice: M003/S01
- Supporting slices: M003/S02, M004/S01
- Validation: validated
- Notes: Proven by canonical `kafka <action> <channel>` normalization plus parity tests that hold AsyncAPI v2 and v3 to the same deterministic operation ordering.

### R039 — Async coverage semantics for channels, operations, and message contracts
- Class: core-capability
- Status: validated
- Description: Yanote can compute async coverage that shows which Kafka channels are covered, which send/receive operations are covered, and which message contracts were observed.
- Why it matters: The user wants async results to be as informative as HTTP coverage, not a shallow topic-hit counter.
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: M003/S03, M005/S02
- Validation: validated
- Notes: Proven by the S02 verifier stack covering separate channel, operation, and message-contract coverage semantics with deterministic v2/v3 parity under shared evidence.

### R040 — Unmatched and mismatched async evidence diagnostics
- Class: failure-visibility
- Status: validated
- Description: Yanote shows unmatched async events and async contract mismatches explicitly instead of silently counting best-effort matches.
- Why it matters: Event-driven coverage is only trustworthy if evidence drift is visible and can participate in gates.
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: M003/S03, M005/S02
- Validation: validated
- Notes: Proven by explicit `unmatched` and `mismatched` async diagnostics, including known-channel action drift and message-contract mismatch proof in the S02 verifier stack.

### R041 — Separate async report and gate path alongside HTTP
- Class: integration
- Status: validated
- Description: Yanote provides a separate async report and gate path alongside the existing HTTP path instead of forcing one mandatory combined report in the first async release.
- Why it matters: This keeps the first async rollout legible and reduces coupling while the async semantics mature.
- Source: user
- Primary owning slice: M003/S03
- Supporting slices: M005/S02
- Validation: validated
- Notes: Proven by the S03 verifier stack covering dedicated `async-report` CLI wiring, deterministic `yanote-async-report.json` output, fail-closed async gate behavior, and HTTP report/coverage non-regression.

### R001 — Canonical OpenAPI specification loading and operation identity
- Class: core-capability
- Status: validated
- Description: Yanote can load OpenAPI HTTP specifications and resolve operations into canonical operation keys.
- Why it matters: Every downstream coverage and governance surface depends on a stable operation identity.
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: validated
- Notes: Legacy SPEC-01. Proven by semantic extraction and parity fixture verification.

### R002 — Actionable unmatched and ambiguous specification diagnostics
- Class: failure-visibility
- Status: validated
- Description: Yanote can detect and surface unmatched or ambiguous specification operations with actionable diagnostics.
- Why it matters: Users need trustworthy failure modes instead of silent fallback behavior.
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: validated
- Notes: Legacy SPEC-02. Proven by fail-closed semantic contract tests.

### R003 — Deterministic event-to-operation matching
- Class: core-capability
- Status: validated
- Description: Yanote can map recorded HTTP events to canonical operation keys using deterministic matching rules.
- Why it matters: Coverage results are only reliable if runtime evidence maps consistently across environments.
- Source: inferred
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: validated
- Notes: Legacy SPEC-03. Proven by shared Java/Node matcher fixtures.

### R004 — Operation-level coverage computation
- Class: core-capability
- Status: validated
- Description: Yanote can compute operation-level coverage for all scoped v1 endpoints.
- Why it matters: This is the primary product outcome.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Notes: Legacy COVR-01. Proven by analyzer/report tests.

### R005 — Status-code coverage computation
- Class: core-capability
- Status: validated
- Description: Yanote can compute status-code coverage per operation.
- Why it matters: Contract coverage needs more depth than raw endpoint-hit counts.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Notes: Legacy COVR-02. Proven by deterministic report fixtures.

### R006 — Parameter coverage computation
- Class: core-capability
- Status: validated
- Description: Yanote can compute parameter coverage across path, query, and header surfaces where defined.
- Why it matters: Users need evidence that contract inputs are exercised, not only that endpoints were touched.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Notes: Legacy COVR-03. Proven by parameter evidence semantics in report tests.

### R007 — Deterministic versioned JSON reports
- Class: core-capability
- Status: validated
- Description: Yanote can generate deterministic versioned JSON report output for the same inputs.
- Why it matters: CI automation and release traceability require stable artifacts.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: M001/S03
- Validation: validated
- Notes: Legacy COVR-04. Proven by strict schema and deterministic serialization checks.

### R008 — Concise CLI coverage summary
- Class: primary-user-loop
- Status: validated
- Description: Yanote can print a concise CLI summary showing uncovered operations and coverage percentages.
- Why it matters: Engineers need a fast local and CI-readable result surface.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: M001/S03
- Validation: validated
- Notes: Legacy COVR-05. Proven by CLI contract tests.

### R009 — Minimum coverage threshold enforcement
- Class: quality-attribute
- Status: validated
- Description: Yanote can configure a minimum coverage threshold and fail checks when the result is below target.
- Why it matters: Coverage only affects shipping behavior when it can gate quality decisions.
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: Legacy GATE-01. Proven by governance gate tests.

### R010 — Regression detection against a baseline report
- Class: continuity
- Status: validated
- Description: Yanote can fail checks on coverage regression against a baseline report.
- Why it matters: Teams need to prevent silent erosion of API test coverage.
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: Legacy GATE-02. Proven by regression gate fixtures.

### R011 — Explicit coverage exclusions with rationale
- Class: operability
- Status: validated
- Description: Yanote can configure explicit coverage exclusions and preserve the rationale in output artifacts.
- Why it matters: Intentional scope gaps must stay visible and auditable.
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: Legacy GATE-03. Proven by policy/report contract tests.

### R012 — Fail-closed invalid evidence handling
- Class: failure-visibility
- Status: validated
- Description: Yanote fails closed when input evidence is invalid, ambiguous, or incomplete.
- Why it matters: False confidence is more dangerous than a hard failure.
- Source: inferred
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: Legacy GATE-04. Proven by deterministic failure ordering and gate tests.

### R013 — Standalone CLI analysis surface
- Class: integration
- Status: validated
- Description: Developers can run Yanote coverage analysis via a standalone CLI in local and CI environments.
- Why it matters: The product needs a direct adoption path outside Gradle plugin wrapping.
- Source: inferred
- Primary owning slice: M001/S02
- Supporting slices: M001/S04
- Validation: validated
- Notes: Legacy DELV-01. Proven by CLI build/test and CI usage.

### R014 — Gradle plugin analysis surface
- Class: integration
- Status: validated
- Description: Developers can run coverage analysis via Gradle plugin tasks integrated into the Java build lifecycle.
- Why it matters: Java-first teams need native build-system ergonomics.
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: validated
- Notes: Legacy DELV-02. Proven by Gradle task and plugin contract tests.

### R015 — GitHub CI analysis surface
- Class: integration
- Status: validated
- Description: Teams can run coverage analysis via GitHub workflows and consume resulting artifacts and check outcomes.
- Why it matters: CI-native delivery is required for team adoption.
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: validated
- Notes: Legacy DELV-03. Proven by workflow contract tests and required-check topology.

### R016 — Signed Maven Central publication
- Class: launchability
- Status: validated
- Description: Maintainers can publish signed Java artifacts to Maven Central.
- Why it matters: A production tool needs a real distribution channel for enterprise consumption.
- Source: inferred
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: Legacy RELS-01. Proven by release preflight and successful publish path.

### R017 — Versioned GitHub Releases with usage notes
- Class: launchability
- Status: validated
- Description: Maintainers can publish versioned GitHub Releases with changelog and usage notes.
- Why it matters: Users need a stable artifact and release communication surface.
- Source: inferred
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: Legacy RELS-02. Proven by release workflow contracts and proof release `v1.0.122`.

### R018 — Reproducible tag-driven release pipeline
- Class: operability
- Status: validated
- Description: Maintainers can run a reproducible CI release pipeline from tagged versions.
- Why it matters: Public release must be governed, auditable, and repeatable.
- Source: inferred
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: Legacy RELS-03. Proven by release proof run `22712608803`.

### R019 — Full requirement traceability across v1
- Class: quality-attribute
- Status: validated
- Description: The project has automated tests that trace to all scoped v1 requirements.
- Why it matters: Capability claims should be backed by accountable proof.
- Source: inferred
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: Legacy QUAL-01. Proven by 100% traceability gate and artifacts.

### R020 — Merge-blocking automated quality checks
- Class: quality-attribute
- Status: validated
- Description: CI runs unit, integration, and end-to-end checks for the v1 workflow and blocks merges on failure.
- Why it matters: Stable delivery requires automated enforcement, not convention only.
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: M001/S05
- Validation: validated
- Notes: Legacy QUAL-02. Proven by required GitHub checks and contract suites.

### R021 — Java 21 baseline compatibility verification
- Class: constraint
- Status: validated
- Description: The project verifies Java 21 baseline compatibility in automated checks.
- Why it matters: Runtime assumptions must stay explicit and enforced.
- Source: inferred
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: validated
- Notes: Legacy QUAL-03. Proven by explicit Java 21 enforcement in CI.

### R022 — Concept-first repository landing for engineers
- Class: primary-user-loop
- Status: validated
- Description: A first-time engineer can open the root repository and understand what Yanote is, what problem it solves, who it is for, and the main path from concept to integration before reading deep setup details.
- Why it matters: The current technical strength of the product is wasted if the first five minutes in the repo do not create clarity and trust.
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: M002/S05, M002/S08
- Validation: validated
- Notes: Public entry surfaces should lead with concept and supported workflow, not with scattered implementation notes.

### R023 — Verified real-service recorder integration path
- Class: integration
- Status: validated
- Description: An engineer can follow one short, verified path to connect the recorder to a real Spring-based service and produce `events.jsonl` without guesswork.
- Why it matters: Recorder integration is the highest-friction adoption step and the place where trust will be won or lost.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S05, M002/S08
- Validation: validated
- Notes: The path should stay grounded in real repo assets and should distinguish smoke-only options from recommended product usage.

### R024 — Event evidence capture and retrieval guidance
- Class: operability
- Status: validated
- Description: The docs explain where event evidence is written, how to verify the file exists and is non-empty, and how to retrieve it for analysis in real environments.
- Why it matters: Users do not care that recording happened internally; they need a dependable way to find the evidence file and move to the next step.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02, M002/S08
- Validation: validated
- Notes: This should cover both path/config behavior and practical verification commands.

### R025 — Analyzer execution and coverage interpretation path
- Class: primary-user-loop
- Status: validated
- Description: An engineer can run the analyzer on collected events, generate a report, and understand the meaning of core coverage results, exclusions, and failure states.
- Why it matters: Producing a file is not enough; users must be able to turn it into an actionable understanding of contract coverage.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S03, M002/S08
- Validation: validated
- Notes: The path should favor one reliable happy path before optional advanced modes.

### R026 — RestAssured and Cucumber tagging/header setup guidance
- Class: integration
- Status: validated
- Description: The docs explain how to configure the current test-tagging surfaces so engineers using RestAssured and Cucumber can emit the expected request headers and suite/run metadata.
- Why it matters: These integrations affect event quality and downstream interpretation, and they are easy to misuse when explained abstractly.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S01, M002/S08
- Validation: validated
- Notes: Guidance should stay concrete and match the modules that already exist in the repo.

### R027 — Current version, recent changes, and release visibility
- Class: continuity
- Status: validated
- Description: A repository visitor can tell which version line is current, where to see recent changes, and how the latest stable release relates to the repository state.
- Why it matters: Corporate engineers need immediate confidence that they are evaluating a current and maintained product instead of stale code.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: M002/S03, M002/S05
- Validation: validated
- Notes: The answer should not require browsing many tags or digging through workflow files.

### R028 — Stable support boundaries, limitations, and compatibility story
- Class: admin/support
- Status: validated
- Description: The docs clearly state what is already stable, what constraints or limitations still exist, and what runtime/integration expectations users should assume.
- Why it matters: Trust improves when the product is explicit about its current envelope instead of implying universal readiness.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: M002/S06, M002/S08
- Validation: validated
- Notes: This should include product boundaries, compatibility assumptions, and the distinction between supported and deferred surfaces.

### R029 — Documentation architecture that separates user docs, maintainer docs, and historical artifacts
- Class: operability
- Status: validated
- Description: The repository documentation is organized so first-time users, maintainers, and historical-reference readers each have a clear path without stepping on each other.
- Why it matters: A mature repo is not only well-written; it is navigable, with the right information in the right place.
- Source: inferred
- Primary owning slice: M002/S05
- Supporting slices: M002/S03, M002/S04, M002/S06
- Validation: validated
- Notes: Historical plans and traceability evidence remain available but should not dominate the landing path.

### R030 — Repository trust surfaces for a maintained product repo
- Class: launchability
- Status: validated
- Description: The repository contains the repo-level files and policy surfaces that make it look and behave like a maintained product rather than an ad hoc pet project.
- Why it matters: Product trust is shaped by repo hygiene as much as by source code quality.
- Source: research
- Primary owning slice: M002/S06
- Supporting slices: M002/S04, M002/S05, M002/S08
- Validation: validated
- Notes: The goal is trust and clarity for users, not performative open-source bureaucracy.

### R031 — Local-only AGENTS.md contract for agent-assisted development
- Class: operability
- Status: validated
- Description: Maintainer agent instructions exist as a local-only artifact with clear handling rules so agent-assisted development is effective without publishing private workflow details in the tracked repository.
- Why it matters: The maintainer wants agent leverage, but the file should not become part of the public product surface.
- Source: user
- Primary owning slice: M002/S07
- Supporting slices: M002/S08
- Validation: validated
- Notes: The milestone should settle the storage/ignore pattern and make it safe to maintain over time.

## Deferred

### R032 — Dedicated documentation site outside the repository
- Class: differentiator
- Status: deferred
- Description: Yanote may later move or mirror user docs into a dedicated docs site with richer navigation and publishing workflows.
- Why it matters: This can improve discoverability later, but it adds infrastructure before the repository entry path is proven.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Repository-first documentation should be made trustworthy before adding a second publishing surface.

### R033 — Broader ecosystem onboarding beyond current Java-first surfaces
- Class: integration
- Status: deferred
- Description: Later milestones may add first-class onboarding for ecosystems beyond the current Java-first recorder and analyzer path.
- Why it matters: Broader adoption may require more than the current Spring/Gradle-centered experience.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The current product posture remains Java-first; expanding beyond that is valuable but not part of this milestone.

### R049 — Payload validation against AsyncAPI message schema
- Class: core-capability
- Status: deferred
- Description: Yanote may later validate observed Kafka payloads against AsyncAPI message schemas instead of only identifying the message contract that was exercised.
- Why it matters: This would deepen confidence in contract fidelity, but it materially increases the semantic and runtime scope of the first async rollout.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The user wants this eventually, but not at the cost of delaying a trustworthy first async capability.

### R050 — Unified combined HTTP and async reporting surface
- Class: primary-user-loop
- Status: deferred
- Description: Yanote may later present HTTP and async coverage in one unified report and gate surface.
- Why it matters: Teams running hybrid services will eventually want one higher-level contract picture.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: The first async rollout should keep separate reports and gates to avoid blurring semantics.

### R051 — Non-Kafka AsyncAPI brokers beyond Spring Kafka-first path
- Class: integration
- Status: deferred
- Description: Later milestones may expand AsyncAPI support beyond Kafka and beyond the Spring Kafka-first Java integration path.
- Why it matters: AsyncAPI is broader than Kafka, but first-wave trust should come from one strong broker/runtime path.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: This includes RabbitMQ and other AsyncAPI-capable transports.

### R052 — Schema Registry integration and schema-evolution awareness
- Class: integration
- Status: deferred
- Description: Yanote may later integrate with schema registries and account for schema-evolution concerns in async contract verification.
- Why it matters: Many Kafka teams rely on schema registries in production, but they are not required to establish the first coverage-capable async path.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deliberately postponed to keep the first async milestone set focused and testable.

### R053 — DLQ, retry, partition, and lag-aware async coverage dimensions
- Class: differentiator
- Status: deferred
- Description: Yanote may later add async coverage dimensions tied to dead-letter flows, retries, partition-aware semantics, or lag/runtime operational signals.
- Why it matters: These could become valuable for mature event-driven teams, but they are not table stakes for the first contract-coverage rollout.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: First-wave async support should measure contract exercise before deeper broker-operational behaviors.

## Out of Scope

### R034 — English-first documentation set
- Class: constraint
- Status: out-of-scope
- Description: This milestone does not create English-first public documentation as the primary documentation surface.
- Why it matters: It prevents accidental duplication and keeps the public entry path aligned with the target Russian-speaking engineer audience.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Internal planning artifacts may remain in English for maintainer efficiency.

### R035 — Public committed AGENTS.md in the tracked repository
- Class: anti-feature
- Status: out-of-scope
- Description: This milestone does not add a tracked public `AGENTS.md` file to the repository.
- Why it matters: The maintainer wants agent leverage without turning private workflow instructions into a public repo surface.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The desired end state is a local-only agent contract.

### R036 — Community-first contribution model
- Class: anti-feature
- Status: out-of-scope
- Description: This milestone does not optimize the repository around broad outside contribution as the primary operating model.
- Why it matters: The real audience is engineers using the product, while development remains maintainer-driven.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Trust surfaces may still allow issues or contributions, but they should not imply high-bandwidth community stewardship.

### R054 — Silent best-effort matching for async evidence drift
- Class: anti-feature
- Status: out-of-scope
- Description: The first async release does not silently accept best-effort Kafka evidence matches when the evidence drifts from the AsyncAPI contract.
- Why it matters: This prevents false confidence in async coverage and preserves the fail-closed posture established for HTTP.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Async drift should surface as explicit unmatched or mismatched diagnostics.

### R055 — HTTP and async merged into one mandatory report in the first async release
- Class: anti-feature
- Status: out-of-scope
- Description: The first async release does not force HTTP and async evidence into one combined mandatory report and gate.
- Why it matters: It protects clarity while the async semantics and runtime path are still being established.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Separate report/gate surfaces are intentional for the first rollout.

### R056 — Broker-agnostic “everything async” support in the first cut
- Class: anti-feature
- Status: out-of-scope
- Description: The first async rollout does not attempt broad broker-agnostic support across every AsyncAPI transport.
- Why it matters: Kafka-only and Spring Kafka-first is the smallest scope that can still be delivered deeply and credibly.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The initial async expansion should go deep on Kafka rather than shallow across many brokers.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | none | validated |
| R002 | failure-visibility | validated | M001/S01 | none | validated |
| R003 | core-capability | validated | M001/S01 | none | validated |
| R004 | core-capability | validated | M001/S02 | none | validated |
| R005 | core-capability | validated | M001/S02 | none | validated |
| R006 | core-capability | validated | M001/S02 | none | validated |
| R007 | core-capability | validated | M001/S02 | M001/S03 | validated |
| R008 | primary-user-loop | validated | M001/S02 | M001/S03 | validated |
| R009 | quality-attribute | validated | M001/S03 | none | validated |
| R010 | continuity | validated | M001/S03 | none | validated |
| R011 | operability | validated | M001/S03 | none | validated |
| R012 | failure-visibility | validated | M001/S03 | none | validated |
| R013 | integration | validated | M001/S02 | M001/S04 | validated |
| R014 | integration | validated | M001/S04 | none | validated |
| R015 | integration | validated | M001/S04 | none | validated |
| R016 | launchability | validated | M001/S05 | none | validated |
| R017 | launchability | validated | M001/S05 | none | validated |
| R018 | operability | validated | M001/S05 | none | validated |
| R019 | quality-attribute | validated | M001/S05 | none | validated |
| R020 | quality-attribute | validated | M001/S04 | M001/S05 | validated |
| R021 | constraint | validated | M001/S04 | none | validated |
| R022 | primary-user-loop | validated | M002/S03 | M002/S05, M002/S08 | M002/S08 final proof (`S08-01`) |
| R023 | integration | validated | M002/S01 | M002/S05, M002/S08 | M002/S08 final proof (`S08-02`, `S08-03`) |
| R024 | operability | validated | M002/S01 | M002/S02, M002/S08 | M002/S08 final proof (`S08-03`) |
| R025 | primary-user-loop | validated | M002/S02 | M002/S03, M002/S08 | M002/S08 final proof (`S08-05`) |
| R026 | integration | validated | M002/S02 | M002/S01, M002/S08 | M002/S08 final proof (`S08-04`, `S08-05`) |
| R027 | continuity | validated | M002/S04 | M002/S03, M002/S05 | M002/S08 final proof (`S08-06`) |
| R028 | admin/support | validated | M002/S04 | M002/S06, M002/S08 | M002/S08 final proof (`S08-06`, `S08-08`) |
| R029 | operability | validated | M002/S05 | M002/S03, M002/S04, M002/S06 | M002/S08 final proof (`S08-01`, `S08-07`) |
| R030 | launchability | validated | M002/S06 | M002/S04, M002/S05, M002/S08 | M002/S08 final proof (`S08-08`) |
| R031 | operability | validated | M002/S07 | M002/S08 | M002/S08 final proof (`S08-09`, `S08-10`) |
| R032 | differentiator | deferred | none | none | unmapped |
| R033 | integration | deferred | none | none | unmapped |
| R034 | constraint | out-of-scope | none | none | n/a |
| R035 | anti-feature | out-of-scope | none | none | n/a |
| R036 | anti-feature | out-of-scope | none | none | n/a |
| R037 | core-capability | validated | M003/S01 | M003/S03 | S01 proof command (`asyncapi`, parity, discovery, diagnostics, OpenAPI`) |
| R038 | core-capability | validated | M003/S01 | M003/S02, M004/S01 | S01 parity and canonical-key proof |
| R039 | core-capability | validated | M003/S02 | M003/S03, M005/S02 | S02 async coverage semantics proof (`asyncCoverage`, diagnostics, parity, HTTP non-regression) |
| R040 | failure-visibility | validated | M003/S02 | M003/S03, M005/S02 | S02 unmatched/mismatched async diagnostic proof (`asyncCoverage.diagnostics`, parity stack) |
| R041 | integration | validated | M003/S03 | M005/S02 | S03 verifier stack (`asyncReport`, `asyncEvaluator`, `cli.async-report`, HTTP report/coverage non-regression) |
| R042 | integration | active | M004/S01 | M004/S02, M004/S03 | mapped |
| R043 | integration | active | M004/S01 | M004/S02, M004/S03 | mapped |
| R044 | operability | active | M004/S02 | M004/S03, M005/S01 | mapped |
| R045 | operability | active | M004/S03 | M005/S02 | mapped |
| R046 | quality-attribute | active | M004/S03 | M003/S01, M003/S02, M003/S03, M005/S02 | mapped |
| R047 | primary-user-loop | active | M005/S01 | M005/S02 | mapped |
| R048 | quality-attribute | active | M005/S02 | M004/S03 | mapped |
| R049 | core-capability | deferred | none | none | unmapped |
| R050 | primary-user-loop | deferred | none | none | unmapped |
| R051 | integration | deferred | none | none | unmapped |
| R052 | integration | deferred | none | none | unmapped |
| R053 | differentiator | deferred | none | none | unmapped |
| R054 | anti-feature | out-of-scope | none | none | n/a |
| R055 | anti-feature | out-of-scope | none | none | n/a |
| R056 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 7
- Mapped to slices: 7
- Validated: 36
- Unmapped active requirements: 0
