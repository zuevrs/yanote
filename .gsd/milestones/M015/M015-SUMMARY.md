---
id: M015
title: "M015: Async Platform Expansion And Cross-Surface Reporting"
status: complete
completed_at: 2026-03-26T23:24:22.354Z
key_decisions:
  - D062 — Prove protocol-aware analyzer generalization first, live RabbitMQ proof second, combined reporting third, and CI/docs closure last.
  - D063 — Deliver one concrete RabbitMQ/AMQP async path first instead of a speculative broker-agnostic async abstraction.
  - D065 — Keep the combined HTTP+async surface as attributed aggregation of canonical child reports rather than a blended denominator.
  - D066 — Keep Kafka-only additive async sections explicit and protocol-scoped on AMQP inputs instead of fabricating RabbitMQ parity.
  - D072 — Build the reusable recorder on Spring AMQP abstractions while keeping the retained runtime proof explicitly RabbitMQ-named.
  - D075 — Serialize the combined artifact as a child-attributed wrapper over canonical child summaries and artifact refs, not full duplicated child DTOs.
  - D081 — Keep `build-and-test` as the stable required GitHub job while widening the proof stack in place.
  - D082 — Keep public docs/support child-attributed and surface-specific so operators attach the right Kafka, RabbitMQ, or combined bundle.
key_files:
  - yanote-js/src/spec/asyncapi.ts
  - yanote-js/src/model/operationKey.ts
  - yanote-js/src/model/asyncEvent.ts
  - yanote-js/src/events/readAsyncEventsJsonl.ts
  - yanote-js/src/coverage/asyncCoverage.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/combinedReport.ts
  - yanote-js/src/report/combinedReportHtml.ts
  - yanote-js/src/cli.ts
  - yanote-recorder-spring-amqp/src/main/java/dev/yanote/recorder/springamqp/YanoteAmqpRecorderAutoConfiguration.java
  - examples/springmvc-service/src/test/java/dev/yanote/examples/service/RabbitMqRecorderTwoServiceIntegrationTest.java
  - scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh
  - scripts/ci/verify-m015-s03-combined-report.sh
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/yanote-ci-workflow.contract.test.mjs
  - scripts/docs/verify-m015-s04-delivery-surfaces.sh
  - README.md
  - SUPPORT.md
lessons_learned:
  - Protocol-aware async widening stays safe when protocol becomes part of canonical identity and new evidence kinds land as sibling contracts instead of overloading Kafka-specific shapes.
  - A trustworthy combined surface should aggregate canonical child reports with explicit child paths and statuses rather than flattening HTTP and async truth into one denominator.
  - When proof families widen, regenerate the retained live bundle first and then rerun collector/summary verification so downstream CI artifacts reflect current truth instead of stale manifests.
  - Stable required workflow job names are part of the delivery contract; widen proof steps inside `build-and-test` rather than renaming the merge-blocking check.
---

# M015: M015: Async Platform Expansion And Cross-Surface Reporting

**M015 closed Yanote’s first non-Kafka async path and child-attributed combined reporting by proving protocol-aware AMQP/RabbitMQ analysis, live RabbitMQ recorder evidence, combined HTTP+async artifacts, and aligned CI/docs/support surfaces on current HEAD.**

## What Happened

M015 delivered the planned boundary expansion in four slices and milestone closeout reran the assembled proof stack on current HEAD before completion. S01 widened the async analyzer from Kafka-only assumptions to protocol-aware identities and sibling event kinds, normalizing supported single-protocol AsyncAPI specs as `<protocol> <action> <channel>`, accepting sibling `kind: "amqp"` evidence on Node and JVM JSONL boundaries, and publishing protocol-attributed AMQP truth through async coverage, report, HTML, and CLI surfaces while keeping Kafka-only additive sections explicit zero/none on AMQP inputs. S02 then proved the first live RabbitMQ runtime path end to end: a Spring AMQP recorder module captured `send` / `receive` evidence as `kind: "amqp"`, the shared example service exercised a two-service RabbitMQ flow, and `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` regenerated `.yanote-ci/live-rabbitmq-proof/` with producer/consumer JSONL evidence, deterministic merged events, stdout/stderr breadcrumbs, and canonical `yanote-async-report.json` / `.html` artifacts reporting `protocols: ["amqp"]` and `operations=2/2`.

