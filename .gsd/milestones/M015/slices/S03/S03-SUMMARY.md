---
id: S03
parent: M015
milestone: M015
provides:
  - A canonical combined report contract and deterministic writer that aggregate `yanote-report.json` and `yanote-async-report.json` into `yanote-combined-report.json` / `.html` without inventing a blended denominator.
  - A shipped `yanote combined-report` CLI surface that composes canonical child reports, prints attributed human summary sections, and fails closed with typed child-specific errors.
  - A retained dist proof path (`scripts/ci/verify-m015-s03-combined-report.sh`) that regenerates a green HTTP child, reuses the retained RabbitMQ async child, and captures enough bundle context for downstream CI/docs/support work.
requires:
  - slice: S01
    provides: Protocol-aware async identities, protocol-attributed async child summaries, and explicit Kafka-only zero/none sections that the combined surface preserves without collapsing into HTTP wording.
  - slice: S02
    provides: The retained canonical RabbitMQ async child report bundle (`.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` / `.html`) that the combined CLI and dist proof consume as the async child input.
affects:
  - S04
key_files:
  - yanote-js/src/report/combinedReport.ts
  - yanote-js/src/report/combinedSchema.ts
  - yanote-js/src/report/combinedNormalize.ts
  - yanote-js/src/report/combinedReportHtml.ts
  - yanote-js/src/report/writeCombinedReport.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.combined-report.test.ts
  - yanote-js/src/cli.combined-report.contract.test.ts
  - yanote-js/src/report/combinedReport.test.ts
  - yanote-js/src/report/combinedReport.contract.test.ts
  - yanote-js/src/report/writeCombinedReport.determinism.test.ts
  - yanote-js/src/testFixturePaths.ts
  - scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml
  - scripts/ci/fixtures/m015-s03-combined-http.events.jsonl
  - scripts/ci/verify-m015-s03-combined-report.sh
  - scripts/ci/verify-m015-s03-combined-report.contract.test.mjs
key_decisions:
  - Keep the combined surface as an attributed wrapper over canonical HTTP and async child reports instead of synthesizing a blended denominator or duplicating full child DTO bodies.
  - Validate each child report’s schema and phase independently in `combined-report`, then surface failures through child-attributed `YANOTE_COMBINED_ERROR*` lines and `report=none` instead of attempting best-effort coercion.
  - Prove the combined dist entrypoint by generating the HTTP child from a dedicated green fixture and combining it with the retained S02 RabbitMQ async report while retaining stdout/stderr, exit codes, manifest, and source-path notes for drift localization.
patterns_established:
  - Build cross-surface aggregation from canonical child JSON reports and drill-down artifact paths rather than re-running raw spec/event analysis or flattening child truth.
  - Keep combined JSON, HTML, and CLI sections child-scoped (`HTTP Child`, `Async Child`) so protocol-specific async facts like `protocols=amqp` remain explicit and cannot be collapsed into HTTP wording.
  - On success, emit exactly one final machine summary line (`YANOTE_COMBINED_SUMMARY`) that points back to both child report paths and the combined report path; on failure, keep the same summary line but pair it with child-attributed typed stderr markers.
  - For focused retained proofs, generate only the HTTP child locally and reuse the retained async child bundle from the upstream slice so future drift can be localized to HTTP generation, retained async input, or combined aggregation independently.
observability_surfaces:
  - `yanote combined-report` stdout ends with one final `YANOTE_COMBINED_SUMMARY` line carrying `status`, child statuses, child report paths, `protocols=amqp`, the combined `report=` path, and the primary failing child/code when present.
  - `yanote combined-report` stderr emits child-attributed `YANOTE_COMBINED_ERROR` / `YANOTE_COMBINED_ERROR_SECONDARY` lines that keep `child=`, `path=`, and `report=none` explicit on broken inputs or write failures.
  - `yanote-combined-report.json` publishes `overview`, `children.http`, and `children.async` sections with child-specific provenance, artifact refs, issue lists, and protocol-attributed async summary data.
  - `yanote-combined-report.html` renders separate `HTTP child summary` and `Async child summary` sections, preserving AMQP protocol attribution and child drill-down links without embedding CLI machine-summary output.
  - `.tmp/m015-s03-combined-proof/http-report/*.stdout|stderr|exit-code.txt` and `.tmp/m015-s03-combined-proof/combined-report/*.stdout|stderr|exit-code.txt` retain high-signal proof logs for localizing drift.
  - `.tmp/m015-s03-combined-proof/artifact-manifest.txt` and `artifact-source-paths.txt` record the rerun commands, canonical child input paths, combined artifact paths, and the pinned `YANOTE_COMBINED_SUMMARY` proof token.
