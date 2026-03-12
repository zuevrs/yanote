---
estimated_steps: 8
estimated_files: 1
---

# T01: Add executable proof for the analyzer and gate surfaces

**Slice:** S02 — Analysis Run And Coverage Interpretation
**Milestone:** M002

## Description

Add one executable proof script that exercises the real repository analysis path end to end: boot the example Spring service, regenerate tagged `events.jsonl` through the RestAssured demo, run the source-built `yanote-js` analyzer against the example OpenAPI spec, assert the expected coverage/result semantics from the written report, and verify that a threshold-failure run still writes the report and emits `YANOTE_ERROR`.

## Steps

1. Build the example service and `yanote-js`, then start the example service against a temp events path.
2. Rerun `:examples:tests-restassured:test` with `--rerun-tasks` and temp env values so the script always produces a fresh events file.
3. Run the analyzer happy path without the stale `/health` exclude and capture stdout/stderr plus the report path.
4. Assert on the real report JSON fields: total/covered operations, status/parameter/aggregate dimensions, `POST /users` missing `201`, and `restassured-suite` in `coverage.perOperation[].suites`.
5. Run the analyzer again with `--min-aggregate 100` and assert exit code `3`, `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE`, and persisted `yanote-report.json`.
6. Preserve temp paths and log tails on failure so a future agent can localize boot, test, event, or analyzer drift quickly.
7. Keep output redacted to coverage numbers, routes, statuses, suite names, and file paths.
8. Make the script pass from a clean repo state without manual cleanup.

## Must-Haves

- [ ] The script proves the happy path with real tagged events and a real `yanote-report.json` built from current repo assets.
- [ ] The script proves the threshold-failure diagnostic surface without losing the report artifact.

## Verification

- `bash scripts/docs/verify-s02-analysis-path.sh`
- The command exits `0` and prints the validated happy-path and gate-failure artifact locations/summary checks.

## Observability Impact

- Signals added/changed: retained temp events/report/service logs on failure plus explicit assertions against `YANOTE_SUMMARY`, `YANOTE_ERROR`, and report JSON fields.
- How a future agent inspects this: rerun `bash scripts/docs/verify-s02-analysis-path.sh` and inspect the printed temp/log paths when it fails.
- Failure state exposed: missing events generation, skipped test rerun, example service boot failure, report-schema drift, suite-propagation drift, or missing threshold diagnostics.

## Inputs

- `examples/springmvc-service/` — runnable service that records HTTP traffic into `events.jsonl`.
- `examples/tests-restassured/` — current tagged-request generator and the truth source for run/suite propagation behavior.
- `examples/openapi/demo-openapi.yaml` — spec used to interpret the recorded events.
- `yanote-js/src/cli.ts` and `yanote-js/src/report/report.ts` — analyzer output and report contracts the script must assert.

## Expected Output

- `scripts/docs/verify-s02-analysis-path.sh` — executable proof of the example service → tagged events → analyzer happy path and gate-failure path.
