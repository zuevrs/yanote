# M013 Research: Analyzer Delivery, Remote Spec, And Report UX

_Gathered: 2026-03-26_

## Skills Discovered

- Existing installed skill used for this research: `openapi-specification-v3.2`
- Directly relevant installed skills already present in the environment: `asyncapi-design`, `java-gradle`, `github-workflows`
- `npx skills find "swagger-parser"` and `npx skills find "@asyncapi/parser"` returned no relevant installable skills
- New skill installs: none

## What exists now

- `yanote-js/src/cli.ts` still presents two separate analyzer entrypoints:
  - `report` for HTTP/OpenAPI
  - `async-report` for AsyncAPI/Kafka
- Both commands call `discoverSpecs()` before loading the spec. `yanote-js/src/spec/discover.ts` uses `stat()` plus local file/directory heuristics, so `--spec` currently means **local path only** even before parser-specific logic runs.
- OpenAPI loading already sits on top of `@apidevtools/swagger-parser` via `SwaggerParser.dereference(specPath)` in `yanote-js/src/spec/openapi.ts`.
  - The underlying library docs accept file paths **or URLs** and expose HTTP resolver options (`headers`, `timeout`, `redirects`).
  - Yanote currently exposes none of that capability.
- AsyncAPI loading in `yanote-js/src/spec/asyncapi.ts` is stricter: it hardcodes `fromFile(parser, specPath).parse()`.
  - Context7 docs for `@asyncapi/parser` confirm `fromURL(parser, url).parse()` exists, but Yanote does not branch to it yet.
- The Gradle delivery surfaces still assume a local file path:
  - `yanote-gradle-plugin/.../YanoteCheckTask.kt` rejects any `specPath` that does not exist as `project.file(specPath)`.
  - `YanoteReportTask.kt` records command args verbatim and still treats the spec as a normal local path input.
- Human-friendly output exists today only as:
  - structured CLI stdout sections in `yanote-js/src/cli.ts`
  - GitHub step summary Markdown rendered by `scripts/ci/render-yanote-summary.mjs`
- There is **no** retained static HTML/human-facing report artifact today:
  - `writeYanoteReport()` writes only `yanote-report.json`
  - `writeAsyncYanoteReport()` writes only `yanote-async-report.json`
  - `scripts/ci/collect-yanote-artifacts.sh` copies JSON, args, and logs, but no human-friendly report file
- Deprecated operations are not currently modeled as a first-class analyzer surface:
  - repo search found no fixtures, docs, or report fields using OpenAPI `deprecated: true`
  - `yanote-js/src/spec/openapi.ts` ignores `deprecated` except as a schema key to discard in parameter-shape normalization

## Key findings and surprises

### 1. Remote OpenAPI support is blocked by Yanote, not by the underlying OpenAPI library

The most important code-path fact is this split:

- Yanote entrypoints (`discoverSpecs`, Gradle task validation, CLI help/docs) assume local files/directories.
- The underlying Swagger Parser library can already parse/dereference URLs and exposes HTTP resolver configuration.

That means M013 remote OpenAPI support is not a greenfield parser problem. It is primarily an **entrypoint, configuration, provenance, and safety** problem.

### 2. Remote AsyncAPI support is a real loader change, not just a flag flip

Unlike OpenAPI, the AsyncAPI loader is concretely file-only today because it calls `fromFile(...)`. Supporting remote AsyncAPI sources requires at least:

- source-kind detection before loading
- branching to `fromURL(...)`
- consistent failure/provenance behavior with the HTTP/OpenAPI path

This is a good reason to introduce a shared **spec-source resolution contract** while keeping HTTP and async loaders separate underneath.

### 3. The highest-risk remote-spec failure mode is secret leakage, not fetching

Current delivery/report surfaces retain command args and other provenance text verbatim:

- `YanoteReportTask.kt` writes `yanote-report-command.args`
- `YanoteCheckTask.kt` writes `yanote-check-command.args`
- `scripts/ci/collect-yanote-artifacts.sh` copies those files into uploaded artifacts
- CI/log scripts and public proof notes already preserve command lines and source-path notes in multiple places

If M013 allows remote specs via signed URLs, embedded basic-auth userinfo, or query-string tokens, those secrets would be copied into report artifacts and CI surfaces.

That strongly suggests:

- URL-embedded credentials should be treated as unsupported or explicitly sanitized/rejected
- any authenticated remote support should prefer headers/env-based configuration rather than secrets inside `--spec`
- spec provenance written to reports/artifacts must be **sanitized**

### 4. There is already a strong reuse point for human-friendly report UX

`scripts/ci/render-yanote-summary.mjs` already proves three useful product patterns:

