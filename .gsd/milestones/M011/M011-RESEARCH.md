# M011 — Research

**Date:** 2026-03-25

## Summary

M011 starts from a narrower real boundary than some late M010 planning artifacts imply. In the current worktree, the shipped HTTP/OpenAPI path still:

- extracts only `path` / `query` / `header` parameter names plus `required`
- computes parameter coverage from operation hit + `queryKeys` + `headerKeys` only
- ignores `cookie`, `style`, `explode`, parameter schemas, and parameter `content`
- records only canonical route + payload bodies/content types in the JVM `HttpEvent`
- does **not** retain cookie values, query values, request-header values, or path-variable values end to end
- validates payloads with AJV configured as `validateFormats: false`
- supports JSON payload validation only, even though it already normalizes broader media-type declarations

The biggest planning implication is that M011 is **not** a thin analyzer-only follow-on. The high-risk work is still the evidence contract: safe request-surface retention for cookies and serialization-sensitive parameter values. By contrast, `format` enforcement and one media-selection correctness bug are lower-risk analyzer work that can move independently.

Primary recommendation: plan the milestone as **four slices**, not one blended feature:

1. **Evidence contract first** — additive recorder/core/parser support for cookie, query, header, and path values with explicit omission/redaction behavior.
2. **Parameter/cookie serialization semantics** — OpenAPI extraction + analyzer logic for the supported subset only.
3. **Payload format/media semantics** — enable selected `format` checks and fix media-type selection precedence on the existing payload path.
4. **Docs/proof integration** — CLI/report/docs/proof-bundle updates once the supported subset is real.

A major surprise: the historical M010 summaries describe richer HTTP-core files such as `HttpEvidenceCapture`, `httpCoreConformance`, and `httpParameterValueConformance`, but those files are not present in this worktree. For M011 planning, the source of truth should be the current code, not the optimistic historical narrative.

## Verified baseline

I verified the current boundary with targeted tests instead of relying only on file reading.

### Commands run

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/parameterCoverage.test.ts src/events/readJsonl.parameters.test.ts src/coverage/httpPayloadConformance.test.ts`
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest" :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"`

### Result

Both commands passed. That matters because it confirms the current observed baseline is internally consistent:

- parameter coverage is still key-presence-only
- event round-trip compatibility is still tightly pinned to the current shallow `HttpEvent` shape
- recorder tests prove JSON payload capture and policy-filtered omission, but not cookie/query/header/path-value capture

## Recommendation

### Recommended slice order

| Slice | Goal | Why it belongs here |
|---|---|---|
| S01 | **Additive HTTP evidence contract** for path/query/header/cookie values + safe omission/redaction policy + focused live proof | This is the gating risk for cookie and serialization semantics. Without it, later analyzer work is forced to guess. |
| S02 | **Supported parameter and cookie conformance** (`cookie`, `style`, `explode`, schema-aware value checks, unsupported-subset diagnostics) | Depends on S01 evidence and on expanding the OpenAPI parameter model. |
| S03 | **Payload format/media semantics** (`format` enforcement, media specificity fix, selected supported non-JSON media if intentionally chosen) | Can partially move in parallel because current payload engine already exists. |
| S04 | **Report/CLI/docs/proof integration** for the widened supported HTTP surface | The public contract is strict and should be updated only once the supported subset is settled. |

### Planning note on order

If the roadmap planner wants one lower-risk early win, S03 can begin with **`format` enforcement on the current JSON path** before S02 is complete. The existing example OpenAPI already declares `format: email`, so the analyzer side can be proven without waiting for new recorder fields. But the milestone’s main uncertainty is still S01: safe truthful evidence for cookies and serialization-sensitive parameters.

## Don’t hand-roll — reuse existing patterns

| Problem | Existing pattern | Why reuse it |
|---|---|---|
| Additive event evolution | `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`, `HttpEvent.java`, `yanote-js/src/events/readJsonl.ts` | Java side ignores unknown fields, TS reader drops unknown fields; additive JSONL evolution is already the safe path. |
| Explicit omission vs true drift | `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java` | Recorder already distinguishes captured vs omitted with reasons. New request-surface evidence should use the same honesty pattern. |
| Redaction-state modeling | `yanote-core/src/main/java/dev/yanote/core/events/KafkaEvent.java`, `yanote-js/src/model/asyncEvent.ts` | Async header evidence already has a good tri-state shape (`captured` / `redacted` / `omitted`) with reasons. That is a much better starting point than inventing a new HTTP-only vocabulary. |
| Additive conformance surface | `yanote-js/src/coverage/httpPayloadConformance.ts`, `yanote-js/src/gates/httpPayloadSemantics.ts`, `yanote-js/src/report/report.ts` | M008 established the right product pattern: keep legacy observation numerators stable and add a separate semantic surface for fail-closed truth. |
| Focused proof before broad bundle updates | `scripts/docs/verify-s02-analysis-path.sh`, `scripts/ci/run-v1-e2e.sh` | The repo already separates a stable happy-path retained bundle from focused red-path checks. M011 should do the same for cookie/serialization proof instead of contaminating the current happy path too early. |
| Strict report contract management | `yanote-js/src/report/schema.ts`, `yanote-js/src/report/report.contract.test.ts` | Any new report surface or diagnostic code will require coordinated schema + contract-test updates. |

