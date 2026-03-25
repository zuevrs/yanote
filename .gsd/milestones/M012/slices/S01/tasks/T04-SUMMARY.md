---
id: T04
parent: S01
milestone: M012
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.security.report.test.ts
  - yanote-js/src/cli.security.summary.contract.test.ts
  - scripts/ci/render-yanote-summary.mjs
  - scripts/ci/render-yanote-summary.test.mjs
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
key_decisions:
  - Compute `httpSecurityConformance` inside the real CLI report flow and route its diagnostics through the existing governance evaluator so security drift uses the same typed semantic failure path as other HTTP semantics.
  - Keep Top Issues and stderr deduped by showing typed security semantic failures once and suppressing duplicate raw security-diagnostic text, while keeping optional/cleared security green.
  - Expose additive security machine tokens on every HTTP report, but render the human-facing CLI/CI security block only when security observations are present so legacy zero-security summaries do not gain empty sections.
duration: ""
verification_result: passed
completed_at: 2026-03-25T21:47:32.402Z
blocker_discovered: false
---

# T04: Expose HTTP security conformance through CLI summaries, machine tokens, and GitHub summary output

**Expose HTTP security conformance through CLI summaries, machine tokens, and GitHub summary output**

## What Happened

Implemented the user-visible security reporting path end to end. In `yanote-js/src/cli.ts`, the HTTP `report` command now computes real `httpSecurityConformance` from the OpenAPI security contracts and retained request evidence, feeds those diagnostics into `evaluateGateFailures`, passes the security section into `buildReport()`, prints a dedicated `HTTP Security Conformance` block when security truth exists, and emits additive `YANOTE_SUMMARY` tokens (`security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, `security_truths`) without changing legacy coverage percentages or removing existing request/payload tokens. I also extended CLI issue collection so typed security semantic failures are shown once in Top Issues/stderr instead of being duplicated by raw conformance diagnostics, and verified that satisfied/optional/clear cases stay off the failing issue surfaces and that secret values do not leak to stdout/stderr.

On the CI side, `scripts/ci/render-yanote-summary.mjs` now surfaces security observations/truth counts from report data when present, while still deriving the primary failure from governance/report data instead of custom secret-bearing parsing. I added focused security contract tests for both CLI surfaces and the GitHub-summary renderer using the real `http-security-api-key` fixture corpus so inherited, override, clear, optional, missing, unavailable, and unsupported security behavior is pinned across stdout, stderr, `YANOTE_SUMMARY`, `yanote-report.json`, and the rendered summary markdown. During verification I also captured a project knowledge note about the renderer’s governance-order vs Top-Issues sort behavior and recorded the conditional human-block observability decision in the decisions register.

## Verification

Passed the focused task verifier stack and the full slice verifier stack. `npm -C yanote-js test -- src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts` passed after aligning new security expectations to the analyzer’s deterministic AND/OR branch precedence and existing request-observation semantics. `node --test scripts/ci/render-yanote-summary.test.mjs` passed with a new governance-driven HTTP security summary contract that proves primary-failure selection and secret-safe report facts in GitHub-summary output. Final slice verification also passed with `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts`, followed by `npm -C yanote-js run build`. The exercised observability surfaces were CLI stdout/stderr, additive `YANOTE_SUMMARY` tokens, `yanote-report.json`, and rendered GitHub summary markdown; all stayed secret-safe.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/spec/openapi.security.test.ts src/coverage/httpSecurityConformance.test.ts src/gates/httpSecuritySemantics.test.ts src/gates/failureOrder.test.ts src/report/report.security.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.security.report.test.ts src/cli.security.summary.contract.test.ts` | 0 | ✅ pass | 1188ms |
| 2 | `node --test scripts/ci/render-yanote-summary.test.mjs` | 0 | ✅ pass | 257ms |
| 3 | `npm -C yanote-js run build` | 0 | ✅ pass | 241ms |


## Deviations

Minor, intentional deviation: the new human-facing HTTP security block is rendered only when the report contains non-zero security observations/declared operations so existing zero-security HTTP summaries stay stable, while additive `YANOTE_SUMMARY` security tokens are always emitted. Also appended one reusable renderer-ordering note to `.gsd/KNOWLEDGE.md` and recorded the observability choice in `.gsd/DECISIONS.md`.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.security.report.test.ts`
- `yanote-js/src/cli.security.summary.contract.test.ts`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`
