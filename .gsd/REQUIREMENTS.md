# Requirements

This file is the explicit capability and coverage contract for the project.

## Validated

### R001 — A Java service team can record live HTTP evidence, analyze it against OpenAPI, and see deterministic operation/status/parameter coverage plus file/CLI outputs that show what was actually proven.
- Class: core-capability
- Status: validated
- Description: A Java service team can record live HTTP evidence, analyze it against OpenAPI, and see deterministic operation/status/parameter coverage plus file/CLI outputs that show what was actually proven.
- Why it matters: This is the core product promise.
- Source: execution
- Primary owning slice: docs phase 1-2 equivalent
- Supporting slices: docs phase 3-5 equivalent
- Validation: validated
- Notes: Supported by the current HTTP/OpenAPI recorder → JSONL → analyzer path and retained proof surfaces.

### R002 — Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Class: failure-visibility
- Status: validated
- Description: Coverage thresholds, regressions, exclusions, and invalid/incomplete evidence must produce explicit fail-closed behavior instead of false green output.
- Why it matters: Coverage tooling is only trustworthy if bad evidence or insufficient proof cannot silently pass.
- Source: execution
- Primary owning slice: docs phase 3 equivalent
- Supporting slices: docs phase 4-5 equivalent
- Validation: validated
- Notes: Supported by the current threshold, regression, exclusion, and semantic-failure contract tests and workflow gates.

### R003 — The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Class: launchability
- Status: validated
- Description: The product can be used through the standalone CLI, Gradle plugin tasks, and GitHub Action/CI workflow surfaces.
- Why it matters: The tool has to fit actual team delivery paths, not just a local demo.
- Source: execution
- Primary owning slice: docs phase 4 equivalent
- Supporting slices: docs phase 2-5 equivalent
- Validation: validated
- Notes: Supported by the current CLI, Gradle, CI, and release workflow surfaces.

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

### R035 — The public GitHub repository surface must read as a clean product repository, not as a mix of internal planning, proof residue, runtime clutter, and maintainer-only process.
- Class: launchability
- Status: validated
- Description: The public GitHub repository surface must read as a clean product repository, not as a mix of internal planning, proof residue, runtime clutter, and maintainer-only process.
- Why it matters: First-time users judge whether Yanote is trustworthy and usable from the repository face before they ever run the tool.
- Source: user
- Primary owning slice: M016/S03
- Supporting slices: M016/S04, M016/S05
- Validation: Validated by M016/S03-S06: public-boundary cleanup, short-doc funnel, and the composed `bash scripts/docs/verify-m016-s05-public-surface.sh` proof now pass on both a cold run and an immediate rerun.
- Notes: The user explicitly wants a “чистый top-tier уровня репозиторий” without public “внутренняя кухня” or visible “мусор”.

### R036 — Public documentation must be short, current, and centered on how to use Yanote rather than on internal process or historical proof narratives.
- Class: launchability
- Status: validated
- Description: Public documentation must be short, current, and centered on how to use Yanote rather than on internal process or historical proof narratives.
- Why it matters: A tool with a noisy or stale documentation surface feels unfinished even if the core code is strong.
- Source: user
- Primary owning slice: M016/S04
- Supporting slices: M016/S05
- Validation: Validated by M016/S04-S06: `README.md`, `docs/README.md`, `docs/guides/getting-started.md`, and related short-doc guards pass, and the final public-surface proof reruns cleanly.
- Notes: The desired style is the minimal clear path common in top-tier OSS repositories.

