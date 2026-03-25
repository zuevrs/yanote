---
estimated_steps: 4
estimated_files: 6
skills_used:
  - openapi-specification-v3.2
  - vitest
  - test
---

# T02: Surface HTTP core results in CLI summaries and focused contract tests

**Slice:** S04 — Final Boundary Assembly And Docs Hardening
**Milestone:** M010

## Description

Wire the HTTP core analyzer into the real `yanote report` path. This task makes the CLI compute `httpCoreConformance`, print a human-readable `HTTP Core Conformance` section, expose machine-summary counts and primary issues, and pin the behavior in focused CLI test files so the milestone no longer relies on report-only contract coverage.

## Steps

1. Update `yanote-js/src/cli.ts` so the report command computes `computeHttpCoreConformance(...)`, passes it to `buildReport(...)`, and includes HTTP core counts in the summary/top-issue path.
2. Add a human-readable `HTTP Core Conformance` section to stdout while keeping `HTTP Payload Conformance` additive instead of replacing or hiding it.
3. Create focused CLI tests in `yanote-js/src/cli.httpCore.report.test.ts` and `yanote-js/src/cli.httpCore.failclosed.test.ts`, then refresh existing summary/contract tests to assert the new machine-readable fields.
4. Keep the report path deterministic and preserve existing async and payload summary behavior where this task does not intentionally change it.

## Must-Haves

- [ ] `yanote report` computes and serializes real `httpCoreConformance` instead of leaving the report section on neutral fallback data.
- [ ] CLI stdout contains an `HTTP Core Conformance` section with deterministic counts and top issues.
- [ ] Machine-readable summary output exposes HTTP core diagnostic information needed by proof scripts and CI summaries.
- [ ] Dedicated focused CLI test files exist on disk for the new HTTP core report/failclosed behavior.

## Verification

- `npm -C yanote-js test -- src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
- `npm -C yanote-js test -- src/report/report.test.ts -t "httpCoreConformance"`

## Observability Impact

- Signals added/changed: `yanote report` stdout and `YANOTE_SUMMARY` now expose HTTP core section/counts alongside payload and coverage data.
- How a future agent inspects this: run the focused CLI tests and inspect the asserted stdout/stderr fragments plus machine-summary tokens in the new dedicated test files.
- Failure state exposed: regressions should show whether the break is report computation, summary rendering, or fail-closed primary-code selection.

## Inputs

- `yanote-js/src/cli.ts` — current CLI summary path that still only surfaces HTTP payload conformance.
- `yanote-js/src/report/report.ts` — report builder that already accepts additive `httpCoreConformance` data when callers supply it.
- `yanote-js/src/coverage/httpCoreConformance.ts` — HTTP core analyzer output the CLI must now compute and pass through.
- `yanote-js/src/gates/httpCoreSemantics.ts` — semantic mapping from T01 that the CLI summary must reflect when fail-closed drift exists.

## Expected Output

- `yanote-js/src/cli.ts` — report command wired to compute and surface `httpCoreConformance`.
- `yanote-js/src/cli.httpCore.report.test.ts` — focused green/red CLI report coverage for HTTP core output.
- `yanote-js/src/cli.httpCore.failclosed.test.ts` — focused fail-closed CLI coverage for HTTP core semantic drift.
- `yanote-js/src/cli.summary.contract.test.ts` — machine-summary assertions updated for the new HTTP core fields.
- `yanote-js/src/cli.report.test.ts` — legacy summary/report coverage aligned with the additive HTTP core section.
- `yanote-js/src/cli.failclosed.contract.test.ts` — contract-level fail-closed assertions aligned with HTTP core primary codes.
