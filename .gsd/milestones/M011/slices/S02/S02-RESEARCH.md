# S02 — Research

**Date:** 2026-03-25

## Summary

S02 is now an analyzer/report/gate slice more than a recorder slice. S01 already added additive path/query/header/cookie evidence and preserves repeated query/header/cookie values. The remaining work is to:

- widen OpenAPI parameter contracts beyond first-scalar only
- classify supported repeated-value array shapes without overclaiming full OpenAPI serialization
- fail closed on observed request-semantic drift / unverifiable supported contracts
- extend focused proof assets

The most important planning decision is the exact supported array subset. Current evidence is honest enough for repeated query values immediately; path simple arrays and cookie/header delimited arrays are still ambiguous unless the contract is restricted further.

## Requirements focus

- Owns **R022** directly: publish/prove supported request serialization and cookie semantics on retained evidence.
- Must preserve **R001**: keep recorder → JSONL → analyzer deterministic; no route or coverage-numerator regressions.
- Must satisfy **R002** more explicitly than S01: request semantics still do not fail closed in CI today.
- Must preserve **R003**: widened truth needs to show up in existing report/CLI/gate entrypoints, not a side channel.

## Skills Discovered

Installed and directly relevant skills already present:

- `openapi-specification-v3.2` — use the Parameter Object rule that a parameter uses either `schema` + serialization keywords or `content`, not both; use its location/default serialization rules.
- `spring-web` — reinforces keeping request observation centralized in filter/interceptor-style infrastructure, not in controller logic.
- `vitest` — use edge-case/table-driven deterministic tests and stable ordering assertions for report/CLI output.

No additional skill installs were needed; the core technologies for this slice already have installed skills.

## Verified baseline

### Commands run

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts`
- `npm -C yanote-js test -- src/coverage/httpRequestConformance.test.ts`
- `./gradlew :yanote-recorder-spring-mvc:test`
- `./gradlew :yanote-core:test`
- `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`

### Result

- Unfiltered module tests passed for `yanote-core` and `yanote-recorder-spring-mvc`.
- The exact Gradle `--tests` filters still fail in this worktree with `No tests found for given includes`, despite the S01 summary saying the classes were made public.
- Vitest file-path filtering is also flaky from this worktree: the two-file invocation returned green, but the direct single-file invocation reported `No test files found`.
- Planner implication: keep S02 verifiers at module/script level unless/until the filter quirk is revalidated; do not build a plan that depends on exact per-class Gradle or per-file Vitest filters.

## Recommendation

### Recommended support cut for S02

Keep the supported boundary honest and narrow:

1. **Support scalars** for the existing four locations (`path=simple`, `query=form`, `header=simple`, `cookie=form`) using the S01 evaluator/report surface.
2. **Add repeated-value array support only where retained evidence preserves multiplicity honestly without delimiter reconstruction.**
   - safest immediate win: `query=form, explode=true` repeated values
   - maybe viable if the team explicitly documents the wire interpretation: repeated `requestHeaders[...]` values and duplicate cookie names, because S01 capture already preserves them as `values[]`
3. **Keep these unsupported for S02 unless the planner is willing to tighten item-schema rules further:**
   - path arrays (current recorder retains one decoded string from `URI_TEMPLATE_VARIABLES_ATTRIBUTE`, not a repeated collection)
   - comma-split arrays reconstructed from a single retained string (`query form explode=false`, `header simple`, `cookie form explode=false`) because delimiter vs literal-comma truth is ambiguous for general strings
   - cookie arrays with default `explode=true` — Swagger’s OAS 3.0 serialization guide leaves array/object examples blank for this case, so Yanote should not invent semantics
   - `content`, `deepObject`, `matrix`, `label`, nested objects

If the team wants to widen beyond repeated query values in S02, do it only for item schemas whose wire forms cannot contain delimiters (integer / number / boolean, maybe tightly constrained strings). Otherwise the slice should prefer unsupported diagnostics over unsafe parsing.

### Recommended work order

1. **Decide and encode the support matrix in the TypeScript contract model first.**
2. **Teach the evaluator to validate arrays + explicit unsupported reasons.**
3. **Add fail-closed request-semantic gates.**
4. **Only then widen the focused proof assets.**

This keeps the risky boundary decision in one place and prevents live-proof work from baking in the wrong subset.

## Don’t hand-roll — reuse existing patterns

- **Reuse the S01 additive boundary.** `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java` already preserves repeated query/header/cookie values as `values[]` and tri-states unavailable evidence. S02 should consume that evidence, not invent a second recorder surface.
- **Reuse the payload/async fail-closed pattern.**
  - `yanote-js/src/gates/httpPayloadSemantics.ts`
  - `yanote-js/src/gates/asyncEvaluator.ts`
  These are the existing repo patterns for mapping analyzer diagnostics into semantic CI failures. Request semantics should follow the same shape instead of creating ad-hoc CLI-only errors.
- **Keep legacy coverage numerators stable.** `coverage.parameters` still hangs off `queryKeys` / `headerKeys` and `ParameterLocation` intentionally excludes `cookie`. S02 should continue using the additive `httpRequestConformance` surface rather than redefining coverage math.

## Implementation landscape

### 1. The current request-parameter contract is still “scalar only” and collapses too many unsupported cases

**Files**
- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`

