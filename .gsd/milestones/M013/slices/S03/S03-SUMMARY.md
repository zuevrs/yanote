---
id: S03
parent: M013
milestone: M013
provides:
  - Separate self-contained offline `yanote-report.html` and `yanote-async-report.html` artifacts derived from canonical JSON report truth.
  - A stable delivery contract where CLI and Gradle remain JSON-centered while preserving sibling HTML artifacts on supported paths.
  - A retained `.yanote-ci/static-html-reports-proof/` bundle and contract test that prove sanitized provenance, inline-only assets, separate HTTP/async surfaces, and no secret/dashboard drift.
requires:
  - slice: S01
    provides: Shared sanitized `specSource` provenance and supported local-file/local-directory/remote-url resolution contracts consumed by the HTML artifacts, CLI summaries, and retained proof bundle.
  - slice: S02
    provides: Canonical deprecated-operation metadata and preserved legacy HTTP coverage numerators that the HTTP HTML renderer and proof bundle surface explicitly without drift.
affects:
  - S04
key_files:
  - yanote-js/src/report/htmlDocument.ts
  - yanote-js/src/report/reportHtml.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/writeReport.ts
  - yanote-js/src/report/writeAsyncReport.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/cli.report.test.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
  - scripts/ci/verify-m013-s03-static-html-reports.sh
  - scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs
  - .yanote-ci/static-html-reports-proof/artifact-manifest.txt
key_decisions:
  - Keep human-facing HTML derived directly from normalized canonical report DTOs instead of introducing a second analyzer truth path.
  - Reuse one inline, self-contained HTML shell for both report families while constraining async output to async-native sections only.
  - Preserve the existing JSON-centered CLI and Gradle contracts; sibling HTML is additive and must not change `Report Path` or machine `report=` tokens.
  - Retain proof artifacts as separate `http-report/` and `async-report/` bundles with manifest claims so future slices can detect provenance, leakage, or combined-surface drift quickly.
patterns_established:
  - Add human-readable artifacts by rendering from canonical normalized DTOs and leaving machine-facing JSON contracts unchanged.
  - Use a shared inline HTML shell with surface-specific section mappers to keep HTTP and async artifacts parallel but separate.
  - Pin new delivery behavior with both entrypoint tests and a retained proof bundle that restates high-signal contract claims in `artifact-manifest.txt`.
  - Fail closed on report-UX drift by asserting sanitized provenance, no external assets, no secret markers, and no combined-dashboard wording in focused tests and retained proof scripts.
observability_surfaces:
  - `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` with rerun commands, canonical counts, sanitized provenance, and boundary claims.
  - `.yanote-ci/static-html-reports-proof/http-report/` and `async-report/` stdout/stderr/exit-code sidecars plus sibling JSON/HTML artifacts.
  - Focused writer and CLI tests in `yanote-js/src/report/*.test.ts` and `yanote-js/src/cli*.test.ts` that fail on HTML drift, provenance drift, or contract widening.
  - `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` proving Gradle preserves analyzer-created sibling HTML artifacts.
drill_down_paths:
  - .gsd/milestones/M013/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M013/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M013/slices/S03/tasks/T03-SUMMARY.md
  - .gsd/milestones/M013/slices/S03/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:57:29.851Z
blocker_discovered: false
---

# S03: Static HTML Reports From Canonical HTTP And Async Truth

**Yanote now emits separate self-contained offline HTML sibling reports for HTTP and async from the same canonical normalized truth as the JSON artifacts, while keeping CLI/Gradle delivery JSON-centered and retaining a proof bundle for provenance and no-leak guarantees.**

## What Happened

