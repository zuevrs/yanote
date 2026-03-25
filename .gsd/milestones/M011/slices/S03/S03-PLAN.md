# S03: Format Policy And Media Specificity Truth

**Goal:** Turn HTTP payload conformance into an honest format/media contract: validate only an explicit supported OpenAPI format subset, choose the most specific declared media type, and expose those outcomes through report/gate/CLI surfaces without changing recorder/core or legacy coverage numerators.
**Demo:** After this slice, declared `format` constraints and competing media types affect real report/gate outcomes: invalid email-like payloads fail, most-specific media declarations win, and declared-but-unsupported/custom formats are surfaced explicitly.
**Active requirements:** Owns active requirement `R022`; preserves validated requirements `R001`, `R002`, and `R003`.

## Must-Haves

- Enforce an explicit supported payload-format policy that validates `format: email`, treats other declared/custom formats as unsupported, and never silently inherits arbitrary Ajv format support.
- Select the most-specific matching declared media type at evaluation time without changing sorted declared-media/report ordering.
- Surface invalid-format, unsupported-format, and media-specific semantic outcomes through governance, `yanote-report.json`, and CLI summary/top-issue output with deterministic fail-closed precedence.
- Prove valid format, invalid format, unsupported format, and most-specific media-selection scenarios through focused Vitest suites and a retained analyzer verifier script.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`
- `bash scripts/ci/verify-m011-s03-format-media.sh`

## Observability / Diagnostics

- Runtime signals: `httpPayloadConformance` diagnostics distinguish invalid-body vs unsupported-schema-format vs unsupported-media vs unsupported-schema paths and preserve the matched observed media type.
- Inspection surfaces: focused Vitest suites, `yanote-report.json`, CLI stdout/stderr, and `bash scripts/ci/verify-m011-s03-format-media.sh`.
- Failure visibility: primary semantic code plus payload diagnostic code/message localize format allowlist drift vs media selection drift vs schema-validation drift.
- Redaction constraints: new diagnostics must not echo raw payload values; only schema paths, format names, and media types are allowed.

## Integration Closure

- Upstream surfaces consumed: OpenAPI content/schema extraction, `httpPayloadConformance`, governance precedence, report schema, and CLI summary surfaces.
- New wiring introduced in this slice: explicit format allowlist evaluation, specificity-ranked media matching, unsupported-schema-format semantic code propagation, and a retained analyzer verifier.
- What remains before the milestone is truly usable end-to-end: S04 still needs docs/CI/analyzer-guide closeout for the widened HTTP boundary, but no recorder/core changes remain for format/media truth.

## Tasks

- [x] **T01: Enforce the supported payload-format policy in the analyzer** `est:1h20m`
  - Why: The slice can overclaim support unless Yanote publishes its own format allowlist before governance and CLI begin failing closed on those semantics.
  - Files: `yanote-js/package.json`, `yanote-js/src/coverage/httpPayloadConformance.ts`, `yanote-js/src/coverage/httpPayloadConformance.test.ts`, `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml`, `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl`, `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl`, `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl`
  - Do: add direct `ajv-formats` support, define Yanote’s explicit payload-format allowlist starting with `email`, scan matched JSON schemas for declared formats, fail closed with a dedicated `UNSUPPORTED_SCHEMA_FORMAT` diagnostic when a declared/custom format is outside the allowlist, and add shared fixture coverage for valid email, invalid email, and unsupported format paths without touching recorder/core.
  - Verify: `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts`
  - Done when: valid email remains `VALID`, invalid email becomes `INVALID_BODY`, and declared unsupported/custom formats no longer pass silently—they emit `UNSUPPORTED_SCHEMA_FORMAT` diagnostics from the analyzer.
- [x] **T02: Prefer the most-specific declared media type during payload matching** `est:55m`
  - Why: S03’s media truth is false until exact/specific declarations beat wildcard siblings during real payload matching.
  - Files: `yanote-js/src/coverage/httpPayloadConformance.ts`, `yanote-js/src/coverage/httpPayloadConformance.test.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl`
  - Do: replace the current first-match selection with specificity ranking at evaluation time, reuse the shared S03 fixture bundle for a competing `application/*+json` vs `application/problem+json` case, and pin that extraction/report ordering stays stable while matching behavior becomes specificity-aware.
  - Verify: `npm -C yanote-js test -- src/coverage/httpPayloadConformance.test.ts src/spec/openapi.test.ts`
  - Done when: an observed `application/problem+json` payload validates against the specific declaration even when a wildcard sibling would sort earlier, and declared media ordering stays deterministic in report output.
- [x] **T03: Fail closed and serialize unsupported-format payload semantics** `est:1h15m`
  - Why: R002 and R003 are still open for S03 until the new analyzer truth shows up as stable governance/report contract data rather than an implementation detail.
  - Files: `yanote-js/src/gates/httpPayloadSemantics.ts`, `yanote-js/src/gates/httpPayloadSemantics.test.ts`, `yanote-js/src/gates/failureOrder.ts`, `yanote-js/src/gates/failureOrder.test.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/report.contract.test.ts`
  - Do: map `UNSUPPORTED_SCHEMA_FORMAT` to a dedicated `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` failure, place it deterministically in HTTP payload precedence, extend the strict report schema/serializer for the new diagnostic code, and prove invalid-format, unsupported-format, and media-specificity scenarios remain schema-valid while preserving legacy coverage numerators.
  - Verify: `npm -C yanote-js test -- src/gates/httpPayloadSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.test.ts src/report/report.contract.test.ts`
  - Done when: `yanote-report.json` serializes the new diagnostic code cleanly, governance chooses the expected primary failure order, and full-observation S03 scenarios fail closed without changing observation coverage math.
- [x] **T04: Expose format and media truth through CLI summaries** `est:1h`
  - Why: Teams consume Yanote through the CLI, so S03 is not complete until the new payload semantics appear on stdout/stderr and `YANOTE_SUMMARY` without duplicated noise.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`
  - Do: update CLI issue selection/dedupe as needed so invalid supported formats, unsupported formats, and specificity-driven outcomes surface once through Top Issues and primary stderr lines, and extend CLI contract tests to cover the shared S03 fixture scenarios while keeping machine-summary compatibility unless a new token is truly necessary.
  - Verify: `npm -C yanote-js test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`
  - Done when: CLI stderr exposes `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`, Top Issues does not duplicate the same raw payload diagnostic, and `YANOTE_SUMMARY` stays backward-compatible while reflecting the richer payload counts.
- [x] **T05: Prove format policy and media specificity with a retained analyzer verifier** `est:50m`
  - Why: The slice closes only when one retained proof script exercises the real `yanote report` entrypoint across both green and red S03 scenarios without mutating the stable live-service bundle.
  - Files: `scripts/ci/verify-m011-s03-format-media.sh`
  - Do: add a focused verifier that builds `yanote-js`, runs `yanote report` against the shared S03 fixtures, asserts valid-format green behavior plus invalid-email, unsupported-format, and media-specificity outcomes through report JSON and CLI stdout/stderr, and retains high-signal temp artifacts on failure.
  - Verify: `bash scripts/ci/verify-m011-s03-format-media.sh`
  - Done when: the verifier proves the valid supported-format case stays green, the red scenarios fail closed with the expected primary codes, and retained artifacts make analyzer-vs-report-vs-CLI drift easy to localize.

## Files Likely Touched

- `yanote-js/package.json`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/httpPayloadSemantics.test.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml`
- `yanote-js/test/fixtures/events/http-payload-valid-format.fixture.jsonl`
- `yanote-js/test/fixtures/events/http-payload-invalid-format.fixture.jsonl`
- `yanote-js/test/fixtures/events/http-payload-unsupported-format.fixture.jsonl`
- `yanote-js/test/fixtures/events/http-payload-media-specificity.fixture.jsonl`
- `scripts/ci/verify-m011-s03-format-media.sh`