Current reality:
- `HttpRequestParameterContract` stores `style`, `explode`, and one `scalar` union.
- Unsupported reasons are only `"style"` or `"schema"`.
- `extractRequestParameters()` ignores `content` as a first-class case and does not model array item schemas at all.
- `explode` is parsed and stored, but the support model does not use it yet.
- `SUPPORTED_PARAMETER_STYLE_BY_LOCATION` already encodes the location whitelist, so S02 does not need a new style matrix — it needs a richer support model on top of the existing one.

Planner implication:
- S02 needs a real contract-model expansion before evaluator work.
- Distinct unsupported reasons worth surfacing now:
  - `content`
  - `explode`
  - `style`
  - `schema`
- If the planner wants supported arrays, it must retain item schema and probably a `shape` / `wire kind` field instead of only `scalarSupport`.
- The existing public field name `scalarSupport` is now awkward. Either:
  - add an additive `valueSupport` / `supportedShape` field, or
  - accept a coordinated rename across report/schema/CLI/tests before S04 freezes the public surface.

### 2. The evaluator still has one-value semantics hard-coded

**File**
- `yanote-js/src/coverage/httpRequestConformance.ts`

Current reality:
- `evaluateRequestParameter()`:
  - emits `redacted` / `omitted` early
  - marks any `observedValues.length !== 1` as `unsupported`
  - only validates scalar wire values
- This means repeated query/header/cookie values already survive the recorder path, but the analyzer categorically rejects them.

Planner implication:
- The natural seam is to preserve the existing truth vocabulary (`captured-valid`, `captured-invalid`, `redacted`, `omitted`, `unsupported`) and teach the evaluator two validation paths:
  - scalar validation
  - repeated-value array validation
- Raw `observedValues` can stay JSON-report-only; CLI no-leak behavior already exists and should remain unchanged.
- Because `HttpRequestEvidenceCapture.toEvidence()` omits/redacts the whole parameter if any retained member is oversized/unsupported/sensitive, array validation can stay all-or-nothing; there is no partial-value capture model to invent.

### 3. Request semantics are still invisible to fail-closed gates

**Files**
- `yanote-js/src/cli.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/asyncEvaluator.ts`

Current reality:
- `cli.ts` computes `requestConformance`, but `evaluateGateFailures()` only receives payload diagnostics.
- There is no request-semantic gate module.
- `Top Issues` already prints non-valid request diagnostics as medium/low issues, but they do not affect exit code.
- `failureOrder.ts` has no request-semantic failure codes.

Planner implication:
- **R002 / the roadmap text about “report and gates” is still unmet.**
- S02 probably needs a new gate mapper, e.g. a sibling to `httpPayloadSemantics.ts`, plus:
  - evaluator wiring
  - failure-order ranks
  - CLI fail-closed contract tests
  - summary dedupe logic so request semantic failures do not appear twice (high failure + medium diagnostic)

A good pattern already exists in async semantics: missing / unavailable / invalid / unverifiable contract states each map to distinct semantic failures. Request semantics can mirror that approach.

### 4. The evidence capture layer is likely sufficient for S02 unless the slice insists on path-array support

**Files**
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java`
- `yanote-core/src/main/java/dev/yanote/core/events/HttpRequestEvidence.java`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`

Current reality:
- Query params, request headers, and cookies already preserve ordered `values[]`.
- Header keys are lowercased; query/path/cookie keys preserve original names.
- `readJsonl.ts` only derives legacy `queryKeys` / `headerKeys` from captured evidence; repeated values do not affect coverage percentages.

Planner implication:
- S02 should **not** reopen the JSONL contract unless the team chooses a subset that needs raw, delimiter-preserving wire strings beyond `values[]`.
- The main exception is path arrays: `capturePathParams()` records `String.valueOf(entry.getValue())`, so a path array is still one rendered value, not a repeated collection. Supporting path arrays truthfully would require either:
  - raw path-segment capture, or
  - a very narrow parser that only accepts comma-safe scalar item schemas
