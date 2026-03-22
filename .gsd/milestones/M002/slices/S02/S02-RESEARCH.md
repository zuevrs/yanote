# M002/S02 — Research

**Date:** 2026-03-12

## Summary

This slice directly owns **R025** (analyzer execution and coverage interpretation path) and **R026** (RestAssured/Cucumber tagging guidance), while supporting **R024** from S01. The core product pieces already exist: `yanote-js` has a deterministic CLI summary and schema-validated `yanote-report.json`, the repo example service and RestAssured test can produce tagged `events.jsonl`, and `dist/node-analyzer/` already exists as an offline bundle. What is missing is one canonical user-facing path that ties those surfaces together and explains what the report actually means.

The cleanest proof path is the repo’s own example service plus the RestAssured demo, followed by the source-built `yanote-js` CLI. I verified that path locally on 2026-03-12: after rerunning `:examples:tests-restassured:test` against a live example service, `node yanote-js/dist/yanote.cjs report --spec examples/openapi/demo-openapi.yaml --events /tmp/yanote-s02-events.jsonl --out /tmp/yanote-s02-out-noexclude --min-coverage 100` produced a real partial report with `operations=100%`, `status=75%`, `parameters=100%`, `aggregate=93.75%`, and `restassured-suite` present in every `coverage.perOperation[].suites` entry. A second run with `--min-aggregate 100` exited with code `3`, emitted `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE`, and still wrote `yanote-report.json`, which is exactly the kind of failure-state explanation S02 needs to document.

The biggest repo-level drift I found is in the current example analysis command: `--exclude /health` is misleading for the primary path. The demo spec does not define `/health`, and the RestAssured test deletes the events file after its readiness wait and before the real test traffic, so the exclude flag only creates an unmatched exclusion warning. S02 should remove that flag from the primary example and teach users to read the real dimensions instead of papering over them.

## Recommendation

Implement S02 around one authoritative analyzer journey and one authoritative tagging journey:

1. **Primary analysis path: source-built CLI in the repo**
   - Use `npm -C yanote-js ci`, `npm -C yanote-js run build`, then `node yanote-js/dist/yanote.cjs report ...` as the main documented path for repo readers.
   - Keep `dist/node-analyzer/README.md` as the offline fallback, not the headline path.

2. **Proof path: live example service → tagged events → real report**
   - Reuse `examples/springmvc-service` plus `examples/tests-restassured` to generate a real `events.jsonl` with `test.run_id` and `test.suite`.
   - Use `examples/openapi/demo-openapi.yaml` to produce a report that demonstrates the real interpretation edge: operations can be 100% while status and aggregate remain partial.
   - Protect the path with an executable script that also checks the threshold-failure surface.

3. **Interpretation guidance should explain dimensions, not only commands**
   - Explain the plain-text CLI sections (`Summary`, `Coverage Dimensions`, `Top Issues`, `Report Path`, `YANOTE_SUMMARY`).
   - Explain `status=partial` vs `operations=covered`, `parameters=N/A` / `parameters=covered`, `aggregate` meaning, `perOperation.status.missing`, and why `coverage.perOperation[].suites` is useful for report interpretation.
   - Explain that threshold failures still write the report file and surface their reason through `YANOTE_ERROR` and `governance.diagnostics`.

4. **Tagging guidance should stay concrete and current**
   - For RestAssured, document the shipped API: `YanoteRestAssuredFilter`, `YANOTE_RUN_ID` only in the example bridge, and `yanote.suite` as the library’s suite input surface.
   - For Cucumber, document `YanoteSuiteNamePlugin` as the source of `yanote.suite`, using the current feature-file-name derivation behavior.
   - Be explicit that `test.run_id` lives in `events.jsonl`, while report output currently preserves suite names per operation through `coverage.perOperation[].suites`.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Running analysis from repo sources | `yanote-js` CLI (`node yanote-js/dist/yanote.cjs report`) | It is the real shipped analyzer contract and already has summary/report tests. |
| Understanding report shape | `yanote-js/src/report/report.ts` + schema validation in `writeReport.ts` | Keeps docs aligned with the actual JSON fields and fail-closed schema behavior. |
| Producing tagged demo events | `examples/springmvc-service` + `examples/tests-restassured` | This path already exercises recorder + tag adapter + analyzer inputs with real repo assets. |
| RestAssured request tagging | `yanote-test-tags-restassured` / `YanoteRestAssuredFilter` | Prevents docs from inventing header-wiring conventions that drift from the published library. |
| Cucumber suite naming | `yanote-test-tags-cucumber` / `YanoteSuiteNamePlugin` | Reuses the existing suite derivation path instead of describing an imaginary plugin API. |
| Offline analyzer usage | `dist/node-analyzer/README.md` + `./gradlew distNodeAnalyzer` | The bundle already exists for closed-network/offline use; no need to invent a second fallback. |

## Existing Code and Patterns

