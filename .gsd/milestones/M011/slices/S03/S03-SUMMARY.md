---
id: S03
parent: M011
milestone: M011
provides:
  - An explicit HTTP payload format policy that validates supported `format: email` declarations and fails closed on unsupported/custom formats.
  - Specificity-ranked payload media matching that truthfully selects `application/problem+json` over wildcard siblings while preserving stable declared-media report ordering.
  - Typed analyzer/report/gate/CLI publication of invalid-format, unsupported-format, and most-specific-media outcomes on shared retained fixtures.
requires:
  - slice: S01
    provides: Additive retained HTTP request/payload evidence and the recorder → JSONL → analyzer path that keeps observed content-type and body facts available for later semantic evaluation.
  - slice: S02
    provides: Typed fail-closed HTTP semantic governance/report/CLI surfaces and deterministic failure ordering infrastructure that S03 extends with payload format/media-specific codes.
affects:
  - S04
key_files:
  - yanote-js/package.json
  - yanote-js/src/coverage/httpPayloadConformance.ts
  - yanote-js/src/gates/httpPayloadSemantics.ts
  - yanote-js/src/gates/failureOrder.ts
  - yanote-js/src/report/report.ts
  - yanote-js/src/report/schema.ts
  - yanote-js/src/cli.ts
  - yanote-js/test/fixtures/openapi/http-payload-format-media.yaml
  - scripts/ci/verify-m011-s03-format-media.sh
