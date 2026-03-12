---
id: T03
parent: S02
milestone: M002
provides:
  - "A canonical Russian-first tagging guide covering the live RestAssured/Cucumber metadata contract from env/property surfaces to recorder events and analyzer suites."
  - "A doc-contract script that checks local markdown links plus exact naming for `YANOTE_RUN_ID`, `YANOTE_SUITE`, `yanote.suite`, headers, event fields, and report suites."
key_files:
  - docs/guides/test-tagging.md
  - scripts/docs/verify-s02-doc-links.sh
  - docs/guides/recorder-spring-mvc.md
  - docs/guides/analyzer-coverage.md
  - examples/tests-restassured/README.md
  - README.md
key_decisions:
  - "Keep `docs/guides/test-tagging.md` as the canonical metadata handoff guide and make recorder/analyzer/root/example docs point to it instead of duplicating the contract."
  - "Treat `YANOTE_SUITE` as a demo/env bridge only, while `yanote.suite` remains the shared suite surface between Cucumber and RestAssured."
patterns_established:
  - "When docs span env vars, system properties, HTTP headers, recorded events, and analyzer report fields, protect the exact vocabulary with a doc-contract script instead of prose-only review."
  - "Runnable docs that depend on freshly generated `events.jsonl` should carry `--rerun-tasks` or an equivalent cache-bypass guard."
observability_surfaces:
  - "`bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s02-analysis-path.sh`, and `./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test`."
duration: 50m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T03: Document the current RestAssured/Cucumber tagging contract and wire doc checks

**Added a canonical tagging guide, rewired the repo docs to it, and locked the metadata vocabulary behind a runnable doc-contract check.**

## What Happened

I added `docs/guides/test-tagging.md` as the canonical S02 guide for the current metadata handoff contract.

The new guide covers:

- the real RestAssured surface in `YanoteRestAssuredFilter`, including explicit construction vs `fromEnv()` and the exact split between `YANOTE_RUN_ID` and `yanote.suite`;
- the repo demo bridge where `YANOTE_SUITE` is only a shell-friendly env input that gets copied into `yanote.suite`;
- the current Cucumber surface in `YanoteSuiteNamePlugin`, including feature-file-name suite derivation and the fact that the plugin writes `yanote.suite` rather than HTTP headers;
- where metadata lands after the handoff: `test.run_id` / `test.suite` in `events.jsonl` and `coverage.perOperation[].suites` in `yanote-report.json`, with the explicit boundary that run id does not currently move into the report.

Then I rewired the nearby docs so they point back to that guide instead of carrying competing explanations:

- `docs/guides/recorder-spring-mvc.md` now keeps only the recorder-facing header→event mapping and points to the canonical tagging guide for the full contract.
- `docs/guides/analyzer-coverage.md` now points to the tagging guide where it talks about per-operation `suites` and report-level suite provenance.
- `examples/tests-restassured/README.md` now frames itself as the runnable demo handoff, calls out `YANOTE_SUITE` as a demo/env bridge, and uses `--rerun-tasks` so the command matches the fresh-events proof contract.
- `README.md` now has a dedicated navigation section for the canonical test-tagging path and explains the report-level suite surface in one place.

I also added `scripts/docs/verify-s02-doc-links.sh` as the machine guardrail for this contract. The script verifies:

- the required docs exist;
- local markdown links between the root/guide/example surfaces resolve;
- the canonical guide and example docs keep the exact names for env vars, system property, headers, recorder fields, and analyzer suite output;
- the RestAssured example still documents the fresh-events `--rerun-tasks` guard.

One small fix landed during verification: the initial guard script used an unescaped backtick-bearing needle, which bash treated as command substitution. I corrected that check before running the final verification set.

## Verification

Task-level and slice-level verification all passed:

- `bash scripts/docs/verify-s02-doc-links.sh` ✅
- `bash scripts/docs/verify-s02-analysis-path.sh` ✅
  - passed with `events=4 routes=/admin/ping,/users,/users,/users/{id} run_id=manual-run-s02 suite=restassured-suite`
  - passed with `operations=4/4 operation_percent=100.00 status_percent=75.00 parameters_percent=100.00 aggregate_percent=93.75 suite=restassured-suite`
  - passed gate proof with `exit=3 code=GATE_MIN_AGGREGATE`
- `./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test` ✅

## Diagnostics

For future edits to tagging docs or metadata naming, rerun:

- `bash scripts/docs/verify-s02-doc-links.sh`
- `bash scripts/docs/verify-s02-analysis-path.sh`
- `./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test`

`verify-s02-doc-links.sh` is now the fastest drift detector for this area: it fails on broken local markdown links and on missing/renamed metadata vocabulary around `YANOTE_RUN_ID`, `YANOTE_SUITE`, `yanote.suite`, `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, and `coverage.perOperation[].suites`.

## Deviations

- `.gsd/milestones/M002/slices/S02/tasks/T03-PLAN.md` was absent at execution time, so I used the T03 entry in `S02-PLAN.md` as the authoritative task contract.

## Known Issues

None.

## Files Created/Modified

- `docs/guides/test-tagging.md` — new canonical guide for RestAssured/Cucumber metadata handoff, recorder event fields, and analyzer suite output.
- `scripts/docs/verify-s02-doc-links.sh` — doc-contract script for link integrity and exact metadata vocabulary.
- `docs/guides/recorder-spring-mvc.md` — reduced duplicate tagging prose and pointed recorder docs at the canonical guide.
- `docs/guides/analyzer-coverage.md` — linked report-level `suites` interpretation back to the canonical tagging guide.
- `examples/tests-restassured/README.md` — clarified the demo/env bridge, added the canonical guide link, and forced fresh-event test execution in the documented command.
- `README.md` — added root navigation for the canonical tagging path and corrected the Cucumber module description.
- `.gsd/DECISIONS.md` — recorded the canonical test-tagging documentation surface decision.
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — advanced the repo state to slice-complete follow-up.
