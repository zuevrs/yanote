# S04: Product docs and example reshape

**Goal:** Reshape README, newcomer docs, and example guidance into one short product-first path for recorder, tagging, analyzer, and the repo demo without reintroducing maintainer or proof archaeology.
**Demo:** After this: A new reader can open the repository and follow short product-facing docs for recorder, tagging, and analyzer without maintainer/proof archaeology.

## Tasks
- [x] **T01: Added a newcomer quickstart and fail-closed landing verifiers for the short docs path.** — ## Description

Create the short newcomer entrypoint that S03 intentionally left for this slice: one explicit quickstart plus trimmed root/docs landings that send readers first to the product loop instead of deep proof, release, or maintainer surfaces.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public landing markdown (`README.md`, `docs/README.md`) | Fail closed until the new newcomer path is first in the navigation order and the stale long-form tails are removed | N/A | Reject broken or circular newcomer links instead of silently keeping stale navigation |
| Short-doc verifier and contract test | Keep the task red on missing size ceilings, broken backlinks, or reintroduced proof-first wording | N/A | Reject a verifier that passes overlong or maintainer-first landings |

## Load Profile

- **Shared resources**: the root landing, docs landing, and one new quickstart surface.
- **Per-operation cost**: static markdown plus a small shell verifier and fixture-backed contract test.
- **10x breakpoint**: wording drift across entry surfaces becomes the main failure source long before runtime cost matters.

## Negative Tests

- **Malformed inputs**: missing quickstart link, broken local markdown link, or duplicated/garbled tail text left in the landing docs.
- **Error paths**: `README.md` or `docs/README.md` still foreground `scripts/ci`, CI bundle names, maintainer docs, or reference maps before the newcomer path.
- **Boundary conditions**: the new quickstart exists, both landings stay under explicit size ceilings, and deeper release/support guidance stays secondary.

## Steps

1. Add `docs/guides/getting-started.md` as the one short newcomer path for recorder -> tagging -> analyzer -> repo demo.
2. Rewrite `README.md` and `docs/README.md` so they point to that quickstart first, keep release/support as a secondary boundary owner, and remove the duplicated/garbled tail content currently visible in both files.
3. Add `scripts/docs/verify-m016-s04-short-docs.sh` plus `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` to fail closed on broken newcomer links, proof-first wording, or size drift (for example `README.md` <= 80 lines, `docs/README.md` <= 70 lines, quickstart <= 140 lines).
4. Update the existing landing verifier so the newcomer path/backlinks are part of the contract.

## Must-Haves

- [ ] Root and docs landings become short entry surfaces that send a reader first to `docs/guides/getting-started.md`.
- [ ] The quickstart names the recorder, tagging, analyzer, and example branches without opening with CI/proof archaeology.
- [ ] Verifiers fail closed on overlong landings, missing newcomer links, or reintroduced proof-first wording.
  - Estimate: 50m
  - Files: README.md, docs/README.md, docs/guides/getting-started.md, scripts/docs/verify-m016-s04-short-docs.sh, scripts/docs/verify-m016-s04-short-docs.contract.test.mjs, scripts/docs/verify-s03-landing.sh
  - Verify: bash scripts/docs/verify-m016-s04-short-docs.sh && node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs && bash scripts/docs/verify-s03-landing.sh
- [x] **T02: Shortened the recorder and tagging guides and aligned the Spring MVC and RestAssured example READMEs to one explicit evidence loop.** — ## Description

Turn the recorder and test-tagging docs into short task-oriented guides that match the real Spring MVC and RestAssured/Cucumber contracts, then align the two leaf example READMEs to the same vocabulary and handoff.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Recorder guide vs runtime recorder proof | Keep the task red until the documented dependency, properties, and `events.jsonl` checks match the real recorder behavior | N/A | Reject docs that omit required properties or promise fields the recorder does not write |
| Tagging guide vs current RestAssured/Cucumber contract | Fail closed if `YANOTE_SUITE` is promoted into the shared contract or if the header -> JSONL -> report mapping drifts | N/A | Reject mixed wording where examples and canonical docs disagree on `yanote.suite`, `X-Test-Run-Id`, or `X-Test-Suite` |
| Leaf example READMEs | Keep the task red until the service and test examples backlink correctly and mirror the short canonical path | N/A | Reject leaf docs that force readers back into long proof narratives |

## Load Profile

- **Shared resources**: recorder/tagging guides, the two example leaf READMEs, and existing shell/runtime verifiers.
- **Per-operation cost**: static markdown plus one runtime recorder proof command.
- **10x breakpoint**: wording drift between canonical guides and leaf examples dominates before command cost matters.

## Negative Tests

- **Malformed inputs**: missing `yanote.recorder.events-path`, missing `X-Test-Run-Id` / `X-Test-Suite` mapping, or missing `coverage.perOperation[].suites` explanation.
- **Error paths**: `YANOTE_SUITE` is described as the shared library surface, or example docs name env/property/header values that no longer match the guides.
- **Boundary conditions**: recorder docs stay short and explicit, tagging docs preserve the true contract boundaries, and the leaf examples remain runnable companions instead of alternate canonical docs.

## Steps

1. Rewrite `docs/guides/recorder-spring-mvc.md` around one short loop: add dependency, set recorder properties/env, send a request, and prove `events.jsonl`.
2. Rewrite `docs/guides/test-tagging.md` around the header/property/dataflow loop and keep the Cucumber + RestAssured boundaries truthful and minimal.
3. Align `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` to the same property/env/header names and backlink structure.
4. Update the recorder/tagging doc verifiers to check the shorter structure and current contract surfaces (for example recorder guide <= 120 lines and tagging guide <= 140 lines) without pinning exact prose.

## Must-Haves

- [ ] The recorder guide names the dependency, required properties/env, and the `events.jsonl` proof check in one short runnable loop.
- [ ] The tagging guide names `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, and `coverage.perOperation[].suites`, while keeping `YANOTE_SUITE` demo-only.
- [ ] The service and RestAssured example READMEs mirror the canonical guide vocabulary and stay short.
  - Estimate: 1h
  - Files: docs/guides/recorder-spring-mvc.md, docs/guides/test-tagging.md, examples/springmvc-service/README.md, examples/tests-restassured/README.md, scripts/docs/verify-s01-doc-links.sh, scripts/docs/verify-s02-doc-links.sh
  - Verify: bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s01-recorder-path.sh
- [x] **T03: Shortened the analyzer guide and examples landing into one standalone-launcher demo path with fail-closed wording checks.** — ## Description

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
  - Estimate: 1h
  - Files: docs/guides/analyzer-coverage.md, examples/README.md, scripts/docs/verify-m016-s04-short-docs.sh, scripts/docs/verify-m016-s04-short-docs.contract.test.mjs, scripts/docs/verify-s03-example-boundary.sh, scripts/docs/verify-s04-boundaries.sh
  - Verify: bash scripts/docs/verify-m016-s04-short-docs.sh && bash scripts/docs/verify-s03-example-boundary.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s02-analysis-path.sh
