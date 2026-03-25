# S02: Supported Serialization Subset And Cookie Conformance

**Goal:** Broaden request conformance from first-scalar-only truth into a published supported serialization subset that validates honest repeated query arrays, marks ambiguous path/header/cookie/content constructs unsupported, and routes request-semantic drift through the same report/CLI/gate entrypoints without changing legacy coverage numerators.
**Demo:** After this slice, `yanote report` and gates distinguish supported scalar and repeated-value array serialization for query/header/path/cookie parameters, and explicitly call out unsupported style/explode/content constructs instead of implying blanket OpenAPI support.
**Active requirements:** Owns active requirements `R022` and `R002`; preserves validated requirements `R001` and `R003`.

## Must-Haves

- Publish a shape-aware request contract that distinguishes supported scalar parameters, supported repeated query arrays where retained evidence is honest, and explicit unsupported request constructs.
- Keep recorder → JSONL → analyzer determinism and legacy `coverage.parameters` math unchanged while request-conformance truth widens additively.
- Surface the widened request semantics through `yanote-report.json`, CLI stdout/stderr, Top Issues, and `YANOTE_SUMMARY` instead of a side channel.
- Keep the supported subset honest: support scalar validation for `path=simple`, `query=form`, `header=simple`, and `cookie=form`; support repeated arrays only for `query=form` + `explode=true` with scalar items; fail closed on `content`, non-whitelisted styles, delimiter-reconstructed arrays, and other unsupported shapes.
- Prove one focused live request where supported repeated query-array truth passes and unsupported request constructs become explicit diagnostics / semantic failures without leaking sensitive values.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`
- `bash scripts/ci/verify-m011-s02-request-semantics.sh`

## Observability / Diagnostics

- Runtime signals: `httpRequestConformance` publishes declared support shape/reason plus observed request truths, and governance diagnostics emit typed request-semantic failure codes when invalid, unavailable, or unsupported request evidence is observed.
- Inspection surfaces: focused Vitest suites, `yanote-report.json`, CLI stdout/stderr + `YANOTE_SUMMARY`, and the retained artifact bundle from `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
- Failure visibility: failures localize to operation/location/name with support shape, unsupported reason, evidence reason, ordered retained values (JSON artifact only), and deterministic semantic failure precedence.
- Redaction constraints: raw retained request values stay out of CLI/stdout/stderr; sensitive header/cookie values remain redacted in retained artifacts; unsupported constructs must never be reconstructed beyond what the recorder actually kept.

## Integration Closure

- Upstream surfaces consumed: additive `pathParams` / `queryParams` / `requestHeaders` / `cookies` evidence from S01, `requestParameters` OpenAPI extraction, `httpRequestConformance`, report normalization/schema, CLI governance wiring, and the focused Spring MVC proof harness.
- New wiring introduced in this slice: shape-aware request-parameter support metadata, request-semantic gate mapping ahead of threshold math, CLI/public summary dedupe for request semantic failures, and a retained live verifier that proves both supported query arrays and unsupported constructs.
- What remains before the milestone is truly usable end-to-end: S03 still needs format/media truth, and S04 still needs public docs/CI/schema closeout for the widened HTTP boundary.

## Tasks