drill_down_paths:
  - .gsd/milestones/M015/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M015/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M015/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T22:02:39.518Z
blocker_discovered: false
---

# S03: Combined HTTP+async report/gate from canonical subreports

**Delivered the combined HTTP+async JSON/HTML/CLI surface on top of canonical child reports, with explicit child attribution, fail-closed typed errors, and a retained dist proof that points back to the generated HTTP child and retained RabbitMQ async child.**

## What Happened

S03 completed the first intentional cross-surface aggregation layer without weakening the split-truth contract established earlier in Yanote. T01 added the combined report contract itself: a dedicated combined schema, deterministic normalizer, explicit HTTP/async child sections, separate child provenance/artifact references, child issue lists, and a sibling HTML renderer/writer that keeps HTTP-only and async-only metrics visibly separate instead of inventing one blended denominator. T02 then put that contract on the real CLI surface by adding `yanote combined-report`, loading canonical `yanote-report.json` and `yanote-async-report.json` inputs from disk, validating each child schema plus phase independently, deriving overall status from child status only, writing `yanote-combined-report.json` / `.html`, and emitting one final `YANOTE_COMBINED_SUMMARY` line plus child-attributed `YANOTE_COMBINED_ERROR` / `YANOTE_COMBINED_ERROR_SECONDARY` lines on malformed, swapped, missing, or unwritable inputs. T03 closed the loop with a dist-level proof: a dedicated deterministic HTTP OpenAPI fixture plus one retained S02 RabbitMQ async child report now drive `scripts/ci/verify-m015-s03-combined-report.sh`, which regenerates the HTTP child, combines it with the retained AMQP async child, and retains stdout/stderr, exit codes, manifest, and source-path notes under `.tmp/m015-s03-combined-proof/`. During closeout verification, the slice also needed two hardening fixes to make the promised proof actually survive worktree execution: combined-report Vitest fixtures now resolve from file-anchored paths instead of assuming the runner cwd is `yanote-js`, and the dedicated HTTP proof fixture now includes one proven query parameter so the canonical HTTP child reaches a truthful `status: ok` instead of payload-only `partial`. The finished slice therefore delivers a real combined surface, not a speculative wrapper: downstream readers can open one combined artifact, see overall status immediately, and still drill directly into separate canonical HTTP and async child reports with preserved AMQP protocol attribution.

## Verification

Slice-plan verification passed with worktree-safe command equivalents plus the retained dist proof:
- `npm -C yanote-js exec vitest run ./src/report/combinedReport.test.ts ./src/report/combinedReport.contract.test.ts ./src/report/writeCombinedReport.determinism.test.ts` ✅ passed (9 tests) — proved the combined DTO/schema/normalizer/writer stay deterministic, preserve child attribution, and keep AMQP additive async facts explicit.
- `npm -C yanote-js exec vitest run ./src/cli.combined-report.test.ts ./src/cli.combined-report.contract.test.ts` ✅ passed (7 tests) — proved the combined CLI composes canonical child reports, prints one final machine summary line, and fails closed with child-attributed typed errors on malformed, swapped, or unwritable inputs.
- `node --test ./scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` ✅ passed — pinned the proof script’s artifact layout, retained child paths, AMQP attribution, and summary assertions.
- `npm -C yanote-js run build && bash ./scripts/ci/verify-m015-s03-combined-report.sh` ✅ passed — regenerated a green HTTP child report, combined it with `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json`, produced `.tmp/m015-s03-combined-proof/combined-report/out/yanote-combined-report.json` / `.html`, and retained high-signal stdout/stderr plus manifest/source-path notes.
Operational readiness was also confirmed on the shipped CLI surface: the combined proof shows healthy runs terminate with exactly one final `YANOTE_COMBINED_SUMMARY ... status=ok ... protocols=amqp ...` line, while failure modes remain child-attributed and fail closed via `YANOTE_COMBINED_ERROR*` plus `report=none`.

## Requirements Advanced

- R002 — S03 extended fail-closed visibility to the new aggregation layer: malformed, swapped, missing, or unwritable child inputs now surface typed child-attributed `YANOTE_COMBINED_ERROR*` failures instead of a false-green combined summary.
- R003 — S03 added a new standalone CLI/report delivery surface (`yanote combined-report`) plus a retained dist proof bundle so the combined contract is reachable through real shipped artifacts and command output, not only internal DTO helpers.

## Requirements Validated

