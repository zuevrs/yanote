# S02: Deprecated Operation Truth Without Numerator Drift — UAT

**Milestone:** M013
**Written:** 2026-03-26T01:35:16.193Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice changes the canonical HTTP analyzer/report/CLI outputs and ships a retained proof bundle, so the highest-value acceptance path is to rerun the real CLI proof and inspect the retained JSON/stdout artifacts directly.

## Preconditions

- Run from the repository worktree with Node dependencies available for `yanote-js`.
- The fixture files `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` and `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl` exist.
- The tester can write into `.yanote-ci/deprecated-operations-proof/`.

## Smoke Test

1. Run `bash scripts/ci/verify-m013-s02-deprecated-operations.sh`.
2. Confirm the command exits successfully and prints `Deprecated-operations proof bundle ready at .yanote-ci/deprecated-operations-proof.`
3. **Expected:** the retained bundle contains `artifact-manifest.txt`, `cli-report/stdout.txt`, `cli-report/stderr.txt`, `cli-report/exit-code.txt`, and `cli-report/out/yanote-report.json`.

## Test Cases

### 1. CLI summary makes deprecated truth explicit without changing the legacy denominator

1. Open `.yanote-ci/deprecated-operations-proof/cli-report/stdout.txt`.
2. Locate the `Summary` block.
3. Check that it contains `- operations: 2/3 (66.67%)`.
4. Check that it also contains `- deprecated operations: covered=0/1 uncovered=1 (0.00%)`.
5. Check `Top Issues` for `http GET /legacy-users - deprecated operation is uncovered`.
6. Check the `YANOTE_SUMMARY` line for `deprecated_operations=0.00`, `deprecated_total=1`, `deprecated_covered=0`, and `deprecated_uncovered=1` while `covered=2/3` remains unchanged.
7. **Expected:** deprecated truth is explicit and machine-readable, but the legacy operation numerator is still `2/3`, not `2/2`.

### 2. Canonical JSON report carries additive deprecated metadata

1. Open `.yanote-ci/deprecated-operations-proof/cli-report/out/yanote-report.json`.
2. Inspect `summary.deprecatedOperations`.
3. Confirm it reports `totalOperations: 1`, `coveredOperations: 0`, `uncoveredOperations: 1`, and `operationCoveragePercent: 0`.
4. Inspect `coverage.perOperation` and find the `http GET /legacy-users` row.
5. Confirm that row has `deprecated: true` and remains `operation.state: "UNCOVERED"`.
6. Confirm the non-deprecated `GET /users` and `POST /users` rows have `deprecated: false` and remain covered.
7. **Expected:** deprecated metadata appears as additive truth on the canonical report while the established coverage rows and states stay intact.

### 3. Retained proof bundle states the boundary and preserved denominator explicitly

1. Open `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`.
2. Verify it records the rerun command using `node yanote-js/dist/yanote.cjs report ...` against the deprecated fixture paths.
3. Verify it includes `legacy_operations=2/3`, `deprecated_operations=0/1`, `deprecated_total=1`, `deprecated_covered=0`, and `deprecated_uncovered=1`.
4. Verify it includes `http_only=true`, `async_artifacts_present=false`, and `dashboard_artifacts_present=false`.
5. **Expected:** one manifest is enough to prove the retained bundle still targets the supported HTTP path, preserves the legacy denominator, and has not widened into async or dashboard surfaces.

## Edge Cases

### Deprecated uncovered operation does not silently turn the run green

1. In the retained CLI stdout, verify the summary status is `partial` and `Top Issues` still shows the ordinary operation-coverage gate warning.
2. Confirm the deprecated operation is called out separately as uncovered rather than removed from the denominator.
3. **Expected:** a deprecated uncovered operation is still visible as uncovered truth, and the run does not silently drift to a green `covered=2/2` interpretation.

### Async boundary remains unchanged

1. Inspect `artifact-manifest.txt` for `async_artifacts_present=false`.
2. Confirm the retained bundle does not contain `yanote-async-report.json`, `YANOTE_ASYNC_SUMMARY`, or any async-only artifact names.
3. **Expected:** deprecated-operation reporting remains an HTTP-only surface in S02.

## Failure Signals

- `bash scripts/ci/verify-m013-s02-deprecated-operations.sh` fails or does not retain the proof bundle.
- `stdout.txt` is missing the deprecated summary line or the `YANOTE_SUMMARY deprecated_*` tokens.
- `yanote-report.json` is missing `summary.deprecatedOperations` or `coverage.perOperation[].deprecated`.
- The legacy summary drifts from `covered=2/3` to `covered=2/2`.
- Async or dashboard artifacts appear in the retained bundle.

## Requirements Proved By This UAT

- R024 — The deprecated-operation portion of analyzer-consumption UX is now proven on the supported HTTP JSON/CLI/report path with a retained proof bundle, while the remaining static HTML and CI/docs/support work stays for later slices.

## Not Proven By This UAT

- Separate static HTML report artifacts (`yanote-report.html` / `yanote-async-report.html`); that remains S03.
- The CI/docs/support publication closeout for the new deprecated semantics; that remains S04.
- Any change to async-report, broker boundaries, or a combined dashboard/report surface.

## Notes for Tester

Use foreground `bash`/`node` commands from the active worktree for authoritative proof reruns. In this repo’s worktree flow, background runners can resolve against the parent checkout and make a passing slice look broken even when the retained proof in the worktree is correct.
