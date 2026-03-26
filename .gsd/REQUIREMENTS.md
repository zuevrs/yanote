# Requirements

This file is the explicit capability and coverage contract for the project.

## Validated

### R001 — A Java service team can record live HTTP evidence, analyze it against OpenAPI, and see deterministic operation/status/parameter coverage plus file/CLI outputs that show what was actually proven.
- Class: core-capability
- Status: validated
- Description: A Java service team can record live HTTP evidence, analyze it against OpenAPI, and see deterministic operation/status/parameter coverage plus file/CLI outputs that show what was actually proven.
- Why it matters: This is the core product promise.
- Source: execution
- Primary owning slice: S01
- Supporting slices: S02,S03,S04
- Validation: validated
- Notes: Mapped during M011 planning to preserve the deterministic recorder → JSONL → analyzer/report path while widening HTTP semantics additively.

### R002 — Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Class: failure-visibility
- Status: validated
- Description: Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Why it matters: Coverage tooling is only trustworthy if bad evidence or insufficient proof cannot silently pass.
- Source: execution
- Primary owning slice: S02
- Supporting slices: S01,S03,S04
- Validation: validated
- Notes: Mapped during M011 planning to keep cookie/serialization/media/format expansion fail-closed and to surface redaction/unsupported states explicitly.

### R003 — The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Class: launchability
- Status: validated
- Description: The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Why it matters: The tool has to fit actual team delivery paths, not just a local demo.
- Source: execution
- Primary owning slice: S04
- Supporting slices: S01,S02,S03
- Validation: validated
- Notes: Mapped during M011 planning so the widened HTTP truth remains visible through CLI/report/schema/docs/CI surfaces teams already use.

### R004 — Public support/release truth is defined by signed tags, GitHub Releases, Maven Central publication, and reproducible release verification rather than by workspace snapshot markers.
- Class: operability
- Status: validated
- Description: Public support/release truth is defined by signed tags, GitHub Releases, Maven Central publication, and reproducible release verification rather than by workspace snapshot markers.
- Why it matters: Teams need a stable release truth surface they can trust separately from repository HEAD.
- Source: execution
- Primary owning slice: docs phase 5 equivalent
- Supporting slices: docs phase 4 equivalent
- Validation: validated
- Notes: Release truth now includes published `v1.0.128` surfaces and the underlying release-proof workflow.

### R005 — The supported async path remains Kafka-only, Spring-Kafka-first, and reported through a separate `async-report` / `yanote-async-report.json` surface without pretending to offer a broker-agnostic or combined HTTP+async report contract.
- Class: constraint
- Status: validated
- Description: The supported async path remains Kafka-only, Spring-Kafka-first, and reported through a separate `async-report` / `yanote-async-report.json` surface without pretending to offer a broker-agnostic or combined HTTP+async report contract.
- Why it matters: The async path is valuable only if it stays explicit about what is and is not proven today.
- Source: execution
- Primary owning slice: M005/M009 equivalent
- Supporting slices: retained proof/docs boundary
- Validation: validated
- Notes: The current docs and retained proof surfaces explicitly preserve this narrow async boundary while proving deeper truth inside it.

