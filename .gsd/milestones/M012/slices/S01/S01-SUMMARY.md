---
id: S01
parent: M012
milestone: M012
provides:
  - Deterministic effective OpenAPI security extraction for HTTP operations, including inheritance, override, clear, optional, OR, and AND semantics.
  - A truthful `apiKey`-only HTTP security evaluator backed by retained request evidence provenance (`captured`, `redacted`, `omitted`) with explicit unsupported outcomes.
  - An additive `httpSecurityConformance` machine-readable report surface that leaves legacy HTTP coverage numerators unchanged.
  - Fail-closed typed security governance plus CLI/CI summary rendering that downstream documentation and proof slices can publish without changing analyzer semantics.
requires:
  []
affects:
  - S02
key_files:
  - yanote-js/src/spec/semantics.ts
  - yanote-js/src/coverage/httpSecurityConformance.ts
  - yanote-js/src/gates/httpSecuritySemantics.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/cli.ts
  - scripts/ci/render-yanote-summary.mjs
  - yanote-js/test/fixtures/openapi/http-security-api-key.yaml
  - yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl
key_decisions:
  - Resolve effective OpenAPI security in the semantic layer first, then materialize typed security contracts on operations so canonical `http METHOD ROUTE` identities remain stable.
  - Support only the truthful first subset — `apiKey` in `query`, `header`, and `cookie` locations backed by retained presence/provenance evidence — and represent all other security types or locations as explicit unsupported truth.
  - Route security drift through dedicated `SEMANTIC_HTTP_*SECURITY` governance failures derived from structured diagnostics instead of free-form strings so CLI/CI output stays deterministic and secret-safe.
  - Expose security truth additively through `httpSecurityConformance` and security summary tokens while keeping legacy `coverage.operations/status/parameters/aggregate` numerators unchanged.
patterns_established:
  - When Yanote widens HTTP/OpenAPI semantics, add a dedicated top-level conformance surface instead of mutating the established `coverage.*` numerators.
  - Resolve broader OpenAPI semantics in the spec/semantic layer first, then materialize typed operation contracts so canonical operation identities and downstream analyzers stay stable.
  - Generate human-facing governance text from structured diagnostics rather than replaying free-form analyzer messages to keep summaries deterministic and secret-safe.
  - Whenever a new semantic failure code is added, update both gate precedence and report normalization so CLI, report JSON, and CI summaries agree on the primary failure ordering.