### R037 — A new user must be able to find one short, explicit path for adding the recorder dependency, configuring runtime/build parameters, and understanding where `events.jsonl` or related evidence artifacts land.
- Class: primary-user-loop
- Status: validated
- Description: A new user must be able to find one short, explicit path for adding the recorder dependency, configuring runtime/build parameters, and understanding where `events.jsonl` or related evidence artifacts land.
- Why it matters: If connecting the recorder feels ambiguous, the product’s main user loop breaks before analysis begins.
- Source: user
- Primary owning slice: M016/S04
- Supporting slices: M016/S05
- Validation: Validated by M016/S04-S06: the recorder guide plus `bash scripts/docs/verify-s01-recorder-path.sh` prove one short explicit recorder path to writable `events.jsonl`, and the recorder stage is now stable inside repeated S05 public-surface proof runs.
- Notes: This is a public-docs and product-packaging requirement, not a new recorder-semantics requirement.

### R038 — A new user must be able to find one short, explicit path for connecting RestAssured/Cucumber tagging and understanding what those tags add to the resulting coverage/report surfaces.
- Class: primary-user-loop
- Status: validated
- Description: A new user must be able to find one short, explicit path for connecting RestAssured/Cucumber tagging and understanding what those tags add to the resulting coverage/report surfaces.
- Why it matters: This is part of the intended integration story for teams that want test-to-evidence traceability without rereading deep maintainer docs.
- Source: user
- Primary owning slice: M016/S04
- Supporting slices: M016/S05
- Validation: Validated by M016/S04-S05: tagging guide/example wiring and `bash scripts/docs/verify-s02-doc-links.sh` keep the RestAssured/Cucumber tagging path explicit and aligned with analyzer/report surfaces.
- Notes: The public contract is explanation and usability, not deeper semantic expansion.

### R039 — Yanote must ship the analyzer as an official standalone CLI surface with a stable versioned distribution and a public install/run story that does not require source-building `yanote-js`.
- Class: core-capability
- Status: validated
- Description: Yanote must ship the analyzer as an official standalone CLI surface with a stable versioned distribution and a public install/run story that does not require source-building `yanote-js`.
- Why it matters: The analyzer is a first-class product surface, not a maintainer-only build detail.
- Source: user
- Primary owning slice: M016/S01
- Supporting slices: M016/S02, M016/S04
- Validation: Validated by M016/S01-S05: the official standalone analyzer bundle contract (`yanote-analyzer.zip` -> `bin/yanote`) is proven by archive/runtime verifiers, release-asset proof, and final public-surface integration.
- Notes: The canonical README path should point to the standalone CLI surface; Gradle remains a secondary path.

### R040 — Creating a release tag must trigger a fail-closed release pipeline that validates the intended shipping surfaces and publishes the supported release artifacts without manual cleanup steps.
- Class: operability
- Status: validated
- Description: Creating a release tag must trigger a fail-closed release pipeline that validates the intended shipping surfaces and publishes the supported release artifacts without manual cleanup steps.
- Why it matters: The release tag should be the single trustworthy publication trigger, not the start of a manual release ritual.
- Source: user
- Primary owning slice: M016/S02
- Supporting slices: M016/S05
- Validation: Validated by M016/S02-S06: tag-driven release proof, workflow wiring, and retained `.yanote-ci/m016-s02-release-pipeline-proof/` diagnostics pass and remain part of the final public-surface gate.
- Notes: This requirement covers end-to-end automation truth, not just the existence of a workflow file.

### R041 — Internal GSD, process, proof, runtime, and similar maintainer-only surfaces must stop being part of the public default branch face.
- Class: constraint
- Status: validated
- Description: Internal GSD, process, proof, runtime, and similar maintainer-only surfaces must stop being part of the public default branch face.
- Why it matters: The user explicitly wants those surfaces to stay local/private rather than competing with the product repo.
- Source: user
- Primary owning slice: M016/S03
- Supporting slices: M016/S05
- Validation: Validated by M016/S03-S05: clone-local `.gsd/`, `.tmp*`, and `.vite/` surfaces are removed from the public default-branch face and guarded by public-boundary verifiers.
- Notes: The requirement is about the public face of `main`, while preserving local GSD usefulness.

