---
estimated_steps: 4
estimated_files: 2
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T04: Prove the standalone install/run path from the staged bundle

**Slice:** S01 — Standalone analyzer shipping contract
**Milestone:** M016

## Description

Add one rerunnable proof that stages and extracts the standalone analyzer bundle the way a user or release automation would, then proves `--version` and `report` work without source-build commands. This is the slice’s executable boundary proof for `R039` and `R042`.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `build/distributions/yanote-analyzer.zip` | Fail with exact missing-asset guidance and retain build/proof logs | Bundle build timeout retains the proof workspace for inspection | Malformed archive structure aborts before report execution |
| extracted `bin/yanote` | Non-zero exit retains stdout/stderr and extracted bundle layout | Report timeout retains fixtures and output paths | Missing or unexpected summary/report outputs fail closed |
| fixture-based `report` run | Missing report JSON/HTML or version drift fails the proof | Timed out report run retains extracted bundle and inputs | Malformed report surfaces fail with exact file/field diagnostics |

## Load Profile

- **Shared resources**: extracted standalone bundle, fixture inputs, retained proof directory, and stdout/stderr artifacts.
- **Per-operation cost**: one bundle build/extract, one `--version` call, and one `report` invocation.
- **10x breakpoint**: repeated bundle extraction and report generation dominate the cost.

## Negative Tests

- **Malformed inputs**: missing archive, missing launcher, or missing bundled runtime files after extraction.
- **Error paths**: `--version` reports the wrong version, `report` requires `node yanote-js/dist/yanote.cjs`, or report outputs are absent.
- **Boundary conditions**: extracted bundle works from outside the repo build tree and emits the same `yanote-report.json` / `yanote-report.html` contract as the existing fixtures.

## Steps

1. Add a focused verifier script that builds the standalone bundle, extracts it to a temp/proof directory, and records high-signal artifact locations on failure.
2. Assert the extracted launcher can answer `--version` and run `report` against existing fixture spec/events inputs without any `npm -C yanote-js ...` or `node yanote-js/dist/yanote.cjs` user command.
3. Retain stdout/stderr/report artifacts plus a small manifest/source-path note so future agents can localize launcher-vs-report-vs-doc drift.
4. Pin the verifier with a contract test that locks expected archive names, launcher commands, and proof artifacts.

## Must-Haves

- [ ] One command proves the standalone analyzer install/run story from the staged bundle.
- [ ] The proof retains enough artifacts to debug bundle-layout, launcher, and report failures separately.

## Verification

- `node --test scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs && bash scripts/ci/verify-m016-s01-standalone-analyzer.sh`
- Expect extracted-bundle proof artifacts plus a green `report` run from the standalone launcher.

## Observability Impact

- Signals added/changed: extracted bundle layout, retained stdout/stderr, version output, generated report artifacts, and a focused proof manifest/source-path note.
- How a future agent inspects this: rerun the verifier, inspect the retained proof directory, and compare launcher-vs-report outputs directly.
- Failure state exposed: archive drift, launcher breakage, and report-output regressions are separated inside the retained proof artifacts.

## Inputs

- `build/distributions/yanote-analyzer.zip` — standalone analyzer archive from T02.
- `yanote-js/test/fixtures/openapi/simple.yaml` — stable report input spec.
- `yanote-js/test/fixtures/events/events.ci.fixture.jsonl` — stable report input events.
- `scripts/ci/run-yanote-gradle-check.sh` — existing helper surface that should remain compatible with the bundle contract.

## Expected Output

- `scripts/ci/verify-m016-s01-standalone-analyzer.sh` — rerunnable standalone-bundle proof command.
- `scripts/ci/verify-m016-s01-standalone-analyzer.contract.test.mjs` — script contract coverage for expected archive names, commands, and retained artifacts.