observability_surfaces:
  - `yanote-report.json` top-level `httpSecurityConformance` summary/per-operation/diagnostics.
  - CLI `HTTP Security Conformance` block in `yanote report` output.
  - Typed `YANOTE_ERROR` / `YANOTE_ERROR_SECONDARY` security semantic lines on stderr.
  - Additive `YANOTE_SUMMARY` security tokens: `security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, and `security_truths`.
  - `scripts/ci/render-yanote-summary.mjs` GitHub-summary markdown for HTTP security failures and counts.
  - Focused Vitest suites covering extraction, evaluator, governance order, report contract, CLI contract, and renderer contract.
drill_down_paths:
  - .gsd/milestones/M012/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M012/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M012/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M012/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T21:52:40.119Z
blocker_discovered: false
---

# S01: Security Semantics Through Report, CLI, And CI

**Shipped additive HTTP security semantics for OpenAPI security requirements through report, CLI, and CI with fail-closed typed governance while preserving legacy coverage numerators.**

## What Happened

S01 turned broader OpenAPI security semantics into a truthful, user-visible Yanote surface without disturbing the established HTTP coverage contract. T01 extended the OpenAPI semantic layer to resolve effective per-operation security requirements deterministically — root inheritance, operation-level override, explicit `security: []` clear semantics, optional `{}` branches, OR across requirement objects, and AND within a requirement object — and materialized those results into typed operation contracts while preserving canonical `http METHOD ROUTE` identities. The slice then introduced a dedicated HTTP security evaluator that only claims support where retained request evidence can prove it: `apiKey` schemes in query/header/cookie locations become satisfied, missing, or unavailable based on captured/redacted/omitted presence truth, while unsupported security types and unsupported `apiKey` locations stay explicit instead of silently passing.

T02 converted that additive security truth into fail-closed governance behavior. The new mapper produces typed `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` failures from structured security diagnostics, with stable precedence ahead of request semantics, payload semantics, and threshold/regression math. That makes security drift the primary exit-5 reason when present while keeping satisfied, optional, and cleared branches green.

T03 published the new capability on a stable machine-readable surface. `yanote-report.json` now carries a dedicated top-level `httpSecurityConformance` section with summary, per-operation branch truth, and diagnostics, but `schemaVersion` remains `1.0.0` and the existing `coverage.operations`, `coverage.status`, `coverage.parameters`, and `coverage.aggregate` numerators remain unchanged. Report normalization was extended so the new security semantic codes preserve the same ordering as gate precedence.

T04 completed the user-facing delivery path. The real `yanote report` flow now computes HTTP security conformance, prints a dedicated `HTTP Security Conformance` block when security truth exists, emits additive security `YANOTE_SUMMARY` tokens, dedupes Top Issues/stderr against the typed governance failures, and keeps secret values out of stdout/stderr. `scripts/ci/render-yanote-summary.mjs` now renders the same security truth from report-first artifacts, so CLI, report JSON, and GitHub summary surfaces agree on the primary failure and the supported/deferred boundary.

## Verification

All slice-plan verification commands passed from the worktree root: `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`, `node --test scripts/ci/render-yanote-summary.test.mjs`, and `npm -C yanote-js run build`. I also directly ran `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out <tmp> --profile local` after the build and confirmed the observability surfaces end to end: exit code `5`, unchanged legacy coverage percentages, an additive `HTTP Security Conformance` block with `satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1`, typed `YANOTE_ERROR` / `YANOTE_ERROR_SECONDARY` stderr lines, additive `YANOTE_SUMMARY` security tokens, and a generated `yanote-report.json` carrying deterministic `httpSecurityConformance` plus ordered `SEMANTIC_HTTP_*SECURITY` governance diagnostics without raw secret values.

## Requirements Advanced

- R001 — Extended the deterministic recorder → analyzer → report path with effective HTTP security truth while preserving canonical operation keys and unchanged legacy coverage numerators.
- R002 — Added dedicated fail-closed security semantic codes and precedence so missing, unavailable, and unsupported security requirements stop the analyzer with explicit typed diagnostics instead of false-green output.
- R003 — Surfaced the new security truth through the standalone CLI, `YANOTE_SUMMARY`, `yanote-report.json`, and GitHub summary rendering so teams see the same result on their existing delivery surfaces.

## Requirements Validated

- R001 — `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts` plus a direct `node yanote-js/dist/yanote.cjs report --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl --out <tmp> --profile local` run proved deterministic additive security truth while `coverage.operations/status/parameters/aggregate` stayed unchanged.
- R002 — `npm -C yanote-js test -- src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts` and the direct fixture-backed CLI run proved exit code 5 with ordered `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, and `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` failures.
- R003 — `npm -C yanote-js test -- src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`, `node --test scripts/ci/render-yanote-summary.test.mjs`, and the direct CLI run proved the same security truth is visible through stdout/stderr, `YANOTE_SUMMARY`, `yanote-report.json`, and GitHub-summary rendering.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Yanote's supported HTTP security subset is intentionally limited to `apiKey` schemes in `query`, `header`, and `cookie` locations. `http`, `oauth2`, `openIdConnect`, and unsupported `apiKey` locations such as `path` still fail closed as explicit unsupported truth. Public docs, release/support boundary text, and retained proof scripts still need the S02 closeout so this supported/deferred boundary is visible outside the code and test surfaces.

## Follow-ups

S02 should publish the supported-vs-deferred security boundary across README/support/release surfaces and retain a public proof path that shows the additive security report/CLI/CI behavior on rerunnable artifacts. Any support for `http`, `oauth2`, `openIdConnect`, or unsupported `apiKey` locations should stay deferred until Yanote can prove them truthfully from retained evidence rather than infer them loosely.

