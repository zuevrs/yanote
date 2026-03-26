---
id: S02
parent: M013
milestone: M013
provides:
  - Canonical HTTP deprecated-operation metadata from OpenAPI extraction through coverage, report JSON, and CLI summary surfaces.
  - Stable operator-facing deprecated summary tokens and explicit uncovered-deprecated issue wording without changing legacy operation/status/parameter/aggregate numerators.
  - A rerunnable retained proof bundle and contract test that catch denominator drift or async/dashboard leakage from one inspection point.
requires:
  - slice: S01
    provides: The shared spec-source resolution/provenance contract and real CLI/report entrypoint boundary reused unchanged while deprecated truth was added only to the canonical HTTP report path.
affects:
  - S03
  - S04
key_files:
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/coverage.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/cli.ts
  - yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml
  - yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl
  - scripts/ci/verify-m013-s02-deprecated-operations.sh
  - scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs
  - .yanote-ci/deprecated-operations-proof/artifact-manifest.txt
  - .yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json
key_decisions:
  - Keep deprecated-operation truth additive on the canonical HTTP path via `summary.deprecatedOperations` plus `coverage.perOperation[].deprecated` instead of rewriting legacy coverage dimensions or gate math.
  - Publish deprecated CLI truth only on `yanote report` via a dedicated human summary line, `YANOTE_SUMMARY` `deprecated_*` tokens, and uncovered-deprecated Top Issues wording while leaving async summary surfaces unchanged.
  - Retain the deprecated-operations proof as a fixed HTTP-only bundle whose manifest records the rerun command plus the preserved legacy denominator and deprecated counts.
patterns_established:
  - Broader HTTP semantics can ship truthfully by adding dedicated summary blocks and explicit per-operation flags while preserving stable legacy coverage numerators.
  - Source-spec metadata can stay sparse in canonical contracts, but downstream coverage/report rows should materialize deterministic booleans so writers and consumers never re-derive defaults.
  - Focused proof bundles are easier to maintain when the artifact layout is pinned and the manifest restates the high-signal claims future agents need to re-check drift quickly.
observability_surfaces:
  - `yanote-report.json` → `summary.deprecatedOperations` and `coverage.perOperation[].deprecated` on the canonical HTTP report surface.
  - `yanote report` stdout → `- deprecated operations:` summary line, uncovered-deprecated Top Issues wording, and `YANOTE_SUMMARY deprecated_operations/deprecated_total/deprecated_covered/deprecated_uncovered` tokens.
  - `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` → retained `legacy_operations=2/3`, deprecated counts, rerun command, and HTTP-only bundle assertions.
drill_down_paths:
  - .gsd/milestones/M013/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M013/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M013/slices/S02/tasks/T03-SUMMARY.md
  - .gsd/milestones/M013/slices/S02/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T01:35:16.193Z
blocker_discovered: false
---

# S02: Deprecated Operation Truth Without Numerator Drift

**Deprecated OpenAPI operations now flow through Yanote’s canonical HTTP coverage/report/CLI path and a retained proof bundle without changing the legacy coverage denominators or widening into async/dashboard surfaces.**

## What Happened

S02 completed the end-to-end deprecated-operation truth path on the canonical HTTP analyzer surface. T01 extended OpenAPI extraction and HTTP coverage so operation contracts carry sparse additive deprecation metadata while `coverage.perOperation[]` materializes a deterministic `deprecated` boolean with `false` defaults; the dedicated `http-deprecated-operations` fixture proves the only uncovered operation can be deprecated while legacy coverage stays `covered=2/3`. T02 extended the canonical report model so `yanote-report.json` now publishes `summary.deprecatedOperations` and explicit `coverage.perOperation[].deprecated` flags without changing `summary.coveredOperations`, `coverage.operations`, `coverage.status`, `coverage.parameters`, `coverage.aggregate`, report status rules, or gate math. T03 extended the real HTTP CLI surface with a dedicated deprecated summary line, stable `YANOTE_SUMMARY` deprecated tokens, and explicit uncovered-deprecated Top Issues wording, while preserving the S01 sanitized `specSource` contract and leaving `yanote async-report` / `YANOTE_ASYNC_SUMMARY` untouched. T04 closed the slice with a retained proof bundle under `.yanote-ci/deprecated-operations-proof/` plus a contract test that pins the HTTP-only artifact layout, rerun command, preserved `legacy_operations=2/3` claim, and additive deprecated counts from one inspection surface. During closeout I reran the full slice verification stack from the worktree with foreground `bash` commands, then read back the retained manifest, stdout, and report JSON to confirm the promised observability surfaces were actually present on disk.

## Verification

