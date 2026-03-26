# S02: Deprecated Operation Truth Without Numerator Drift

**Goal:** Make deprecated OpenAPI operations explicit on Yanote’s canonical HTTP coverage/report/CLI path while preserving the legacy operation/status/parameter coverage numerators, fail-closed semantics, and the sanitized S01 spec-source contract.
**Demo:** Analyze a spec containing deprecated operations and show JSON plus CLI summaries that call them out separately while legacy operation coverage numerators stay unchanged.
**Active requirements:** Support `R004` by making deprecation truth explicit additive product truth on the canonical HTTP path. Preserve `R005` and `R030` by keeping async and dashboard/report-surface boundaries untouched. Support `R003` indirectly through the real CLI/report path only; no separate Gradle or plugin work is planned in this slice.

## Must-Haves

- Carry OpenAPI Operation Object `deprecated` truth into the canonical HTTP operation contract and per-operation coverage catalog with a default-false path that does not force unrelated fixtures to change shape.
- Emit additive deprecated totals/covered/uncovered coverage truth plus per-operation deprecated flags in `yanote-report.json` while leaving `summary.coveredOperations`, `coverage.operations`, `coverage.status`, `coverage.parameters`, `coverage.aggregate`, report status, and gate/exit semantics unchanged by default.
- Print additive deprecated summary truth and machine tokens on the real HTTP CLI `report` path, and label uncovered deprecated operations explicitly in Top Issues without introducing async blending or dashboard/report-surface expansion.
- Prove denominator stability with a retained fixture where the only uncovered operation is deprecated and the supported CLI still reports partial legacy coverage (`covered=2/3`) instead of silently drifting to `covered=2/2`.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts src/report/report.contract.test.ts src/report/report.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/cli.async-report.contract.test.ts`
- `bash scripts/ci/verify-m013-s02-deprecated-operations.sh`
- `node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`

## Observability / Diagnostics

- Runtime signals: `yanote-report.json` publishes `summary.deprecatedOperations` plus `coverage.perOperation[].deprecated`, and HTTP CLI output publishes a deprecated summary line plus `YANOTE_SUMMARY` deprecated tokens.
- Inspection surfaces: focused Vitest contracts, `yanote report` stdout, and the retained proof bundle from `bash scripts/ci/verify-m013-s02-deprecated-operations.sh`.
- Failure visibility: denominator drift is visible as `covered=2/2` or a missing deprecated block/tokens, while async/dashboard leakage shows up as unexpected contract-test churn outside the HTTP path.
- Redaction constraints: preserve S01 sanitized `specSource` behavior and do not add any new persisted secret-bearing surfaces.

## Integration Closure

- Upstream surfaces consumed: `yanote-js/src/spec/openapi.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/report/*`, `yanote-js/src/cli.ts`, and the S01 `specSource` report/summary contract.
- New wiring introduced in this slice: HTTP-only deprecated metadata flows from OpenAPI extraction through coverage/report into CLI summaries and a retained proof bundle.
- What remains before the milestone is truly usable end-to-end: S03 still needs static HTML writers and S04 still needs CI/docs/support publication; async and dashboard surfaces stay unchanged here.

## Tasks

- [x] **T01: Thread deprecated operation metadata into canonical HTTP coverage** `est:1h10m`
  - Why: The slice needs one canonical source of deprecated truth before any report or CLI surface can publish it honestly.
  - Files: `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/src/coverage/coverage.ts`, `yanote-js/src/coverage/coverage.test.ts`, `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml`, `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`
  - Do: add optional operation-level `deprecated` extraction in the OpenAPI loader, thread it onto `coverage.perOperation`, and add a dedicated fixture pair where the only uncovered operation is deprecated so the default denominator can be proven at the coverage layer without touching gates or report math.
  - Verify: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts`
  - Done when: loader and coverage tests prove explicit deprecated metadata is available on the canonical HTTP coverage catalog and the dedicated fixture still reports partial legacy coverage rather than a silent `2/2` green run.
- [x] **T02: Extend the canonical HTTP report contract with additive deprecated truth** `est:1h20m`
  - Why: The canonical JSON report is the product truth that downstream CLI, CI, and later HTML writers must inherit.
  - Files: `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/report.contract.test.ts`, `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`
  - Do: add `summary.deprecatedOperations` and per-operation `deprecated` booleans to the HTTP report, keep schema/normalization deterministic, and prove the new fields serialize without changing legacy summary numerators, status resolution, or writer stability.
  - Verify: `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/report.test.ts src/report/writeReport.determinism.test.ts`
  - Done when: `yanote-report.json` is schema-valid with explicit deprecated counts and per-operation flags while legacy operation/status/parameter/aggregate coverage outputs remain unchanged by default.
- [x] **T03: Publish deprecated truth on HTTP CLI summaries without touching async surfaces** `est:1h25m`
  - Why: The slice demo is not true until operators can see deprecated truth directly in the real HTTP CLI summary and machine summary surfaces.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.remote-spec.contract.test.ts`, `yanote-js/src/report/report.remote-spec.contract.test.ts`, `yanote-js/src/report/report.requestEvidence.contract.test.ts`, `yanote-js/src/report/report.security.contract.test.ts`
  - Do: add an additive deprecated summary line and `YANOTE_SUMMARY` tokens, label uncovered deprecated operations explicitly in Top Issues, and update downstream CLI/report contract consumers so the expanded HTTP truth stays compatible with remote-spec, request-evidence, and security report paths while async surfaces remain untouched.
  - Verify: `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.remote-spec.contract.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.requestEvidence.contract.test.ts src/report/report.security.contract.test.ts src/cli.async-report.contract.test.ts`
  - Done when: HTTP CLI output makes deprecation explicit without changing existing `operations`/`covered` semantics or leaking the new truth into `YANOTE_ASYNC_SUMMARY` and async report surfaces.
- [x] **T04: Lock the slice demo behind a retained deprecated-operations proof** `est:55m`
  - Why: The slice needs a rerunnable real-entrypoint proof that future agents can use to spot denominator drift immediately.
  - Files: `scripts/ci/verify-m013-s02-deprecated-operations.sh`, `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`, `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml`, `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`, `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`
  - Do: build a retained proof bundle that runs the real CLI against the dedicated deprecated fixture, captures stdout and report artifacts, and asserts deprecated report/summary truth alongside preserved `covered=2/3` legacy coverage semantics.
  - Verify: `bash scripts/ci/verify-m013-s02-deprecated-operations.sh && node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`
  - Done when: the proof bundle shows deprecated totals, per-operation flags, CLI summary tokens, and unchanged denominator math from one inspection without widening into async or dashboard work.

## Files Likely Touched

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml`
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.remote-spec.contract.test.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/report.security.contract.test.ts`
- `scripts/ci/verify-m013-s02-deprecated-operations.sh`
- `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`
