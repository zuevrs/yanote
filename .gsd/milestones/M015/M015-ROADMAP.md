# M015: M015: M015: Async Platform Expansion And Cross-Surface Reporting

## Vision
M015: M015: Async Platform Expansion And Cross-Surface Reporting

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Protocol-aware async analyzer contract with first RabbitMQ path | high | — | ✅ | TBD |
| S02 | Live RabbitMQ recorder and proof path | high | S01 | ✅ | TBD |
| S03 | Combined HTTP+async report/gate from canonical subreports | medium | S01, S02 | ✅ | # S03: Combined HTTP+async report/gate from canonical subreports — UAT

**Milestone:** M015
**Written:** 2026-03-26T22:02:39.518Z

# S03: Combined HTTP+async report/gate from canonical subreports — UAT

**Milestone:** M015

# S03 UAT — Combined HTTP+async report/gate from canonical subreports

## Preconditions
- `npm -C yanote-js run build` succeeds.
- `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` and `.yanote-ci/live-rabbitmq-proof/yanote-async-report.html` exist. If they are missing, rerun `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` first.
- The worktree contains `scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml`, `scripts/ci/fixtures/m015-s03-combined-http.events.jsonl`, and `scripts/ci/verify-m015-s03-combined-report.sh`.

## Test Case 1 — Generate the green canonical HTTP child report from the dedicated S03 fixture
1. Run:
   ```bash
   rm -rf .tmp/m015-s03-uat && mkdir -p .tmp/m015-s03-uat/http
   node yanote-js/dist/yanote.cjs report \
     --spec scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml \
     --events scripts/ci/fixtures/m015-s03-combined-http.events.jsonl \
     --out .tmp/m015-s03-uat/http
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s03-uat/http/yanote-report.json` and `.tmp/m015-s03-uat/http/yanote-report.html` both exist.
   - Stdout ends with exactly one final `YANOTE_SUMMARY` line.
   - Stdout shows `- status: ok` and the machine summary includes `status=ok`.
   - `yanote-report.json` contains `status: "ok"`, `summary.totalOperations = 1`, `summary.coveredOperations = 1`, and `summary.operationCoveragePercent = 100`.

## Test Case 2 — Combine the canonical HTTP child with the retained RabbitMQ async child
1. Run:
   ```bash
   mkdir -p .tmp/m015-s03-uat/combined
   node yanote-js/dist/yanote.cjs combined-report \
     --report .tmp/m015-s03-uat/http/yanote-report.json \
     --async-report .yanote-ci/live-rabbitmq-proof/yanote-async-report.json \
     --out .tmp/m015-s03-uat/combined
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s03-uat/combined/yanote-combined-report.json` and `.tmp/m015-s03-uat/combined/yanote-combined-report.html` both exist.
   - Stdout ends with exactly one final `YANOTE_COMBINED_SUMMARY` line.
   - The machine summary line includes `status=ok`, `http_status=ok`, `async_status=ok`, `protocols=amqp`, `http_report=.tmp/m015-s03-uat/http/yanote-report.json`, `async_report=.yanote-ci/live-rabbitmq-proof/yanote-async-report.json`, and `report=.tmp/m015-s03-uat/combined/yanote-combined-report.json`.
   - Human stdout contains separate `HTTP Child` and `Async Child` sections and points back to both child JSON/HTML drill-down paths.
   - `yanote-combined-report.json` contains:
     - `status: "ok"`
     - `overview.childStatuses.http = "ok"`
     - `overview.childStatuses.async = "ok"`
     - `children.async.summary.protocols = ["amqp"]`
     - child provenance artifact refs for both the HTTP and async child JSON/HTML files.
   - `yanote-combined-report.html` contains `Yanote combined report`, `HTTP child summary`, `Async child summary`, and visible `amqp` protocol attribution.

