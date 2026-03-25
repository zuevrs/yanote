---
id: S02
parent: M011
milestone: M011
provides:
  - A published request-serialization support matrix that distinguishes supported scalar parameters, supported repeated query arrays, and explicit unsupported request constructs.
  - Honest request-conformance evaluation and typed fail-closed governance for supported arrays, unsupported constructs, and unavailable/redacted evidence without changing legacy `coverage.parameters` math.
  - A focused retained live-proof harness for request semantics that downstream slices can extend without re-litigating recorder/analyzer/CLI boundaries.
requires:
  - slice: S01
    provides: Additive path/query/header/cookie evidence with captured/redacted/omitted provenance, the initial requestParameters/report scaffold, and the focused Spring MVC request-evidence proof baseline.
affects:
  - S03
  - S04
key_files:
  - yanote-js/src/spec/openapi.ts
  - yanote-js/src/coverage/httpRequestConformance.ts
  - yanote-js/src/gates/httpRequestSemantics.ts
  - yanote-js/src/gates/evaluator.ts
  - yanote-js/src/cli.ts
  - examples/openapi/request-evidence-openapi.yaml
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java
  - scripts/ci/verify-m011-s02-request-semantics.sh
key_decisions:
  - Publish request-serialization support additively via `declaredSupport` / `declaredSupportShape` / `declaredSupportReason` while preserving the legacy `scalarSupport` evaluator contract until enforcement fully switches over.
  - Support repeated arrays only for `query=form` + `explode=true` with scalar items; keep path/header/cookie arrays, parameter `content`, delimiter-reconstructed arrays, and unsupported style/explode/schema cases explicit and fail closed.
  - Map request-semantic drift to dedicated `SEMANTIC_HTTP_*REQUEST_PARAMETER` failures ranked ahead of HTTP payload and threshold/regression failures.
  - Make the focused verifier assert all three localization surfaces explicitly — recorder `events.jsonl`, analyzer/report truth in `yanote-report.json`, and CLI stdout/stderr publication — while keeping secret-bearing values out of public surfaces.
patterns_established:
  - Additive contract migration: publish a wider support matrix first, keep legacy coverage math stable, then switch analyzer/governance enforcement onto the new surface without redefining validated numerators.
  - Fail-closed request semantics follow the same governance path as payload semantics: typed codes, deterministic precedence, secret-safe CLI text, and deduped Top Issues.
  - Focused live-proof scripts should assert recorder capture, analyzer truth, and public CLI/report publication together so drift localizes cleanly across runtime, analysis, and presentation layers.
observability_surfaces:
  - `httpRequestConformance.summary`, per-operation parameter counts, and ordered diagnostics in `yanote-report.json`.
  - Typed governance diagnostics and primary failure codes: `SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER`, `SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER`, and `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`.
  - CLI public surfaces: `HTTP Request Conformance`, `Top Issues`, stderr `YANOTE_ERROR`, and the final `YANOTE_SUMMARY` line.
  - `bash scripts/ci/verify-m011-s02-request-semantics.sh` retained-artifact proof path validating `events.jsonl`, `yanote-report.json`, stdout, and stderr together.
drill_down_paths:
  - .gsd/milestones/M011/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M011/slices/S02/tasks/T03-SUMMARY.md
  - .gsd/milestones/M011/slices/S02/tasks/T04-SUMMARY.md
  - .gsd/milestones/M011/slices/S02/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T17:06:59.616Z
blocker_discovered: false
---

# S02: Supported Serialization Subset And Cookie Conformance

**Published Yanote’s supported request-serialization subset, added honest repeated query-array validation plus typed fail-closed request-semantic gating, and proved the widened boundary end to end on a focused Spring MVC route.**

## What Happened

S02 turned the additive request evidence from S01 into a published, enforced request-serialization contract without disturbing legacy coverage numerators. T01 widened the OpenAPI/report model with shape-aware declared support metadata so each request parameter now publishes whether Yanote supports it as a scalar, supports it as a repeated query array, or treats it as explicitly unsupported, along with stable unsupported reasons for content/style/explode/schema cases. T02 moved request conformance onto that support matrix: supported scalar parameters kept the existing captured/redacted/omitted behavior, while supported repeated query arrays now validate against retained ordered values honestly instead of reconstructing ambiguous delimiter-based shapes. T03 introduced dedicated request-semantic governance codes for invalid, unavailable, and unsupported request drift and ordered them ahead of threshold/regression and HTTP payload failures so request-semantic problems fail closed deterministically. T04 carried those typed failures through the existing CLI/public summary surfaces by making the semantic failure the primary issue, deduplicating equivalent medium request diagnostics from Top Issues, and preserving secret-safe stdout/stderr plus stable green-run request rollups. T05 closed the slice with a focused Spring MVC proof that sends a supported repeated `tags` query array, an unsupported `meta` query contract, supported scalar path/header/cookie inputs, and secret-bearing Authorization/SESSION values only for redaction checks; the retained verifier then localized truth across `events.jsonl`, `yanote-report.json`, and CLI stdout/stderr, proving both honest supported-array handling and fail-closed unsupported request semantics end to end.

## Verification