S03 closed the human-facing report gap by adding static HTML writers directly on top of the existing normalized report DTOs instead of creating a second analysis path. On the HTTP side, the slice introduced a shared inline HTML document shell plus a dedicated renderer that maps canonical report truth into semantic offline sections for overview, sanitized provenance, coverage summary, deprecated operations, per-operation coverage, HTTP payload/request/security conformance, diagnostics, and governance while escaping dynamic text and excluding raw retained values or request observedValues. On the async side, the same shell is reused but constrained to async-native sections only—overview, sanitized provenance, async coverage summary, channel coverage, operation coverage, message coverage, and diagnostics—so the async artifact stays visibly parallel to HTTP without inheriting HTTP-only wording or inventing a combined dashboard surface. The writers now emit `yanote-report.html` beside `yanote-report.json` and `yanote-async-report.html` beside `yanote-async-report.json` while preserving the existing JSON-path return contract.

The slice then pinned the supported delivery surfaces instead of widening them. CLI tests now assert sibling HTML artifacts for both `report` and `async-report`, but `Report Path` and machine `report=` tokens remain JSON-centered. Gradle contract coverage was extended so successful report execution preserves analyzer-created sibling HTML output rather than synthesizing placeholder HTML or changing the existing task contract. To make the slice inspectable without replaying every focused test, the slice also added a rerunnable retained proof bundle under `.yanote-ci/static-html-reports-proof/` that rebuilds the real CLI, runs both supported entrypoints against dedicated fixtures, and retains separate HTTP and async subtrees with stdout/stderr/exit-code sidecars, sibling JSON+HTML artifacts, and an artifact manifest that restates canonical counts, sanitized `specSource`, inline-only assets, separate surfaces, and the absence of secret markers, raw event dumps, or out-of-scope combined-report/dashboard language.

During final closeout, the exact slice verifier stack exposed two local alignment drifts outside the core feature itself: stale HTTP semantic-status test expectations still assumed `ok` for fully covered semantic-failure scenarios, and the Gradle remote-spec fixture needed an escaped Kotlin raw-string interpolation. Those verifier surfaces were corrected, then the exact slice-level verification stack from the plan was rerun successfully. Closeout also recorded the new proof/renderer decisions, advanced the milestone-level analyzer-consumption requirement notes, and refreshed project state so downstream S04 work can build on a completed static HTML delivery surface rather than re-deriving it.

## Verification

Executed the full slice verification stack from `S03-PLAN.md` and all commands passed: `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/writeAsyncReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts`; `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`; `bash scripts/ci/verify-m013-s03-static-html-reports.sh`; and `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`. Beyond exit codes, I inspected `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`, the retained HTTP/async stdout summaries, and the generated HTML artifacts to confirm sanitized `specSource`, separate HTTP-vs-async section sets, inline-only assets, JSON-centered `Report Path` behavior, and the absence of secret markers, raw event-dump fields, and combined-dashboard wording. Observability/diagnostic surfaces named in the plan are live: sibling `.html` artifacts are retained beside canonical JSON outputs, focused writer/CLI/Gradle tests pass, and the proof bundle localizes failures through manifest claims and per-mode sidecars.

## Requirements Advanced

- R024 — Completed the static HTML portion of the analyzer-consumption milestone by emitting separate offline HTTP and async HTML artifacts from canonical normalized report truth and retaining proof that they stay self-contained and provenance-safe.
- R003 — Proved the supported CLI and Gradle delivery surfaces preserve sibling HTML artifacts without widening the existing JSON-centered machine contract.
- R001 — Kept HTTP human-facing output derived from the same canonical normalized report truth as `yanote-report.json`, so the new artifact surface reflects what was actually proven instead of inventing a parallel renderer path.
- R002 — Extended fail-closed verification so missing sibling HTML, external assets, provenance drift, secret markers, or combined-surface wording all fail focused tests or the retained proof bundle.
- R022 — Rendered existing HTTP payload/request/security conformance truth into the HTML artifact without changing the established coverage and governance semantics.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Minor verifier-alignment fixes were needed during closeout: stale HTTP semantic-status assertions were updated to the current `partial` behavior for semantic drift, and the Gradle remote-spec fixture was corrected to escape Kotlin raw-string interpolation before rerunning the advertised slice stack. No slice-plan rework was required.

## Known Limitations

The slice intentionally stops at separate static offline files. It does not introduce a combined HTTP+async report model, hosted dashboard UI, or public CI/docs/support-boundary publication; those remain explicit product boundaries or S04 follow-up work.

