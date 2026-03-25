# S04: Final Boundary Assembly And Docs Hardening

**Goal:** Close M010 by wiring the unfinished HTTP core runtime/public surfaces and async retained-artifact boundary into one truthful, rerunnable public contract so the repo, retained proof bundles, and support docs all describe the same supported core completeness scope.
**Demo:** Running the focused HTTP-core tests, the async export test, and the final boundary verifier produces a green happy-path HTTP bundle plus a retained HTTP core red path, a widened Kafka header-drift bundle, and public docs/support surfaces that describe exactly those proven boundaries without implying full-spec or broker-agnostic coverage.
**Active requirements:** Owns final assembly for `R031`, `R032`, `R033`, `R034`; supports `R001`, `R002`, `R003`, `R005`.

## Must-Haves

- `yanote report` computes and surfaces real `httpCoreConformance`, and governance fail-closed behavior now covers undeclared statuses plus supported parameter-value and response-header drift instead of stopping at payload-era semantics.
- The retained HTTP proof path stays additively truthful: happy-path artifacts remain green, while the retained red path demonstrates `/evidence/users/{id}` HTTP core drift with deterministic CLI/report/manifests that future agents can diagnose.
- The retained Kafka proof export includes missing/invalid/unavailable/unverifiable header sidecars on the proven Kafka path, and the public async docs/support/requirements/verifiers promote that header truth without widening beyond Kafka-only or a combined HTTP+async surface.
- Release/support, landing docs, and a new final assembly verifier all agree on one public core-boundary story tied to the latest stable tag and the actual retained proof artifacts.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts`
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-m010-s04-final-boundary.sh`

## Observability / Diagnostics

- Runtime signals: `YANOTE_SUMMARY`, `YANOTE_ERROR`, `httpCoreConformance` summary/diagnostic counts, `YANOTE_ASYNC_SUMMARY`, `ASYNC_SEMANTIC_*` header codes, and retained artifact manifests in `.yanote-ci/v1-e2e/` and `.yanote-ci/live-kafka-proof/`.
- Inspection surfaces: focused `yanote-js` tests, `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/docs/verify-s04-boundaries.sh`, and the new `scripts/docs/verify-m010-s04-final-boundary.sh`.
- Failure visibility: primary semantic code, `operationKey`, status/header/value target, `schemaId`, `pointer`, capture `state`/`reason`, and retained manifest counts must all be inspectable from failing stdout/stderr or exported bundle files.
- Redaction constraints: proof and docs may expose redacted/omitted/unavailable state plus reason text, but must never emit raw sensitive query/header/Kafka values or imply support beyond the proven Spring MVC + Spring Kafka core paths.

## Integration Closure

- Upstream surfaces consumed: S01 retained HTTP evidence shape, S02 additive `httpCoreConformance` report contract, S03 async header fixtures/proof exporter groundwork, public guides/landings, and existing retained `.yanote-ci/` bundle conventions.
- New wiring introduced in this slice: HTTP core semantic gate mapping and CLI output, HTTP proof-bundle retargeting, widened async header-sidecar export/public boundary wording, and one final boundary verifier that composes the assembled runtime/doc surfaces.
- What remains before the milestone is truly usable end-to-end: nothing.

## Tasks

- [x] **T01: Add HTTP core semantic gate codes and precedence** `est:1h20m`
  - Why: S02 left the HTTP core analyzer/report DTOs additive but not fail-closed; this task turns undeclared status and supported parameter/header drift into stable governance semantics that the CLI and proof scripts can rely on.
  - Files: `yanote-js/src/gates/httpCoreSemantics.ts`, `yanote-js/src/gates/httpCoreSemantics.test.ts`, `yanote-js/src/gates/evaluator.ts`, `yanote-js/src/gates/failureOrder.ts`, `yanote-js/src/gates/failureOrder.test.ts`, `yanote-js/src/gates/evaluator.threshold.test.ts`
  - Do: introduce a dedicated HTTP-core semantic mapper, decide which `httpCoreConformance` diagnostics fail closed versus stay explicitly skipped/warning, run that mapper in the gate evaluator before threshold-only logic, and extend failure-order tests so the new `SEMANTIC_HTTP_*` codes sort deterministically with existing payload and async failures.
  - Verify: `npm -C yanote-js test -- src/gates/httpCoreSemantics.test.ts src/gates/evaluator.threshold.test.ts src/gates/failureOrder.test.ts`
  - Done when: HTTP core drift yields stable governance failures with deterministic precedence and no path silently falls back to payload-era semantics.