### R042 — The analyzer’s public install and run story must not require users to understand or manually operate the internal Node build seam.
- Class: launchability
- Status: validated
- Description: The analyzer’s public install and run story must not require users to understand or manually operate the internal Node build seam.
- Why it matters: Yanote targets teams that need a clear tool path, not an implementation archaeology exercise.
- Source: inferred
- Primary owning slice: M016/S01
- Supporting slices: M016/S04
- Validation: Validated by M016/S01-S05: public install/run docs, Gradle/CI defaults, and the final integrated proof all point to the standalone analyzer launcher rather than the raw Node seam.
- Notes: Node may remain an internal build dependency, but it should not be the public quick-start contract.

### R043 — After cleanup, the public README/docs/examples/release surfaces must still describe the same real shipping contract, with no broken promises or hidden maintainer assumptions.
- Class: failure-visibility
- Status: validated
- Description: After cleanup, the public README/docs/examples/release surfaces must still describe the same real shipping contract, with no broken promises or hidden maintainer assumptions.
- Why it matters: Cleanup that makes the repo prettier but less truthful would damage trust.
- Source: inferred
- Primary owning slice: M016/S05
- Supporting slices: M016/S02, M016/S03, M016/S04
- Validation: Validated by M016/S02-S06: release/docs/examples/readme surfaces stay aligned with the real shipping contract, and the canonical final proof now passes from both a cold run and an immediate rerun.
- Notes: This is the anti-regression guard for the whole milestone.

## Deferred

### R020 — Produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`.
- Class: admin/support
- Status: deferred
- Description: Produce one combined HTTP + async report/gate surface without losing the current truthful split between `report` and `async-report`.
- Why it matters: It may reduce operator overhead later, but the current truthful split is explicit and supported.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred in `docs/requirements.md` as ASYNC-02.

### R021 — Extend the async path beyond the current Kafka-only boundary to non-Kafka brokers or a broker-agnostic runtime promise.
- Class: differentiator
- Status: deferred
- Description: Extend the async path beyond the current Kafka-only boundary to non-Kafka brokers or a broker-agnostic runtime promise.
- Why it matters: Useful later, but outside the current public support boundary.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred in `docs/requirements.md` as ASYNC-03.

### R022 — Extend the HTTP/OpenAPI path from key-presence truth into supported parameter serialization, cookie, media, and format semantics that can be proven through retained evidence.
- Class: contract-depth
- Status: deferred
- Description: Extend the HTTP/OpenAPI path from key-presence truth into supported parameter serialization, cookie, media, and format semantics that can be proven through retained evidence.
- Why it matters: Teams eventually expect the main HTTP contract surface to include more than route hits, declared statuses, and JSON payloads.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M011 follow-on after core contract completeness lands in M010.

### R023 — Support selected non-request/response OpenAPI constructs such as security schemes, examples, links, callbacks, or webhooks where they can be turned into truthful analyzer surfaces.
- Class: contract-depth
- Status: deferred
- Description: Support selected non-request/response OpenAPI constructs such as security schemes, examples, links, callbacks, or webhooks where they can be turned into truthful analyzer surfaces.
- Why it matters: Rich real-world OpenAPI documents contain important contract meaning outside the request/response core.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M012 follow-on and intentionally kept separate from the core HTTP surfaces in M010/M011.

### R024 — Improve analyzer consumption through supported remote spec loading, explicit deprecated-operation handling, and human-friendly report artifacts that reflect the same canonical truth as machine-readable outputs.
- Class: launchability
- Status: deferred
- Description: Improve analyzer consumption through supported remote spec loading, explicit deprecated-operation handling, and human-friendly report artifacts that reflect the same canonical truth as machine-readable outputs.
- Why it matters: Coverage tooling needs operator-friendly delivery surfaces once the semantic core is stable.
- Source: planning
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Planned as the queued M013 follow-on after the HTTP/OpenAPI contract surfaces stabilize.