### R020 — Produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`.
- Class: admin/support
- Status: validated
- Description: Produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`.
- Why it matters: It may reduce operator overhead later, but the current truthful split is explicit and supported.
- Source: execution
- Primary owning slice: S03
- Supporting slices: S04
- Validation: Validated by M015 closeout on current HEAD: S03 delivered the child-attributed combined report surface, and milestone verification reran `bash scripts/ci/verify-m015-s03-combined-report.sh`, regenerating the retained combined bundle with canonical HTTP and async child JSON/HTML artifacts, `combined_status=ok`, `combined_async_protocols=amqp`, explicit child report paths, and no blended denominator.
- Notes: The validated surface aggregates canonical HTTP and async child reports into explicit combined JSON/HTML/CLI summaries while preserving child attribution, drill-down artifact paths, AMQP protocol visibility, and fail-closed typed errors instead of inventing a blended denominator.

### R021 — Extend the async path beyond the current Kafka-only boundary to non-Kafka brokers or a broker-agnostic runtime promise.
- Class: differentiator
- Status: validated
- Description: Extend the async path beyond the current Kafka-only boundary to non-Kafka brokers or a broker-agnostic runtime promise.
- Why it matters: Useful later, but outside the current public support boundary.
- Source: execution
- Primary owning slice: S01
- Supporting slices: S02,S04
- Validation: Validated by M015 closeout on current HEAD: S01 established protocol-aware AMQP analyzer/report/CLI semantics, S02 reran `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` to regenerate the retained live RabbitMQ proof bundle with `protocols=amqp` and `operations=2/2`, and S04 reran the collector/renderer/workflow/docs verification stack proving the first RabbitMQ/AMQP path survives CI artifacts, GitHub summaries, workflow enforcement, public docs, and support intake.
- Notes: Validated by M015 after S01 established protocol-aware async contracts, S02 proved the live RabbitMQ/AMQP path, and S04 closed CI/docs/support surfaces around retained RabbitMQ and combined proof bundles without claiming broker-agnostic support.

### R022 — Extend the HTTP/OpenAPI path from key-presence truth into supported parameter serialization, cookie, media, and format semantics that can be proven through retained evidence.
- Class: contract-depth
- Status: validated
- Description: Extend the HTTP/OpenAPI path from key-presence truth into supported parameter serialization, cookie, media, and format semantics that can be proven through retained evidence.
- Why it matters: Teams eventually expect the main HTTP contract surface to include more than route hits, declared statuses, and JSON payloads.
- Source: planning
- Primary owning slice: S02
- Supporting slices: S01,S03,S04
- Validation: M011 closeout reran and passed the public proof stack on current HEAD: `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m011-s02-request-semantics.sh`, and `bash scripts/ci/verify-m011-s03-format-media.sh`.
- Notes: Validated by M011 after S01 safe request evidence, S02 supported request serialization/cookie truth, S03 payload format/media semantics, and S04 public-contract closeout aligned docs, retained CI artifacts, and verifier surfaces. Milestone closeout reran the public proof stack on current HEAD before completion.

### R023 — Support selected non-request/response OpenAPI constructs such as security schemes, examples, links, callbacks, or webhooks where they can be turned into truthful analyzer surfaces.
- Class: contract-depth
- Status: validated
- Description: Support selected non-request/response OpenAPI constructs such as security schemes, examples, links, callbacks, or webhooks where they can be turned into truthful analyzer surfaces.
- Why it matters: Rich real-world OpenAPI documents contain important contract meaning outside the request/response core.
- Source: planning
- Primary owning slice: S01
- Supporting slices: S02
- Validation: Validated by M012 closeout: `bash scripts/ci/verify-m012-s02-security-semantics.sh`, `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/ci/run-v1-e2e.sh` proved truthful OpenAPI security semantics on additive report/CLI/CI/doc surfaces while other broader OpenAPI objects remain explicitly deferred.
- Notes: Validated by M012 through truthful support for selected OpenAPI security schemes (`apiKey` in query/header/cookie locations) with additive `httpSecurityConformance` reporting and explicit public defers for examples, links, callbacks, webhooks, and unsupported security types/locations.

### R024 — Improve analyzer consumption through supported remote spec loading, explicit deprecated-operation handling, and human-friendly report artifacts that reflect the same canonical truth as machine-readable outputs.
- Class: launchability
- Status: validated
- Description: Improve analyzer consumption through supported remote spec loading, explicit deprecated-operation handling, and human-friendly report artifacts that reflect the same canonical truth as machine-readable outputs.
- Why it matters: Coverage tooling needs operator-friendly delivery surfaces once the semantic core is stable.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: Validated by M013 S04 closeout: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` proved the widened CI bundles, GitHub summaries, and public docs/support surfaces publish sanitized remote spec provenance, additive deprecated-operation truth, and separate HTTP/async JSON+HTML artifacts without introducing combined-report or dashboard claims.
- Notes: Validated by M013 after S01 delivered supported local/remote spec inputs with sanitized provenance, S02 added additive deprecated-operation truth without denominator drift, S03 emitted separate static HTTP/async HTML artifacts from canonical report data, and S04 aligned retained CI bundles, GitHub summaries, workflow contracts, and public docs/support wording to the same local-first / remote-opt-in / no-dashboard delivery boundary.