## What exists now

### 1. The OpenAPI parameter model is too shallow for M011

**Files:**
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/dimensions.ts`

Current reality:

- `extractParameters()` accepts only `path`, `query`, and `header`.
- `cookie` is filtered out entirely.
- `ParameterDefinition` retains only `{ name, in, required }`.
- `style`, `explode`, `schema`, `content`, and `allowReserved` are all discarded.
- The parser currently cannot tell whether a parameter is scalar vs array/object, so it cannot reason about serialization even if runtime evidence existed.

Planner implication:

- S02 needs a real parameter-contract expansion, not just a new evaluator.
- M011 should stay on the existing OpenAPI 3.0-ish surface already used in the repo. Do **not** silently expand into newer 3.2-only surfaces such as `in: querystring` as table stakes.
- Parameter `content` support is a separate breadth decision; current code does not have the model for it.

### 2. Runtime HTTP evidence is still too shallow for cookie/serialization truth

**Files:**
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/events/readJsonl.ts`

Current reality:

- JVM `HttpEvent` carries canonical `route`, status, request/response body, body capture provenance, content types, and metadata.
- It does **not** carry path params, query values, request-header values, cookies, or any multi-value-safe request evidence.
- `HttpEventRecordingFilter` writes only route/method/status/payload surfaces.
- TS `HttpEvent` expects `queryKeys` and `headerKeys`, but those are Node-side compatibility arrays, not live retained value maps.
- `readJsonl.ts` only normalizes key arrays; it has no concept of value-bearing evidence.

Planner implication:

- M011 cannot honestly claim cookie or serialization support without a new additive event shape.
- `route` must stay canonical. Do **not** switch `route` from template to concrete path; add `pathParams` instead.
- New value-bearing evidence must preserve repeated values. The current `queryKeys` / `headerKeys` dedupe-and-sort behavior is fine for coverage percentages, but it is not sufficient for serialization semantics.

### 3. Parameter coverage is still presence-only

**Files:**
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/parameterCoverage.ts`
- `yanote-js/src/events/readJsonl.parameters.test.ts`

Current reality:

- `coverage.ts` aggregates `queryKeys` and `headerKeys` into sets.
- `parameterCoverage.ts` marks path parameters covered if the operation was observed at all.
- Query/header coverage is still name-presence, not value conformance.
- Current tests assert exactly that behavior.

Planner implication:

- Do **not** redefine `coverage.parameters` to mean full semantic conformance. That would destabilize existing numerators, docs, and aggregate coverage semantics.
- Follow the payload pattern instead: keep the existing observation metric, add a new supported semantic surface for cookies/serialization/value checks.

### 4. The payload/media engine is a strong base, but still intentionally narrow

**Files:**
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/package.json`
- `examples/openapi/demo-openapi.yaml`

Current reality:

- Recorder payload capture is JSON-only, plus explicit omission for non-JSON, malformed, or oversized bodies.
- `httpPayloadConformance.ts` normalizes content types and already supports exact, wildcard, and `+json` matching.
- AJV is initialized with `validateFormats: false`, so `format` is ignored today.
- `yanote-js/package.json` includes `ajv` directly, but not `ajv-formats` as a direct dependency.
- The example OpenAPI already contains `format: email`, so the repo has a live spec surface where format validation matters but is currently ignored.

Planner implication:

- `format` enforcement is a good self-contained analyzer slice.
- If M011 enables format checks, it must also define what happens to **unknown/custom formats**, because OpenAPI `format` is open-valued and many tools treat it as annotation-only unless a validator explicitly supports it.
- Supporting broader media types than JSON is **not** just an analyzer change if real body capture is required. Any non-JSON body support must pass a privacy/size review first.

### 5. Media selection has one correctness gap already visible from the code

**Files:**
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- OpenAPI reference material from the installed `openapi-specification-v3.2` skill and Swagger docs

Current reality:

- `extractMediaTypeContracts()` sorts declared media types lexicographically.
- `findMatchingMediaType()` picks the **first** declared entry whose media type matches the observed content type.
- OpenAPI media semantics expect the **most specific** media-type key to win.

