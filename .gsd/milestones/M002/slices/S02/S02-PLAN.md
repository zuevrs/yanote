# S02: Analysis Run And Coverage Interpretation

**Goal:** Give engineers one short, verified path from collected `events.jsonl` to a truthful Yanote report, and explain how the current RestAssured/Cucumber tagging surfaces affect what they see.
**Demo:** Starting from the repository docs and a real `events.jsonl`, an engineer can run the analyzer, get `yanote-report.json`, understand the core meaning of operation/status/parameter/aggregate coverage plus gate output, and configure the current tagging surfaces so suite data appears truthfully in the recorder/analyzer flow.

## Must-Haves

- A Russian-first canonical guide under `docs/guides/` documents the primary source-built analyzer path (`yanote-js`), the output location, the plain-text CLI summary, the `yanote-report.json` structure, and the core interpretation rules for operations, status codes, parameters, aggregate coverage, exclusions, and threshold failures.
- The slice adds executable proof for the real repo path: example service + RestAssured tests generate tagged `events.jsonl`, the analyzer runs without the bogus `/health` exclude, the report contains the expected dimension values and suite data, and a threshold-failure run still writes the report while surfacing `YANOTE_ERROR`.
- The docs explain the current test-tagging contract concretely for both `yanote-test-tags-restassured` and `yanote-test-tags-cucumber`, including the distinction between demo env vars and the real shared `yanote.suite` property surface.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s02-analysis-path.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test`

## Observability / Diagnostics

- Runtime signals: analyzer plain-text sections, final `YANOTE_SUMMARY` / `YANOTE_ERROR` lines, and the written `yanote-report.json` coverage/governance fields.
- Inspection surfaces: `scripts/docs/verify-s02-analysis-path.sh`, `scripts/docs/verify-s02-doc-links.sh`, retained temp `events.jsonl` / report / service logs on failure, and the canonical guides under `docs/guides/`.
- Failure visibility: proof scripts fail closed on missing events, skipped test reruns, missing suite propagation, unexpected coverage dimensions, broken links, or absent gate-error surfaces, and they print the retained artifact paths needed for localization.
- Redaction constraints: proof output should stay limited to routes, statuses, coverage numbers, suite names, and file paths; do not dump request bodies, auth headers, or secret-bearing env values.

## Integration Closure

- Upstream surfaces consumed: S01 recorder/evidence contract, `yanote-js` CLI/report contract, `examples/springmvc-service`, `examples/tests-restassured`, `examples/openapi/demo-openapi.yaml`, `dist/node-analyzer/README.md`, and the RestAssured/Cucumber tag modules.
- New wiring introduced in this slice: an executable analyzer proof script, a canonical analysis guide, a canonical test-tagging guide, cleaned example commands, and doc-contract checks that keep the analyzer/tagging path coherent.
- What remains before the milestone is truly usable end-to-end: concept-first landing and broader navigation work in S03/S05, plus version/support/trust-surface work in S04-S06.

## Tasks

- [x] **T01: Add executable proof for the analyzer and gate surfaces** `est:90m`
  - Why: S02 needs an objective runtime proof before the docs can claim a verified analysis and interpretation path.
  - Files: `scripts/docs/verify-s02-analysis-path.sh`
  - Do: Implement a proof script that builds the example service and analyzer, boots the example service, reruns the RestAssured test against a fresh `events.jsonl`, runs `yanote-js` against `examples/openapi/demo-openapi.yaml`, asserts the expected dimension values and per-operation suite data from the real report, then reruns with a failing aggregate threshold to assert exit code `3`, `YANOTE_ERROR`, and persisted report output. Retain temp/events/report/service logs on failure.
  - Verify: `bash scripts/docs/verify-s02-analysis-path.sh`
  - Done when: the script passes from a clean repo state and fails loudly on stale test execution, missing report fields, incorrect dimension semantics, missing suite propagation, or absent gate diagnostics.
- [x] **T02: Write the canonical analyzer guide and align analysis entry docs** `est:75m`
  - Why: Engineers need one authoritative explanation of how to run analysis and what the resulting coverage numbers mean.
  - Files: `docs/guides/analyzer-coverage.md`, `README.md`, `dist/node-analyzer/README.md`, `examples/docker-compose.yml`
  - Do: Add the Russian-first canonical analysis guide with the source-built CLI as the primary path, `dist/node-analyzer` as the offline fallback, the exact input/output command shape, explanation of CLI summary sections and report JSON fields, and a concrete interpretation example where operations are 100% but status/aggregate are still partial. Remove the stray `/health` exclude from the primary example command surfaces so the docs match the real proof path.
  - Verify: `bash scripts/docs/verify-s02-analysis-path.sh && rg -n "YANOTE_SUMMARY|yanote-report.json|operations|status|aggregate|node-analyzer|/health" docs/guides/analyzer-coverage.md README.md dist/node-analyzer/README.md examples/docker-compose.yml`
  - Done when: the guide and entry docs all point to one authoritative analyzer path, use truthful commands, and explain the observed coverage/result semantics without stale workaround flags.
- [x] **T03: Document the current RestAssured/Cucumber tagging contract and wire doc checks** `est:60m`
  - Why: R026 is about avoiding metadata drift; the repo needs one concrete explanation of how test tags reach recorder events and report suites.
  - Files: `docs/guides/test-tagging.md`, `docs/guides/recorder-spring-mvc.md`, `examples/tests-restassured/README.md`, `README.md`, `scripts/docs/verify-s02-doc-links.sh`
  - Do: Write a canonical tagging guide covering `YanoteRestAssuredFilter`, `YanoteSuiteNamePlugin`, `YANOTE_RUN_ID`, the example-only `YANOTE_SUITE` bridge, and the real shared `yanote.suite` property surface; explain where `test.run_id`, `test.suite`, and `coverage.perOperation[].suites` appear; then wire recorder/analyzer/root/example docs to that guide and add a doc-contract script that fails on broken links or incorrect env/property/header naming.
  - Verify: `bash scripts/docs/verify-s02-doc-links.sh && ./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test`
  - Done when: tagging guidance is concrete, repo entry surfaces link to it, and machine-checked docs prevent drift around suite/run metadata names and handoff semantics.

## Files Likely Touched

- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/test-tagging.md`
- `docs/guides/recorder-spring-mvc.md`
- `README.md`
- `dist/node-analyzer/README.md`
- `examples/docker-compose.yml`
- `examples/tests-restassured/README.md`
