---
estimated_steps: 4
estimated_files: 5
skills_used:
  - debug-like-expert
  - vitest
---

# T02: Wire the `combined-report` CLI with fail-closed child-report loading and attributed summary output

**Slice:** S03 — Combined HTTP+async report/gate from canonical subreports
**Milestone:** M015

## Description

Add a `combined-report` command that loads canonical child report JSON, validates both inputs, writes the combined artifact, prints attributed human summary plus `YANOTE_COMBINED_SUMMARY`, and emits typed fail-closed errors when child inputs are missing, malformed, mismatched, or make the combined surface invalid.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| HTTP child report JSON loader | Fail with a typed input/runtime error naming the `http` child and its path; no empty fallback | N/A | Reject JSON or schema mismatch before combining |
| Async child report JSON loader | Fail with a typed input/runtime error naming the `async` child and its path; no synthetic green fallback | N/A | Reject JSON/schema drift and unknown protocol or status values before combining |
| Combined artifact writer | Surface `report=none` plus a typed runtime failure instead of partial files | N/A | Refuse to summarize a malformed combined DTO |

## Load Profile

- **Shared resources**: two parsed child reports, one combined writer pass, and one summary/error prioritization pass.
- **Per-operation cost**: two file reads, two schema validations, one combined write, and one attributed summary render.
- **10x breakpoint**: repeated large child-report parses and HTML writes dominate before the aggregation logic becomes expensive.

## Negative Tests

- **Malformed inputs**: unreadable path, invalid JSON, valid JSON with the wrong schema or phase, or swapped child file types.
- **Error paths**: HTTP child invalid while async child is ok, async child invalid while HTTP child is ok, and unwritable `--out` destinations.
- **Boundary conditions**: both children ok, one child partial with attributed top issues, and missing child HTML siblings while JSON inputs remain valid.

## Steps

1. Add `combined-report` to `yanote-js/src/cli.ts` with `--report <path>`, `--async-report <path>`, `--out <dir>`, and `--verbose`, reusing existing summary and error formatting patterns but with child attribution.
2. Load child JSON from disk, validate the HTTP report via `validateReport` and the async report via `validateAsyncReport`, derive combined overall status plus child-attributed top issues, and fail closed on wrong or tampered inputs.
3. Emit deterministic human summary sections plus one final `YANOTE_COMBINED_SUMMARY` line and typed `YANOTE_COMBINED_ERROR` / `YANOTE_COMBINED_ERROR_SECONDARY` lines that identify the failing child while keeping drill-down paths to both child reports and the combined report visible.
4. Add CLI tests covering green composition, partial child attribution, malformed or missing child reports, and write-path failures without regressing existing `report` / `async-report` commands.

## Must-Haves

- [ ] `combined-report` can compose canonical HTTP and async child JSON reports into a combined artifact and summary without requiring the original specs or events.
- [ ] Missing, malformed, or mismatched child inputs surface attributed typed failures and never produce a false-green combined summary.

## Verification

- `npm -C yanote-js test -- src/cli.combined-report.test.ts src/cli.combined-report.contract.test.ts`
- Expect exactly one final `YANOTE_COMBINED_SUMMARY` line on success, attributed child failures on broken input, and preserved child report paths in the summary/report output.

## Observability Impact

- Signals added/changed: `YANOTE_COMBINED_SUMMARY`, `YANOTE_COMBINED_ERROR`, and child-attributed `primary=` / `child=` tokens in summary and error output.
- How a future agent inspects this: run `node yanote-js/dist/yanote.cjs combined-report --report <http-json> --async-report <async-json> --out <dir>` and inspect stdout, stderr, and `yanote-combined-report.json`.
- Failure state exposed: the failing child path, validation class, and combined output path-or-`none` become explicit on every error.

## Inputs

- `yanote-js/src/cli.ts` — existing CLI command registration and summary/error formatting patterns.
- `yanote-js/src/report/combinedReport.ts` — combined DTO/writer contract from T01.
- `yanote-js/src/report/combinedSchema.ts` — combined schema validation behavior from T01.
- `yanote-js/src/report/writeCombinedReport.ts` — combined artifact writer from T01.
- `yanote-js/src/cli.summary.contract.test.ts` — HTTP summary contract patterns to mirror for deterministic human/machine output.
- `yanote-js/src/cli.async-report.contract.test.ts` — async summary contract patterns to mirror for child-attributed output.

## Expected Output

- `yanote-js/src/cli.ts` — new `combined-report` entrypoint, child report loading, and typed failure handling.
- `yanote-js/src/cli.combined-report.test.ts` — behavior coverage for green, partial, and broken child-report inputs.
- `yanote-js/src/cli.combined-report.contract.test.ts` — contract coverage for section order, one final machine line, and attributed summary tokens.