- R020 — Validated on current HEAD via combined report/unit contract tests, combined CLI contract tests, the proof-script contract test, and `npm -C yanote-js run build && bash ./scripts/ci/verify-m015-s03-combined-report.sh`, which produced a green combined artifact and final `YANOTE_COMBINED_SUMMARY ... status=ok ... protocols=amqp ...` line while preserving canonical child report paths.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The slice goal and public contract stayed the same, but closeout verification required two implementation hardenings inside S03 scope. First, the plan-listed `npm -C yanote-js test -- ...` form did not execute the targeted Vitest files reliably in this `.gsd/worktrees/M015` checkout, so authoritative verification used the equivalent direct form `npm -C yanote-js exec vitest run ./...`. Second, the original dedicated HTTP proof fixture was fully covered on payload truth but still produced `status: partial` because `coverage.parameters` and `aggregate` stayed `N/A`; the fixture was updated to include one proven query parameter so the proof now matches the slice’s intended green child pair.

## Known Limitations

- The combined surface is intentionally an aggregation of canonical child reports only; it does not re-analyze raw specs or runtime evidence directly.
- The combined artifact preserves separate HTTP and async denominators by design; there is still no blended cross-surface coverage percentage or flattened child body.
- The combined proof depends on the retained S02 RabbitMQ child artifacts (`.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` and `.html`) being present.
- Async child truth remains bounded by the child report itself, so AMQP still shows protocol-attributed coverage with Kafka-only binding/runtime-semantic sections explicit as zero/none rather than parity.

## Follow-ups

- S04 should carry the new combined JSON/HTML/CLI surface into collected CI artifacts, GitHub summaries, and public docs/support wording without implying a blended denominator or hosted dashboard.
- S04 should describe the retained `.tmp/m015-s03-combined-proof/` / `.yanote-ci/live-rabbitmq-proof/` drill-down story so operators know when to rerun the generated HTTP child step versus the retained RabbitMQ async proof.
- Future broader aggregation work, if any, should remain additive to the canonical child reports and preserve the current child-attributed failure model instead of folding HTTP and async semantics into one hidden numerator.

## Files Created/Modified

- `yanote-js/src/report/combinedReport.ts` — Defined the combined report DTO/builder, explicit child summaries, child provenance/artifact refs, issue collection, and deterministic overall-status derivation from canonical HTTP and async child reports.
- `yanote-js/src/report/combinedSchema.ts` — Added the dedicated combined report schema so the new surface validates its own child-attributed contract instead of masquerading as either child schema.
- `yanote-js/src/report/combinedNormalize.ts` — Implemented deterministic rounding and stable ordering for child protocols, issues, and artifact lists before serialization.
- `yanote-js/src/report/combinedReportHtml.ts` — Rendered the offline combined HTML report with separate Overview, HTTP child summary, and Async child summary sections plus drill-down artifact paths.
- `yanote-js/src/report/writeCombinedReport.ts` — Wrote stable `yanote-combined-report.json` and `.html` siblings and failed closed on malformed combined DTOs.
- `yanote-js/src/cli.ts` — Added the `combined-report` command, canonical child loaders, child-phase/schema validation, attributed summary output, and typed fail-closed error handling.
- `yanote-js/src/cli.combined-report.test.ts` — Covered combined CLI success, partial child attribution, missing child paths, and unwritable-output failure behavior.
- `yanote-js/src/cli.combined-report.contract.test.ts` — Pinned section ordering, the single final `YANOTE_COMBINED_SUMMARY` line, deterministic primary/secondary error ordering, and child path retention.
- `yanote-js/src/report/combinedReport.test.ts` — Covered combined builder status derivation, child attribution, AMQP async summary preservation, and fail-closed malformed-child handling.
- `yanote-js/src/report/combinedReport.contract.test.ts` — Pinned the combined schema boundary, HTML escaping/path rendering, AMQP protocol visibility, and rejection of invented blended fields.
- `yanote-js/src/report/writeCombinedReport.determinism.test.ts` — Proved byte-stable combined JSON/HTML output and fail-closed writer behavior on malformed combined reports.
- `yanote-js/src/testFixturePaths.ts` — Added a file-anchored fixture-path helper so combined-report tests resolve package-local fixtures correctly inside `.gsd/worktrees/*` checkouts.
- `scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml` — Defined the dedicated green HTTP proof fixture, including one declared query parameter so the canonical HTTP child can reach `status: ok`.
- `scripts/ci/fixtures/m015-s03-combined-http.events.jsonl` — Captured the matching HTTP proof event, including the proven query-parameter evidence consumed by the green child report.
- `scripts/ci/verify-m015-s03-combined-report.sh` — Added the end-to-end dist proof that generates the HTTP child, combines it with the retained S02 RabbitMQ async child, and retains manifest/source-path diagnostics.
- `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` — Pinned the combined proof script’s artifact layout, retained-child-path assertions, AMQP attribution, and summary expectations.
