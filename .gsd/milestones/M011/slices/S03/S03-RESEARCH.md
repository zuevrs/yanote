# S03 — Research

**Date:** 2026-03-25

## Requirement targeting

- **Direct milestone requirement:** `R022` — widen HTTP/OpenAPI truth from key-presence into provable media and format semantics.
- **Guardrails this slice must preserve:**
  - `R001` — keep the recorder → JSONL → analyzer → report path deterministic.
  - `R002` — fail closed when declared semantics are unsupported or cannot be proven.
  - `R003` — publish the widened truth through the existing CLI/report/gate surfaces rather than a side channel.

## Summary

S03 is **analyzer-first** work. The current Spring MVC recorder already retains the only runtime inputs this slice needs for the first supported payload-semantic expansion: JSON request/response bodies plus normalized content types. No `yanote-core` or recorder event-shape change is required to start S03.

The slice has **three real gaps**:

1. **Format enforcement is still effectively off.**
   - `yanote-js/src/coverage/httpPayloadConformance.ts` creates one global Ajv instance with `validateFormats: false`.
   - The demo OpenAPI already declares `format: email` in `examples/openapi/demo-openapi.yaml`, but the analyzer currently treats an invalid email as `VALID`.
   - A direct CLI probe against the current analyzer showed this exact blind spot: invalid `email` request/response payloads passed payload conformance with `payload_diagnostics=covered:2,uncovered:0,skipped:0`.

2. **Unsupported/custom formats are silently accepted today.**
   - Even if `validateFormats` were toggled to `true`, Ajv still ignores standard/custom formats unless formats are registered.
   - Context7 Ajv docs confirm `addFormats(ajv)` is required for standard format validation, and unknown formats are only fail-closed during schema compilation when strict schema handling is enabled.
   - A local Node probe showed:
     - Ajv without `ajv-formats`: `format: email` is ignored.
     - Ajv with `ajv-formats` and `strict: false`: known `email` validates, but custom `format: yanote-id` is still silently ignored.
   - This means S03 needs an explicit **Yanote product policy** for supported formats; it cannot inherit “whatever ajv-formats happens to know”.

3. **Media-type specificity is currently wrong.**
   - `yanote-js/src/spec/openapi.ts` normalizes and lexicographically sorts declared media types.
   - `yanote-js/src/coverage/httpPayloadConformance.ts` then picks the **first** matching entry.
   - A synthetic CLI probe proved the bug: with both `application/*+json` and `application/problem+json` declared, an observed `application/problem+json` response matched the wildcard contract first and produced `INVALID_BODY` (`/ must have required property 'kind'`) even though the specific declaration should win.

## Skills Discovered

- **Already installed and directly relevant**
  - `openapi-specification-v3.2`
  - `json-schema-validator`
- **Skill discovery performed**
  - `npx skills find "ajv"`
  - Result: only unrelated skills were returned; **no new skill was relevant enough to install**.

### Skill rules that matter here

- The loaded **OpenAPI** skill points to the request/response `content` map and media-type-range semantics. That reinforces that S03 must treat media matching as an OpenAPI contract-selection problem, not a lexical-order artifact.
- The same skill also treats schema `format` as part of schema semantics, not transport matching. That argues for a separate **format-policy layer** on top of media selection.
- The loaded **JSON Schema validator** skill reinforces that `format` validation is validator-defined behavior. That supports an explicit Yanote allowlist rather than assuming every declared OpenAPI `format` is automatically enforceable.

## Commands run

- Baseline targeted tests:
  - `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/report/report.contract.test.ts src/cli.report.test.ts`
  - Result: **42 tests passed**.
- Ajv behavior probes (local Node scripts):
  - confirmed `validateFormats: true` without `ajv-formats` still ignores `email`
  - confirmed `ajv-formats` enables `email` validation
  - confirmed custom formats are still ignored under non-strict schema compilation
- Analyzer probes (local temporary spec/events via `node yanote-js/dist/yanote.cjs report`):
  - invalid email against `examples/openapi/demo-openapi.yaml` currently passes as payload `VALID`
  - custom format `yanote-id` currently passes as payload `VALID`
  - media-specificity probe currently fails with the wildcard schema instead of the more-specific declaration
- Dependency inspection:
  - `npm -C yanote-js ls ajv-formats`
  - Result: `ajv-formats@2.1.1` is already present **transitively** via `@asyncapi/parser`, but not declared directly in `yanote-js/package.json`.

## Implementation landscape

### 1. Slice center: `yanote-js/src/coverage/httpPayloadConformance.ts`

This is the main S03 implementation file.

