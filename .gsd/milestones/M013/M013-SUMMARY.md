---
id: M013
title: "Analyzer Delivery, Remote Spec, And Report UX"
status: complete
completed_at: 2026-03-26T04:20:10.682Z
key_decisions:
  - Resolve spec inputs once into a shared sanitized provenance contract (`specSource`) so local and supported remote analyzer entrypoints reuse one truth path.
  - Keep deprecated-operation reporting additive (`summary.deprecatedOperations` and per-operation flags) instead of rewriting legacy coverage numerators or gate math.
  - Generate separate offline HTML siblings for HTTP and async from canonical report truth while explicitly preserving the split report boundary and no-dashboard/no-combined-report scope.
  - Drive CI manifests, GitHub summaries, and public support wording from canonical report truth and collected artifact directories so widened delivery surfaces stay aligned and secret-safe.
key_files:
  - yanote-js/src/spec/specSource.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/reportHtml.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/writeReport.ts
  - yanote-js/src/report/writeAsyncReport.ts
  - yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/SpecInputSupport.kt
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/render-yanote-summary.mjs
  - README.md
  - docs/release-and-support.md
lessons_learned:
  - When shared report writers gain additive artifacts, older focused proof verifiers must be widened explicitly or milestone integration will report false regressions.
  - Canonical report JSON should remain the single metadata source for retained manifests, CI summaries, and docs wording so widened surfaces stay aligned and secret-safe.
  - Keep HTTP and async operator surfaces parallel but separate at every artifact, verifier, and doc boundary to preserve the product’s truthful support posture.
---

# M013: Analyzer Delivery, Remote Spec, And Report UX

**M013 closed with integrated proof that Yanote now supports sanitized remote spec loading, additive deprecated-operation truth, separate HTTP/async HTML report artifacts, and aligned CI/docs delivery surfaces without widening into combined-report or dashboard promises.**

## What Happened

Milestone M013 delivered the intended analyzer-consumption upgrade on top of the existing trustworthy JSON/CLI contract. S01 introduced a shared spec-source resolver so local files, local directories, and a narrow supported remote single-document `http(s)` URL path all flow through the same CLI and Gradle entrypoints while publishing sanitized `specSource` provenance instead of replayable remote values. S02 extended the canonical HTTP path with additive deprecated-operation truth (`summary.deprecatedOperations` plus `coverage.perOperation[].deprecated`) while intentionally preserving the legacy covered-operations denominator and existing coverage dimensions. S03 turned the canonical JSON truth into separate self-contained offline HTML siblings for HTTP and async (`yanote-report.html` and `yanote-async-report.html`) without introducing any combined dashboard/report surface. S04 then aligned retained CI bundles, GitHub step summaries, workflow contracts, and public docs/support wording to those same boundaries so the widened operator UX is visible everywhere teams actually consume Yanote.

During milestone closeout I first verified that this was real implementation work rather than planning-only output: `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` reported 69 non-`.gsd/` files changed, spanning `yanote-js`, the Gradle plugin, CI collectors/verifiers, and public docs. I then reran the focused proof stack on current HEAD: `bash ./scripts/ci/verify-m013-s01-remote-spec.sh`, `bash ./scripts/ci/verify-m013-s02-deprecated-operations.sh`, `bash ./scripts/ci/verify-m013-s03-static-html-reports.sh`, `node --test scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs`, `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`, `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`, `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh`. All passed after one integration repair: the S02 retained-proof verifier originally treated `yanote-report.json` as the only success artifact, so I widened it to require the now-supported `yanote-report.html` sibling as well. With that update, the assembled milestone verifies cleanly end to end on current HEAD.

## Success Criteria Results