S03 added the combined HTTP+async reporting surface as an attributed wrapper over canonical child reports rather than a blended denominator. `bash scripts/ci/verify-m015-s03-combined-report.sh` regenerated `.tmp/m015-s03-combined-proof/` with a green dedicated HTTP child, the retained RabbitMQ async child, combined JSON/HTML artifacts, and a `YANOTE_COMBINED_SUMMARY` surface that preserved `http child`, `async child`, `async_protocols=amqp`, and explicit drill-down paths back to both child report families. S04 then carried those widened surfaces through CI artifact collection, GitHub summary rendering, workflow contracts, and public docs/support wording. Current-head closeout reran `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` (12/12 pass), `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` (18/18 pass), `rm -rf .tmp/m015-s04-uat && bash scripts/ci/collect-yanote-artifacts.sh .tmp/m015-s04-uat/artifacts`, both `node scripts/ci/render-yanote-summary.mjs ...` summary renderers, and `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh`, confirming the widened RabbitMQ and combined proof families are collected, rendered, enforced, and documented without broker-agnostic drift, dashboard promises, or flattened evidence asks.

Milestone closeout also verified that M015 produced real product changes rather than only planning artifacts. `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` reported substantial non-`.gsd/` changes across Node analyzer/report code, Spring AMQP recorder code, CI/workflow scripts, fixtures, and public docs/support surfaces. Together, the rerun proof stack confirms that protocol-aware AMQP contracts compose cleanly into live RabbitMQ proof, that retained RabbitMQ artifacts compose cleanly into combined HTTP+async reporting, and that the widened proof families survive collection, summary rendering, workflow enforcement, and support guidance on current HEAD.

## Decision Re-evaluation

| Decision(s) | Re-evaluation after delivery | Revisit next milestone? |
|---|---|---|
| D062, D063 | Still valid. Sequencing the milestone as protocol-aware widening → live RabbitMQ proof → combined reporting → CI/docs closure kept the risky Kafka-only seams isolated first and prevented speculative broker-agnostic abstractions. The delivered scope proves one concrete RabbitMQ/AMQP path cleanly. | Revisit only if a future milestone intentionally expands beyond RabbitMQ/AMQP to additional brokers or a broader runtime abstraction. |
| D065, D075 | Still valid. The combined surface stayed child-attributed and drill-down friendly: current-head proof reruns preserve canonical HTTP and async child JSON/HTML paths, `combined_status=ok`, and `combined_async_protocols=amqp` without inventing a blended denominator. | No. |
| D066 | Still valid. AMQP reports and collected summaries keep Kafka-only additive sections explicit zero/none or optional-missing rather than fabricating RabbitMQ parity, exactly matching the shipped boundary. | Revisit only if AMQP gains its own proven additive semantics beyond today’s routing/message/payload scope. |
| D072 | Still valid. The reusable recorder seam lives on Spring AMQP abstractions while the retained runtime proof and docs stay explicitly RabbitMQ-named, which preserves reuse without overpromising broker-agnostic support. | No. |
| D081, D082 | Still valid. Workflow contract tests and docs/support verification prove `build-and-test` stayed the required job name and public support remained surface-specific, asking operators for the right Kafka, RabbitMQ, or combined bundle instead of a flattened evidence story. | No. |

## Success Criteria Results