### R025 — Extend the proven Kafka-first async path to selected richer AsyncAPI constructs such as bindings, traits, correlation, or reply semantics where they can be verified truthfully from runtime evidence.
- Class: contract-depth
- Status: validated
- Description: Extend the proven Kafka-first async path to selected richer AsyncAPI constructs such as bindings, traits, correlation, or reply semantics where they can be verified truthfully from runtime evidence.
- Why it matters: Teams using richer AsyncAPI contracts will eventually expect more than channels, operations, messages, payloads, and headers.
- Source: planning
- Primary owning slice: S02
- Supporting slices: S01,S03,S04
- Validation: M014 milestone closeout reran and passed the authoritative live Kafka proof plus delivery/docs verifiers on current HEAD: `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, and `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh`, proving additive Kafka binding support, declared semantics, and header-backed runtime semantics through the authoritative Spring Kafka JSON/HTML bundle, retained companions, collected CI summary surfaces, and public Kafka-first docs.
- Notes: Validated by M014 after S01 trait-aware declarations, S02 header-backed runtime correlation/reply truth, S03 Kafka binding matrix, and S04 live Spring Kafka proof/docs/CI closeout. Scope remains Kafka-first, Spring-Kafka-first, separate async reporting; combined HTTP+async surfaces and broker expansion stay deferred.

### R031 — When live HTTP traffic returns a status not declared by the OpenAPI contract, Yanote must surface it explicitly instead of silently preserving a green declared-status numerator.
- Class: contract-depth
- Status: validated
- Description: When live HTTP traffic returns a status not declared by the OpenAPI contract, Yanote must surface it explicitly instead of silently preserving a green declared-status numerator.
- Why it matters: Teams need to know when implementation behavior has escaped the documented status surface.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: Validated by the M010 closeout stack: `bash scripts/docs/verify-m010-s04-final-boundary.sh` and the focused HTTP core gate/CLI suite proved undeclared HTTP statuses surface as explicit drift on the live Spring MVC path.
- Notes: Activated for the M010 core contract completeness milestone.

### R032 — Yanote validates supported OpenAPI path/query/header parameter values against retained evidence instead of only counting key presence.
- Class: contract-depth
- Status: validated
- Description: Yanote validates supported OpenAPI path/query/header parameter values against retained evidence instead of only counting key presence.
- Why it matters: Key presence alone is not enough to tell whether the main declared parameter contract was actually honored.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: Validated by live retained-evidence proof in `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` and the final boundary verifier, which proved supported path/query/header parameter values are checked from retained evidence on the Spring MVC example path.
- Notes: M010 intentionally limits this to the retained evidence shapes the recorder path can prove truthfully.

### R033 — Yanote treats supported OpenAPI response-header declarations as a first-class HTTP conformance surface.
- Class: contract-depth
- Status: validated
- Description: Yanote treats supported OpenAPI response-header declarations as a first-class HTTP conformance surface.
- Why it matters: Real API contracts often encode important semantics in response headers, not only in payloads.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: Validated by `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`, the focused HTTP core gate/CLI suite, and `npm -C yanote-js test -- src/report/report.contract.test.ts`, which proved supported response-header truth is a first-class HTTP conformance surface.
- Notes: M010 covers the supported core header surface, not every possible OpenAPI response-header nuance.

### R034 — On the proven Kafka-first async path, Yanote surfaces missing, invalid, unavailable, and unverifiable header diagnostics as a supported user-facing contract surface.
- Class: contract-depth
- Status: validated
- Description: On the proven Kafka-first async path, Yanote surfaces missing, invalid, unavailable, and unverifiable header diagnostics as a supported user-facing contract surface.
- Why it matters: Async header truth is already part of the implementation seam and should become explicit public contract truth on the proven Kafka path.
- Source: planning
- Primary owning slice: M010
- Supporting slices: none
- Validation: Validated by `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and `bash scripts/docs/verify-m010-s04-final-boundary.sh`, which proved live missing, invalid, unavailable, and unverifiable Kafka header diagnostics on the supported Spring Kafka path.
- Notes: This does not widen the product beyond Kafka-only or introduce broker-agnostic header promises.