Passed the full slice-level Vitest stack from the plan: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` (9 files, 29 tests). Passed `bash scripts/ci/verify-m011-s02-request-semantics.sh`, which built the analyzer and focused Spring MVC proof assets, exercised the live route, asserted ordered retained request evidence in `events.jsonl`, verified supported-array and unsupported request truth plus governance diagnostics in `yanote-report.json`, confirmed `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` fail-closed CLI behavior, and checked that secret values and retained request values do not leak to stdout/stderr. These checks also confirmed the planned observability surfaces: request-conformance summary/per-operation/diagnostics in the JSON report, typed governance diagnostics, CLI `HTTP Request Conformance`/`Top Issues`/`YANOTE_SUMMARY`, and the retained focused verifier artifacts.

## Requirements Advanced

- R022 — Published and enforced the supported request-serialization subset: shape-aware request support metadata now distinguishes scalar/array/unsupported contracts, repeated query arrays are validated from retained ordered values, and the focused Spring MVC proof shows supported-array truth plus unsupported request semantics end to end.
- R003 — Surfaced the widened request truth through the existing `yanote report` JSON/CLI path, including Top Issues, stderr semantic failures, and `YANOTE_SUMMARY`, instead of introducing a side channel.

## Requirements Validated

- R002 — `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` plus `bash scripts/ci/verify-m011-s02-request-semantics.sh` prove that invalid/unavailable/unsupported request semantics now fail closed through typed governance codes and secret-safe CLI/report publication.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Authorization and SESSION were kept only as live-request redaction/no-leakage proof inputs instead of declared request-conformance parameters so the focused fail-closed path stays on the unsupported `meta` query contract rather than an unavailable secret-bearing parameter.

## Known Limitations

The supported subset is still intentionally narrow: scalar validation covers `path=simple`, `query=form`, `header=simple`, and `cookie=form`, while repeated arrays are only supported for `query=form` + `explode=true` with scalar items. Delimiter-reconstructed arrays, parameter `content`, non-whitelisted styles/explode combinations, and richer schema shapes remain explicit unsupported semantics. M011 still needs S03 for format/media truth and S04 for public-boundary docs/schema/CI closeout.

## Follow-ups

S03 should preserve the new request-semantic precedence when adding media/format semantics so mixed request+payload failures stay deterministic. S04 should document the published request support matrix (`declaredSupport*`), typed request-semantic codes, and focused verifier path on the stable public report/CLI/schema/CI surfaces.

## Files Created/Modified

- `yanote-js/src/coverage/dimensions.ts` — Extended request-coverage dimension types to publish shape-aware declared support metadata alongside the legacy scalar contract.
- `yanote-js/src/spec/openapi.ts` — Parsed the supported request-serialization subset, including repeated query-array support and stable unsupported reasons for unsupported constructs.
- `yanote-js/src/spec/openapi.test.ts` — Pinned supported query arrays plus unsupported content/style/explode/schema request declarations.
- `yanote-js/src/coverage/httpRequestConformance.ts` — Switched request conformance onto the declared support matrix, added honest repeated query-array validation, and kept unsupported/ambiguous shapes explicit.
- `yanote-js/src/coverage/httpRequestConformance.test.ts` — Covered supported-array captured-valid/captured-invalid behavior plus unsupported, redacted, and omitted request truth cases.
- `yanote-js/src/report/report.ts` — Published declared request support metadata and widened request-conformance details on the report surface without changing legacy coverage numerators.
- `yanote-js/src/report/schema.ts` — Extended the JSON report schema for declared request support and additive request-conformance fields.
- `yanote-js/src/report/report.requestEvidence.contract.test.ts` — Locked the schema-valid report contract for additive request evidence, supported arrays, unsupported diagnostics, and deterministic counts.
- `yanote-js/src/report/writeReport.determinism.test.ts` — Confirmed the widened request/report output remains deterministic.
- `yanote-js/src/gates/httpRequestSemantics.ts` — Added a dedicated classifier from request-conformance truths to typed semantic governance failures.
- `yanote-js/src/gates/httpRequestSemantics.test.ts` — Verified fail-closed mapping for invalid, unavailable, unsupported, and green request-semantic cases.
- `yanote-js/src/gates/evaluator.ts` — Inserted request-semantic failures into the main governance evaluator ahead of threshold/regression logic.
- `yanote-js/src/gates/failureOrder.ts` — Ordered request-semantic failures deterministically ahead of payload and generic gate failures.
- `yanote-js/src/gates/failureOrder.test.ts` — Pinned mixed request/payload/gate failure precedence.
- `yanote-js/src/cli.ts` — Promoted typed request-semantic failures to the primary CLI issue surface, deduped equivalent request diagnostics, and preserved secret-safe summaries.
- `yanote-js/src/cli.requestEvidence.test.ts` — Asserted fail-closed request-semantic exit behavior and secret-safe CLI surfacing.
- `yanote-js/src/cli.summary.contract.test.ts` — Verified stable green-run request rollups and `YANOTE_SUMMARY` tokens under the widened request semantics.
- `yanote-js/src/cli.failclosed.contract.test.ts` — Covered request-semantic precedence over payload semantics and duplicate suppression in CLI issue output.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — Extended the focused Spring MVC route to exercise repeated query arrays, unsupported query evidence, and secret-bearing redaction checks.
- `examples/openapi/request-evidence-openapi.yaml` — Declared supported repeated `tags` query arrays and unsupported `meta` query schema in the focused proof spec.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java` — Sent the focused live request and asserted retained request evidence, unsupported semantics, and redaction behavior end to end.
- `scripts/ci/verify-m011-s02-request-semantics.sh` — Built the retained end-to-end verifier for recorder/analyzer/CLI request semantics, fail-closed exit behavior, and no-leakage checks.
- `.gsd/KNOWLEDGE.md` — Recorded the staged request-support migration, CLI fail-closed test boundary, and shell verifier exit-code gotcha discovered during the slice.
