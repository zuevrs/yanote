---
id: T04
parent: S02
milestone: M014
provides: []
requires: []
affects: []
key_files: ["yanote-js/src/report/asyncReport.ts", "yanote-js/src/report/asyncSchema.ts", "yanote-js/src/report/asyncNormalize.ts", "yanote-js/src/report/asyncReportHtml.ts", "yanote-js/src/report/htmlDocument.ts", "yanote-js/src/report/asyncReport.test.ts", "yanote-js/src/report/asyncReport.contract.test.ts", "yanote-js/src/report/asyncReport.remote-spec.contract.test.ts", "yanote-js/src/report/writeAsyncReport.determinism.test.ts"]
key_decisions: ["Published runtime truth under a dedicated report.runtimeSemantics section with summary, per-operation rows, and typed diagnostic counts/items instead of mutating legacy coverage or declaredSemantics surfaces.", "Marked async report status partial when runtime semantic diagnostics exist so fully covered legacy routing/schema surfaces cannot mask header-backed semantic drift."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` and confirmed the widened async report stays schema-valid, deterministic, additive to the legacy coverage/declared surfaces, consistent across local-file/local-directory/remote-url spec provenance, and free of retained correlation/reply header-value leakage in JSON and HTML artifacts."
completed_at: 2026-03-26T11:11:03.422Z
blocker_discovered: false
---

# T04: Added additive runtimeSemantics reporting to async JSON/HTML artifacts with strict schema validation, deterministic ordering, and redaction-safe runtime diagnostics.

> Added additive runtimeSemantics reporting to async JSON/HTML artifacts with strict schema validation, deterministic ordering, and redaction-safe runtime diagnostics.

## What Happened
---
id: T04
parent: S02
milestone: M014
key_files:
  - yanote-js/src/report/asyncReport.ts
  - yanote-js/src/report/asyncSchema.ts
  - yanote-js/src/report/asyncNormalize.ts
  - yanote-js/src/report/asyncReportHtml.ts
  - yanote-js/src/report/htmlDocument.ts
  - yanote-js/src/report/asyncReport.test.ts
  - yanote-js/src/report/asyncReport.contract.test.ts
  - yanote-js/src/report/asyncReport.remote-spec.contract.test.ts
  - yanote-js/src/report/writeAsyncReport.determinism.test.ts
key_decisions:
  - Published runtime truth under a dedicated report.runtimeSemantics section with summary, per-operation rows, and typed diagnostic counts/items instead of mutating legacy coverage or declaredSemantics surfaces.
  - Marked async report status partial when runtime semantic diagnostics exist so fully covered legacy routing/schema surfaces cannot mask header-backed semantic drift.
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:11:03.422Z
blocker_discovered: false
---

# T04: Added additive runtimeSemantics reporting to async JSON/HTML artifacts with strict schema validation, deterministic ordering, and redaction-safe runtime diagnostics.

**Added additive runtimeSemantics reporting to async JSON/HTML artifacts with strict schema validation, deterministic ordering, and redaction-safe runtime diagnostics.**

## What Happened

Extended the canonical async report builder so header-backed runtime semantic truth now ships under a dedicated runtimeSemantics section sourced from coverage.runtimeSemantics, grouped by canonical kafka operation row and kept separate from legacy summary, coverage, and declaredSemantics surfaces. Added strict schema validation for the widened contract, deterministic normalization for runtime rows/suites/diagnostics, and an async-only HTML Runtime semantics section that mirrors the JSON contract without serializing retained correlation or reply header values. Expanded focused Vitest coverage to pin the widened DTO, fail-closed schema behavior, remote/local spec parity, byte-stable writer output, unchanged legacy coverage numerators, and redaction-safe serialization.

## Verification

Ran `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` and confirmed the widened async report stays schema-valid, deterministic, additive to the legacy coverage/declared surfaces, consistent across local-file/local-directory/remote-url spec provenance, and free of retained correlation/reply header-value leakage in JSON and HTML artifacts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/asyncReport.test.ts src/report/asyncReport.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/report/writeAsyncReport.determinism.test.ts` | 0 | ✅ pass | 24200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `yanote-js/src/report/asyncReport.ts`
- `yanote-js/src/report/asyncSchema.ts`
- `yanote-js/src/report/asyncNormalize.ts`
- `yanote-js/src/report/asyncReportHtml.ts`
- `yanote-js/src/report/htmlDocument.ts`
- `yanote-js/src/report/asyncReport.test.ts`
- `yanote-js/src/report/asyncReport.contract.test.ts`
- `yanote-js/src/report/asyncReport.remote-spec.contract.test.ts`
- `yanote-js/src/report/writeAsyncReport.determinism.test.ts`


## Deviations
None.

## Known Issues
None.
## Must-Haves Covered

- `yanote-async-report.json` exposes runtime semantics separately from coverage and declared truth.
- `yanote-async-report.html` mirrors the same runtime states/counts while staying async-only and self-contained.
- The async report schema keeps `additionalProperties: false` discipline on the widened contract.