- That is the biggest scope trap in this slice.

### 5. The current proof assets are reusable, but array/cookie proof needs a deliberate route/spec design

**Files**
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s01-request-evidence.sh`

Current reality:
- The focused proof route already proves scalar path/query/header/cookie evidence plus redacted/omitted cases end to end.
- The controller does not need to validate every parameter itself; recorder capture happens in the filter after handler mapping.
- The verifier already retains `events.jsonl`, `yanote-report.json`, and CLI stdout/stderr and checks for secret leakage.

Planner implication:
- The lowest-risk S02 proof path is to extend these assets rather than invent a brand-new stack.
- Likely proof structure:
  - keep the existing scalar operation
  - add one array-focused operation or extend the focused spec with clearly named array/unsupported parameters
  - retain artifact assertions at both raw JSONL and `yanote-report.json` levels
- Watch-outs:
  - duplicate cookie proof may need low-level header construction rather than RestAssured’s high-level cookie map if the client dedupes names
  - path-array proof probably needs a second operation if the existing `userId` scalar contract should stay intact

### 6. CLI/report output already has the right place for additive data, but contract tests will fan out

**Files**
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`

Current reality:
- `YanoteReport.httpRequestConformance` is already strict-schema, deterministic, and heavily contract-tested.
- CLI summary prints only rollups and issue text; raw retained values never appear on stdout.
- `observedParameters` and request truth counts are derived from diagnostics, not declared contract summaries.

Planner implication:
- Any shape change to request-conformance summaries will require coordinated updates across schema + normalize + contract tests.
- If S02 needs unsupported declarations visible even before traffic exercises them, current summary counts are insufficient; the planner must decide whether:
  - per-operation parameter metadata in `yanote-report.json` is enough, or
  - CLI/report summary needs a new declared-support rollup.

## Serialization-specific constraints from docs

- From the installed `openapi-specification-v3.2` skill: a parameter uses either `schema` + serialization keywords or `content`. That makes `content` a distinct unsupported-contract reason, not just “schema unsupported”.
- From Swagger’s OAS 3 serialization guide:
  - path default is `simple` + `explode=false`
  - query default is `form` + `explode=true`
  - header always uses `simple`
  - cookie always uses `form`
  - cookie array/object examples are only documented for `explode=false`; the guide leaves `explode=true` array/object examples blank
- Planner implication: cookie array support needs extra care; Yanote should not silently invent semantics the public docs do not even illustrate.

## What to build or prove first

1. **Lock the supported/unsupported matrix in code comments/tests before broad implementation.**
   - This is the one decision that touches every downstream surface.
2. **Refactor the request-parameter contract model.**
   - openapi parser + dimensions types + parser tests
3. **Upgrade the evaluator.**
   - repeated arrays, explicit unsupported reasons, deterministic diagnostics
4. **Add request-semantic fail-closed gates.**
   - evaluator wiring + failure ordering + CLI failclosed contracts
5. **Extend the focused proof route/spec/script.**
   - raw `events.jsonl` + `yanote-report.json` + stdout assertions

## Verification plan

### Existing commands that are reliable in this worktree

- `./gradlew :yanote-core:test`
- `./gradlew :yanote-recorder-spring-mvc:test`

### Commands to treat with caution

- Exact Gradle `--tests` filters for the S01 request-evidence classes currently return `No tests found`.
- Targeted `npm -C yanote-js test -- <file>` filters are flaky in this worktree; use module/full-suite execution or revalidate a reliable Vitest invocation before baking file-filtered commands into the slice plan.

### S02-focused verifier stack to plan for

- JS:
  - OpenAPI parser/contract tests
  - request conformance evaluator tests
  - new request semantic gate tests
  - report/CLI contract tests
- JVM/live:
  - existing recorder module test suite
  - focused RestAssured proof + retained verifier script (likely a new `scripts/ci/verify-m011-s02-...sh` or an additive extension of the S01 script)

## Sources

- Installed skill `openapi-specification-v3.2` — Parameter Object rule (`schema` vs `content`) and location/default serialization rules.
- Installed skill `spring-web` — keep request observation centralized instead of moving semantics into controllers.
- Installed skill `vitest` — deterministic edge-case and ordering-sensitive tests.
- Swagger OpenAPI 3.0 Parameter Serialization guide: `https://swagger.io/docs/specification/v3_0/serialization/`