## Test Case 3 — Malformed HTTP child input fails closed with child attribution
1. Run:
   ```bash
   printf '{not-json' > .tmp/m015-s03-uat/invalid-http-child.json
   node yanote-js/dist/yanote.cjs combined-report \
     --report .tmp/m015-s03-uat/invalid-http-child.json \
     --async-report .yanote-ci/live-rabbitmq-proof/yanote-async-report.json \
     --out .tmp/m015-s03-uat/combined-invalid
   ```
2. Expected outcome:
   - The command exits non-zero with exit code `2`.
   - Stderr contains one primary `YANOTE_COMBINED_ERROR` line with `class=input`, `code=INPUT_COMBINED_CHILD_JSON_INVALID`, `child=http`, `path=".tmp/m015-s03-uat/invalid-http-child.json"`, and `report=none`.
   - Stdout still ends with one `YANOTE_COMBINED_SUMMARY` line whose `primary=INPUT_COMBINED_CHILD_JSON_INVALID`, `child=http`, and `report=none` fields are explicit.
   - Stdout still points back to the provided async child path so the operator can tell which input remained valid.

## Test Case 4 — Swapped child file types surface primary and secondary typed failures
1. Run:
   ```bash
   node yanote-js/dist/yanote.cjs combined-report \
     --report .yanote-ci/live-rabbitmq-proof/yanote-async-report.json \
     --async-report .tmp/m015-s03-uat/http/yanote-report.json \
     --out .tmp/m015-s03-uat/combined-swapped
   ```
2. Expected outcome:
   - The command exits non-zero with exit code `2`.
   - Stderr contains exactly one primary `YANOTE_COMBINED_ERROR` line for the HTTP child path and one `YANOTE_COMBINED_ERROR_SECONDARY` line for the async child path.
   - The primary and secondary failures both use `INPUT_COMBINED_CHILD_SCHEMA_INVALID` rather than a generic runtime error.
   - Stdout still ends with one `YANOTE_COMBINED_SUMMARY` line, with `primary=INPUT_COMBINED_CHILD_SCHEMA_INVALID` and `child=http`.

## Test Case 5 — The retained dist proof reruns the full combined surface and preserves diagnostic breadcrumbs
1. Run:
   ```bash
   npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s03-combined-proof/` exists with:
     - `artifact-manifest.txt`
     - `artifact-source-paths.txt`
     - `http-report/http-report.stdout`, `.stderr`, `.exit-code.txt`, and `out/yanote-report.json` / `.html`
     - `combined-report/combined-report.stdout`, `.stderr`, `.exit-code.txt`, and `out/yanote-combined-report.json` / `.html`
   - `artifact-manifest.txt` includes `http_status=ok`, `http_operations=1/1`, `combined_status=ok`, `combined_async_protocols=amqp`, and `summary_token=YANOTE_COMBINED_SUMMARY`.
   - `artifact-source-paths.txt` records the dedicated HTTP fixture paths plus the retained S02 async child JSON/HTML paths.
   - `combined-report.stdout` contains one final `YANOTE_COMBINED_SUMMARY` line and points back to both the generated HTTP child report and the retained async child report.

## Edge cases to confirm during sign-off
- The combined surface must not invent a blended aggregate coverage percentage across HTTP and async; the child summaries remain separate and attributable.
- Missing, malformed, or swapped child inputs must fail closed with child-attributed typed errors and `report=none`, never a false-green combined artifact.
- Missing child HTML siblings are not required for composition when the canonical child JSON inputs are valid; the combined CLI should still derive and print the expected sibling HTML paths for drill-down.
- AMQP remains explicitly async-specific inside the combined surface: `protocols=amqp` should stay visible and Kafka-only additive sections should remain explicit zero/none, not hidden or translated into HTTP wording.
 |
| S04 | CI, docs, and support closure for widened async and combined reporting | medium | S02, S03 | ✅ | # S04: CI, docs, and support closure for widened async and combined reporting — UAT

**Milestone:** M015
**Written:** 2026-03-26T23:14:24.830Z

