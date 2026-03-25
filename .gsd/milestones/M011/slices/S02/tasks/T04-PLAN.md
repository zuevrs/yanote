---
estimated_steps: 3
estimated_files: 4
skills_used:
  - vitest
---

# T04: Expose typed request-semantic failures through CLI summary surfaces

**Slice:** S02 — Supported Serialization Subset And Cookie Conformance
**Milestone:** M011

## Description

Preserve R003 by keeping widened request semantics on the public path teams already use. This task teaches the CLI to show typed request-semantic failures, keep one primary issue, and avoid duplicating the same drift as both a semantic failure and a medium request diagnostic.

## Steps

1. Update `yanote-js/src/cli.ts` to consume request-semantic governance failures, keep one primary high-severity issue when request semantics fail closed, and avoid double-reporting the same drift in Top Issues.
2. Preserve the existing request truth rollups on stdout and `YANOTE_SUMMARY` while ensuring request semantic failures appear in stderr/stdout primary-failure surfaces deterministically.
3. Expand CLI contract tests for unsupported serialization, unavailable evidence, and mixed failure ordering without leaking raw retained values.

## Must-Haves

- [ ] `yanote report` exit 5 / stderr / summary surfaces all show typed request semantic failures through existing public entrypoints.
- [ ] Top Issues prefers one semantic primary issue over duplicate medium request diagnostics for the same drift.
- [ ] `YANOTE_SUMMARY` and human-readable request sections stay stable and secret-safe on green runs.

## Inputs

- `yanote-js/src/gates/httpRequestSemantics.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`

## Expected Output

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`

## Verification

- `npm -C yanote-js test -- src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`

## Observability Impact

- Signals added/changed: CLI stderr/stdout and `YANOTE_SUMMARY` expose typed request-semantic primaries while keeping request truth rollups stable.
- How a future agent inspects this: run the focused CLI contract tests and inspect stdout/stderr for one primary issue plus sanitized request summaries.
- Failure state exposed: request semantic failures become visible at the human and machine summary boundary without leaking retained values.
