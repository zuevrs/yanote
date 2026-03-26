# S02 Research: Deprecated Operation Truth Without Numerator Drift

_Gathered: 2026-03-26_

## Skills Discovered

- Existing installed skills used for this research: `openapi-specification-v3.2`, `vitest`
- Existing directly relevant installed skills already present in the environment: `json-schema-validator`
- New skill installs: none

## Requirements Focus

- Primary slice-owned missing contract: deprecated OpenAPI operations must be surfaced explicitly without dropping them from existing coverage denominators by default.
- Supports `R004`: deprecation truth must be explicit additive product truth, not a silent policy shift.
- Must preserve `R005` and `R030`: no async contract blending, no dashboard/report-surface expansion in this slice.
- `R003` impact is indirect only: JSON + CLI HTTP delivery surfaces must tell the deprecation truth through the real supported analyzer path, but no separate Gradle/plugin logic is required because the plugin already shells through the same report writer.

## Summary

This slice is a focused HTTP/OpenAPI contract extension, not a parser/platform project.
The code already has one canonical seam for per-operation metadata (`HttpOperationContract` -> `computeCoverage()` -> `buildReport()` -> CLI summary). Nothing in the current stack treats `deprecated` as first-class, but the safest implementation is additive:

- extract `deprecated: true/false` at OpenAPI load time;
- carry it onto the per-operation coverage catalog;
- publish separate deprecated counts in the HTTP report + CLI summary;
- keep `coveredOperations`, `uncoveredOperations`, gate math, and report status exactly as they are.

Do **not** turn deprecation into a new coverage dimension, exclusion rule, or semantic/gate failure in this slice. The spec only gives a boolean flag; policy is deferred.

## What Exists Now

### Canonical extraction seam already exists

- `yanote-js/src/spec/openapi.ts`
  - `extractHttpContracts()` already walks each Operation Object and materializes the per-operation contract used everywhere else.
  - `HttpOperationContract` currently carries statuses, parameters, request/response bodies, and security, but no deprecation metadata.
  - The only current `deprecated` mention in the repo is inside `IGNORED_PARAMETER_SCHEMA_KEYS`; operation-level deprecation is completely ignored today.
- The `openapi-specification-v3.2` skill’s `paths-and-operations` reference matches this seam exactly: Operation Object `deprecated` is a **boolean** with **default `false`**. There is no spec rule about excluding deprecated operations from coverage or changing policy.

### Coverage math is already isolated from additive truth surfaces

- `yanote-js/src/coverage/coverage.ts`
  - `coveredOperations`, `uncoveredOperations`, and `dimensions` are computed from observed-vs-unobserved operations plus status/parameter coverage.
  - `computeDimensionSummaries()` only uses `entry.operation.state`, `entry.status`, and `entry.parameters`.
  - `computeCoverage()` already receives `operationContractsByKey`, so it is the natural place to thread `deprecated` onto `perOperation` entries without touching denominator math.
- `yanote-js/src/gates/evaluator.ts`
  - threshold/regression math recomputes raw metrics from `coverage.allOperations`, `coverage.coveredOperations`, and `coverage.perOperation` status/parameter counts only.
  - Nothing here should change for S02. If this file changes, the slice is probably overreaching.

### HTTP report contract is strict and manual

- `yanote-js/src/report/report.ts`
  - `buildReport()` manually shapes `summary` and every `coverage.perOperation` object; there is no automatic passthrough.
  - `resolveReportStatus()` stays `partial` whenever `coverage.uncoveredOperations.length > 0`, so a deprecated uncovered operation still keeps the report partial unless a future explicit policy says otherwise.
- `yanote-js/src/report/schema.ts`
  - `additionalProperties: false` all the way down.
  - Any new deprecated fields must be added here or report writing will fail.
- `yanote-js/src/report/normalize.ts`
  - deterministic sort/rounding pass for the report DTO.
  - new fields need to survive normalization deterministically.
- `yanote-js/src/report/writeReport.determinism.test.ts`
  - byte-equivalent serialization is already pinned; any new report field must be reflected here.

### CLI summary is the right human-facing surface for this slice

- `yanote-js/src/cli.ts`
  - `formatSummaryOutput()` prints the HTTP summary block and the final `YANOTE_SUMMARY` machine line.
  - `collectIssues()` currently reports only generic uncovered operations; there is no deprecated-specific wording.
  - `formatAsyncSummaryOutput()` and async issue collection are separate and should stay untouched for this slice.
- Current fixed-section tests already protect the output contract:
  - `yanote-js/src/cli.summary.contract.test.ts`
  - `yanote-js/src/cli.report.test.ts`
- Because the summary tests mainly assert headings/fragments rather than exact line counts, one additive deprecated line and additive machine tokens are low-risk.