# S04 UAT — CI, docs, and support closure for widened async and combined reporting

## Preconditions
- `node` is available in the worktree.
- The retained RabbitMQ proof bundle exists at `.yanote-ci/live-rabbitmq-proof/`. If it is missing, rerun `bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh` first.
- The retained combined proof bundle exists at `.tmp/m015-s03-combined-proof/`. If it is missing, rerun `bash scripts/ci/verify-m015-s03-combined-report.sh` first.
- If you want to inspect full three-family parity with a live Kafka bundle too, rerun `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` before Test Case 2.

## Test Case 1 — Collector and summary renderer contract suites pin widened bundle behavior
1. Run:
   ```bash
   node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs
   ```
2. Expected outcome:
   - The command exits `0`.
   - The collector suite passes the RabbitMQ/combined inventory assertions, including `rabbitmq_bundle_report_protocols=amqp`, `rabbitmq_bundle_runtime_selected_report_found=false`, `rabbitmq_bundle_schema_failure_report_found=false`, and `combined_bundle_*` child-path metadata.
   - The renderer suite passes the widened async and combined summary assertions, including the new `protocols` line, optional-companion wording for RabbitMQ, combined child-report attribution, and fail-closed malformed-bundle diagnostics.

## Test Case 2 — Collect retained proof bundles into a deterministic widened artifact family
1. Run:
   ```bash
   rm -rf .tmp/m015-s04-uat
   bash scripts/ci/collect-yanote-artifacts.sh .tmp/m015-s04-uat/artifacts
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s04-uat/artifacts/live-rabbitmq-proof/` exists and contains `artifact-manifest.txt`, `artifact-source-paths.txt`, `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`, and `yanote-async-report.html`.
   - `.tmp/m015-s04-uat/artifacts/combined-proof/` exists and contains `artifact-manifest.txt`, `artifact-source-paths.txt`, `combined-report/combined-report.stdout`, `combined-report/combined-report.stderr`, and `combined-report/out/yanote-combined-report.json` / `.html`.
   - `.tmp/m015-s04-uat/artifacts/artifact-manifest.txt` includes:
     - `rabbitmq_bundle_found=true`
     - `rabbitmq_bundle_report_status=ok`
     - `rabbitmq_bundle_report_protocols=amqp`
     - `rabbitmq_bundle_runtime_selected_report_found=false`
     - `rabbitmq_bundle_schema_failure_report_found=false`
     - `combined_bundle_found=true`
     - `combined_bundle_status=ok`
     - `combined_bundle_http_status=ok`
     - `combined_bundle_async_status=ok`
     - explicit `combined_bundle_http_child_*` and `combined_bundle_async_child_*` paths.
   - `.tmp/m015-s04-uat/artifacts/artifact-source-paths.txt` points back to `.yanote-ci/live-rabbitmq-proof/` and `.tmp/m015-s03-combined-proof/` and records `live-rabbitmq-proof-report-protocols=amqp` / `combined-proof-async-protocols=amqp`.

## Test Case 3 — Render the collected RabbitMQ async summary without fabricating Kafka-only companions
1. Run:
   ```bash
   node scripts/ci/render-yanote-summary.mjs \
     --report .tmp/m015-s04-uat/artifacts/live-rabbitmq-proof/yanote-async-report.json \
     --stdout .tmp/m015-s04-uat/artifacts/live-rabbitmq-proof/async-report.stdout \
     --stderr .tmp/m015-s04-uat/artifacts/live-rabbitmq-proof/async-report.stderr \
     --artifacts-dir .tmp/m015-s04-uat/artifacts/live-rabbitmq-proof \
     --output .tmp/m015-s04-uat/rabbitmq-summary.md
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s04-uat/rabbitmq-summary.md` exists.
   - The summary contains all of the following:
     - `## Yanote Async Summary`
     - `- status: ok`
     - `- protocols: amqp`
     - `- report artifacts: yanote-async-report.json (present), yanote-async-report.html (present)`
     - `runtime-selected-yanote-async-report.json (optional missing)`
     - `schema-failure-yanote-async-report.json (optional missing)`
     - `- declared semantics: correlation_operations=2/2 reply_operations=2/2`
     - `- primary failure: none`
   - The summary does **not** pretend RabbitMQ has Kafka binding/runtime parity; it keeps those surfaces explicit as zero/none rather than fabricated artifacts.

