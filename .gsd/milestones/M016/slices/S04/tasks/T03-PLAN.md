---
estimated_steps: 25
estimated_files: 6
skills_used: []
---

# T03: Shorten the analyzer and repo-demo path while preserving the standalone launcher truth

## Description

Finish the newcomer loop by turning the analyzer guide and examples landing into one short install-run-demo path that stays tied to the standalone launcher and the current compose example instead of CI/proof archaeology.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Analyzer guide and examples landing | Fail closed if either surface drifts back to proof bundles, `scripts/ci`, or raw Node seams as the primary path | N/A | Reject mixed messaging where the guide promises one launcher but the example path points elsewhere |
| Standalone analyzer/runtime verifiers | Keep the task red until docs and runtime proof agree on `yanote-analyzer.zip` -> `bin/yanote` -> `report` | N/A | Reject docs that pass wording checks but fail the real analyzer/runtime contract |
| Example boundary verifier | Localize whether drift lives in markdown wording or in the compose launcher contract | N/A | Reject example docs that bury the repo demo behind CI artifact families or maintainer breadcrumbs |

## Load Profile

- **Shared resources**: the analyzer guide, examples landing, compose example contract, and shell runtime verifiers.
- **Per-operation cost**: static markdown plus one real analyzer/runtime proof command.
- **10x breakpoint**: wording drift between analyzer docs, examples docs, and compose/runtime truth dominates before command cost matters.

## Negative Tests

- **Malformed inputs**: raw `node yanote-js/dist/yanote.cjs` commands, `.yanote-ci` / `build-and-test-artifacts` bundle names in the first-run example path, or missing `yanote-report.json` / `yanote-report.html` outputs.
- **Error paths**: `examples/README.md` describes CI proof archaeology instead of the repo demo, or the analyzer guide stops naming the release asset/launcher pair.
- **Boundary conditions**: analyzer docs stay short, standalone, and truthful; the examples landing shows one repo demo route and keeps release/support details secondary.

## Steps

1. Rewrite `docs/guides/analyzer-coverage.md` into a short install-run-read loop centered on `yanote-analyzer.zip`, `bin/yanote`, `report`, and the two report files, with deeper release/support details linked out instead of inlined.
2. Rewrite `examples/README.md` into one short repo demo route built around `docker-compose.yml`, the two leaf example READMEs, and the standalone analyzer contract rather than CI bundle archaeology.
3. Extend the short-doc verifier and update the analyzer/example boundary verifiers so they enforce short-path wording (for example analyzer guide <= 170 lines and examples landing <= 60 lines), ban proof-bundle-first navigation, and still keep the compose launcher contract fail-closed.
4. Re-run the standalone analyzer runtime proof and example boundary checks to prove the shortened docs still describe the real product path.

## Must-Haves

- [ ] The analyzer guide keeps the public standalone contract `yanote-analyzer.zip` -> `bin/yanote` -> `report` -> `yanote-report.json` / `yanote-report.html`.
- [ ] `examples/README.md` presents one short repo demo path and backlinks to the service/test leaf docs without foregrounding CI bundles or maintainer proof notes.
- [ ] Example and analyzer verifiers fail closed on raw Node seams, proof-bundle-first wording, or launcher drift.

## Inputs

- `docs/guides/getting-started.md`
- `docs/guides/analyzer-coverage.md`
- `examples/README.md`
- `examples/docker-compose.yml`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`
- `scripts/docs/verify-s03-example-boundary.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/docs/verify-s02-analysis-path.sh`

## Expected Output

- `docs/guides/analyzer-coverage.md`
- `examples/README.md`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`
- `scripts/docs/verify-s03-example-boundary.sh`
- `scripts/docs/verify-s04-boundaries.sh`

## Verification

bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s02-analysis-path.sh