Verified the slice with the exact slice-plan stack from the worktree: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts`, `bash scripts/ci/verify-m013-s02-deprecated-operations.sh`, and `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`; all passed. I also inspected `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`, `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt`, and `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json`, confirming `legacy_operations=2/3`, `deprecated_operations=0/1`, `summary.deprecatedOperations`, `coverage.perOperation[].deprecated`, the CLI `- deprecated operations:` line, `YANOTE_SUMMARY deprecated_*` tokens, and `async_artifacts_present=false` / `dashboard_artifacts_present=false`.

## Requirements Advanced

- R024 — Completed the deprecated-operation portion of the analyzer-consumption requirement by surfacing additive deprecated truth on the supported HTTP JSON/CLI path and retaining a dedicated proof bundle, while leaving static HTML and CI/docs/support closeout to later M013 slices.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Deprecated truth is additive only by design: legacy `coverage.operations/status/parameters/aggregate`, gate math, and summary covered-operation numerators still count deprecated operations until a future explicit policy says otherwise. Async surfaces and any dashboard/web UI remain intentionally untouched in this slice, and separate static HTML report artifacts are still pending S03.

## Follow-ups

S03 should derive the static HTTP HTML artifact from the new canonical `summary.deprecatedOperations` and `coverage.perOperation[].deprecated` fields so the offline report matches JSON truth exactly. S04 should publish the deprecated-operation semantics, retained proof bundle, and HTTP-only boundary in CI/docs/support surfaces so operators understand that deprecated truth is explicit but denominator policy is unchanged.

## Files Created/Modified

- `yanote-js/src/spec/openapi.ts` — Carries sparse OpenAPI `deprecated: true` metadata into the canonical HTTP operation contract.
- `yanote-js/src/spec/openapi.test.ts` — Adds extraction tests covering explicit deprecated-operation metadata.
- `yanote-js/src/coverage/coverage.ts` — Threads deprecated truth onto deterministic `coverage.perOperation[]` rows with `false` defaults.
- `yanote-js/src/coverage/coverage.test.ts` — Proves the dedicated deprecated fixture preserves the legacy `2/3` denominator and coverage math.
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` — Defines an HTTP spec where the only uncovered operation is deprecated.
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` — Retains evidence that covers only the non-deprecated operations in the dedicated proof fixture.
- `yanote-js/src/report/report.ts` — Adds `summary.deprecatedOperations` and explicit per-operation deprecated flags to the canonical HTTP report.
- `yanote-js/src/report/schema.ts` — Extends the report schema to require the additive deprecated fields on HTTP reports.
- `yanote-js/src/report/normalize.ts` — Keeps deprecated report truth deterministic during normalization and ordering.
- `yanote-js/src/report/report.contract.test.ts` — Pins the deprecated JSON contract while preserving legacy summary and status semantics.
- `yanote-js/src/report/report.test.ts` — Verifies deprecated-fixture behavior and denominator stability on the report surface.
- `yanote-js/src/report/writeReport.determinism.test.ts` — Covers deterministic serialization of the expanded HTTP report DTO.
- `yanote-js/src/cli.ts` — Prints additive deprecated summary output, machine tokens, and uncovered-deprecated Top Issues wording on the HTTP CLI path only.
- `yanote-js/src/cli.summary.contract.test.ts` — Pins deprecated summary lines and `YANOTE_SUMMARY` tokens on CLI stdout.
- `yanote-js/src/cli.report.test.ts` — Verifies the real HTTP CLI/report path exposes deprecated truth without numerator drift.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — Confirms the expanded HTTP summary/report contract stays compatible with local and remote spec-source inputs.
- `yanote-js/src/cli.async-report.contract.test.ts` — Guards the async boundary so deprecated HTTP summary output does not leak into async surfaces.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — Pins deprecated-report compatibility on remote-spec report generation.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — Locks default deprecated report values for request-evidence report consumers.
- `yanote-js/src/report/report.security.contract.test.ts` — Locks default deprecated report values for security-report consumers.
- `scripts/ci/verify-m013-s02-deprecated-operations.sh` — Builds the real CLI, runs the deprecated fixture, and retains an HTTP-only proof bundle with denominator and deprecated assertions.
- `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs` — Pins the retained proof bundle path, artifact layout, rerun command, and deprecated-operation claims.
- `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` — Records the retained proof command, preserved `legacy_operations=2/3`, deprecated counts, and HTTP-only bundle assertions.
- `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt` — Retains the human/machine HTTP CLI summary proving deprecated output and unchanged legacy coverage wording.
- `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json` — Retains the canonical JSON proof with deprecated summary counts and per-operation flags.