## Test Case 4 — Render the collected combined summary with explicit child attribution
1. Run:
   ```bash
   node scripts/ci/render-yanote-summary.mjs \
     --report .tmp/m015-s04-uat/artifacts/combined-proof/combined-report/out/yanote-combined-report.json \
     --stdout .tmp/m015-s04-uat/artifacts/combined-proof/combined-report/combined-report.stdout \
     --stderr .tmp/m015-s04-uat/artifacts/combined-proof/combined-report/combined-report.stderr \
     --artifacts-dir .tmp/m015-s04-uat/artifacts/combined-proof \
     --output .tmp/m015-s04-uat/combined-summary.md
   ```
2. Expected outcome:
   - The command exits `0`.
   - `.tmp/m015-s04-uat/combined-summary.md` exists.
   - The summary contains all of the following:
     - `## Yanote Combined Summary`
     - `- status: ok`
     - `- http child: ok`
     - `- async child: ok`
     - `- async protocols: amqp`
     - `combined-report/out/yanote-combined-report.json (present)` and `combined-report/out/yanote-combined-report.html (present)`
     - explicit `http child reports:` paths back to `.tmp/m015-s03-combined-proof/http-report/out/yanote-report.json` / `.html`
     - explicit `async child reports:` paths back to `.yanote-ci/live-rabbitmq-proof/yanote-async-report.json` / `.html`
   - The summary remains child-attributed; it does **not** invent a blended HTTP+async denominator.

## Test Case 5 — Workflow contracts pin the stable required job and widened proof stack
1. Run:
   ```bash
   node --test scripts/ci/yanote-ci-workflow.contract.test.mjs
   ```
2. Expected outcome:
   - The command exits `0`.
   - The suite proves `.github/workflows/yanote-ci.yml` still uses `build-and-test` as the required delivery job.
   - The suite proves the job runs live Kafka proof, live RabbitMQ proof, and combined proof before enforcement, renders summaries from `build-and-test-artifacts/live-rabbitmq-proof/` and `build-and-test-artifacts/combined-proof/`, and fails closed on proof-specific exit-code drift.
   - The suite also proves `.github/BRANCH_PROTECTION.md` documents the widened split between delivery proof, Kafka proof, RabbitMQ proof, combined proof, and HTTP validation.

## Test Case 6 — Public docs and support intake stay aligned to the widened delivery boundary
1. Run:
   ```bash
   bash scripts/docs/verify-m015-s04-delivery-surfaces.sh
   ```
2. Expected outcome:
   - The command exits `0`.
   - The verifier confirms README/docs/examples/support surfaces mention `live-rabbitmq-proof/`, `combined-proof/`, and the RabbitMQ/combined rerun commands.
   - The verifier confirms the public requirements/support wording no longer treats RabbitMQ or combined reporting as deferred.
   - The verifier confirms the touched docs keep the explicit no-dashboard, no blended denominator, and no broker-agnostic promise clauses, and that support intake does not ask for raw retained headers or payload bodies.

## Edge cases to confirm during sign-off
- RabbitMQ collected summaries must keep Kafka-only companions explicit as `optional missing` / `none`, never fabricate them.
- Combined collected summaries must preserve explicit HTTP and async child report paths and `async protocols: amqp`; they must not collapse child truth into one aggregate percentage.
- The required GitHub job name must remain `build-and-test`; widening the proof stack must not rename the merge-blocking delivery check.
- For combined failures, support intake should request the combined bundle plus the referenced child reports rather than asking operators to flatten evidence into one denominator.
 |