### R025 — Extend the proven Kafka-first async path to selected richer AsyncAPI constructs such as bindings, traits, correlation, or reply semantics where they can be verified truthfully from runtime evidence.
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
| R031 | contract-depth | validated | M010 | none | Validated by the M010 closeout stack: `bash scripts/docs/verify-m010-s04-final-boundary.sh` and the focused HTTP core gate/CLI suite proved undeclared HTTP statuses surface as explicit drift on the live Spring MVC path. |
| R032 | contract-depth | validated | M010 | none | Validated by live retained-evidence proof in `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh` and the final boundary verifier, which proved supported path/query/header parameter values are checked from retained evidence on the Spring MVC example path. |
| R033 | contract-depth | validated | M010 | none | Validated by `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`, the focused HTTP core gate/CLI suite, and `npm -C yanote-js test -- src/report/report.contract.test.ts`, which proved supported response-header truth is a first-class HTTP conformance surface. |
| R034 | contract-depth | validated | M010 | none | Validated by `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and `bash scripts/docs/verify-m010-s04-final-boundary.sh`, which proved live missing, invalid, unavailable, and unverifiable Kafka header diagnostics on the supported Spring Kafka path. |
| R035 | launchability | validated | M016/S03 | M016/S04, M016/S05 | Validated by M016/S03-S06: public-boundary cleanup, short-doc funnel, and the composed `bash scripts/docs/verify-m016-s05-public-surface.sh` proof now pass on both a cold run and an immediate rerun. |
| R036 | launchability | validated | M016/S04 | M016/S05 | Validated by M016/S04-S06: `README.md`, `docs/README.md`, `docs/guides/getting-started.md`, and related short-doc guards pass, and the final public-surface proof reruns cleanly. |
| R037 | primary-user-loop | validated | M016/S04 | M016/S05 | Validated by M016/S04-S06: the recorder guide plus `bash scripts/docs/verify-s01-recorder-path.sh` prove one short explicit recorder path to writable `events.jsonl`, and the recorder stage is now stable inside repeated S05 public-surface proof runs. |
| R038 | primary-user-loop | validated | M016/S04 | M016/S05 | Validated by M016/S04-S05: tagging guide/example wiring and `bash scripts/docs/verify-s02-doc-links.sh` keep the RestAssured/Cucumber tagging path explicit and aligned with analyzer/report surfaces. |
| R039 | core-capability | validated | M016/S01 | M016/S02, M016/S04 | Validated by M016/S01-S05: the official standalone analyzer bundle contract (`yanote-analyzer.zip` -> `bin/yanote`) is proven by archive/runtime verifiers, release-asset proof, and final public-surface integration. |
| R040 | operability | validated | M016/S02 | M016/S05 | Validated by M016/S02-S06: tag-driven release proof, workflow wiring, and retained `.yanote-ci/m016-s02-release-pipeline-proof/` diagnostics pass and remain part of the final public-surface gate. |
| R041 | constraint | validated | M016/S03 | M016/S05 | Validated by M016/S03-S05: clone-local `.gsd/`, `.tmp*`, and `.vite/` surfaces are removed from the public default-branch face and guarded by public-boundary verifiers. |
| R042 | launchability | validated | M016/S01 | M016/S04 | Validated by M016/S01-S05: public install/run docs, Gradle/CI defaults, and the final integrated proof all point to the standalone analyzer launcher rather than the raw Node seam. |
| R043 | failure-visibility | validated | M016/S05 | M016/S02, M016/S03, M016/S04 | Validated by M016/S02-S06: release/docs/examples/readme surfaces stay aligned with the real shipping contract, and the canonical final proof now passes from both a cold run and an immediate rerun. |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 18 (R001, R002, R003, R004, R005, R031, R032, R033, R034, R035, R036, R037, R038, R039, R040, R041, R042, R043)
- Unmapped active requirements: 0