## Follow-ups

S04 should publish the new JSON+HTML artifact set on CI/public delivery surfaces, update docs/support wording to describe the separate offline HTML boundary honestly, and keep the out-of-scope combined-dashboard language aligned with the retained proof bundle.

## Files Created/Modified

- `yanote-js/src/report/htmlDocument.ts` — Added the shared inline static HTML shell, escaping helpers, skip-link navigation, and offline-safe styling used by both report families.
- `yanote-js/src/report/reportHtml.ts` — Implemented HTTP-specific HTML rendering from the normalized canonical report DTO, including provenance, deprecated operations, conformance sections, diagnostics, and governance.
- `yanote-js/src/report/writeReport.ts` — Updated the HTTP writer to emit `yanote-report.html` beside `yanote-report.json` while preserving the JSON-path contract.
- `yanote-js/src/report/writeReport.determinism.test.ts` — Pinned deterministic HTTP HTML bytes, offline/self-contained constraints, escaped rendering, and secret-safe output.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — Extended HTTP provenance coverage so sibling JSON and HTML artifacts both prove sanitized `specSource` for local and remote inputs.
- `yanote-js/src/report/asyncReportHtml.ts` — Implemented async-specific HTML rendering with async-native coverage and diagnostic sections only.
- `yanote-js/src/report/writeAsyncReport.ts` — Updated the async writer to emit `yanote-async-report.html` beside `yanote-async-report.json` while preserving the JSON-path contract.
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts` — Pinned deterministic async HTML bytes, self-contained output, async-only wording, and escaped provenance rendering.
- `yanote-js/src/report/asyncReport.contract.test.ts` — Added async HTML surface assertions to keep the retained sections async-native and self-contained.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — Extended async provenance coverage so sibling JSON and HTML artifacts both prove sanitized `specSource`.
- `yanote-js/src/cli.summary.contract.test.ts` — Updated HTTP CLI contract expectations so `Report Path` and machine tokens stay JSON-centered while sibling HTML is present and semantic-drift status remains truthful.
- `yanote-js/src/cli.report.test.ts` — Pinned HTTP CLI output around sibling HTML artifacts and corrected semantic-status expectations exposed during final verifier reruns.
- `yanote-js/src/cli.async-report.contract.test.ts` — Updated async CLI contract coverage so sibling HTML exists while async summaries remain separate and free of HTTP-only wording.
- `yanote-js/src/cli.async-report.test.ts` — Pinned async CLI integration behavior around sibling HTML artifacts and async-only human-facing output.
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt` — Extended Gradle delivery proof so analyzer-created HTML siblings survive task execution and fixed the raw-string fixture interpolation used by the remote-spec contract test.
- `scripts/ci/verify-m013-s03-static-html-reports.sh` — Added a rerunnable retained proof script that rebuilds the real CLI, runs HTTP and async entrypoints, and retains separate JSON+HTML proof bundles.
- `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` — Pinned the static HTML proof script contract, retained bundle layout, manifest claims, and fail-closed forbidden-marker checks.
- `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` — Retained rerun commands, artifact paths, canonical counts, sanitized provenance, and no-leak/no-dashboard contract claims for the focused S03 proof bundle.
- `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html` — Retained the HTTP offline HTML artifact beside canonical JSON for proof inspection.
- `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html` — Retained the async offline HTML artifact beside canonical JSON for proof inspection.
- `.gsd/KNOWLEDGE.md` — Recorded the non-obvious rule that semantic payload drift can keep coverage dimensions green while top-level HTTP report status still becomes `partial`.
- `.gsd/REQUIREMENTS.md` — Updated R024 to record that S03 now proves the static HTML artifact portion of the analyzer-consumption requirement while S04 remains for CI/docs/support closeout.
- `.gsd/DECISIONS.md` — Appended S03 decisions covering async HTML separation and retained static HTML proof-bundle structure.
- `.gsd/PROJECT.md` — Refreshed project state to reflect completed S03 static HTML delivery and the remaining S04 milestone gap.
