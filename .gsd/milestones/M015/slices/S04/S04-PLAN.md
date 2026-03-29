# S04: CI, docs, and support closure for widened async and combined reporting

**Goal:** Close M015 by carrying the widened async and combined-report contracts through the real CI, artifact, docs, and support surfaces so teams can rerun, inspect, and trust the RabbitMQ/AMQP and combined proof paths without losing the existing split truth between HTTP and async.
**Demo:** After this: # S04: CI, docs, and support closure for widened async and combined reporting — UAT

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
   - The summary remains child-attributed; it does **not** invent a blended HTTP plus async denominator.

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


## Tasks
- [x] **T01: Extended artifact collection and summary rendering toward RabbitMQ and combined proof support, but renderer tests still need follow-up expectation updates.** — Why: The current collector and summary renderer only know how to publish the Kafka proof family, so CI cannot expose the RabbitMQ/AMQP or combined proof surfaces that S02 and S03 already shipped.
- [x] **T02: Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.** — Historical completed task retained in tasks/T02-SUMMARY.md.
- [x] **T03: Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.** — Historical completed task retained in tasks/T03-SUMMARY.md.
Do: extend the artifact collector to retain `live-rabbitmq-proof/` and `combined-proof/` beside the existing Kafka and HTTP bundles, teach the summary renderer to produce redaction-safe markdown for the RabbitMQ async and combined report families, and pin the new inventories plus failure diagnostics in Node tests.
Done when: `build-and-test-artifacts/` can retain Kafka, RabbitMQ, and combined proof families without fabricating absent AMQP companions, and the targeted collector/summary tests pass with explicit `protocols=amqp`, child-path, and fail-closed error assertions.

## Description

Publish the widened async and combined proof families through the same collected-artifact and summary surfaces that operators already inspect in CI, while keeping RabbitMQ optional-companion absences explicit and the combined surface visibly child-attributed.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Retained proof bundle directories (`.yanote-ci/live-kafka-proof`, `.yanote-ci/live-rabbitmq-proof`, `.tmp/m015-s03-combined-proof`) | Refuse to invent missing bundle members and keep manifest/source-path notes explicit | N/A | Treat malformed or swapped JSON/HTML/stdout inputs as summary-render failures, not green output |
| Summary rendering over async and combined artifacts | Surface actionable validation errors naming the missing or drifted artifact family | N/A | Fail closed if combined child attribution or AMQP protocol metadata is missing |

## Load Profile

- **Shared resources**: three retained proof bundle families plus their manifests, stdout/stderr logs, and summary markdown outputs.
- **Per-operation cost**: file-copy and JSON parse work over already-generated artifacts; no spec or event re-analysis.
- **10x breakpoint**: bundle size and repeated file-system scans dominate before markdown formatting becomes expensive.

## Negative Tests

- **Malformed inputs**: missing combined JSON/HTML outputs, malformed RabbitMQ async report JSON, or stale copied directories from prior collector runs.
- **Error paths**: RabbitMQ bundle with intentionally absent `runtime-selected-*` / `schema-failure-*` companions, combined proof missing child paths, or summary rendering without a valid machine-summary fallback.
- **Boundary conditions**: existing Kafka bundle remains intact, RabbitMQ bundle keeps `protocols=amqp`, and combined bundle preserves separate HTTP-vs-async child report paths instead of a blended denominator.

## Steps

1. Extend `scripts/ci/collect-yanote-artifacts.sh` so it copies `.yanote-ci/live-rabbitmq-proof` and `.tmp/m015-s03-combined-proof` into deterministic bundle directories and records their manifest/source-path provenance beside the existing Kafka and HTTP families.
2. Teach `scripts/ci/render-yanote-summary.mjs` to summarize the retained RabbitMQ async family with optional-companion absences and to summarize the combined report family with explicit child attribution, AMQP protocol visibility, and fail-closed malformed-bundle diagnostics.
3. Add contract tests that pin the widened collected inventory, the RabbitMQ optional-artifact rules, the combined summary markdown shape, and the failure messages produced when bundles drift or go missing.