- [x] **T02: Surface HTTP core results in CLI summaries and focused contract tests** `est:1h15m`
  - Why: even with semantic mapping in place, M010 is not truthful until `yanote report` actually computes `httpCoreConformance`, prints it, and emits machine-readable summary data that matches the new gate behavior.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.httpCore.report.test.ts`, `yanote-js/src/cli.httpCore.failclosed.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`
  - Do: wire `computeHttpCoreConformance(...)` through the report command, add an `HTTP Core Conformance` summary surface plus machine-summary/top-issue data, create dedicated CLI test files for green/core-red/failclosed cases, and keep the existing payload and async summary surfaces additive and deterministic.
  - Verify: `npm -C yanote-js test -- src/cli.httpCore.report.test.ts src/cli.httpCore.failclosed.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts`
  - Done when: a fresh executor can point to passing focused CLI tests that prove `yanote report` emits HTTP core results and fail-closed primary codes from live analyzer data, not report-only fixtures.
- [x] **T03: Retarget the live HTTP proof bundle and docs to the HTTP core boundary** `est:1h35m`
  - Why: the public retained HTTP bundle and landing docs still showcase payload-era red proof, so users cannot yet see the richer supported HTTP core truth that M010 promises.
  - Files: `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh`, `scripts/ci/run-v1-e2e.contract.test.mjs`, `docs/guides/analyzer-coverage.md`, `README.md`, `docs/README.md`, `examples/README.md`, `scripts/docs/verify-s03-landing.sh`
  - Do: keep the happy-path denominator green while retargeting the retained red path to `/evidence/users/{id}` undeclared-status/parameter-value/response-header drift, update the retained manifest/contract assertions, and refresh the analyzer guide plus root/docs/examples landing verifiers so they describe `HTTP Core Conformance` truthfully while preserving payload validation as an additive supported surface.
  - Verify: `node --test scripts/ci/run-v1-e2e.contract.test.mjs && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/ci/run-v1-e2e.sh && bash scripts/docs/verify-s03-landing.sh`
  - Done when: `.yanote-ci/v1-e2e/` proves the new HTTP core red path, the happy path stays green, and public landing/docs verifiers no longer depend on payload-era-only wording.
- [x] **T04: Export Kafka header-drift sidecars and promote the async public boundary** `est:1h30m`
  - Why: S03 already widened the code path, but the retained export and public owner/support surfaces still under-claim Kafka header truth, which blocks truthful milestone closeout.
  - Files: `scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `scripts/ci/export-async-proof-artifacts.sh`, `scripts/ci/export-async-proof-artifacts.test.mjs`, `docs/guides/asyncapi-kafka.md`, `docs/requirements.md`, `SUPPORT.md`, `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Do: finish the widened async exporter/test so success manifests retain missing/invalid/unavailable/unverifiable header sidecars, make the live Kafka proof script enforce those sidecars and typed `ASYNC_SEMANTIC_*` codes, and update the async guide/requirements/support/verifiers to promote Kafka header diagnostics as supported public truth while keeping Kafka-only, Spring-Kafka-first, and separate-report boundaries explicit.
  - Verify: `node --test scripts/ci/export-async-proof-artifacts.test.mjs && bash scripts/ci/verify-m004-s02-metadata-propagation.sh && bash scripts/ci/verify-m004-s03-live-kafka-proof.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
  - Done when: `.yanote-ci/live-kafka-proof/artifact-manifest.txt` shows the widened header sidecars on success and no public async boundary surface still says retained Kafka headers are unverifiable.
- [x] **T05: Assemble the final boundary verifier and release/support surface** `est:1h00m`
  - Why: M010 is only truly closed when one final verifier can rerun the assembled HTTP + Kafka truth surfaces and the release/support owner doc matches the latest stable tag plus the now-real retained artifacts.
  - Files: `docs/release-and-support.md`, `scripts/docs/verify-s04-boundaries.sh`, `scripts/docs/verify-m010-s04-final-boundary.sh`, `README.md`, `docs/README.md`
  - Do: refresh `docs/release-and-support.md` to the latest stable tag and final core-boundary wording, update the boundary verifier to assert the new HTTP/async claims, add a milestone-level assembly script that reruns the assembled proof/doc stack and checks retained manifest contents, and tighten the README/docs landing pointers only where the final owner story changed.
  - Verify: `bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m010-s04-final-boundary.sh`
  - Done when: the release/support owner doc, the landing docs, and the final assembly verifier all agree on one rerunnable core completeness boundary and no additional milestone wiring remains.

## Files Likely Touched

- `yanote-js/src/gates/httpCoreSemantics.ts`
- `yanote-js/src/gates/httpCoreSemantics.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/gates/evaluator.threshold.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.httpCore.report.test.ts`
- `yanote-js/src/cli.httpCore.failclosed.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `docs/guides/analyzer-coverage.md`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `docs/guides/asyncapi-kafka.md`
- `docs/requirements.md`
- `SUPPORT.md`
- `scripts/docs/verify-m005-s01-async-path.sh`
- `scripts/docs/verify-m005-s01-async-boundaries.sh`
- `docs/release-and-support.md`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/docs/verify-m010-s04-final-boundary.sh`