### CI markdown renderer is a downstream consumer, not the primary slice seam

- `scripts/ci/render-yanote-summary.mjs`
  - HTTP markdown summary currently renders status/operations/aggregate/status/parameters plus uncovered-operation issues.
  - It does not read HTTP machine tokens and it ignores unknown report fields.
  - This means S02 can land report + CLI truth without touching the CI markdown renderer; S04 can decide whether to expose deprecated counts in published CI markdown.

### There is no existing deprecated fixture corpus

- `yanote-js/test/fixtures/openapi/` currently has `simple.yaml`, payload fixtures, and security fixtures only.
- `yanote-js/test/fixtures/events/` likewise has no deprecated-specific evidence fixture.
- A dedicated fixture pair is needed if the slice wants a retained proof script instead of only inline-temp Vitest cases.

## Key Constraints And Forward Intelligence

### 1. Treat deprecation as metadata, not policy

The loaded `openapi-specification-v3.2` skill is decisive here:
- Operation Object `deprecated` is just a boolean, default `false`.
- The spec does **not** say deprecated operations disappear from the API surface.
- The safest Yanote behavior is additive truth only:
  - per-operation deprecated flag
  - deprecated covered/uncovered counts
  - explicit CLI/report callouts
  - unchanged existing operation/status/parameter/aggregate numerators

Natural consequence: do **not** add new CLI flags, exclusions, gate semantics, or policy-file behavior in S02.

### 2. `HttpOperationContract` is instantiated inline in many tests

Search results show inline `HttpOperationContract` literals across:
- `yanote-js/src/coverage/coverage.test.ts`
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/gates/evaluator.threshold.test.ts`
- `yanote-js/src/gates/httpPayloadSemantics.test.ts`
- `yanote-js/src/gates/httpRequestSemantics.test.ts`
and others.

Planner consequence:
- make `HttpOperationContract.deprecated` **optional** internally and default it to `false` at use sites, or
- expect a lot of unrelated test churn.

The output/report contract can still make the emitted deprecated fields explicit booleans.

### 3. The best join point is `coverage.perOperation`, not every downstream section

`coverage.perOperation` is already the canonical per-operation catalog used by:
- `buildReport()`
- CLI uncovered-operation issue generation
- downstream human renderers

That is enough to power deprecated reporting. Duplicating `deprecated` into `httpPayloadConformance.perOperation`, `httpRequestConformance.perOperation`, and `httpSecurityConformance.perOperation` would increase churn without new truth. Those sections already key on `operationKey` and can be joined later if S03/S04 want richer rendering.

### 4. Do not introduce a `coverage.deprecated` dimension

There is strong precedent here:
- payload truth stayed in `httpPayloadConformance`
- request truth stayed in `httpRequestConformance`
- security truth stayed in `httpSecurityConformance`
- legacy `coverage.operations/status/parameters/aggregate` remained untouched

S02 should follow the same pattern. A `coverage.deprecated` block will read like a new numerator/dimension and blur the contract.

### 5. Schema evolution is repo-wide even if the slice is local

Any new required HTTP report field means:
- `report.ts`
- `schema.ts`
- `normalize.ts`
- `report.contract.test.ts`
- `writeReport.determinism.test.ts`
move together.

The repo has already evolved the v1 contract in place (e.g. `specSource` is now required under the same `REPORT_SCHEMA_VERSION`), so the planner does not need to invent a version-bump project unless product wants one explicitly.

### 6. Async surface should stay completely separate

To satisfy `R005`:
- do not touch `yanote-js/src/report/asyncReport.ts`
- do not touch `yanote-js/src/report/asyncSchema.ts`
- do not touch `YANOTE_ASYNC_SUMMARY`
- do not add combined HTTP+async deprecated language

This slice is specifically about OpenAPI Operation Object deprecation on the HTTP path.

### 7. Use a proof fixture where the only uncovered operation is deprecated

This makes numerator drift obvious:
- if deprecated operations remain in the denominator, overall coverage stays partial (e.g. `2/3`)
- if someone accidentally excludes deprecated operations, the same run would falsely look green (`2/2`)

That is a better proof than a fixture where deprecated and non-deprecated operations are both uncovered.

### 8. Follow the existing Vitest isolation pattern

The loaded `vitest` skill points to `setup-avoid-shared-state` and `assert-specific-matchers` as the safe default. The repo already follows that pattern in files like:
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`

Planner consequence:
- use per-test temp specs/events for unit and contract coverage while the field names are still moving;
- reserve a checked-in fixture pair for the retained proof script once the contract is settled.

### 9. Gradle/plugin code probably does not need slice-local changes

The Gradle tasks added in S01 mostly:
- classify spec input
- invoke the analyzer
- persist sanitized sidecars