## Must-Haves

- [ ] `build-and-test-artifacts/` retains `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` without fabricating missing AMQP companions or losing existing HTTP bundle collection.
- [ ] Collected markdown summaries stay redaction-safe while surfacing `protocols=amqp`, combined child report paths, and fail-closed bundle drift.

  - Estimate: 1h45m
  - Files: scripts/ci/collect-yanote-artifacts.sh, scripts/ci/collect-yanote-artifacts.test.mjs, scripts/ci/render-yanote-summary.mjs, scripts/ci/render-yanote-summary.test.mjs
  - Verify: node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/render-yanote-summary.test.mjs
- [x] **T02: Extended `build-and-test` to enforce Kafka, RabbitMQ, and combined proof stacks while publishing widened CI summaries.** — Why: The repository already has live RabbitMQ and combined proof commands, but the required CI job still runs only the Kafka proof and therefore does not expose or enforce the new delivery surface promised by M015.
Do: keep `build-and-test` as the stable required job, add live RabbitMQ and combined proof steps in dependency order, publish the widened collected summaries in GitHub Actions, and update workflow contract tests plus required-check docs so the widened stack is mechanically pinned.
Done when: `build-and-test` runs the Kafka, RabbitMQ, and combined proof stack without renaming required jobs, uploads deterministic widened artifacts, and fails closed with step-specific exit codes when any proof drifts.

## Description

Turn the widened async and combined-report work into a real GitHub Actions delivery surface by extending the existing required job instead of inventing new merge-blocking job names or a blended dashboard workflow.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Live RabbitMQ and combined proof scripts | Capture exit codes, keep artifact collection on `always()`, and fail the job with a proof-specific message | Preserve retained temp/bundle paths so CI logs point to the failing proof family | Do not continue as green if the combined proof consumes malformed child artifacts |
| GitHub step summary publication | Keep summaries additive and redaction-safe; no overwrite that hides earlier proof output | N/A | Refuse to point summary steps at non-existent collected bundle paths |
| Required-check contract docs/tests | Fail the contract suite if step order, artifact names, or stable job IDs drift | N/A | Reject stale branch-protection wording that still describes Kafka-only async CI coverage |

## Load Profile

- **Shared resources**: one required `build-and-test` job, multiple proof-script runs, and one uploaded collected artifact bundle.
- **Per-operation cost**: Kafka proof, RabbitMQ proof, combined proof, artifact collection, summary rendering, and workflow contract assertions.
- **10x breakpoint**: proof-script runtime and artifact I/O dominate before YAML parsing or contract tests do.

## Negative Tests

- **Malformed inputs**: combined proof step pointed at the wrong collected bundle path or missing retained RabbitMQ child report.
- **Error paths**: RabbitMQ proof failure, combined proof failure after RabbitMQ success, and summary step path drift inside the workflow.
- **Boundary conditions**: stable required job names stay unchanged, `always()` artifact collection still runs on failure, and delivery-proof / HTTP validation behavior stays intact beside the widened proof stack.

## Steps

1. Extend `.github/workflows/yanote-ci.yml` so `build-and-test` runs the live RabbitMQ proof and then the combined proof after the existing Kafka proof, records each exit code, and still collects artifacts on `always()`.
2. Publish the widened collected summary surfaces from the deterministic artifact paths and keep enforcement fail-closed without renaming `build-and-test` or `yanote-validation`.
3. Update workflow contract coverage and branch-protection documentation so step order, artifact bundle names, and widened proof expectations stay pinned.

## Must-Haves

- [ ] `build-and-test` remains the stable required job while enforcing Kafka, RabbitMQ, and combined proof results through one deterministic collected artifact family.
- [ ] Workflow contracts and required-check docs explain the widened proof stack without implying a combined dashboard or breaking the existing HTTP validation split.

  - Estimate: 1h30m
  - Files: .github/workflows/yanote-ci.yml, scripts/ci/yanote-ci-workflow.contract.test.mjs, .github/BRANCH_PROTECTION.md
  - Verify: node --test scripts/ci/yanote-ci-workflow.contract.test.mjs