## Files Created/Modified

- `yanote-js/src/spec/semantics.ts` — Resolved effective per-operation OpenAPI security semantics, including inheritance, override, clear, optional, and branch normalization.
- `yanote-js/src/spec/openapi.ts` — Materialized typed HTTP security contracts on operations without changing canonical HTTP operation keys or legacy extraction surfaces.
- `yanote-js/src/coverage/httpSecurityConformance.ts` — Evaluated truthful apiKey-only HTTP security conformance from retained request evidence with per-branch and per-operation truth.
- `yanote-js/src/spec/openapi.security.test.ts` — Pinned security extraction behavior for inheritance, override, clear, optional, OR/AND, and invalid references.
- `yanote-js/src/coverage/httpSecurityConformance.test.ts` — Pinned apiKey conformance truth, unavailable evidence handling, unsupported scheme handling, and legacy-coverage stability.
- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` — Added the security-focused OpenAPI fixture corpus covering supported, optional, clear, missing, unavailable, and unsupported security branches.
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` — Added retained HTTP event fixtures proving captured, redacted, omitted, and unsupported security scenarios without leaking secret values.
- `yanote-js/src/gates/httpSecuritySemantics.ts` — Mapped security conformance diagnostics to dedicated fail-closed semantic governance failures.
- `yanote-js/src/gates/evaluator.ts` — Threaded security semantic failures through the main gate evaluator ahead of threshold/regression math.
- `yanote-js/src/gates/failureOrder.ts` — Extended deterministic failure precedence with HTTP security semantic codes.
- `yanote-js/src/gates/httpSecuritySemantics.test.ts` — Verified fail-closed mapping for missing, unavailable, unsupported, satisfied, optional, and clear security outcomes.
- `yanote-js/src/gates/failureOrder.test.ts` — Verified security semantic precedence versus request, payload, and gate failures.
- `yanote-js/src/report/report.ts` — Published additive `httpSecurityConformance` report summary, per-operation, and diagnostic surfaces with typed semantic annotations.
- `yanote-js/src/report/schema.ts` — Extended the strict `1.0.0` report schema additively for HTTP security conformance.
- `yanote-js/src/report/normalize.ts` — Normalized security sections and mirrored security semantic precedence into report-governance ordering.
- `yanote-js/src/report/report.security.contract.test.ts` — Locked the report contract for additive security truth, deterministic ordering, and unchanged legacy coverage numerators.
- `yanote-js/src/report/writeReport.determinism.test.ts` — Extended report determinism coverage to include the new security section and governance ordering.
- `yanote-js/src/report/report.contract.test.ts` — Updated the base report contract fixture coverage for the additive security section.
- `yanote-js/src/cli.ts` — Surfaced HTTP security conformance through CLI stdout, stderr, report generation, and additive `YANOTE_SUMMARY` tokens.
- `yanote-js/src/cli.security.report.test.ts` — Verified full CLI security reporting, typed stderr failures, and secret-safe output on the real fixture corpus.
- `yanote-js/src/cli.security.summary.contract.test.ts` — Verified CLI block ordering, machine-token stability, and truncated/deduped top-issue behavior for security semantics.
- `scripts/ci/render-yanote-summary.mjs` — Extended the GitHub summary renderer to display additive HTTP security observations and typed semantic failures.
- `scripts/ci/render-yanote-summary.test.mjs` — Locked renderer output for governance-driven HTTP security summaries without secret leakage.
- `.gsd/KNOWLEDGE.md` — Recorded reusable report-normalization and CI-summary ordering lessons for future semantic-surface slices.
- `.gsd/DECISIONS.md` — Recorded the conditional human-visible security-block observability decision and the closeout governance decision for typed security failure routing.
- `.gsd/PROJECT.md` — Refreshed the project state summary to reflect delivered M012 S01 HTTP security semantics and the remaining S02 boundary work.
