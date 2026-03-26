---
estimated_steps: 3
estimated_files: 4
skills_used:
  - debug-like-expert
  - vitest
---

# T05: Surface runtime semantics through async-report CLI and machine summary tokens

**Slice:** S02 — Header-backed correlation and reply truth
**Milestone:** M014

## Description

Close the supported user path by wiring runtime semantics and typed gate failures through `yanote async-report` stdout, stderr, and `YANOTE_ASYNC_SUMMARY` without breaking the JSON-centered `report=` contract or supported local/remote spec handling.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| CLI summary formatting plus typed async gate failures | Keep one final `YANOTE_ASYNC_SUMMARY` line, preserve `report=.../yanote-async-report.json`, and emit typed primary/secondary stderr failures instead of partial prose. | Fail the CLI contract tests and treat the entrypoint as blocked rather than emitting ambiguous mixed-surface output. | Malformed runtime-semantic rows or failure payloads must degrade to deterministic summary/test failures without leaking retained header values. |

## Load Profile

- **Shared resources**: CLI summary buffers, issue prioritization, stderr emission, and machine-summary token formatting.
- **Per-operation cost**: Format runtime-semantic detail lines for humans, aggregate counts/tokens for machines, and preserve deterministic issue ordering.
- **10x breakpoint**: Very large detail sections stress stdout readability before CPU cost matters; the plan keeps machine tokens counts-only and caps issue display via existing summary behavior.

## Negative Tests

- **Malformed inputs**: Missing report paths, malformed runtime-semantic rows, and unsupported local/remote spec variations must fail focused CLI tests.
- **Error paths**: Primary/secondary stderr ordering, `primary=` token selection, and report-path handling must stay stable when runtime semantics fail.
- **Boundary conditions**: Stdout, stderr, and machine tokens must agree on runtime truth while never printing retained `correlation_id` / `reply_to` values.

## Steps

1. Update `yanote-js/src/cli.ts` so `async-report` prints a Runtime Semantics section, keeps declared-vs-runtime truth separate, and emits stable counts/tokens plus typed stderr lines from the new gate failures.
2. Expand `yanote-js/src/cli.async-report.contract.test.ts` and `yanote-js/src/cli.async-report.test.ts` to pin section order, machine-summary tokens, stderr primary/secondary behavior, report path, and no-leakage behavior across covered and failure fixtures.
3. Update `yanote-js/src/cli.remote-spec.contract.test.ts` so local-file, local-directory, and remote-url spec modes keep the widened async summary deterministic and JSON-centered.

## Must-Haves

- [ ] stdout, stderr, and `YANOTE_ASYNC_SUMMARY` tell the same runtime-truth story as the JSON/HTML artifacts.
- [ ] `Report Path` and `report=` still point at `yanote-async-report.json`, not HTML or any combined surface.
- [ ] No retained correlation/reply header values appear in stdout, stderr, or machine tokens.

## Verification

- `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build`
- CLI output keeps one final `YANOTE_ASYNC_SUMMARY` line, typed primary/secondary stderr failures, `report=.../yanote-async-report.json`, and no retained header-value leakage.

## Observability Impact

- Signals added/changed: `yanote async-report` stdout/stderr and `YANOTE_ASYNC_SUMMARY` expose additive runtime semantic states plus typed correlation/reply failures.
- How a future agent inspects this: rerun the focused CLI tests or execute `yanote async-report` on the dedicated header-runtime fixtures and inspect stdout, stderr, and the written JSON artifact together.
- Failure state exposed: summary-token drift, wrong primary failure selection, report-path drift, or any retained-header leakage fails focused CLI assertions with the offending line/token.

## Inputs

- `yanote-js/src/gates/asyncEvaluator.ts` — typed runtime semantic failures from T03 that drive stderr/primary failure behavior.
- `yanote-js/src/report/asyncReport.ts` — widened async report DTO from T04 that the CLI must summarize consistently.
- `yanote-js/src/report/asyncSchema.ts` — report contract the CLI must keep JSON-centered.
- `yanote-js/src/report/asyncNormalize.ts` — deterministic ordering reused by async-report delivery.
- `yanote-js/src/report/asyncReportHtml.ts` — human artifact surface that must stay aligned with stdout boundaries.
- `yanote-js/src/cli.ts` — async-report entrypoint and summary formatter.
- `yanote-js/src/cli.async-report.contract.test.ts` — section-order and machine-token contract guard.
- `yanote-js/src/cli.async-report.test.ts` — end-to-end CLI coverage for covered and failure runtime-semantic cases.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — supported local/remote spec-source contract coverage.

## Expected Output

- `yanote-js/src/cli.ts` — async-report CLI wiring updated for runtime semantics and typed correlation/reply failures.
- `yanote-js/src/cli.async-report.contract.test.ts` — contract assertions for widened async summary sections/tokens and deterministic stderr behavior.
- `yanote-js/src/cli.async-report.test.ts` — CLI integration coverage proving runtime semantics surface without leakage or report-path drift.
- `yanote-js/src/cli.remote-spec.contract.test.ts` — remote-spec coverage proving supported spec-source modes stay deterministic with the widened runtime semantic summary.