What it does now:
- normalizes observed content types
- selects request/response content contracts
- matches observed vs declared media types
- limits conformance to JSON media types (`application/json` and `+json`)
- compiles payload schemas with Ajv
- emits payload diagnostics and per-operation summaries

Why it matters:
- format policy and format-aware failure behavior belong here
- media-specificity correction belongs here
- any new payload diagnostic code originates here first

Important current constraints:
- the Ajv singleton is created once at module load time
- cache keys are media-type based per operation/target/status; that is already sufficient for the current format-policy scope
- unsupported paths today map to `SKIPPED` diagnostics that later become fail-closed semantic failures through gate classification

### 2. OpenAPI extraction seam: `yanote-js/src/spec/openapi.ts`

Relevant current behavior:
- `extractMediaTypeContracts()` normalizes media types and sorts them lexicographically
- `normalizeSchemaContract()` preserves `format` inside normalized schemas
- OpenAPI 3.0 `nullable` normalization is already handled before Ajv compilation

Planner note:
- **Do not fix specificity by changing public report ordering unless necessary.**
- The report/tests currently expect sorted `declaredMediaTypes` arrays. The safer fix is to keep extraction/report order stable and change only **matching-time selection** inside `findMatchingMediaType()`.

### 3. Gate and public-contract fan-out

If S03 introduces a new fail-closed payload diagnostic such as `UNSUPPORTED_FORMAT`, the change fans out through these files:

- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/cli.ts`

Why this matters:
- `report/schema.ts` is strict (`additionalProperties: false`)
- `cli.ts` summary/top-issue output is contract-tested
- `failureOrder.ts` ranks semantic failures explicitly

Recommendation:
- keep the schema blast radius small if possible
- a new **code enum value** plus clear message may be enough for S03; add new structured fields only if the planner decides they are necessary for downstream proof/report consumption

### 4. Existing proof and contract surfaces are reusable

Best existing seams:
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
  - already contains the wildcard `+json` matcher tests and the payload truth matrix
  - the new media-specificity regression test belongs here next to the wildcard matcher coverage
- `yanote-js/src/cli.report.test.ts`
  - already has `createFullObservationPayloadTruthFixture(...)` for semantic red payload cases
  - easiest place to add `invalid-format` and `unsupported-format` scenario builders
- `yanote-js/src/report/report.contract.test.ts`
  - already mirrors the same payload truth scenarios at report-contract level
- `scripts/docs/verify-s02-analysis-path.sh`
  - already validates the retained payload truth matrix with fixture-backed analyzer runs
  - can be extended or cloned for S03 format/media cases

### 5. Demo/example surfaces already give one cheap live proof path

Files:
- `examples/openapi/demo-openapi.yaml`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`

Useful observation:
- the existing `POST /users` route echoes `email` back in the response model
- the service does **not** enforce email validity itself
- that means an invalid email request can generate both request and response semantic drift **without any recorder or service change**

But there is a catch:
- `DemoServiceE2eTest` and `scripts/docs/verify-s02-analysis-path.sh` currently assume the stable happy path and exactly **four** recorded events
- mutating the existing example test to send an extra invalid-email request would ripple through the happy-path proof stack

Recommendation:
- if a live proof is desired in S03, make it a **separate focused verifier/test**, not a mutation of the current happy-path example flow

## Don’t hand-roll

Reuse these patterns instead of inventing new ones:

- **Ajv format plugin**
  - use `ajv-formats` directly; do not reimplement email/date regexes manually
  - add it as a **direct** `yanote-js` dependency even though it currently arrives transitively; S03 should not depend on AsyncAPI’s dependency tree for HTTP format truth
- **Async unsupported-format pattern**
  - `yanote-js/src/gates/asyncEvaluator.ts` and `yanote-js/src/gates/failureOrder.ts` already show a clean fail-closed pattern for unsupported schema-format surfaces (`ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT`)
  - S03 can mirror that style for HTTP payload format policy
- **Full-observation red-fixture builders**
  - `cli.report.test.ts` and `report.contract.test.ts` already have scenario-based temp fixture builders; extend those instead of inventing a new harness
- **Focused analyzer proof script pattern**
  - `scripts/docs/verify-s02-analysis-path.sh` already separates happy-path and red-path analyzer verification; use that style for S03 if retained proof needs shell verification

## What to build or prove first

1. **Freeze the current blind spots with red tests/probes**
   - invalid email currently passes
   - custom/unsupported format currently passes
   - wildcard media currently beats the specific declaration