They do not own HTTP report semantics. Once the JS report contract grows a deprecated section, Gradle-produced `yanote-report.json` picks it up automatically. A dedicated Gradle change is only needed if the planner wants extra proof coverage, not for the core implementation.

## Natural Task Seams

### Seam 1 — Extract deprecated metadata into the canonical HTTP operation contract

Files:
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`

Recommended shape:
- add `deprecated?: boolean` to `HttpOperationContract`
- materialize `deprecated: operation.deprecated === true` in `extractHttpContracts()`
- default empty contracts to `deprecated: false` at consumption points

What to prove:
- loader returns `deprecated: true` for marked operations and `false`/absent default for others
- canonical operation keys/order stay unchanged

### Seam 2 — Carry deprecated metadata through coverage without changing any numerators

Files:
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/coverage.test.ts`

Recommended shape:
- add `deprecated: boolean` to `PerOperationCoverage`
- populate from `contract?.deprecated ?? false`
- leave `coveredOperations`, `uncoveredOperations`, `computeDimensionSummaries()`, and gate math untouched

What to prove:
- deprecated presence changes only per-operation metadata
- operation/status/parameter/aggregate coverage outputs stay identical for the same observed evidence
- the “only uncovered op is deprecated” fixture still produces partial overall coverage

### Seam 3 — Extend the canonical HTTP report contract additively

Files:
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`

Recommended shape:
- add a dedicated additive summary block such as `summary.deprecatedOperations { totalOperations, coveredOperations, uncoveredOperations, operationCoveragePercent }`
- add per-operation `deprecated: boolean` on `coverage.perOperation[]`
- do **not** add a new `coverage.deprecated` dimension
- do **not** change `summary.totalOperations`, `summary.coveredOperations`, `coverage.operations`, or report status semantics

What to prove:
- schema-valid report JSON includes explicit deprecated counts
- per-operation deprecated flags are deterministic
- legacy summary/coverage numerators remain unchanged
- byte-stable writer output still holds

### Seam 4 — Extend only the HTTP CLI summary and issue wording

Files:
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`

Recommended behavior:
- add one additive human summary line in the HTTP summary block for deprecated counts
- add additive `YANOTE_SUMMARY` machine tokens for deprecated counts/percent
- leave existing `operations=...`, `covered=...`, and exit-code behavior unchanged
- when an uncovered operation is deprecated, phrase the low-severity issue text explicitly as deprecated rather than generic uncovered
- do not surface covered deprecated operations as “issues”; the summary line is enough

Good token pattern:
- preserve existing tokens
- add explicit deprecated tokens, e.g. ratio + percent, rather than overloading `covered=`

### Seam 5 — Add a retained proof once the field names are settled

Likely files:
- `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml`
- `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`
- `scripts/ci/verify-m013-s02-deprecated-operations.sh`
- optionally `scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs`

Recommended proof:
- build `yanote-js`
- run `node yanote-js/dist/yanote.cjs report ...`
- expect a successful exit (no semantic/policy failure from deprecation alone)
- assert:
  - report JSON has deprecated summary + per-operation flags
  - stdout has the deprecated summary line
  - `YANOTE_SUMMARY` has deprecated tokens
  - overall `operations`/`covered` values still include the deprecated uncovered operation

## Verification Stack

Minimum focused stack after implementation:

```bash
npm -C yanote-js test -- \
  src/spec/openapi.test.ts \
  src/coverage/coverage.test.ts \
  src/report/report.contract.test.ts \
  src/report/report.test.ts \
  src/report/writeReport.determinism.test.ts \
  src/cli.summary.contract.test.ts \
  src/cli.report.test.ts
```

Recommended expanded stack because the HTTP report schema changes:

```bash
npm -C yanote-js test -- \
  src/spec/openapi.test.ts \
  src/coverage/coverage.test.ts \
  src/report/report.contract.test.ts \
  src/report/report.test.ts \
  src/report/report.requestEvidence.contract.test.ts \
  src/report/report.security.contract.test.ts \
  src/report/report.remote-spec.contract.test.ts \
  src/report/writeReport.determinism.test.ts \
  src/cli.summary.contract.test.ts \
  src/cli.report.test.ts \
  src/cli.remote-spec.contract.test.ts
```

If a retained proof script is added:

```bash
bash scripts/ci/verify-m013-s02-deprecated-operations.sh
node --test scripts/ci/verify-m013-s02-deprecated-operations.contract.test.mjs
```

If `scripts/ci/render-yanote-summary.mjs` is intentionally updated for early CI markdown parity, rerun `node --test scripts/ci/render-yanote-summary.test.mjs`; otherwise it can stay out of the slice verification stack.
