---
id: M014
title: "M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries"
status: complete
completed_at: 2026-03-26T14:30:52.247Z
key_decisions:
  - D041 — Widen AsyncAPI semantics additively on the existing Kafka report path while preserving canonical operation identity and legacy async coverage numerators.
  - D043 — Support only the retained-header runtime-expression subset for `correlationId` / `reply.address` and fail closed on unsupported or unavailable evidence.
  - D046 — Trust parser-resolved trait output for supported declaration fields and keep declaration metadata adjacent to canonical Kafka contracts.
  - D047 — Evaluate runtime correlation/reply semantics in a dedicated `runtimeSemantics` seam instead of mutating legacy coverage math.
  - D049 — Map async runtime drift to dedicated `ASYNC_SEMANTIC_*` failures ranked ahead of generic async drift.
  - D053 — Keep Kafka binding support additive so binding fields never redefine canonical Kafka identity or legacy async numerators.
  - D057 — Close the milestone on the authoritative live Spring Kafka proof bundle rather than fixture-only evidence.
  - D058 — Derive collected async bundle metadata and summary rendering from the authoritative live bundle manifest and fail closed on missing required artifacts.
  - D060 — Use stable non-sensitive `correlation_id` and `reply_to` proof values so runtime semantics are end-to-end provable without leaking secrets.
  - D061 — Anchor public docs/support wording to the redaction-safe `binding support`, `declared semantics`, and `runtime semantics` summary families.
key_files:
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/coverage/asyncSemanticConformance.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/gates/asyncEvaluator.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/cli.ts
  - scripts/ci/verify-m004-s03-live-kafka-proof.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/KafkaRecorderTwoServiceIntegrationTest.java
  - README.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - .github/BRANCH_PROTECTION.md
lessons_learned:
  - Additive async semantic widening works when declaration truth, runtime truth, and binding support all hang off the same canonical Kafka contract model instead of rewriting existing coverage numerators.
  - The authoritative live Spring Kafka proof bundle is the right single source for closeout: collectors, summaries, and docs stay truthful when they derive from that bundle rather than reconstructing metadata heuristically.
  - Milestone closeout should verify both positive-path and fail-closed companion async artifacts so widening a supported surface does not silently drop schema-failure or runtime-selection proof.
  - For this repo’s generated milestone artifacts, `M###-VALIDATION.md` may be the structured closeout checklist even when `M###-ROADMAP.md` mainly renders the slice overview.
---

# M014: M014: AsyncAPI Semantic Breadth Within Kafka-First Boundaries

**M014 widened Yanote’s Kafka-first AsyncAPI support with truthful declared, runtime, and binding semantics on the real async-report/CI/docs path while preserving canonical Kafka identity, legacy async coverage numerators, and the separate async-report boundary.**

## What Happened

M014 delivered the planned async semantic breadth in four additive slices and verified the assembled result on current HEAD before closeout. S01 normalized trait-aware AsyncAPI `correlationId` and `reply.address` declarations into the same canonical Kafka contracts as inline declarations, then exposed that truth additively through `yanote-async-report.json`, `yanote-async-report.html`, CLI stdout, and `YANOTE_ASYNC_SUMMARY` without changing canonical `kafka <action> <channel>` identities or legacy async coverage numerators. S02 extended that declaration truth into retained-header runtime proof for header-backed `correlationId` and `reply.address`, added typed `ASYNC_SEMANTIC_*` failures for missing, unavailable, mismatched, malformed, and unsupported cases, and downgraded async reports to `partial` when runtime semantics drifted even if legacy routing/schema coverage stayed green. S03 added an explicit Kafka binding support matrix that truthfully distinguishes supported, declared-only, deferred, and invalid binding semantics on the same canonical contracts and separate async-report surfaces without producing false-green coverage. S04 then carried the widened semantics onto the authoritative live Spring Kafka proof bundle, collected artifact family, GitHub/CI summary rendering, and public support/docs wording, keeping the product promise Kafka-only, Spring-Kafka-first, and separate from combined HTTP+async reporting.

Milestone closeout re-ran the key integrated verification stack from the M014 worktree: `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` proved the milestone changed real product code and docs outside `.gsd/`; `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` passed (30/30); and `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` passed, regenerating the authoritative live Kafka proof and reconfirming the public boundary wording. The live proof still reports `channels=1/1`, `operations=2/2`, `messages=2/2`, supported bindings `2/2`, declared correlation/reply operations `2/2`, and runtime satisfied semantics `4/4`, while the docs verifiers still pin the Kafka-only, Spring-Kafka-first, separate async-report boundary.

## Decision Re-evaluation

| Decision(s) | Re-evaluation after delivery | Revisit next milestone? |
|---|---|---|
| D040, D042 | Still valid. The delivered binding matrix stayed surgical: topic support is additive, groupId/clientId/key stay declaration-only, and broader binding fields remain deferred rather than silently green. | No |
| D041 | Still valid. All slices widened async semantics additively and preserved canonical `kafka <action> <channel>` identity plus legacy async numerators. | No |
| D043 | Still valid. The shipped runtime subset remained header-backed and fail-closed, exactly matching what retained Kafka evidence can prove truthfully today. | Revisit in M015 only if new runtime evidence shapes are intentionally added. |
| D044, D045, D046 | Still valid. Declared semantics were sourced from canonical Kafka contracts/parser-resolved trait output and stayed JSON-centered for machine consumers. | No |
| D047, D048, D049, D050, D051, D052 | Still valid. Dedicated runtime-semantics evaluation, typed failure ordering, additive report sections, and redaction-safe CLI output behaved as designed on both satisfied and failing proof paths. | No |
| D053, D054, D055, D056 | Still valid. Binding support remained a dedicated additive truth surface backed by canonical contracts instead of coverage/gate overloading. | No |
| D057, D058, D060, D061 | Still valid. The authoritative live Spring Kafka bundle remained the single closeout source for widened async truth, with collectors/summaries/docs derived from it and companion artifacts retained fail-closed. | No |
| D059 | Still valid. R025 is supported by the live proof, CI/delivery contract tests, and docs boundary verifiers rerun on current HEAD. | No |