- `yanote-js/src/cli.ts` — canonical analyzer command surface, option names, exit codes, and `YANOTE_SUMMARY` / `YANOTE_ERROR` behavior.
- `yanote-js/src/report/report.ts` — authoritative report JSON structure, including `summary`, coverage dimensions, `perOperation`, diagnostics, exclusions, and governance fields.
- `yanote-js/src/cli.summary.contract.test.ts` — proves section order and the single final machine summary line.
- `yanote-js/src/cli.report.test.ts` — proves that gate failures still write a report and that exclusion/governance data land in the JSON artifact.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — current end-to-end tagged-event generator; also reveals that `--rerun-tasks` is required in docs/proof scripts if we expect fresh `events.jsonl` from Gradle.
- `examples/openapi/demo-openapi.yaml` — the current real demo spec that produces a useful interpretation example: all operations covered, but `POST /users` still misses declared status `201`.
- `examples/docker-compose.yml` — existing end-to-end composition surface; currently useful as proof of wiring, but its `--exclude /health` flag should not survive into the primary documented path.
- `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java` — real RestAssured API contract: run ID from env only if the caller chooses that bridge, suite from `yanote.suite` system property.
- `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java` — current Cucumber contract: derive suite from feature URI file name (or fallback name) and write it into `yanote.suite`.

## Constraints

- The primary analyzer path in repo docs should use the source-built CLI; release/bundle/version visibility is a later S04 concern.
- `yanote-js` requires Node `>=20`, so S02 docs should state that plainly for the source-built path.
- The example event-generation step needs `:examples:tests-restassured:test --rerun-tasks` or an equivalent clean step; otherwise Gradle may skip the test and leave no fresh `events.jsonl`.
- The library surface for suites is `yanote.suite`, not `YANOTE_SUITE`; the env variable is only the demo/example bridge.
- The current report preserves suite names per operation but not run IDs, so docs should explain that distinction instead of implying the whole event payload is mirrored into the report.
- `dist/node-analyzer/` is still a generated bundle; docs must continue to say how to build it (`./gradlew distNodeAnalyzer`) before treating it as a local artifact.

## Common Pitfalls

- **Keeping `--exclude /health` in the primary analyzer example** — for the demo spec it only creates `unmatchedRules` noise and obscures the real status-dimension story.
- **Expecting Gradle to regenerate events on an up-to-date test task** — use `--rerun-tasks` in the proof path, or the analyzer step will fail on a missing events file.
- **Documenting `YANOTE_SUITE` as if the RestAssured library reads it directly** — the shipped filter reads `yanote.suite`; only the example bridges env into that property.
- **Treating `operations=100%` as equivalent to “fully covered”** — the current demo proves that status and aggregate dimensions can still be partial.
- **Assuming threshold failures destroy the report** — the analyzer still writes `yanote-report.json`; users should inspect the artifact and `YANOTE_ERROR` output instead of treating a non-zero exit as “no result.”

## Open Risks

- There is no standalone runnable Cucumber example in the repo, so the Cucumber guidance must stay concrete from source/tests without pretending there is an end-to-end demo.
- Root landing and doc taxonomy are still pre-S03/S05, so S02’s new guides need to be explicit about what is authoritative until broader navigation work lands.
- Source-built CLI docs and offline bundle docs can drift if they are not linked back to one canonical analyzer guide.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Node CLI / TypeScript | none found | none found |
| Java test-tag adapters | none found | none found |

## Sources

- The analyzer command surface, exit codes, failure ordering, and summary formatting come from `yanote-js/src/cli.ts` and its summary/report tests (source: [cli.ts](../../../../../yanote-js/src/cli.ts), [cli.summary.contract.test.ts](../../../../../yanote-js/src/cli.summary.contract.test.ts), [cli.report.test.ts](../../../../../yanote-js/src/cli.report.test.ts)).
- The report artifact fields and status rules come from the shipped report builder and writer (source: [report.ts](../../../../../yanote-js/src/report/report.ts), [writeReport.ts](../../../../../yanote-js/src/report/writeReport.ts)).
- The real tagged-event proof path already exists through the example service and RestAssured test (source: [ExampleServiceApplication.java](../../../../../examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java), [DemoServiceE2eTest.java](../../../../../examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java), [demo-openapi.yaml](../../../../../examples/openapi/demo-openapi.yaml)).
- The current test-tagging APIs are exactly what the docs need to describe: `YanoteRestAssuredFilter` for request headers and `YanoteSuiteNamePlugin` for suite derivation into `yanote.suite` (source: [YanoteRestAssuredFilter.java](../../../../../yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java), [YanoteSuiteNamePlugin.java](../../../../../yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java), [YanoteSuiteNamePluginTest.java](../../../../../yanote-test-tags-cucumber/src/test/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePluginTest.java)).
- The offline analyzer bundle already exists and should remain secondary to the repo-source path (source: [dist/node-analyzer/README.md](../../../../../dist/node-analyzer/README.md), [README.md](../../../../../README.md)).
- Local verification completed on 2026-03-12: `./gradlew --no-daemon :examples:springmvc-service:bootJar :examples:tests-restassured:testClasses` and `npm -C yanote-js ci && npm -C yanote-js run build` passed; a live example-service run plus `:examples:tests-restassured:test --rerun-tasks` produced `/tmp/yanote-s02-events.jsonl`; `node yanote-js/dist/yanote.cjs report --spec examples/openapi/demo-openapi.yaml --events /tmp/yanote-s02-events.jsonl --out /tmp/yanote-s02-out-noexclude --min-coverage 100` produced `operations=100.00 status=75.00 parameters=100.00 aggregate=93.75`; and `--min-aggregate 100` produced `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE` while still writing the report.