- [x] **Protocol-aware async analyzer widened beyond Kafka to a first AMQP/RabbitMQ path without losing explicit protocol attribution.** Evidence: S01 delivered canonical `<protocol> <action> <channel>` identities, sibling `kind: "amqp"` evidence contracts, protocol-aware coverage/report/CLI surfaces, and explicit zero/none Kafka-only additive sections on AMQP inputs. Current-head closeout reran `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`, which exported `.yanote-ci/live-rabbitmq-proof/` with `report_status=ok`, `report_protocols=amqp`, and `report_operations=2/2`.
- [x] **A live RabbitMQ recorder/proof path exists and produces retained AMQP evidence/report artifacts suitable for downstream composition.** Evidence: `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` passed on current HEAD, proving the live two-service RabbitMQ flow, deterministic merge, and retained `.yanote-ci/live-rabbitmq-proof/` bundle with producer/consumer JSONL evidence, stdout/stderr breadcrumbs, and canonical JSON/HTML async reports.
- [x] **Combined HTTP+async reporting/gating composes canonical child reports, preserves child attribution, surfaces AMQP as async-specific truth, and fails closed instead of inventing a blended denominator.** Evidence: `bash scripts/ci/verify-m015-s03-combined-report.sh` passed and retained `.tmp/m015-s03-combined-proof/` with `http_status=ok`, `http_operations=1/1`, `combined_status=ok`, `combined_async_protocols=amqp`, `summary_token=YANOTE_COMBINED_SUMMARY`, and explicit `http_child` / `async_child` paths. The rendered `.tmp/m015-s04-uat/combined-summary.md` states `http child: ok`, `async child: ok`, `async protocols: amqp`, and lists separate HTTP and async child report paths instead of any synthetic aggregate percentage.
- [x] **CI, documentation, artifact collection, and support intake stayed aligned to the widened delivery boundary without broker-agnostic drift, dashboard requirements, or flattened evidence asks.** Evidence: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs` passed 12/12 tests, `node --test scripts/ci/yanote-ci-workflow.contract.test.mjs` passed 18/18 tests, direct collector and summary reruns produced deterministic RabbitMQ and combined summaries, and `bash scripts/docs/verify-m015-s04-delivery-surfaces.sh` passed.
- [x] **The milestone vision stayed within boundary.** Evidence: the rerun proof stack and rendered summaries keep AMQP explicitly async-specific, preserve Kafka-only additive sections as zero/none on RabbitMQ inputs, keep HTTP and async child truth separate in combined reporting, and preserve the required GitHub job name `build-and-test`.

## Definition of Done Results

- [x] **All roadmap slices are complete.** Verified via the existing milestone validation state and the slice registry; S01-S04 all have completion summaries and no slice remains open.
- [x] **All slice summaries exist.** Verified by listing `.gsd/milestones/M015/slices/` and confirming `S01-SUMMARY.md`, `S02-SUMMARY.md`, `S03-SUMMARY.md`, and `S04-SUMMARY.md` are present.
- [x] **Cross-slice integration works correctly.** Verified by current-head reruns of the live RabbitMQ proof, combined proof, collector/render summary flow, and docs/workflow contract stack: S01’s protocol-aware AMQP contract feeds S02’s live retained proof, S02’s retained async child feeds S03’s combined report, and S04’s collected summaries/workflow/docs consume both proof families without attribution drift.
- [x] **The milestone produced real product changes, not only planning artifacts.** Verified by `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'`, which reports substantial non-`.gsd/` changes across analyzer, recorder, CI, workflow, fixtures, and docs/support files.
- [x] **Horizontal checklist review.** No separate `Horizontal Checklist` section was rendered for M015 beyond the explicit validation checklist in `.gsd/milestones/M015/M015-VALIDATION.md`, so there were no additional unchecked checklist items to audit.

## Requirement Outcomes

- **R020 — Active → Validated.** Supported by current-head M015 evidence: S03 delivered the combined report contract and current-head closeout reran `bash scripts/ci/verify-m015-s03-combined-report.sh`, which regenerated the retained combined bundle with canonical HTTP and async child JSON/HTML artifacts, explicit child attribution, `combined_status=ok`, and `combined_async_protocols=amqp` without inventing a blended denominator.
- **R021 — Active → Validated.** Supported by current-head M015 evidence across S01-S04: S01 established protocol-aware AMQP analyzer/report/CLI semantics, S02 reran `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` to regenerate the retained live RabbitMQ proof bundle with `protocols=amqp` and `operations=2/2`, and S04 reran the collector/renderer/workflow/docs verification stack to prove the first RabbitMQ/AMQP path now survives CI artifacts, GitHub summaries, workflow enforcement, public docs, and support intake.
- **No other requirement status transitions were introduced during M015 closeout.** Earlier validated requirements remained in their existing project state.

## Deviations

None.

## Follow-ups

Future milestones can decide whether to add AMQP runtime-semantics parity beyond the current Kafka-only retained-header model, widen broker support beyond the first RabbitMQ/AMQP path, or extend combined-report policy further without collapsing child attribution.