## Success Criteria Results

- [x] **Trait-aware declared semantics are visible additively without changing Kafka identity or legacy async coverage math.** Evidence: S01 delivered parser-resolved inline-vs-trait parity for `correlationId` / `reply.address` and additive `declaredSemantics` across JSON/HTML/CLI surfaces; milestone validation recorded this criterion as passed; the milestone diff includes the declaration/report/CLI/test surfaces in `yanote-js/src/spec/asyncapi.ts`, `yanote-js/src/report/asyncReport.ts`, `yanote-js/src/report/asyncReportHtml.ts`, and `yanote-js/src/cli.ts`.
- [x] **Header-backed correlation and reply runtime truth is evaluated fail-closed and exposed on supported async-report surfaces.** Evidence: S02 added `runtimeSemantics`, typed `ASYNC_SEMANTIC_*` failures, partial-status behavior, and redaction-safe CLI/report surfacing; slice verification covered green, failing, unsupported, and malformed paths; current-head closeout re-ran the live proof stack successfully.
- [x] **Kafka binding semantics are reported truthfully with support/declaration/deferred distinctions and no synthetic green coverage.** Evidence: S03 added canonical `bindingSupport` rows, dedicated JSON/HTML/CLI binding sections, and additive `binding_*` machine tokens; the slice proof explicitly accepted `status: partial` under `--profile local` while asserting the binding matrix artifacts and tokens rather than synthetic all-green coverage.
- [x] **The authoritative Spring Kafka proof path, docs, and CI/reporting surfaces retain the widened async semantics while preserving Kafka-only / separate async-report boundaries.** Evidence: the milestone closeout reran `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` and the three async docs/boundary verifiers successfully; S04 summary confirms the happy-path, runtime-selected, and schema-failure async artifacts plus collected summaries and docs wording all stayed aligned.
- [x] **The milestone vision stayed within boundary.** Evidence: all slice summaries and the re-run doc verifiers confirm no broker-agnostic expansion, no combined HTTP+async report contract, no dashboard promise, unchanged canonical Kafka operation identity, and additive rather than denominator-changing semantics.

## Definition of Done Results

- [x] **All roadmap slices are complete.** Verified in `.gsd/milestones/M014/M014-ROADMAP.md` slice overview (`S01`–`S04` all marked `✅`) and by the existing slice completion summaries.
- [x] **All slice summaries exist.** Verified by listing `.gsd/milestones/M014/slices/` and confirming `S01-SUMMARY.md`, `S02-SUMMARY.md`, `S03-SUMMARY.md`, and `S04-SUMMARY.md` are present.
- [x] **Cross-slice integration works correctly.** Verified by `M014-VALIDATION.md` cross-slice audit plus current-head integrated proof: declaration scaffolding from S01 feeds S02 runtime truth and S03 binding truth, and S04 carries both onto the authoritative live Spring Kafka proof/docs/CI path without boundary drift.
- [x] **The milestone produced real product changes, not only planning artifacts.** Verified by `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'`, which reports substantial non-`.gsd/` changes across `yanote-js`, `scripts/ci`, `scripts/docs`, `examples/springmvc-service`, `README.md`, `docs/README.md`, `docs/guides/asyncapi-kafka.md`, and `docs/release-and-support.md`.
- [x] **Horizontal checklist review.** No `Horizontal Checklist` section is rendered in `M014-ROADMAP.md`, so there were no additional unchecked checklist items to audit.

## Requirement Outcomes

- **R025 — Active → Validated.** Supported by current-head milestone closeout evidence: `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` regenerated the authoritative live Kafka bundle with supported bindings `2/2`, declared correlation operations `2/2`, declared reply operations `2/2`, and runtime satisfied semantics `4/4`; `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` passed and confirmed the widened exporter/collector/summary/workflow contracts; and `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s04-boundaries.sh` passed and confirmed the same Kafka-first boundary on public docs/support surfaces.
- **No other requirement status transitions were introduced during M014 closeout.** R001, R002, and R003 were advanced by milestone slices on supported delivery surfaces, but they remained in their already-validated project status rather than changing state during this milestone.

## Deviations

No milestone-level scope deviation. Slice-level closeout corrections recorded in S02 and S03 were resolved before milestone completion and did not change the milestone’s promised boundary or success criteria.

## Follow-ups

M015 can revisit the explicitly deferred boundary questions only if the product intentionally chooses them: broader runtime-expression sources beyond retained headers, transport expansion beyond Kafka, and any future combined HTTP+async reporting surface. Until then, the validated boundary remains Kafka-only, Spring-Kafka-first, JSON-centered for machine consumers, and separate across `report` / `async-report`.