## Out of Scope

### R030 — A web dashboard/report UI is not required for the current product value; CLI plus file reports are the supported surfaces.
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
| R001 | core-capability | validated | S01 | S02,S03,S04 | validated |
| R002 | failure-visibility | validated | S02 | S01,S03,S04 | validated |
| R003 | launchability | validated | S04 | S01,S02,S03 | validated |
| R004 | operability | validated | docs phase 5 equivalent | docs phase 4 equivalent | validated |
| R005 | constraint | validated | M005/M009 equivalent | retained proof/docs boundary | validated |
| R020 | admin/support | validated | S03 | S04 | Validated by M015 closeout on current HEAD: S03 delivered the child-attributed combined report surface, and milestone verification reran `bash scripts/ci/verify-m015-s03-combined-report.sh`, regenerating the retained combined bundle with canonical HTTP and async child JSON/HTML artifacts, `combined_status=ok`, `combined_async_protocols=amqp`, explicit child report paths, and no blended denominator. |
| R021 | differentiator | validated | S01 | S02,S04 | Validated by M015 closeout on current HEAD: S01 established protocol-aware AMQP analyzer/report/CLI semantics, S02 reran `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` to regenerate the retained live RabbitMQ proof bundle with `protocols=amqp` and `operations=2/2`, and S04 reran the collector/renderer/workflow/docs verification stack proving the first RabbitMQ/AMQP path survives CI artifacts, GitHub summaries, workflow enforcement, public docs, and support intake. |
| R022 | contract-depth | validated | S02 | S01,S03,S04 | M011 closeout reran and passed the public proof stack on current HEAD: `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m011-s02-request-semantics.sh`, and `bash scripts/ci/verify-m011-s03-format-media.sh`. |
| R023 | contract-depth | validated | S01 | S02 | Validated by M012 closeout: `bash scripts/ci/verify-m012-s02-security-semantics.sh`, `node --test scripts/ci/render-yanote-summary.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/ci/run-v1-e2e.sh` proved truthful OpenAPI security semantics on additive report/CLI/CI/doc surfaces while other broader OpenAPI objects remain explicitly deferred. |
| R024 | launchability | validated | none | none | Validated by M013 S04 closeout: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` proved the widened CI bundles, GitHub summaries, and public docs/support surfaces publish sanitized remote spec provenance, additive deprecated-operation truth, and separate HTTP/async JSON+HTML artifacts without introducing combined-report or dashboard claims. |
| R025 | contract-depth | validated | S02 | S01,S03,S04 | M014 milestone closeout reran and passed the authoritative live Kafka proof plus delivery/docs verifiers on current HEAD: `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, and `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh`, proving additive Kafka binding support, declared semantics, and header-backed runtime semantics through the authoritative Spring Kafka JSON/HTML bundle, retained companions, collected CI summary surfaces, and public Kafka-first docs. |
| R030 | anti-feature | out-of-scope | none | none | n/a |
| R031 | contract-depth | validated | M010 | none | Validated by the M010 closeout stack: `bash scripts/docs/verify-m010-s04-final-boundary.sh` and the focused HTTP core gate/CLI suite proved undeclared HTTP statuses surface as explicit drift on the live Spring MVC path. |
| R032 | contract-depth | validated | M010 | none | Validated by live retained-evidence proof in `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` and the final boundary verifier, which proved supported path/query/header parameter values are checked from retained evidence on the Spring MVC example path. |
| R033 | contract-depth | validated | M010 | none | Validated by `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`, the focused HTTP core gate/CLI suite, and `npm -C yanote-js test -- src/report/report.contract.test.ts`, which proved supported response-header truth is a first-class HTTP conformance surface. |
| R034 | contract-depth | validated | M010 | none | Validated by `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and `bash scripts/docs/verify-m010-s04-final-boundary.sh`, which proved live missing, invalid, unavailable, and unverifiable Kafka header diagnostics on the supported Spring Kafka path. |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 15 (R001, R002, R003, R004, R005, R020, R021, R022, R023, R024, R025, R031, R032, R033, R034)
- Unmapped active requirements: 0