- [x] **Supported remote spec inputs work through the real CLI and Gradle entrypoints alongside the deterministic local baseline.** Evidence: `bash ./scripts/ci/verify-m013-s01-remote-spec.sh` passed and retained `.yanote-ci/remote-spec-proof/`; `node --test scripts/ci/verify-m013-s01-remote-spec.contract.test.mjs` passed and pins the CLI local-file/local-directory/remote-url plus Gradle remote check/report contract.
- [x] **Persisted command, provenance, and report surfaces disclose sanitized spec-source provenance without leaking remote credentials.** Evidence: the same S01 proof stack passed; its retained manifest/source-path notes are secret-scanned by the verifier, and the contract test pins sanitized `specSource` plus Gradle sidecar placeholders instead of replayable remote URLs.
- [x] **Deprecated OpenAPI operations are surfaced explicitly without silently changing legacy coverage numerators.** Evidence: `bash ./scripts/ci/verify-m013-s02-deprecated-operations.sh` passed and retained `.yanote-ci/deprecated-operations-proof/`; `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` passed and pins `summary.deprecatedOperations`, `coverage.perOperation[].deprecated`, CLI `deprecated_*` summary tokens, and preserved `covered=2/3` legacy operation coverage.
- [x] **Yanote emits separate static offline HTML artifacts for HTTP and async reports from the same canonical truth as JSON.** Evidence: `bash ./scripts/ci/verify-m013-s03-static-html-reports.sh` passed and retained `.yanote-ci/static-html-reports-proof/`; `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` passed and pins separate `yanote-report.html` / `yanote-async-report.html` siblings with sanitized provenance, inline-only assets, and no combined-dashboard drift.
- [x] **CI artifacts and public docs describe the local-vs-remote boundary, separate HTTP/async report surfaces, and explicit out-of-scope dashboard/combined-report boundaries honestly.** Evidence: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` passed; `bash scripts/docs/verify-s03-landing.sh` and `bash scripts/docs/verify-s04-boundaries.sh` both passed, confirming widened CI bundles, GitHub summaries, and public docs/support wording.

No success criteria were left unmet.

## Definition of Done Results

- [x] **All roadmap slices complete.** The inlined roadmap shows S01, S02, S03, and S04 checked `[x]`.
- [x] **All slice summaries exist.** `find .gsd/milestones/M013/slices -maxdepth 2 -name 'S*-SUMMARY.md' | sort` returned `S01-SUMMARY.md`, `S02-SUMMARY.md`, `S03-SUMMARY.md`, and `S04-SUMMARY.md`.
- [x] **Implementation exists outside `.gsd/`.** `git diff --stat HEAD $(git merge-base HEAD main) -- ':!.gsd/'` reported 69 non-`.gsd/` files changed across product code, Gradle tasks, CI scripts, verifiers, and docs.
- [x] **Cross-slice integration works on current HEAD.** The remote-spec, deprecated-operation, static-HTML, CI/workflow, and docs/support proof stack all passed together after updating the S02 retained-proof verifier to accept the S03 HTML sibling as part of the now-supported delivery surface.
- [x] **Verification evidence is durable.** Current HEAD retains focused proof bundles at `.yanote-ci/remote-spec-proof/`, `.yanote-ci/deprecated-operations-proof/`, and `.yanote-ci/static-html-reports-proof/`, plus CI/workflow/doc contract tests that pin the widened delivery boundary.

## Requirement Outcomes

- **R024** remained **validated** and now has milestone-closeout proof on current HEAD. The full M013 stack (`verify-m013-s01`, `verify-m013-s02`, `verify-m013-s03`, CI/workflow contract tests, and docs verifiers) confirms the combined remote-spec, deprecated-operation, separate HTML-artifact, and delivery-surface contract without combined-report/dashboard drift.
- **R001** remained **validated**; M013 added new supporting proof that the deterministic analyzer/report contract still holds when the spec comes from the supported sanitized remote URL subset instead of only local paths. Evidence: the passing S01 localhost remote-spec proof and contract test.
- **R003** remained **validated**; M013 added new supporting proof that the widened analyzer-delivery contract works through the standalone CLI, Gradle plugin tasks, and GitHub/CI artifact-summary surfaces. Evidence: passing S01 CLI+Gradle proof plus the passing S04 CI/workflow/doc contract stack.
- **Requirement status transitions during this milestone closeout:** no additional status flips were required beyond the already-recorded validated state. The closeout work strengthened proof and aligned retained validation text rather than introducing new Active/Deferred/Blocked transitions.

## Deviations

During closeout, the historical S02 retained-proof verifier still pinned a JSON-only success bundle and therefore failed once S03 legitimately added `yanote-report.html` as a supported sibling artifact. I updated the verifier and its contract test to require the HTML sibling explicitly; no product code or milestone scope changed beyond that integration-alignment fix.

## Follow-ups

Next milestone planning should start at M014, which deepens the supported Kafka-first async path while preserving the current split-report and transport boundaries. Separately, if the project ever wants cold-start `docker compose up` without host prebuilds to be a supported promise, that should be scoped as a new explicit requirement rather than assumed from the current proof path.