2. **Implement the format policy core**
   - register `ajv-formats`
   - define Yanote’s supported format subset explicitly
   - detect declared-but-unsupported/custom formats before they silently degrade to plain `type`

3. **Fix media-specific matching**
   - rank all matching declared media types by specificity at selection time
   - exact match should beat suffix wildcard; suffix wildcard should beat broad subtype wildcard

4. **Only then fan out the public contract**
   - gate failure code(s)
   - report schema enums
   - CLI top issues / machine summary / contract tests

## Recommended task seams for the planner

### Task seam A — Format policy core

Primary files:
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/package.json`

Likely work:
- add direct `ajv-formats`
- introduce a supported-format policy helper
- keep the initial allowlist intentionally small (recommended: **`email` first**)
- convert unsupported/custom format usage on the matched schema into explicit fail-closed diagnostics instead of implicit success

Why start here:
- this is the largest semantic gap and the easiest place to overclaim support if done loosely

### Task seam B — Media specificity fix

Primary file:
- `yanote-js/src/coverage/httpPayloadConformance.ts`

Likely work:
- change `findMatchingMediaType()` from “first matching declared entry” to “most specific matching declared entry”
- keep `extractMediaTypeContracts()` sorting/report behavior stable unless a contract reason appears to change it

Why it is separable:
- localized logic change with a clean failing regression case

### Task seam C — Gate/report/CLI plumbing for new payload code(s)

Primary files:
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/cli.ts`

Likely work:
- add new payload diagnostic enum(s)
- map them to semantic failure code(s)
- update reason/hint text and precedence ordering
- update strict report schema enums
- preserve current machine-summary shape unless a new token is truly required

### Task seam D — Test and retained-proof expansion

Primary files:
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/gates/httpPayloadSemantics.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- optionally `scripts/docs/verify-s02-analysis-path.sh` **or** a new focused S03 verifier

Likely work:
- add a specificity regression test
- add `invalid-format` and `unsupported-format` fixture scenarios
- assert full report/CLI/gate contract behavior for the new code path(s)
- if shell proof is needed, prefer a focused analyzer verifier rather than mutating the happy-path E2E bundle

## Verification plan

Minimum fast stack:

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/report/report.contract.test.ts src/cli.report.test.ts`

Recommended additional proof if shell verification is touched:

- run the focused analyzer verifier that carries the payload red-path matrix
- if the planner extends the existing script, rerun:
  - `bash scripts/docs/verify-s02-analysis-path.sh`

If a dedicated S03 verifier is introduced, keep it focused on:
- invalid supported format drift (`email`)
- unsupported/custom format drift
- most-specific media selection

## Key constraints and pitfalls

- **Do not equate `ajv-formats` support with Yanote support.**
  - The product contract still needs an allowlist.
- **Do not flip global Ajv strictness blindly.**
  - current payload schema normalization intentionally tolerates broader OpenAPI-ish input than strict Ajv schema mode
  - S03 should not accidentally turn compile-time warnings into unrelated regressions
- **Do not “fix” media specificity by destabilizing report ordering unless necessary.**
  - matching behavior and presentation order do not need to be the same thing
- **Do not expand the happy-path example bundle casually.**
  - current example/test/docs scripts are pinned to the four-event green path and the existing unsupported-schema red pass
- **No recorder/core work is required for the first S03 cut.**
  - JSON body + content-type retention is already enough for format/media truth on the current supported payload boundary

## Sources

- Loaded skill: `openapi-specification-v3.2`
- Loaded skill: `json-schema-validator`
- Context7 Ajv docs: `/websites/ajv_js` query `format validation validateFormats unknown formats strict mode ajv-formats email uri date-time custom formats`
- Repo files explored:
  - `yanote-js/src/coverage/httpPayloadConformance.ts`
  - `yanote-js/src/spec/openapi.ts`
  - `yanote-js/src/gates/httpPayloadSemantics.ts`
  - `yanote-js/src/gates/failureOrder.ts`
  - `yanote-js/src/report/report.ts`
  - `yanote-js/src/report/schema.ts`
  - `yanote-js/src/cli.ts`
  - `yanote-js/src/coverage/httpPayloadConformance.test.ts`
  - `yanote-js/src/spec/openapi.test.ts`
  - `yanote-js/src/report/report.contract.test.ts`
  - `yanote-js/src/cli.report.test.ts`
  - `examples/openapi/demo-openapi.yaml`
  - `examples/openapi/demo-openapi-unsupported-schema.yaml`
  - `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
  - `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
  - `scripts/docs/verify-s02-analysis-path.sh`
  - `scripts/ci/run-v1-e2e.sh`
