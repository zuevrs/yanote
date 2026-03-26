---
estimated_steps: 3
estimated_files: 4
skills_used:
  - vitest
---

# T03: Surface declared semantics through async-report summaries without breaking JSON-centered delivery

**Slice:** S01 — Trait-aware declared semantics on async-report
**Milestone:** M014

## Description

Close the supported `yanote async-report` entrypoint by surfacing declared async semantics in stdout and `YANOTE_ASYNC_SUMMARY` while preserving JSON-centered report delivery, remote-spec handling, and the async-only boundary.

## Steps

1. Update `yanote-js/src/cli.ts` so `async-report` threads the richer async semantics bundle into report building and prints an additive declared-semantics summary alongside the existing coverage sections.
2. Extend `yanote-js/src/cli.async-report.contract.test.ts` and `yanote-js/src/cli.async-report.test.ts` to assert the new summary text/tokens, the unchanged JSON-centered `report=` path, and the absence of HTTP-only wording or raw retained values.
3. Update `yanote-js/src/cli.remote-spec.contract.test.ts` so local-file, local-directory, and remote-url AsyncAPI runs keep the widened async summary deterministic across supported spec-source modes.

## Must-Haves

- [ ] `yanote async-report` exposes declared `correlationId` / `reply` counts or fields additively in stdout and `YANOTE_ASYNC_SUMMARY`.
- [ ] `Report Path` and `report=` continue to point at `yanote-async-report.json`, not HTML or any combined surface.
- [ ] Supported local and remote spec inputs stay green with the widened summary and no raw header-value leakage.

## Verification

- `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts`
- The CLI output shows the new declared semantics section/tokens while preserving existing JSON-centered delivery markers.

## Observability Impact

- Signals added/changed: `async-report` stdout and `YANOTE_ASYNC_SUMMARY` now expose additive declared-semantics text/tokens.
- How a future agent inspects this: rerun the focused CLI contract tests or execute `yanote async-report` on the dedicated fixtures and inspect stdout plus the written JSON artifact.
- Failure state exposed: summary leakage, token drift, or remote-spec variance fails focused CLI assertions with the exact unexpected line.

## Inputs

- `yanote-js/src/cli.ts` — current async-report entrypoint and summary formatter.
- `yanote-js/src/report/asyncReport.ts` — widened async report DTO from T02.
- `yanote-js/src/report/asyncSchema.ts` — report schema contract that now includes declared semantics.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic report ordering reused by the CLI path.
- `yanote-js/src/report/asyncReportHtml.ts` — async HTML surface that must stay aligned with the CLI summary boundary.
- `yanote-js/src/cli.async-report.contract.test.ts` — machine-summary contract guard for async-report.
- `yanote-js/src/cli.async-report.test.ts` — real CLI integration coverage for async-report artifacts.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — supported local/remote spec-source contract coverage.

## Expected Output

- `yanote-js/src/cli.ts` — async-report CLI wiring updated to surface declared semantics additively while keeping JSON-centered delivery.
- `yanote-js/src/cli.async-report.contract.test.ts` — contract assertions for the widened async summary text and machine tokens.
- `yanote-js/src/cli.async-report.test.ts` — integration coverage proving the real CLI surfaces declared semantics without boundary drift.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — remote-spec coverage proving supported spec-source modes stay deterministic with the widened async summary.
