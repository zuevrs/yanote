# S03 Research: Static HTML Reports From Canonical HTTP And Async Truth

_Gathered: 2026-03-26_

## Skills Discovered

- Installed skill used during research: `accessibility`
- Newly installed skill relevant to future execution: `esbuild-bundler`
- No other directly relevant skill gap surfaced; this slice stays inside the existing Node/TypeScript/Vitest/esbuild stack.

## Requirements Focus

Primary active requirements this slice supports:
- `R003` — the human-friendly artifact must work through real supported delivery paths, not just an ad hoc local experiment
- `R004` — the HTML artifact must preserve explicit local-vs-remote provenance truth instead of inventing a blurred support surface
- `R005` — HTTP and async remain separate retained artifacts; no combined report contract
- `R030` — static offline HTML is compatible, but any dashboard/server-hosted UI stays out of scope

Candidate requirements this slice should treat as table stakes:
- disclose sanitized `specSource` provenance in the human artifact for auditability
- keep artifacts static, offline-viewable, and separate for HTTP vs async
- avoid leaking credentials or retained secret values by rendering only canonical report truth, not raw events or arbitrary object dumps

## What Exists Now

- `yanote-js/src/report/writeReport.ts`
  - normalizes + validates the HTTP DTO, then writes only `yanote-report.json`
  - returns the JSON path string
- `yanote-js/src/report/writeAsyncReport.ts`
  - same pattern for async, writing only `yanote-async-report.json`
- `yanote-js/src/report/normalize.ts` and `yanote-js/src/report/asyncNormalize.ts`
  - already establish deterministic ordering/rounding; these are the safest render inputs for HTML
- `yanote-js/src/report/report.ts` and `yanote-js/src/report/asyncReport.ts`
  - define the canonical top-level truth the HTML must mirror
  - HTTP surface includes summary, deprecated truth, per-operation coverage, payload/request/security conformance, diagnostics, governance, and `specSource`
  - async surface includes summary, channels/operations/messages coverage, diagnostics, and `specSource`
- `yanote-js/src/cli.ts`
  - only consumer of the two writers
  - `Summary` / `Report Path` / `YANOTE_SUMMARY` and `YANOTE_ASYNC_SUMMARY` currently point to the JSON artifact only
- `scripts/ci/render-yanote-summary.mjs`
  - already proves a deterministic, secret-safe, human-readable summary pattern for both HTTP and async
  - stays CI-only and is outside the bundled CLI package
- `yanote-js/package.json`
  - no HTML templating, DOM, or HTML parsing dependencies
- `yanote-js/esbuild.config.mjs`
  - single bundled `outfile` build with no configured loaders for external template/CSS assets
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteReportTask.kt`
  - real runs execute the Node analyzer into the Gradle output dir, so successful runs will automatically inherit new sibling artifacts written by the CLI
  - stub/skip paths still emit placeholder JSON only
- `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/tasks/YanoteCheckTask.kt`
  - also invokes `report --out ...`, so successful `yanoteCheck` runs would inherit sibling HTML automatically
- `scripts/ci/collect-yanote-artifacts.sh` and `.github/workflows/yanote-ci.yml`
  - still assume JSON-only retained report surfaces; this belongs to S04, not S03

Useful existing test/proof anchors:
- `yanote-js/src/report/writeReport.determinism.test.ts`
  - rich synthetic HTTP report fixture already spans deprecated truth + request truth + security truth
- `yanote-js/src/report/asyncReport.contract.test.ts`
  - strong async schema/normalization fixture surface
- `yanote-js/src/cli.report.test.ts`
  - real HTTP CLI runs that already inspect sibling JSON output
- `yanote-js/src/cli.async-report.test.ts`
  - real async CLI runs that already inspect sibling JSON output
- `scripts/ci/verify-m013-s02-deprecated-operations.sh`
  - current proof-bundle pattern to copy for S03

## Key Findings And Surprises

### 1. The safest HTML source is the normalized, validated DTO already used for JSON

`writeReport.ts` and `writeAsyncReport.ts` already do the right preconditions:
1. normalize
2. schema-validate
3. serialize JSON

For S03, the lowest-risk move is to render HTML from that same normalized object inside the writer, after validation succeeds. That keeps:
- ordering deterministic
- HTML aligned with the canonical JSON truth
- secret exposure risk low, because the HTML renderer can explicitly select report fields instead of touching raw events or raw object dumps

This slice does **not** need schema changes if HTML remains a derived artifact rather than a new canonical contract.

### 2. The current CLI summary contract is intentionally narrow and expensive to widen

`yanote-js/src/cli.ts` currently emits:
- a human `Report Path` section with one path
- machine `report=...` tokens in `YANOTE_SUMMARY` / `YANOTE_ASYNC_SUMMARY`

That path is assumed to be the JSON artifact by:
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.async-report.contract.test.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.async-report.test.ts`
- `scripts/ci/render-yanote-summary.mjs`
- existing retained proof scripts

