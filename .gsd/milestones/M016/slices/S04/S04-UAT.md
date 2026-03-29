# S04: Product docs and example reshape — UAT

**Milestone:** M016
**Written:** 2026-03-29T02:31:42.088Z

# S04: Product docs and example reshape — UAT

**Milestone:** M016
**Written:** 2026-03-29T00:34:59+03:00

## Preconditions
- Work from the M016 worktree root.
- `bash`, `node`, Java/Gradle, and `unzip` are available.
- The repository already contains the S04 doc guides, example READMEs, and verifier scripts.
- No manual doc edits are pending while running UAT.

## Test Case 1 — Root and docs landings send a newcomer to one quickstart-first path
**Goal:** prove the public landings no longer start with release/proof archaeology.

1. Run:
   ```bash
   bash scripts/docs/verify-m016-s04-short-docs.sh
   ```
   **Expected:** the command exits `0` and reports that newcomer, analyzer, and repo-demo docs stay short and product-first.
2. Open `README.md`.
   **Expected:** the first local markdown link points to `docs/guides/getting-started.md`, and the page stays short (well under the 80-line ceiling).
3. Open `docs/README.md`.
   **Expected:** the first local markdown link points to `guides/getting-started.md`, and the page stays short (well under the 70-line ceiling).
4. Confirm both pages mention release/support only as a secondary boundary.
   **Expected:** they link to `docs/release-and-support.md`, but the newcomer path is still the first route.

## Test Case 2 — The quickstart covers the whole product loop with concrete proof checks
**Goal:** prove a first-time reader can follow one short recorder -> tagging -> analyzer -> repo-demo path.

1. Open `docs/guides/getting-started.md`.
   **Expected:** it includes all four steps in order: recorder, tagging, analyzer, repo demo.
2. In the recorder step, inspect the proof command.
   **Expected:** the guide includes `test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"` and explains that `events.jsonl` is the required evidence file.
3. In the tagging step, inspect the contract wording.
   **Expected:** the guide names `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, and `coverage.perOperation[].suites`, and states that `YANOTE_SUITE` is a demo/env bridge rather than the shared library contract.
4. In the analyzer step, inspect the launcher wording.
   **Expected:** the guide names `yanote-analyzer.zip`, `bin/yanote report`, `yanote-report.json`, and `yanote-report.html`.
5. In the repo-demo step, inspect the backlinks.
   **Expected:** it points to `examples/README.md` and keeps the same loop vocabulary used in the earlier steps.

## Test Case 3 — The recorder guide stays short and its documented contract is runtime-proven
**Goal:** prove the short recorder docs still describe a real working path.

1. Run:
   ```bash
   bash scripts/docs/verify-s01-doc-links.sh
   bash scripts/docs/verify-s01-recorder-path.sh
   ```
   **Expected:** both commands exit `0`.
2. Review `docs/guides/recorder-spring-mvc.md`.
   **Expected:** it stays on one short loop: dependency, recorder properties/env, one live request, and `events.jsonl` proof.
3. Review `examples/springmvc-service/README.md`.
   **Expected:** it uses the same `yanote.recorder.events-path` / `YANOTE_EVENTS_PATH` vocabulary and points back to the canonical recorder guide.
4. Review the runtime verifier output from `verify-s01-recorder-path.sh`.
   **Expected:** it publishes the recorder to `mavenLocal()`, boots the smoke Spring fixture, sends a real request, and reports a passing JSONL contract with `method=GET`, `route=/orders/{orderId}`, `status=200`, the expected `service`, and `test.run_id=None`, `test.suite=None`.

## Test Case 4 — The tagging guide and RestAssured/Cucumber example agree on the exact handoff
**Goal:** prove the short tagging docs match the actual example vocabulary and contract boundary.

1. Run:
   ```bash
   bash scripts/docs/verify-s02-doc-links.sh
   ```
   **Expected:** the command exits `0`.
2. Open `docs/guides/test-tagging.md`.
   **Expected:** it explicitly shows `X-Test-Run-Id` -> `test.run_id`, `X-Test-Suite` -> `test.suite`, and `test.suite` -> `coverage.perOperation[].suites`.
3. Confirm the RestAssured surface description.
   **Expected:** the guide mentions `YanoteRestAssuredFilter.fromEnv()`, `YANOTE_RUN_ID`, and `yanote.suite`, and does **not** promote `YANOTE_SUITE` as the shared library contract.
4. Open `examples/tests-restassured/README.md`.
   **Expected:** it mirrors the same wording, explicitly calling `YANOTE_SUITE` a demo/env bridge and pointing back to the canonical tagging and recorder guides.
5. Check the backlink chain.
   **Expected:** `examples/tests-restassured/README.md` links back to `examples/README.md`, `docs/guides/test-tagging.md`, and `docs/guides/recorder-spring-mvc.md`.

## Test Case 5 — The analyzer guide and examples landing keep the standalone launcher story short and truthful
**Goal:** prove the analyzer and repo-demo docs stay product-first without drifting back to raw Node or proof-bundle archaeology.

1. Run:
   ```bash
   bash scripts/docs/verify-s03-example-boundary.sh
   bash scripts/docs/verify-s04-boundaries.sh
   bash scripts/docs/verify-s02-analysis-path.sh
   ```
   **Expected:** all three commands exit `0`.
2. Open `docs/guides/analyzer-coverage.md`.
   **Expected:** the first screen is the standalone analyzer story: `yanote-analyzer.zip`, `./yanote-analyzer/bin/yanote`, `report`, `yanote-report.json`, and `yanote-report.html`.
3. Confirm raw Node is not the public path.
   **Expected:** the guide does **not** use `node yanote-js/dist/yanote.cjs report` as the canonical command.
4. Open `examples/README.md`.
   **Expected:** it presents one short repo-demo route via `docker-compose.yml`, points to the service/test leaf READMEs, and names `dist/standalone-analyzer/bin/yanote` rather than the raw Node seam.
5. Review the analysis-path verifier behavior.
   **Expected:** `verify-s02-analysis-path.sh` extracts `build/distributions/yanote-analyzer.zip` and proves the guide against the public archive launcher contract rather than an internal source-build path.

## Edge Case 1 — Broken newcomer navigation fails closed
**Goal:** prove the short-doc guard does not silently accept drift in the newcomer path.

1. Run:
   ```bash
   node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs
   ```
   **Expected:** the suite exits `0`.
2. Review the named tests.
   **Expected:** they explicitly prove failures for a landing whose first link is not the quickstart and for broken local markdown links.
3. Treat any future regression here as blocking.
   **Expected:** if the contract suite no longer proves those failure modes, the short-doc boundary is no longer trustworthy.

## Edge Case 2 — Analyzer security provenance stays secondary, not first-screen archaeology
**Goal:** prove the analyzer guide can keep truthful secondary security context without retaking the newcomer path.

1. Re-run:
   ```bash
   node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs
   ```
   **Expected:** one test explicitly confirms that later analyzer security/provenance wording is allowed after the newcomer section.
2. Open `docs/guides/analyzer-coverage.md` and scroll from the top.
   **Expected:** the standalone install/run path appears first; any `HTTP Security Conformance`, proof command, or provenance notes come only later as secondary context.
3. If future edits move proof/provenance language back into the intro section, rerun `bash scripts/docs/verify-m016-s04-short-docs.sh`.
   **Expected:** the verifier fails closed on proof-first analyzer intro drift.
