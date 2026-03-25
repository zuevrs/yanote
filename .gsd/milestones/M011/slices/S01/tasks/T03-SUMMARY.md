---
id: T03
parent: S01
milestone: M011
key_files:
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/report/normalize.ts
  - yanote-js/src/cli.ts
  - yanote-js/src/report/report.requestEvidence.contract.test.ts
  - yanote-js/src/cli.requestEvidence.test.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-js/src/report/report.contract.test.ts
  - yanote-js/src/report/writeReport.determinism.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Add a dedicated top-level `httpRequestConformance` report section instead of widening legacy coverage or payload surfaces.
  - Keep CLI request-conformance diagnostics value-free while retaining `observedValues` only in `yanote-report.json` diagnostics for artifact inspection.
duration: ""
verification_result: mixed
completed_at: 2026-03-25T14:52:56.759Z
blocker_discovered: false
---

# T03: Publish request-conformance evidence and scalar truth on report and CLI surfaces

**Publish request-conformance evidence and scalar truth on report and CLI surfaces**

## What Happened

I added an additive top-level `httpRequestConformance` surface to the Node report contract and wired the existing first-scalar analyzer into `buildReport()` and the CLI `report` command. The new report section publishes deterministic request-evidence summary counts, per-operation parameter truth counts, and ordered diagnostics for captured-valid, captured-invalid, redacted, omitted, and unsupported request evidence without changing the legacy coverage or payload-conformance sections.

To keep the public report contract stable and machine-usable, I widened `yanote-js/src/report/schema.ts` and `yanote-js/src/report/normalize.ts` so the new section is schema-validated, sorted deterministically, and normalized alongside the existing payload/report surfaces. I also updated the typed report fixtures in the existing report/write determinism tests so the stricter additive schema remains covered end to end.

On the CLI side, I extended `yanote report` to print a dedicated `HTTP Request Conformance` section and additive `YANOTE_SUMMARY` tokens for observed request operations, observed parameters, and truth counts. I deliberately kept raw request values out of stdout by rendering request Top Issues from the analyzer’s safe summary message plus evidence reason instead of the value-bearing `reason` strings; retained `observedValues` remain available only in `yanote-report.json` diagnostics for artifact inspection.

I then added focused Vitest contract coverage for the new surfaces: `report.requestEvidence.contract.test.ts` pins the JSON report shape and scalar-truth diagnostics, `cli.requestEvidence.test.ts` pins the human-readable CLI section and verifies no raw request values leak into stdout, and `cli.summary.contract.test.ts` now asserts the new section ordering and additive machine-summary tokens without changing legacy percentages. I also recorded the CLI sanitization rule in `.gsd/KNOWLEDGE.md` and saved the observability decision in D009 for downstream tasks.

## Verification

Verified the task-specific contract with `npm -C yanote-js test -- src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`, which passed and proved the new additive report/CLI surfaces. Re-ran the slice-level Node verifier `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`, which passed and confirmed the new report/CLI publication stays compatible with the earlier ingestion/spec/analyzer work. Re-ran the prior Java recorder/core verifier `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'`, which still passed. Added an extra regression sweep with `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.report.test.ts`, which passed and proved the additive request-conformance surface did not break the older report/write/CLI contracts. Per the slice-level verification stack, `bash scripts/ci/verify-m011-s01-request-evidence.sh` still fails because the focused end-to-end verifier script belongs to T04 and has not been created yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 1176ms |
| 2 | `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 1533ms |
| 3 | `./gradlew :yanote-core:test --tests 'dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest' :yanote-recorder-spring-mvc:test --tests 'dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest'` | 0 | ✅ pass | 767ms |
| 4 | `npm -C yanote-js test -- src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.report.test.ts` | 0 | ✅ pass | 1562ms |
| 5 | `bash scripts/ci/verify-m011-s01-request-evidence.sh` | 127 | ❌ fail | 6ms |


## Deviations

I also updated the existing typed report fixtures in `src/report/report.contract.test.ts` and `src/report/writeReport.determinism.test.ts` so the stricter additive schema remains enforced by the older contract/determinism suites, and I ran an extra regression sweep over those suites to prove legacy report behavior stayed stable.

## Known Issues

`bash scripts/ci/verify-m011-s01-request-evidence.sh` still exits 127 because the focused end-to-end verifier script is planned for T04 and does not exist yet.

## Files Created/Modified

- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `.gsd/KNOWLEDGE.md`