So if S03 changes machine tokens or the meaning of `Report Path`, the blast radius is much bigger than just adding writers.

**Safer S03 boundary:** keep the machine summary JSON-centered and rely on deterministic sibling filenames:
- `yanote-report.json` + `yanote-report.html`
- `yanote-async-report.json` + `yanote-async-report.html`

That satisfies the slice acceptance without forcing CI-summary and docs work early.

### 3. `render-yanote-summary.mjs` is the right precedent, but the wrong runtime dependency

The CI summary script already solved several problems S03 also needs:
- deterministic issue prioritization
- HTTP vs async separation
- rendering only selected report truth instead of raw payloads
- secret-safe summaries proven by tests that inject sentinel `SECRET_*` values

But importing it into `yanote-js` would couple the bundled CLI to a repo script outside the package boundary.

Best use of it in S03:
- copy the sectioning/formatting ideas
- port only the small helpers needed into `yanote-js/src/report/...`
- do **not** import `scripts/ci/render-yanote-summary.mjs` directly from runtime code

### 4. esbuild strongly favors inline templates/styles for this slice

The current build is:
- one bundled CLI entrypoint
- `outfile` mode
- no loaders configured for `.html` / `.css` / text assets

That means free-standing template or stylesheet files are not available automatically at runtime.

Per the installed `esbuild-bundler` skill, external assets would require deliberate loader/copy configuration. For S03 that is bigger than needed.

**Lowest-risk asset strategy:**
- implement HTML as TS string renderers
- keep CSS inline in a `<style>` block
- avoid external fonts, scripts, or stylesheet files

That also makes offline-viewability easy to prove.

### 5. HTTP is the riskier renderer; async is the smaller parallel surface

The HTTP report has far more canonical truth to cover:
- summary
- deprecated truth
- coverage dimensions
- per-operation coverage
- payload conformance
- request conformance
- security conformance
- semantic diagnostics
- governance diagnostics/exclusions
- sanitized `specSource`

The async report is much smaller:
- summary
- coverage dimensions
- channel/operation/message tables
- diagnostics
- sanitized `specSource`

So HTTP is the higher-risk implementation and should establish the renderer pattern first. Async can reuse the shell/helpers and stay intentionally separate.

### 6. There is no single real end-to-end HTTP fixture that exercises every HTML section

The repo’s realistic HTTP fixtures are split across prior slices:
- deprecated operations
- request truth
- security truth
- payload/format-media truth

So the natural testing split is:
- **rich synthetic renderer/writer tests** for exhaustive HTTP section coverage
- **narrow real CLI proof** for stable artifact names, offline HTML shape, and key canonical truths

`yanote-js/src/report/writeReport.determinism.test.ts` already has the best synthetic HTTP fixture for exhaustive HTML contract coverage.

### 7. Async is missing a writer-focused determinism test today

There is strong async schema coverage, but no dedicated `writeAsyncReport` determinism/artifact test analogous to `writeReport.determinism.test.ts`.

S03 is the right moment to add one, because async HTML creation will otherwise land without a focused artifact contract.

### 8. Gradle likely inherits successful HTML generation for free

Both `YanoteReportTask` and `YanoteCheckTask` already pass `--out` into the real analyzer.

Implication:
- if the CLI writers emit sibling HTML files, successful Gradle runs should get them automatically without task changes
- the Gradle stub/skip branches still only write placeholder JSON; changing those would invent non-canonical HTML and likely exceed the slice boundary

## Skill-Informed Constraints

From the loaded `accessibility` skill, the generated HTML should follow the static-document subset of the guidance:
- set page language (`<html lang="en">`)
- use semantic landmarks and heading hierarchy (`<main>`, real headings)
- include a skip link because the report will likely have long tables/sections
- prefer native tables with `<caption>`, `<thead>`, and `<th scope>` for report matrices
- do not rely on color alone for status; pair badge color with explicit status text
- keep focus-visible styles and avoid JS-only interactions

Because this is an offline static artifact, native HTML with no custom ARIA widgets is the simplest way to satisfy those rules.

From the installed `esbuild-bundler` skill:
- current build config has no asset loaders, so external template/CSS files are a deliberate bundling change, not a free add-on
- inline template/CSS constants are the minimal-risk fit for the current bundle shape

## Natural Seams

### 1. Shared HTML shell and safe formatting helpers

Likely new TS surface under `yanote-js/src/report/` or `yanote-js/src/report/html/` for:
- `escapeHtml`
- `formatPercent` / `formatNullable`
- status-to-label helpers
- inline CSS string
- document shell with title, metadata, skip link, header, and `<main>`

This is the one shared dependency between HTTP and async renderers.

### 2. HTTP renderer and writer integration

