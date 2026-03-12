---
id: T01
parent: S02
milestone: M002
provides:
  - "Executable proof of the example service → tagged events → analyzer happy path using current repo assets."
  - "Executable proof that aggregate-threshold failures still emit `YANOTE_ERROR` and persist `yanote-report.json`."
key_files:
  - scripts/docs/verify-s02-analysis-path.sh
key_decisions:
  - "Use the repo example service, RestAssured demo, and source-built `yanote-js` CLI as the S02 proof surface instead of the offline bundle or a synthetic fixture."
  - "Require `:examples:tests-restassured:test --rerun-tasks` in the proof path so the script always regenerates a fresh `events.jsonl`."
patterns_established:
  - "Analysis proof scripts should assert both the happy-path report semantics and one real gate-failure surface, not just command success."
  - "If docs rely on generated events, the proof path should explicitly guard against Gradle up-to-date skips before trusting the resulting file."
observability_surfaces:
  - "`scripts/docs/verify-s02-analysis-path.sh` retains build, analyzer-build, service, test, stdout, stderr, events, and report paths on failure and validates `YANOTE_SUMMARY` / `YANOTE_ERROR` plus report JSON fields."
duration: 45m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T01: Add executable proof for the analyzer and gate surfaces

**Added a real analyzer proof script that regenerates tagged events, validates the happy-path report semantics, and proves threshold failures still write the report.**

## What Happened

I added `scripts/docs/verify-s02-analysis-path.sh` as the runtime proof surface for S02.

The script now:

- builds the example Spring Boot service/test classes and the `yanote-js` analyzer;
- starts the example service on a temp port and temp `events.jsonl` path;
- reruns `:examples:tests-restassured:test` with `--rerun-tasks` plus explicit `YANOTE_RUN_ID`, `YANOTE_SUITE`, `YANOTE_BASE_URI`, and `YANOTE_EVENTS_PATH` so the file is always regenerated;
- asserts that the final `events.jsonl` contains exactly the four expected routes, contains no stray `/health` traffic, and preserves the expected `test.run_id` / `test.suite` values;
- runs the analyzer happy path without `/health` exclude and validates the real report contract: `4/4` operations covered, `100%` operation coverage, `75%` status coverage, `100%` parameter coverage, `93.75%` aggregate coverage, `POST /users` missing declared status `201`, and `restassured-suite` present in every `coverage.perOperation[].suites` entry;
- reruns the analyzer with `--min-aggregate 100` and asserts exit code `3`, `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE`, and a persisted `yanote-report.json`.

During execution I confirmed the research finding that the proof path must force the Gradle test task to rerun. A plain `:examples:tests-restassured:test` had been up-to-date and produced no fresh events file, so the script bakes `--rerun-tasks` into the contract instead of leaving it as a tribal-memory footnote.

## Verification

- `bash scripts/docs/verify-s02-analysis-path.sh` ✅
  - passed with `events=4 routes=/admin/ping,/users,/users,/users/{id} run_id=manual-run-s02 suite=restassured-suite`
  - passed with `operations=4/4 operation_percent=100.00 status_percent=75.00 parameters_percent=100.00 aggregate_percent=93.75 suite=restassured-suite`
  - passed gate proof with `exit=3 code=GATE_MIN_AGGREGATE`

## Diagnostics

Future agents should rerun `bash scripts/docs/verify-s02-analysis-path.sh` before editing analyzer-path docs or example commands.

On failure the script retains and prints:

- Gradle example build log
- analyzer build log
- example-service log
- RestAssured test log
- happy-path stdout/stderr
- gate-path stdout/stderr
- generated `events.jsonl`
- both report directories

This localizes whether the drift came from service boot, event generation, report output, suite propagation, or threshold diagnostics.

## Deviations

None.

## Known Issues

- The repo still has user-facing docs and example commands to update in T02/T03; this task only established the executable proof surface.

## Files Created/Modified

- `scripts/docs/verify-s02-analysis-path.sh` — executable end-to-end proof for tagged-event generation, happy-path report semantics, and threshold-failure diagnostics.
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — marked T01 complete.