- [x] **T01: Publish the supported request serialization matrix in OpenAPI and report contracts** `est:1h30m`
  - Why: The slice needs one honest published support matrix before the analyzer and gates can fail closed against it.
  - Files: `yanote-js/src/coverage/dimensions.ts`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/schema.ts`, `yanote-js/src/report/normalize.ts`, `yanote-js/src/report/report.requestEvidence.contract.test.ts`, `yanote-js/src/report/writeReport.determinism.test.ts`
  - Do: replace the scalar-only request contract with shape-aware support metadata, keep legacy coverage numerators stable, publish declared support shape/reason on `yanote-report.json`, and pin supported query arrays plus unsupported content/style/explode/schema cases in parser/report tests.
  - Verify: `npm -C yanote-js test -- src/spec/openapi.test.ts src/report/report.requestEvidence.contract.test.ts src/report/writeReport.determinism.test.ts`
  - Done when: the report contract can say which request parameters are supported scalars, supported repeated query arrays, or explicitly unsupported without changing `coverage.parameters` behavior.
- [x] **T02: Validate supported repeated query arrays and unsupported request semantics in the analyzer** `est:1h20m`
  - Why: The new support matrix is only useful once observed retained evidence can prove supported arrays honestly and keep ambiguous constructs explicit.
  - Files: `yanote-js/src/coverage/httpRequestConformance.ts`, `yanote-js/src/coverage/httpRequestConformance.test.ts`, `yanote-js/src/report/report.requestEvidence.contract.test.ts`
  - Do: teach request conformance to validate supported repeated query arrays from retained ordered `values[]`, preserve scalar/redacted/omitted handling, and emit deterministic unsupported diagnostics for unsupported or ambiguous retained shapes.
  - Verify: `npm -C yanote-js test -- src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts`
  - Done when: supported repeated query arrays can become captured-valid/captured-invalid, unsupported constructs stay explicitly unsupported, and report counts remain deterministic.
- [x] **T03: Fail closed on request-semantic drift in the governance layer** `est:1h`
  - Why: R002 is still open for request semantics until invalid, unavailable, and unsupported request evidence can stop CI through the existing semantic-failure path.
  - Files: `yanote-js/src/gates/httpRequestSemantics.ts`, `yanote-js/src/gates/httpRequestSemantics.test.ts`, `yanote-js/src/gates/evaluator.ts`, `yanote-js/src/gates/failureOrder.ts`, `yanote-js/src/gates/failureOrder.test.ts`
  - Do: add a dedicated request-semantic gate mapper, wire it ahead of threshold/regression math, and lock deterministic precedence against existing payload semantics.
  - Verify: `npm -C yanote-js test -- src/gates/httpRequestSemantics.test.ts src/gates/failureOrder.test.ts`
  - Done when: request semantic drift fails closed with typed semantic codes and fully valid request semantics leave governance green.
- [x] **T04: Expose typed request-semantic failures through CLI summary surfaces** `est:1h`
  - Why: Preserving R003 requires the widened request truth to appear on the same CLI/summary path teams already use, not only inside report JSON.
  - Files: `yanote-js/src/cli.ts`, `yanote-js/src/cli.requestEvidence.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`
  - Do: surface request-semantic failures as primary CLI issues, dedupe them against medium request diagnostics in Top Issues, and keep green-run request summaries and `YANOTE_SUMMARY` secret-safe.
  - Verify: `npm -C yanote-js test -- src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts src/cli.failclosed.contract.test.ts`
  - Done when: `yanote report` exit 5, stderr, human summary, and `YANOTE_SUMMARY` all expose typed request-semantic failures without leaking retained values or duplicating the same drift.
- [x] **T05: Prove the supported serialization subset end to end on the focused Spring MVC route** `est:1h30m`
  - Why: The slice closes only when a live retained-artifact proof shows supported repeated query arrays and unsupported request constructs on the same recorder → report → gate → CLI path.
  - Files: `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`, `examples/openapi/request-evidence-openapi.yaml`, `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`, `scripts/ci/verify-m011-s02-request-semantics.sh`
  - Do: extend the focused proof route/spec/test to send repeated query values plus unsupported request constructs, and add a retained verifier script that asserts raw `events.jsonl`, `yanote-report.json`, and CLI stdout/stderr for supported query-array truth, fail-closed unsupported diagnostics, and no secret leakage.
  - Verify: `bash scripts/ci/verify-m011-s02-request-semantics.sh`
  - Done when: the focused verifier demonstrates supported query-array truth, typed unsupported request-semantic failures, and enough retained artifacts to localize capture vs analyzer vs CLI/gate drift.

## Files Likely Touched

- `yanote-js/src/coverage/dimensions.ts`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/normalize.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/writeReport.determinism.test.ts`
- `yanote-js/src/coverage/httpRequestConformance.ts`
- `yanote-js/src/coverage/httpRequestConformance.test.ts`
- `yanote-js/src/gates/httpRequestSemantics.ts`
- `yanote-js/src/gates/httpRequestSemantics.test.ts`
- `yanote-js/src/gates/evaluator.ts`
- `yanote-js/src/gates/failureOrder.ts`
- `yanote-js/src/gates/failureOrder.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.requestEvidence.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s02-request-semantics.sh`