Why this matters:

- A declaration set like `application/*+json` plus `application/problem+json` can be matched incorrectly today if the wildcard sorts first.
- This is a real M011 media-semantics bug even before broader media capture is added.

Planner implication:

- S03 should include a media-specificity fix even if the team decides not to widen beyond the JSON family yet.
- This is a good low-risk, high-truth slice because it is localized to analyzer semantics and fixtures.

### 6. The current example/proof path cannot prove M011 semantics yet

**Files:**
- `examples/openapi/demo-openapi.yaml`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `docs/guides/analyzer-coverage.md`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`

Current reality:

- The demo service exercises basic path + JSON payload flows only.
- The public proof bundle and analyzer guide are written around observation coverage + JSON payload conformance.
- There is no focused query/header/cookie route today.
- There is no retained proof surface for serialization-specific cases such as repeated query params, header values, or cookies.

Planner implication:

- M011 needs at least one **focused Spring MVC proof route** rather than relying only on the existing happy path.
- Keep the current `run-v1-e2e.sh` happy-path bundle stable as long as possible. Add a separate focused verifier for M011 semantics first, then compose a final owner verifier later if needed.

### 7. Report/CLI/docs contracts are strict and tightly coupled

**Files:**
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `docs/guides/analyzer-coverage.md`
- `scripts/docs/verify-s02-analysis-path.sh`

Current reality:

- The report schema is strict (`additionalProperties: false`) and version-pinned.
- CLI summary output and retained proof scripts assert exact machine-readable tokens such as `payload_diagnostics=...`.
- The public analyzer guide explains the world as **observation coverage + JSON payload conformance**.

Planner implication:

- If M011 adds a new top-level semantic surface, that is a coordinated schema / report / CLI / docs / verifier change.
- If possible, prefer one additive surface over multiple loosely related flags.
- The public wording must remain explicit about the supported subset; otherwise the tool will overclaim full OpenAPI breadth.

## Requirements lens

### Table stakes continuity from validated requirements

Even though `R022` is still deferred in the requirements register, M011 still has to preserve the already-validated product contract:

- **R001:** keep the recorder → JSONL → analyzer → report path deterministic.
- **R002:** fail closed when the contract cannot be proven or when supported semantics drift.
- **R003:** keep the widened truth visible through CLI/report/CI surfaces teams already use.

These are not optional polish items. They are the guardrails that keep M011 honest.

### Direct milestone requirement

- **R022** is the actual milestone target: extend the HTTP/OpenAPI path from key-presence truth into supported cookie, serialization, media, and format semantics that can be proven through retained evidence.

### Candidate requirements worth making explicit (advisory only)

These are not auto-binding, but the roadmap planner should consider turning them into explicit acceptance bullets or new requirements:

1. **Supported parameter-subset requirement**
   - Yanote must publish the exact supported parameter serialization subset rather than claiming generic `style` / `explode` support.
   - Recommended first subset: defaults the current stack can prove most safely — `query=form`, `header=simple`, `path=simple`, `cookie=form`, scalar first, then repeated-value arrays where live evidence preserves values honestly.

2. **Safe request-evidence requirement**
   - Yanote must distinguish captured vs redacted/omitted request-surface evidence for sensitive headers and cookies instead of silently dropping them.
   - This is especially important because the recorder already injects test metadata headers into every request.

3. **Format-policy requirement**
   - Yanote must define which OpenAPI formats it validates and how it reports declared-but-unsupported/custom formats.
   - Silent fallback to plain `type` should not remain implicit once M011 claims format support.

4. **Media-specificity requirement**
   - When multiple declared media types match an observed content type, Yanote should select the most specific declaration.
   - This is a small requirement, but it is core to truthful media semantics.

### Likely optional / overbuilt for M011

- Full matrix / label / deepObject serialization coverage.
- Multipart and nested `encoding` object support.
- Parameter `content` support for complex non-schema parameters.
- OAS 3.2-only `querystring` parameter support.
- Universal media-type validation across every text/binary form.
- Replacing existing `coverage.parameters` percentages with a brand new meaning.

### Clearly out of scope

- Security schemes, callbacks, links, webhooks, examples as first-class analyzer surfaces.
- Non-HTTP protocols.
- Combined HTTP + async reporting.
- Broker or transport expansion.

## What to prove first

1. **Additive JSONL compatibility**
   - Extend `HttpEvent` and `readJsonl.ts` so new request-surface evidence can round-trip without breaking old events.
   - Preserve legacy `queryKeys` / `headerKeys` derivation for existing coverage numerators.

2. **Focused Spring MVC evidence proof**
   - Add one live path that proves real query/header/cookie/path-value retention and at least one intentional redaction/omission case.
   - This should be a focused verifier, not an immediate mutation of the retained happy-path bundle.

3. **Analyzer semantics for the supported subset**
   - Add cookie + serialization conformance with explicit unsupported-subset diagnostics.
   - Fail closed only for the subset Yanote actually claims to support.

4. **Format/media truth**
   - Turn on selected format validation, add unknown/unsupported-format behavior, and fix media specificity.
   - If the team intentionally supports one additional non-JSON media type, prove it here. Otherwise keep non-JSON as explicit unsupported drift.

5. **Public boundary closeout**
   - Only after the above are green should the CLI summary, analyzer guide, retained bundle expectations, and owner verifier stack be widened.

## Constraints and pitfalls

### Constraints

- Preserve the current recorder → `events.jsonl` → analyzer architecture.
- Keep `route` as the canonical template; do not replace it with the concrete request path.
- Preserve backward compatibility for old events that do not contain any new M011 evidence fields.
- Preserve current observation coverage numerators unless a requirement explicitly says otherwise.
- Existing public specs and examples are OpenAPI 3.0-oriented; do not silently make M011 depend on 3.2-only constructs.

### Common pitfalls

- **Capturing only key sets again** — serialization needs values and repeated-value fidelity, not just names.
- **Sorting/deduping away semantic meaning** — per-key value order may matter for arrays and repeated params.
- **Leaking secrets** — cookies, `Authorization`, and similar headers need explicit policy before capture becomes a dependency.
- **Treating Yanote metadata headers as user contract evidence** — `X-Test-Run-Id` and `X-Test-Suite` are transport metadata, not product semantics.
- **Turning on `format` globally without policy** — unsupported/custom formats will create noisy or inconsistent behavior if the validator surface is not defined.
- **Assuming wildcard media matching is already correct** — it is only partially correct today.
- **Updating the public happy path too early** — the retained bundle should stay stable until the focused proof is settled.

## Open risks

- The current worktree/history mismatch could cause planners to overestimate how much HTTP-core groundwork already exists.
- Cookie/header retention is the milestone’s biggest privacy risk.
- Supporting non-JSON media may require a second recorder-capture policy, not just analyzer code.
- If the team does not define a supported format list, `format` support will feel inconsistent and hard to explain publicly.
- If M011 broadens too far into multipart, `encoding`, or non-schema parameters, it will likely become an unfinished breadth milestone.

## Skills discovered

| Technology | Skill | Status |
|---|---|---|
| OpenAPI parameter/media semantics | `openapi-specification-v3.2` | already installed |
| Spring MVC request/response seams | `spring-web` | already installed |
| JSON Schema / validator policy | `json-schema-validator` | already installed |

No new skill installs were required for this milestone research.

## Sources

### Code and docs inspected

- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/parameterCoverage.ts`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/events/readJsonl.ts`
- `yanote-js/src/model/httpEvent.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/package.json`
- `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`
- `yanote-core/src/main/java/dev/yanote/core/events/YanoteEvent.java`
- `yanote-core/src/test/java/dev/yanote/core/events/EventJsonlRoundTripTest.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/RouteTemplateResolver.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
- `examples/openapi/demo-openapi.yaml`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `docs/guides/analyzer-coverage.md`
- `scripts/docs/verify-s02-analysis-path.sh`
- `scripts/ci/run-v1-e2e.sh`
- `.gsd/milestones/M010/M010-SUMMARY.md`
- `.gsd/milestones/M010/slices/S01/S01-RESEARCH.md`
- `.gsd/milestones/M010/slices/S04/S04-SUMMARY.md`

### Commands executed

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/parameterCoverage.test.ts src/events/readJsonl.parameters.test.ts src/coverage/httpPayloadConformance.test.ts` ✅
- `./gradlew :yanote-core:test --tests "dev.yanote.core.events.EventJsonlRoundTripTest" :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.RecorderWritesJsonlTest"` ✅
- `rg` / `find` repo searches for `cookie`, `style`, `explode`, `validateFormats`, `pathParams`, `responseHeaders`, `httpCoreConformance`, `httpParameterValueConformance` ✅

### External reference material

- Swagger parameter-serialization reference for default `style` / `explode` behavior across `query`, `path`, `header`, and `cookie`: https://swagger.io/docs/specification/v3_0/serialization/
- Swagger data-types reference noting that `format` is open-valued and validation behavior is implementation-defined: https://swagger.io/docs/specification/v3_0/data-models/data-types/
- Installed `openapi-specification-v3.2` skill references for parameters, request bodies/media types, responses, and format semantics.