- render human-readable content from the report model rather than inventing new analyzer semantics
- preserve deterministic prioritization and redaction discipline
- keep HTTP and async surfaces separate while still being readable by humans

That script is currently CI-only Markdown, not a product artifact, but it is the clearest existing precedent for M013 report UX.

### 5. Deprecated operations are spec metadata first, policy second

The OpenAPI skill references confirm that `deprecated` on the Operation Object is just a boolean flag with default `false`.

That means:

- **labeling and counting** deprecated operations is spec-consistent
- **excluding** deprecated operations from numerators by default is a product-policy choice
- **failing CI** based on deprecation is also a product-policy choice

This matters because the current Yanote design strongly favors additive surfaces that do not silently rewrite established coverage numerators.

## Key codebase constraints

### Remote source handling constraints

- `discoverSpecs()` currently supports two local-only behaviors that should remain explicit:
  - local file path
  - local directory scan for `openapi*.yaml/json` and `asyncapi*.yaml/json`
- A remote URL cannot reuse local directory discovery semantics. M013 needs an explicit contract such as:
  - local file
  - local directory
  - remote single-document URL
  rather than pretending remote URLs behave like directories.
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java` partially tolerates remote locations via Swagger's Java parser `readLocation(...)`, but its raw-spec diagnostic path still calls `Files.readString(Path.of(specPath))`, which is fundamentally local-path-oriented. Even if the Node analyzer is the main M013 surface, this is a warning sign against claiming repo-wide “remote spec” support too broadly.

### Report-contract constraints

- `yanote-js/src/report/schema.ts` is strict (`additionalProperties: false`) and version-pinned to `1.0.0`.
- `writeReport.ts` and `writeAsyncReport.ts` validate before writing.
- `normalize.ts` and `asyncNormalize.ts` enforce deterministic ordering.

So any human-facing HTML or deprecated-operation additions need coordinated changes across:

- DTO types
n- normalization
- schema validation
- contract tests
- CLI summary text
- CI summary rendering

### Product-boundary constraints

- `R005` and current CLI architecture explicitly preserve the split between HTTP and async.
- `R030` keeps a web dashboard out of scope.

So M013 human-friendly report work should land as **static artifacts**, likely one per surface, not a new combined dashboard or combined HTTP+async truth layer.

### Delivery-surface constraints

- `R003` means analyzer delivery is not just CLI-local. Remote support and report UX have to make sense through:
  - standalone CLI
  - Gradle plugin tasks
  - GitHub Actions / CI artifact surfaces
- An analyzer-only change would leave the supported Gradle and CI product paths inconsistent.

## Remote spec loading: viability and support-boundary implications

## OpenAPI path

Swagger Parser documentation indicates the library can already:

- parse/validate/dereference from a URL
- resolve remote `$ref`
- accept HTTP resolver options such as headers, timeout, and redirects

That suggests the least risky Yanote approach is **not** to write a separate OpenAPI fetcher/dereferencer from scratch.

The likely safer design direction is:

- keep Yanote responsible for source-kind detection, safety policy, provenance, and config
- keep Swagger Parser responsible for OpenAPI dereference semantics

## AsyncAPI path

Context7 documentation for `@asyncapi/parser` shows:

- `fromURL(parser, url).parse()` exists
- optional fetching options can be supplied

But current Yanote code uses only `fromFile`. So M013 needs an explicit abstraction such as a resolved spec input union:

- local-file
- local-directory
- remote-url

with separate branches in the HTTP and async loaders.

## Determinism and offline implications

The milestone context explicitly cares about CI and restricted/offline environments. The current codebase implies several boundary decisions should be made narrow and early:

- remote support should start with a clearly supported URL class, not arbitrary repository shortcuts or implicit auth flows
- docs should keep local-file/directory input as the deterministic baseline
- remote support should stay opt-in and explicit, not silently required by the happy path
- reports/artifacts should disclose non-secret source provenance so teams can tell what was actually analyzed

A particularly important subtlety from the OpenAPI skill references: relative-reference behavior depends on retrieval/base URI rules (`$self`, retrieval URI, schema `$id`). That means remote top-level loading and remote nested-reference resolution are closely related; planners should not assume “download top file only” is enough unless the support boundary intentionally forbids remote external refs.

## Deprecated operations: spec-consistent behavior vs policy-heavy behavior

### What the spec supports cleanly

The OpenAPI Operation Object exposes:

- `deprecated: boolean`
- default `false`

That makes the following behaviors clean and deterministic:

- per-operation deprecated flag in extracted contracts
- report/CLI labeling for deprecated operations
- additive summary counts such as deprecated total / deprecated covered / deprecated uncovered
- separate highlighting in human-facing reports

### What becomes product policy, not spec truth

The spec does **not** say that deprecated operations should:

- disappear from the API surface
- be removed from coverage denominators
- automatically fail or pass governance

So the following are policy decisions, not table stakes:

- excluding deprecated operations from operation coverage by default
- down-weighting deprecated operations in aggregate math
- emitting semantic failures purely because an operation is deprecated

### Existing Yanote patterns point to an additive default

Yanote already widened payload, request, and security truth by adding separate sections instead of mutating legacy numerators.

That precedent strongly suggests a safe M013 default:

- keep deprecated operations in current coverage numerators
- publish deprecated status as additive metadata and summaries
- if teams want stronger policy, build it as explicit governance/config later

### Existing exclusion/governance surfaces are the reuse point for policy

If M013 eventually wants deprecation-aware policy, the natural reuse points are:

- exclusion/governance configuration in `gates/policy.ts`
- deterministic governance diagnostics/failure ordering

That is much safer than silently turning “deprecated” into “excluded”.

## Human-friendly report UX: reuse patterns and constraints

### What can be reused directly

- canonical JSON report DTOs (`YanoteReport`, `AsyncYanoteReport`)
- normalization + schema validation
- issue prioritization and wording patterns in `scripts/ci/render-yanote-summary.mjs`
- current CLI section names and additive truth surfaces

### What does not exist yet

- no HTML writer
- no static CSS/template layer
- no artifact collection path for HTML
- no docs describing a human-facing retained report file

### Lowest-risk implementation shape

The current architecture points toward a static artifact pattern such as:

- `yanote-report.json` + `yanote-report.html`
- `yanote-async-report.json` + `yanote-async-report.html`

rendered from the same normalized/validated canonical report model.

That preserves:

- separate HTTP vs async truth surfaces
- offline-openable artifacts
- no dashboard/server scope expansion

### Drift risk to control

The milestone context correctly flags drift risk. In this codebase, drift will happen if HTML becomes a separate interpretation layer.

The best architectural guardrail is:

- treat normalized report DTO / validated JSON as the source of truth
- render HTML from that canonical shape
- add contract tests that assert HTML-visible counts/labels derive from the same report fields already validated in JSON

## What should be proven first

### Risk-first answer

The first unknown to retire is the **spec-source contract**, because it has the most cross-surface implications:

- CLI argument parsing
- HTTP vs async loader branching
- Gradle plugin compatibility
- artifact/log safety
- offline/reproducibility wording

### Fast-confidence answer

If planners want a smaller first implementation slice before remote fetching, deprecated-operation extraction is the lowest-risk additive feature:

- single-spec metadata
- no network/auth complexity
- no recorder changes
- aligns with current additive reporting patterns

### Recommended proof order

1. **Spec-source resolution and provenance boundary**
   - detect local file/directory vs remote URL
   - keep HTTP and async report modes separate
   - prevent secret leakage from remote source configuration
2. **Deprecated-operation extraction and additive reporting**
   - prove labeling/counting before any policy behavior
3. **Human-friendly artifact writer from canonical report DTOs**
   - after report shape is stable enough to render confidently
4. **CI/docs/artifact closeout**
   - once source handling and report model changes are settled

## Natural slice boundaries

### Recommended Slice 1 — Spec source resolution, provenance, and delivery-surface parity

Goal: make supported remote loading explicit without breaking the deterministic local baseline.

Likely scope:

- replace/localize `discoverSpecs()` assumptions with a real source-kind resolver
- branch OpenAPI to URL-capable parser flow and AsyncAPI to `fromURL(...)` when needed
- keep local directory discovery local-only
- update Gradle task assumptions so supported remote inputs are not rejected immediately
- define sanitized source provenance and credential-safe behavior
- document the narrow first-class remote support boundary

Why first:

- this retires the milestone’s largest technical and support risk
- it is required before docs can truthfully claim remote support through supported delivery surfaces

### Recommended Slice 2 — Deprecated operation metadata and reporting contract

Goal: make deprecation explicit and deterministic without policy overreach.

Likely scope:

- extract `deprecated` from OpenAPI operations
- carry it through coverage/report DTOs
- add deprecated summary counts and per-operation labeling to CLI/JSON
- optionally expose a narrow, explicit policy mode only if planners decide it is required

Why separate:

- low-risk additive change
- should settle the canonical report model before HTML rendering
- avoids mixing reporting semantics with remote loading complexity

### Recommended Slice 3 — Human-friendly static report artifacts

Goal: produce operator-friendly artifacts from the same canonical truth as JSON.

Likely scope:

- static HTML writer for HTTP report
- static HTML writer for async report
- reuse normalized report DTOs / validated JSON as the render source
- clearly preserve the HTTP vs async split
- add deterministic tests for report content/structure

Why after Slice 2:

- the HTML surface should not be built before the canonical report shape for deprecation/report metadata is settled

### Recommended Slice 4 — CI artifact, docs, and support-boundary closeout

Goal: make the new delivery/report UX visible and supportable.

Likely scope:

- `collect-yanote-artifacts.sh`
- `.github/workflows/yanote-ci.yml`
- `README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`

Why last:

- it should describe and upload the actual settled product surfaces, not half-finished intermediate behavior

## Requirements lens

### Table stakes from active/validated requirements

- **R003**: remote loading and report UX must work through supported delivery paths, not just local CLI experiments.
- **R004**: support/release truth must stay explicit. Remote support cannot blur the difference between a stable local/offline path and an opt-in networked path.
- **R005**: async remains a separate supported surface. Do not let report UX accidentally create the deferred combined-report contract.
- **R030**: a web dashboard is still out of scope. HTML/static artifacts are compatible with this; an interactive dashboard is not.

### What looks missing and should be treated as candidate requirements

1. **Remote source credentials must not leak through command args, logs, uploaded artifacts, or report provenance.**
   - This is the most obvious missing failure-visibility/security requirement surfaced by the codebase.
2. **Reports should disclose sanitized spec-source provenance for auditability.**
   - Especially important once remote inputs exist.
3. **Deprecated operations should remain inside legacy coverage numerators by default unless an explicit policy says otherwise.**
   - This preserves continuity and avoids a silent product-contract change.
4. **Human-friendly artifacts must remain static, offline-viewable, and separate for HTTP vs async.**
   - This protects R005 and R030 while satisfying R024’s UX goal.

### What still looks optional or should remain advisory

- authenticated remote repository integrations beyond a narrow URL/header-based contract
- automatic cache/replay/offline mirroring of remote specs
- deprecation-based CI failure modes by default
- a combined HTTP+async HTML report
- any dashboard/server-hosted report UI

## Known failure modes that should shape slice ordering

- `discoverSpecs()` fails remote URLs immediately because it calls local filesystem `stat()`.
- AsyncAPI remote support cannot work until the loader stops assuming `fromFile(...)`.
- Gradle `yanoteCheck` rejects supported remote URLs today because it insists on `project.file(specPath).exists()`.
- Command-arg artifact retention would leak secrets if remote auth uses signed URLs or embedded credentials.
- Human-friendly HTML can drift from JSON truth if it becomes a separate interpretation layer.
- A combined human-facing report would accidentally push toward deferred combined HTTP+async semantics.

## Resume notes for the roadmap planner

- The milestone’s biggest architectural risk is **remote source handling across product surfaces**, not HTML templating.
- The safest default for deprecated operations is **label-first, policy-second**.
- The best reuse point for report UX is the existing CI summary renderer plus the normalized report DTOs, not a brand-new reporting stack.
- Keep the current local file/directory path as the stable baseline and make remote support an explicit narrow addition.
- Treat credential-safe provenance as part of the feature, not post-hoc polish.

## Sources

### Code and docs inspected

- `yanote-js/src/spec/discover.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/asyncapi.ts`
- `yanote-js/src/spec/semantics.ts`
- `yanote-js/src/model/operationKey.ts`
- `yanote-js/src/coverage/coverage.ts`
- `yanote-js/src/coverage/httpSecurityConformance.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/writeReport.ts`
- `yanote-js/src/report/writeAsyncReport.ts`
- `yanote-js/src/gates/policy.ts`
- `yanote-js/src/gates/exclusions.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/httpSecuritySemantics.ts`
- `yanote-js/src/spec/discover.test.ts`
- `yanote-js/src/cli.test.ts`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
- `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/collect-yanote-artifacts.sh`
- `.github/workflows/yanote-ci.yml`
- `README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`

### External/library references

- Context7 docs for `@asyncapi/parser` showing `fromURL(parser, url).parse()` support
- Swagger Parser docs showing URL input support and HTTP resolver options (`headers`, `timeout`, `redirects`)
- `openapi-specification-v3.2` skill references:
  - `paths-and-operations.md` for `deprecated: boolean`
  - `advanced-base-uri-and-resolution.md` for retrieval/base-URI resolution and `$self`

### Commands executed

- `find . -maxdepth 2 -type d | sort | head -200`
- `rg -n "report|html|deprecated|remote spec|URL|fetch|discoverSpec|async-report|yanote-report" ...`
- `rg -n "deprecated|deprecation" yanote-js docs scripts README.md examples test ...`
- `rg -n "writeYanoteReport\(|writeAsyncYanoteReport\(|yanote-report.json|yanote-async-report.json" yanote-js/src ...`
- `rg -n "Render Yanote GitHub summary|render-yanote-summary|GitHub summary" scripts .github yanote-js ...`
- `npx skills find "swagger-parser"`
- `npx skills find "@asyncapi/parser"`
