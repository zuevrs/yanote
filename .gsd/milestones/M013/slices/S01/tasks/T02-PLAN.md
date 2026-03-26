---
estimated_steps: 7
estimated_files: 9
skills_used:
  - vitest
---

# T02: Publish sanitized spec-source provenance on retained report and summary surfaces

**Slice:** S01 — Supported Remote Spec Inputs With Sanitized Provenance
**Milestone:** M013

## Description

Remote spec support is only trustworthy if persisted analyzer surfaces say where the spec came from without leaking credentials.

## Steps

1. Thread the resolved source metadata from the CLI into the HTTP and async report builders so the canonical JSON models carry a deterministic `specSource` section with source kind and sanitized provenance.
2. Update report schema/normalization and CLI human/machine summaries so retained outputs expose the source kind consistently for local file, local directory, and remote URL runs while redacting userinfo, query strings, and fragments.
3. Add focused report and summary contract tests that pin deterministic ordering, schema validity, and redaction for both HTTP and async retained surfaces.

## Must-Haves

- [ ] `yanote-report.json` and `yanote-async-report.json` disclose source kind and sanitized origin from the same canonical truth used by the CLI.
- [ ] `YANOTE_SUMMARY` and `YANOTE_ASYNC_SUMMARY` never echo credential-bearing URL parts.
- [ ] Provenance stays additive and must not change legacy coverage numerators or unrelated diagnostics ordering.

## Verification

- `npm -C yanote-js test -- src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.remote-spec.contract.test.ts`
- Report contract cases prove schema-valid deterministic `specSource` output for local file, local directory, and remote URL runs.

## Observability Impact

- Signals added/changed: retained HTTP/async report JSON plus machine-summary lines expose source kind and sanitized provenance.
- How a future agent inspects this: read `yanote-report.json` / `yanote-async-report.json`, inspect `YANOTE_SUMMARY` / `YANOTE_ASYNC_SUMMARY`, and rerun the focused contract tests named above.
- Failure state exposed: redaction regressions, schema drift, or summary/report mismatches become explicit contract-test failures instead of silent artifact leakage.

## Inputs

- `yanote-js/src/spec/specSource.ts` — resolved source metadata contract produced by T01.
- `yanote-js/src/cli.ts` — summary formatting path that must publish sanitized provenance.
- `yanote-js/src/report/report.ts` — canonical HTTP report builder that must gain additive source truth.
- `yanote-js/src/report/schema.ts` — HTTP report schema validator that must accept the new provenance section.
- `yanote-js/src/report/asyncReport.ts` — canonical async report builder that must publish the same source truth pattern.
- `yanote-js/src/report/asyncSchema.ts` — async report schema validator that must accept the new provenance section.

## Expected Output

- `yanote-js/src/report/report.ts` — HTTP report builder publishes deterministic sanitized `specSource` metadata.
- `yanote-js/src/report/schema.ts` — HTTP report schema validates the additive source-provenance section.
- `yanote-js/src/report/normalize.ts` — HTTP report normalization keeps the new provenance fields deterministic.
- `yanote-js/src/report/asyncReport.ts` — async report builder publishes the same source-provenance truth.
- `yanote-js/src/report/asyncSchema.ts` — async report schema validates the additive provenance section.
- `yanote-js/src/report/asyncNormalize.ts` — async report normalization keeps provenance deterministic.
- `yanote-js/src/cli.ts` — human and machine summaries expose source kind without echoing unsafe URL parts.
- `yanote-js/src/report/report.remote-spec.contract.test.ts` — focused HTTP report provenance contract tests.
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts` — focused async report provenance contract tests.
