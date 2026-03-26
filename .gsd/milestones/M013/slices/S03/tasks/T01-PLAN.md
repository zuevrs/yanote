---
estimated_steps: 3
estimated_files: 6
skills_used:
  - accessibility
  - vitest
---

# T01: Render self-contained HTTP HTML from canonical report truth

**Slice:** S03 — Static HTML Reports From Canonical HTTP And Async Truth
**Milestone:** M013

## Description

Implement the higher-risk HTTP HTML artifact first so the shared shell, accessibility, and redaction rules are settled before async mirrors them.

## Steps

1. Add self-contained HTML shell/helpers under `yanote-js/src/report/` that keep CSS inline, escape dynamic content, render a skip link plus semantic landmarks/tables, and avoid any external asset dependency or raw object dumping.
2. Update `writeYanoteReport()` to render normalized, validated HTTP report truth into `yanote-report.html` beside `yanote-report.json`, selecting only canonical summary/coverage/payload/request/security/governance/specSource fields and preserving the returned JSON path.
3. Extend deterministic HTTP writer tests and remote-spec contract coverage to assert byte-stable HTML, explicit deprecated/provenance sections, and absence of secret sentinels or external asset refs.

## Must-Haves

- [ ] HTTP HTML is derived from the same normalized DTO used for JSON, not a second analysis path.
- [ ] The document is self-contained/offline with semantic structure and explicit `specSource` plus deprecated truth.
- [ ] Writer behavior and machine-facing report path contract remain JSON-centered.

## Verification

- `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/report.test.ts`
- Focused assertions read generated `yanote-report.html` bytes and fail on missing deprecated/provenance sections, `<script` tags, remote asset URLs, or sentinel `SECRET_` leaks.

## Observability Impact

- Signals added/changed: sibling `yanote-report.html` file and stable section labels for deprecated/provenance/security truth.
- How a future agent inspects this: open generated HTML beside `yanote-report.json` or rerun the focused writer/contract tests.
- Failure state exposed: missing section, external asset reference, or leaked sentinel value fails deterministic HTML assertions.

## Inputs

- `yanote-js/src/report/writeReport.ts` — current HTTP writer that normalizes, validates, and emits only JSON today.
- `yanote-js/src/report/report.ts` — canonical HTTP report model whose fields must drive the HTML sections.
- `yanote-js/src/report/normalize.ts` — deterministic ordering/rounding contract the HTML must reuse unchanged.
- `yanote-js/src/report/writeReport.determinism.test.ts` — rich synthetic HTTP fixture that already spans deprecated, request, and security truth.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — provenance contract coverage to extend with human-artifact assertions.
- `yanote-js/esbuild.config.mjs` — bundle-shape reference showing external template assets are currently out of scope.

## Expected Output

- `yanote-js/src/report/htmlDocument.ts` — shared safe HTML shell/helpers for static self-contained report pages.
- `yanote-js/src/report/reportHtml.ts` — HTTP HTML renderer derived from canonical report truth.
- `yanote-js/src/report/writeReport.ts` — HTTP writer that emits sibling JSON and HTML artifacts while returning the JSON path.
- `yanote-js/src/report/writeReport.determinism.test.ts` — deterministic writer tests covering HTML bytes, deprecated truth, and offline asset rules.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — provenance tests proving local/remote `specSource` shows up truthfully in HTML.
- `yanote-js/src/report/report.test.ts` — HTTP report assertions updated only if needed to cover human-artifact section selection or secret-safety guardrails.