key_decisions:
  - Support HTTP payload `format` semantics only through an explicit Yanote allowlist (`email` first) instead of inheriting arbitrary Ajv format behavior.
  - Represent declared-but-unsupported/custom payload formats as dedicated `UNSUPPORTED_SCHEMA_FORMAT` analyzer diagnostics that downstream governance turns into fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` errors.
  - Separate stable declared-media presentation order from evaluation-time specificity ranking so exact/specific media declarations beat wildcard siblings without destabilizing deterministic report output.
  - Keep CLI/public issue text secret-safe by surfacing typed semantic failures once through Top Issues / stderr while leaving raw payload values out of human-facing output.
patterns_established:
  - Pre-scan matched JSON schemas for unsupported `format` keywords before validator compilation, and register only explicitly allowlisted formats with Ajv.
  - Resolve media truth in two phases: keep declaration/report ordering stable for deterministic artifacts, but choose the validation contract at runtime by specificity (`exact` > structured-suffix wildcard > broader wildcard).
  - Drive analyzer, report, CLI, and retained verifier coverage from one shared fixture bundle so the same S03 scenarios prove end-to-end consistency across all public surfaces.
observability_surfaces:
  - `httpPayloadConformance` diagnostics in `yanote-report.json`, including `code`, `message`, `errors`, and matched `observedMediaType`.
  - Governance diagnostics and primary failure selection through `SEMANTIC_HTTP_*` codes in CLI stderr / `YANOTE_SUMMARY` / Top Issues.
  - Focused Vitest suites covering analyzer, governance, report-schema, and CLI contracts for valid-format, invalid-format, unsupported-format, and media-specificity scenarios.
  - `bash scripts/ci/verify-m011-s03-format-media.sh`, which retains per-scenario stdout/stderr/report artifacts on failure for analyzer-vs-report-vs-CLI localization.
drill_down_paths:
  - .gsd/milestones/M011/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M011/slices/S03/tasks/T03-SUMMARY.md
  - .gsd/milestones/M011/slices/S03/tasks/T04-SUMMARY.md
  - .gsd/milestones/M011/slices/S03/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T18:25:39.736Z
blocker_discovered: false
---

# S03: Format Policy And Media Specificity Truth

**Yanote now enforces an explicit HTTP payload format allowlist and specificity-ranked media matching, and publishes invalid or unsupported payload semantics through analyzer, report, gate, CLI, and retained verifier surfaces.**

## What Happened

S03 turned HTTP payload conformance from a JSON-only shape check into an explicit product contract for payload formats and competing media types. In the analyzer, `httpPayloadConformance` now registers only Yanote’s allowlisted payload formats (`email` first), walks matched JSON schemas before Ajv compilation to detect declared-but-unsupported/custom formats, and emits dedicated `UNSUPPORTED_SCHEMA_FORMAT` diagnostics instead of silently degrading those declarations to plain string checks. The same evaluator now ranks matching media types by specificity at evaluation time (`exact` > structured-suffix wildcard > broader wildcard), so an observed `application/problem+json` body is validated against the stricter declaration even when a wildcard sibling exists, while the declared-media lists shown in reports stay lexicographically stable.

The slice then wired those analyzer truths through the fail-closed path. Governance maps `UNSUPPORTED_SCHEMA_FORMAT` to `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`, payload semantic precedence is deterministic, and `yanote-report.json` serializes the new diagnostic code and matched observed media type without leaking raw payload values. CLI summary and stderr selection were tightened so invalid supported formats, unsupported custom formats, and media-specificity-driven failures appear once as typed Top Issues / primary error lines instead of duplicating raw payload diagnostics.

Finally, S03 established a shared proof bundle for valid-format, invalid-format, unsupported-format, and media-specificity scenarios. Focused Vitest suites cover analyzer, OpenAPI extraction, governance ordering, report serialization, and CLI behavior, while `scripts/ci/verify-m011-s03-format-media.sh` builds `yanote-js`, runs `yanote report` end to end on the retained fixtures, and asserts both green and fail-closed outcomes with localized artifacts. Together those proofs show that declared `format` and content-map specificity now materially affect real report and gate outcomes without changing legacy coverage numerators or recorder/core contracts.

## Verification

Passed the full slice verification stack from the plan: `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` (9 files, 62 tests passed) and `bash scripts/ci/verify-m011-s03-format-media.sh` (valid-format, invalid-format, unsupported-format, and media-specificity scenarios all passed). Also spot-checked observability surfaces by running `node yanote-js/dist/yanote.cjs report` against the shared unsupported-format and media-specificity fixtures and confirming that `yanote-report.json` governance diagnostics reported `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` / `SEMANTIC_HTTP_INVALID_BODY` respectively, while request payload diagnostics preserved the matched `observedMediaType` (`application/json` and `application/problem+json`) and emitted only schema-path / format messages.

## Requirements Advanced

- R022 — Expanded the supported HTTP/OpenAPI contract depth from request serialization into payload format/media truth by proving an explicit `email` format allowlist, dedicated unsupported-format semantics, and specificity-ranked media matching end to end through analyzer, report, CLI, and retained verifier paths.

## Requirements Validated

- R002 — `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts` plus `bash scripts/ci/verify-m011-s03-format-media.sh` proved that invalid supported formats and unsupported/custom formats fail closed with deterministic typed semantic codes and stable precedence.
- R003 — CLI/report contract tests and the retained S03 verifier proved that `yanote report` publishes the richer payload semantics through `yanote-report.json`, Top Issues, stderr, and `YANOTE_SUMMARY` without requiring a new entrypoint or breaking the existing CLI surface.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Yanote’s published payload-format allowlist still starts and ends with `email`; other OpenAPI/custom `format` values remain intentionally fail-closed as unsupported until a future milestone expands the supported subset. Non-JSON declared media types are still outside HTTP payload conformance support. S04 still needs to finish the public-boundary docs/CI/schema closeout for the widened HTTP request/media semantics.

## Follow-ups

S04 should publish the S03 format/media boundary through the analyzer guide, public docs, CI/verifier contracts, and any user-facing schema/CLI wording that now depends on the new payload semantics. Any future expansion of supported payload formats should follow the same explicit allowlist + retained-fixture + fail-closed-governance pattern established here.

## Files Created/Modified

- `yanote-js/package.json` — Added the explicit `ajv-formats` runtime dependency needed to register only Yanote’s allowlisted payload formats.
- `yanote-js/package-lock.json` — Captured the lockfile update for the new `ajv-formats` dependency.
- `yanote-js/src/coverage/httpPayloadConformance.ts` — Added payload-format allowlist enforcement, unsupported-format schema scanning, specificity-ranked media matching, and the new `UNSUPPORTED_SCHEMA_FORMAT` diagnostic path.
- `yanote-js/src/coverage/httpPayloadConformance.test.ts` — Extended payload conformance tests to cover valid email, invalid email, unsupported custom formats, and most-specific media-type matching.
- `yanote-js/src/spec/openapi.test.ts` — Pinned that declared media extraction/report ordering stays stable while evaluation-time matching becomes specificity-aware.
- `yanote-js/src/gates/httpPayloadSemantics.ts` — Mapped unsupported schema formats to dedicated fail-closed semantic failures and added corresponding reason/hint text.
- `yanote-js/src/gates/httpPayloadSemantics.test.ts` — Verified classification of invalid-body and unsupported-schema-format payload diagnostics into governance failures.
- `yanote-js/src/gates/failureOrder.ts` — Inserted the new HTTP payload semantic code into deterministic failure precedence ordering.
- `yanote-js/src/gates/failureOrder.test.ts` — Added precedence coverage so unsupported-format payload failures sort correctly among other semantic failures.
- `yanote-js/src/report/report.ts` — Serialized the new payload diagnostic/governance truth while preserving existing coverage numerators and deterministic output ordering.
- `yanote-js/src/report/schema.ts` — Extended the strict report schema to allow `UNSUPPORTED_SCHEMA_FORMAT` in payload diagnostics.
- `yanote-js/src/report/report.test.ts` — Covered report aggregation and serialization for the new S03 payload semantics.
- `yanote-js/src/report/report.contract.test.ts` — Pinned `yanote-report.json` contract behavior for the shared format/media fixtures.
- `yanote-js/src/cli.ts` — Updated CLI issue selection/deduplication so new payload semantic failures surface once through Top Issues / stderr / summary output.
- `yanote-js/src/cli.report.test.ts` — Exercised CLI rendering for the S03 format/media scenarios.
- `yanote-js/src/cli.summary.contract.test.ts` — Proved `YANOTE_SUMMARY` stayed backward-compatible while reflecting richer payload semantic counts.
- `yanote-js/src/cli.failclosed.contract.test.ts` — Pinned exit-5 fail-closed behavior and typed primary-error selection for the new payload semantics.
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml` — Added the focused OpenAPI fixture that declares supported email format, unsupported custom format, and competing wildcard/specific media types.
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl` — Added the green supported-format fixture for a valid email request/response flow.
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl` — Added the red fixture proving invalid allowlisted email format fails as `INVALID_BODY`.
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl` — Added the red fixture proving unsupported/custom schema formats fail closed as `UNSUPPORTED_SCHEMA_FORMAT`.
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl` — Added the fixture proving most-specific `application/problem+json` matching beats wildcard siblings and turns the stricter request schema red.
- `scripts/ci/verify-m011-s03-format-media.sh` — Added the retained end-to-end verifier that builds `yanote-js`, runs the shared S03 scenarios through `yanote report`, and asserts report/CLI/governance outcomes with retained failure artifacts.