Likely work:
- add a pure `renderHttpReportHtml(normalized: YanoteReport): string`
- update `writeReport.ts` to write `yanote-report.html` beside `yanote-report.json`
- keep the return value as the JSON path to avoid widening the CLI machine contract

Risk hotspots:
- render deprecated truth from `summary.deprecatedOperations` and `coverage.perOperation[].deprecated`
- surface `specSource.kind/reference` so remote/local provenance is visible in human artifacts
- handle `N/A` / `null` dimensions cleanly
- keep request/security/payload sections secret-safe by selecting canonical fields only

Best test anchor:
- `yanote-js/src/report/writeReport.determinism.test.ts`

### 3. Async renderer and writer integration

Likely work:
- add a pure `renderAsyncReportHtml(normalized: AsyncYanoteReport): string`
- update `writeAsyncReport.ts` to write `yanote-async-report.html`
- add a missing writer-focused async determinism contract

Risk hotspots:
- no HTTP-only wording or deprecated section
- keep async terminology canonical (`channel`, `async operation`, `message`)
- diagnostics ordering should follow normalized DTO order

Best test anchors:
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/cli.async-report.test.ts`

### 4. Dedicated S03 proof bundle, not shared CI collector changes yet

Follow the S01/S02 proof pattern with a new verifier + contract test instead of touching shared CI artifact collection in this slice.

Suggested proof scope:
- build the CLI
- run HTTP `report` against `yanote-js/test/fixtures/openapi/http-deprecated-operations.yaml` + `yanote-js/test/fixtures/events/http-deprecated-operations.fixture.jsonl`
- run async `async-report` against `yanote-js/test/fixtures/asyncapi/v3.yaml` + `yanote-js/test/fixtures/async-events/partial.fixture.jsonl`
- retain both JSON + HTML outputs, stdout/stderr/exit-code, and a manifest under a new `.yanote-ci/...` proof path

Suggested assertions:
- `yanote-report.html` exists next to `yanote-report.json`
- `yanote-async-report.html` exists next to `yanote-async-report.json`
- HTML contains key canonical counts and sanitized `specSource`
- HTTP HTML contains deprecated truth; async HTML does not
- async HTML contains channels/operations/messages truth; HTTP-only sections do not leak into it
- both artifacts are standalone/offline (no external CSS/fonts/scripts/dashboard references)
- sentinel secret strings do not appear

## What To Build Or Prove First

1. **Lock the HTML shell contract first.**
   Decide once that the artifact is self-contained, semantic, no-JS, and inline-styled. That retires the offline/dashboard risk early.

2. **Implement HTTP first.**
   It is the broader, riskier report surface and carries forward S02’s deprecated truth.

3. **Keep `YANOTE_SUMMARY` / `YANOTE_ASYNC_SUMMARY` stable unless a hard product requirement appears.**
   Deterministic sibling filenames are enough for this slice and avoid CI-summary churn.

4. **Do async second as a parallel-but-separate renderer.**
   Reuse the shell/helpers, but keep output copy and sections independently named.

5. **Close with a retained proof bundle.**
   The proof should demonstrate real analyzer runs produce separate offline HTML artifacts without widening CI/docs/support surfaces yet.

## Verification Strategy

Focused unit/contract coverage:
- `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts ...new HTTP HTML tests...`
- `npm -C yanote-js test -- src/report/asyncReport.contract.test.ts ...new async writer/HTML tests...`

Recommended new assertions:
- equivalent DTO orderings produce byte-equivalent HTML
- canonical headings/sections exist
- sanitized `specSource` is rendered
- HTTP HTML includes deprecated truth and does not omit aggregate/request/security sections when present
- async HTML stays free of HTTP-only sections
- no external asset references (`<script src=`, remote stylesheet/font URLs)

Real CLI verification:
- `npm -C yanote-js test -- src/cli.report.test.ts src/cli.async-report.test.ts`
- add assertions that real CLI runs create sibling `.html` artifacts while `report=` tokens remain JSON-centered unless intentionally widened

Retained proof verification:
- new `scripts/ci/verify-m013-s03-static-html-reports.sh`
- new `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`

Optional manual/browser confidence:
- serving the retained proof directory locally is optional; string/structure assertions are sufficient for slice acceptance because the artifact is intentionally static and self-contained

## Planner Gotchas

- No HTML parser/test helper is installed. String/regex assertions are cheaper than adding dependencies.
- The writer return type is currently just the JSON path. Preserving that keeps CLI and CI-summary churn low.
- If executors choose external template/CSS files, they must also widen `yanote-js/esbuild.config.mjs`; current build will not copy them automatically.
- `collect-yanote-artifacts.sh`, `.github/workflows/yanote-ci.yml`, and public docs still assume JSON-only retained surfaces. That mismatch is expected until S04; don’t accidentally pull those updates into S03.
- Gradle stub/skip JSON placeholders are not canonical reports. Avoid inventing matching HTML placeholders unless the planner explicitly decides that is required by support semantics.
