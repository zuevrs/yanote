# S03: Combined HTTP plus async report and gate from canonical subreports

**Goal:** Add one combined HTTP plus async aggregation surface that consumes canonical `yanote-report.json` and `yanote-async-report.json` inputs, emits `yanote-combined-report.json`/`.html` plus a combined CLI summary, and keeps child attribution plus drill-down paths explicit instead of inventing a blended denominator.
**Demo:** After this: # S03: Combined HTTP plus async report and gate from canonical subreports — UAT

**Milestone:** M015
**Written:** 2026-03-26T22:02:39.518Z

# S03: Combined HTTP plus async report and gate from canonical subreports — UAT

**Milestone:** M015

# S03 UAT — Combined HTTP plus async report and gate from canonical subreports

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


## Tasks
- [x] **T01: Added the combined HTTP plus async report contract, normalizer, HTML renderer, and deterministic writer.** — 
- [x] **T02: Added the combined-report CLI summary and typed child-attributed failure contract.** — Historical completed task retained in tasks/T02-SUMMARY.md.
- [x] **T03: Closed the combined-report slice on retained proof, JSON/HTML artifacts, and child attribution.** — Historical completed task retained in tasks/T03-SUMMARY.md.
