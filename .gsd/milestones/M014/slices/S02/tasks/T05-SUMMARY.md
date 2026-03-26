---
id: T05
parent: S02
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/cli.ts", "yanote-js/src/cli.async-report.contract.test.ts", "yanote-js/src/cli.async-report.test.ts", "yanote-js/src/cli.remote-spec.contract.test.ts", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Formatted async runtime CLI detail rows from report.runtimeSemantics with sanitized message names while keeping machine summary tokens counts-only and redaction-safe.", "Updated satisfied-runtime CLI fixtures to use normalized AsyncHeaderEvidence JSONL objects because raw string headers normalize away and fail closed once runtime semantics gate the command."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build` and confirmed the widened async CLI/report contracts pass with deterministic runtime sections, machine tokens, typed stderr ordering, and remote-spec handling. Then executed the built CLI directly against `yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml` plus `yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl` and verified one final `YANOTE_ASYNC_SUMMARY` line, primary `ASYNC_SEMANTIC_CORRELATION_ID_MISSING` stderr selection, `report=.../yanote-async-report.json`, additive `runtime_*` tokens, and no retained `corr-runtime-mismatch` or `orders.deadletter` leakage in stdout or stderr."
completed_at: 2026-03-26T11:32:21.245Z
blocker_discovered: false
---

# T05: Surfaced header-backed async runtime semantics through async-report stdout, stderr, and machine tokens while preserving the JSON-centered report contract.

> Surfaced header-backed async runtime semantics through async-report stdout, stderr, and machine tokens while preserving the JSON-centered report contract.

## What Happened
---
id: T05
parent: S02
milestone: M014
key_files:
  - yanote-js/src/cli.ts
  - yanote-js/src/cli.async-report.contract.test.ts
  - yanote-js/src/cli.async-report.test.ts
  - yanote-js/src/cli.remote-spec.contract.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Formatted async runtime CLI detail rows from report.runtimeSemantics with sanitized message names while keeping machine summary tokens counts-only and redaction-safe.
  - Updated satisfied-runtime CLI fixtures to use normalized AsyncHeaderEvidence JSONL objects because raw string headers normalize away and fail closed once runtime semantics gate the command.
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:32:21.246Z
blocker_discovered: false
---

# T05: Surfaced header-backed async runtime semantics through async-report stdout, stderr, and machine tokens while preserving the JSON-centered report contract.

**Surfaced header-backed async runtime semantics through async-report stdout, stderr, and machine tokens while preserving the JSON-centered report contract.**

## What Happened

Extended `yanote async-report` so the CLI now renders a dedicated Runtime Semantics section sourced from `report.runtimeSemantics`, including per-operation runtime proof state, aggregate satisfied/unsatisfied counts, diagnostic totals, and redaction-safe runtime diagnostic detail lines. Kept declared-vs-runtime truth separate, preserved `Report Path` / `report=` on `yanote-async-report.json`, and widened `YANOTE_ASYNC_SUMMARY` with additive `runtime_*` tokens instead of changing legacy async coverage fields. Expanded the focused Vitest contract and end-to-end CLI suites to pin section order, runtime summary tokens, typed primary/secondary stderr ordering, redaction-safe failure output, and local-file/local-directory/remote-url spec determinism. Updated the satisfied-runtime CLI fixtures to use normalized retained-header evidence objects so success cases exercise the truthful header-backed runtime proof path instead of degrading into fail-closed missing/unavailable semantics, and recorded that fixture rule in `.gsd/KNOWLEDGE.md`.

## Verification

Ran `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build` and confirmed the widened async CLI/report contracts pass with deterministic runtime sections, machine tokens, typed stderr ordering, and remote-spec handling. Then executed the built CLI directly against `yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml` plus `yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl` and verified one final `YANOTE_ASYNC_SUMMARY` line, primary `ASYNC_SEMANTIC_CORRELATION_ID_MISSING` stderr selection, `report=.../yanote-async-report.json`, additive `runtime_*` tokens, and no retained `corr-runtime-mismatch` or `orders.deadletter` leakage in stdout or stderr.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/cli.async-report.contract.test.ts src/cli.async-report.test.ts src/cli.remote-spec.contract.test.ts && npm -C yanote-js run build` | 0 | ✅ pass | 2219ms |
| 2 | `node yanote-js/dist/yanote.cjs async-report --spec yanote-js/test/fixtures/asyncapi/header-runtime-inline-v3.yaml --events yanote-js/test/fixtures/async-events/header-runtime-failures.fixture.jsonl --out <tmp> --profile local` | 5 | ✅ pass | 513ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `.gsd/KNOWLEDGE.md`


## Deviations
None.

## Known Issues
None.