- [x] **T03: Aligned public docs and support intake to the Kafka, RabbitMQ, and combined proof bundles.** — Why: The public landings, release/support boundary, requirements inventory, and support guide still describe RabbitMQ and combined reporting as deferred or unsupported, which contradicts the real proof bundles and would send operators to the wrong artifacts.
Do: update the Russian-first public docs and support intake so they describe the first RabbitMQ/AMQP path and the combined report surface as additive current proof families, keep the no-dashboard / no blended denominator / no broker-agnostic promise clauses explicit, and add one focused doc verifier that pins the new wording and retained artifact paths.
Done when: the public docs no longer call RabbitMQ or combined reporting deferred, support intake asks for the correct retained proof bundles, and the focused M015 S04 doc verifier passes against the new delivery-surface wording.

## Description

Close the milestone on the outward-facing boundary: make the main README, docs landings, requirements/support surfaces, and async guide tell one truthful story about what is now supported, what remains explicitly out of scope, and which retained artifacts operators should inspect when Kafka, RabbitMQ, or combined proof paths fail.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public boundary markdown surfaces | Fail the focused verifier on stale wording rather than publishing mixed Kafka-only vs RabbitMQ/combined guidance | N/A | Reject broken links or missing artifact names before the task is considered complete |
| Support intake guidance | Refuse to keep asking for the wrong proof bundle or raw secret-bearing headers | N/A | Fail verification if the docs imply a dashboard, a blended denominator, or a broker-agnostic promise |

## Load Profile

- **Shared resources**: multiple cross-linked public/support markdown surfaces plus one focused shell verifier.
- **Per-operation cost**: static content rewrite and exact-string verification; runtime cost is trivial.
- **10x breakpoint**: wording drift across multiple surfaces becomes the main risk before verification time matters.

## Negative Tests

- **Malformed inputs**: broken local markdown links, missing retained bundle names, or missing proof commands in the updated docs.
- **Error paths**: stale `Kafka-only` / `combined deferred` wording, support intake that still points only to `.yanote-ci/live-kafka-proof/`, or docs that collapse combined child truth into one denominator.
- **Boundary conditions**: RabbitMQ stays the first concrete AMQP path, Kafka proof guidance remains present, and no touched surface promises a hosted dashboard or broker-agnostic coverage.

## Steps

1. Rewrite `README.md`, `docs/README.md`, `examples/README.md`, and `docs/guides/asyncapi-kafka.md` so the user-facing path points to separate Kafka, RabbitMQ, and combined proof families with explicit retained artifact names and rerun commands.
2. Update `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md` so the public boundary and support intake promote the first RabbitMQ/AMQP and combined-report surfaces from deferred follow-ons into additive current support while keeping no-dashboard, no blended denominator, and no broker-agnostic clauses explicit.
3. Add one focused shell verifier that checks the widened delivery-surface wording, retained artifact paths, and support intake expectations across the touched public docs.

## Must-Haves

- [ ] Public docs describe RabbitMQ/AMQP and combined-report support as additive current proof families, not deferred follow-ons, while preserving explicit no-dashboard, no blended denominator, and no broker-agnostic clauses.
- [ ] Support intake points operators to `live-kafka-proof/`, `live-rabbitmq-proof/`, and `combined-proof/` artifacts according to the failing surface and never asks for raw retained headers or payload bodies.

  - Estimate: 1h45m
  - Files: README.md, docs/README.md, examples/README.md, docs/guides/asyncapi-kafka.md, docs/release-and-support.md, docs/requirements.md, SUPPORT.md, scripts/docs/verify-m015-s04-delivery-surfaces.sh
  - Verify: bash scripts/docs/verify-m015-s04-delivery-surfaces.sh
