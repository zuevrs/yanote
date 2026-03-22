# S04: HTTP/OpenAPI Recorder-Policy And Schema Fidelity Hardening

**Goal:** Deepen the existing HTTP/OpenAPI path so it can distinguish recorder-policy omission from semantic payload drift more cleanly and validate a broader set of real OpenAPI schema/media-type shapes without weakening the observation-versus-conformance split established in M008.
**Demo:** Running the HTTP payload/report/gate suites plus the retained live Spring MVC analyzer proof shows explicit recorder-policy diagnostics beside semantic drift, improved media-type/schema handling for realistic OpenAPI shapes, and no regression of the current green HTTP payload-conformance path.

## Must-Haves

- HTTP payload conformance consumes explicit recorder provenance instead of inferring “missing body” whenever the recorder intentionally omitted evidence.
- OpenAPI schema handling is normalized enough that supported real-world schema/media-type shapes fail less often for parser reasons while unsupported cases remain explicit and fail closed.
- Report/gate/CLI output keeps observation coverage separate from payload conformance and explains recorder-policy omission distinctly from semantic mismatch.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `./gradlew --no-daemon :yanote-recorder-spring-mvc:test`
- `npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts src/gates/httpPayloadSemantics.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts src/cli.summary.contract.test.ts`
- `bash scripts/docs/verify-s02-analysis-path.sh`

## Observability / Diagnostics

- Runtime signals: provenance-aware HTTP payload diagnostics, clearer media-type/schema normalization errors, and report/governance entries that separate recorder-policy omission from semantic drift.
- Inspection surfaces: `httpPayloadConformance` tests, report/CLI tests, Spring MVC recorder tests, and retained `verify-s02-analysis-path.sh` artifacts.
- Failure visibility: oversized/unsupported/malformed capture omission, schema-normalization failure, media-type mismatch, and true semantic invalid-body cases remain individually inspectable.
- Redaction constraints: provenance and diagnostics should describe omission reason, declared media, and observed media/status without widening raw payload exposure beyond the current JSON-first boundary.

## Integration Closure

- Upstream surfaces consumed: S01 HTTP provenance fields, `HttpPayloadCapture`, OpenAPI loading, HTTP payload conformance semantics, report/gate/CLI surfaces, and the retained live Spring MVC proof stack.
- New wiring introduced in this slice: recorder-policy-aware semantics flow from HTTP JSONL evidence into report/gate truth without changing observation coverage math.
- What remains before the milestone is truly usable end-to-end: S05 still needs to re-prove the strengthened HTTP and async boundaries together through retained artifacts/docs and version-sensitive recorder hardening.

## Tasks

- [ ] **T01: Normalize OpenAPI payload schema/media handling and recorder-policy inputs** `est:1h25m`
  - Why: the current HTTP semantic layer still mixes recorder omission and semantic absence too easily, and raw OpenAPI schema objects are a brittle input for payload validation.
  - Files: `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`, `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`, `yanote-js/src/spec/openapi.ts`, `yanote-js/src/spec/openapi.test.ts`, `yanote-js/src/coverage/httpPayloadConformance.ts`, `yanote-js/src/coverage/httpPayloadConformance.test.ts`, `yanote-js/test/fixtures/openapi/http-payload.yaml`
  - Do: Feed S01 provenance into the HTTP analyzer path, add or tighten OpenAPI-to-validation normalization where needed, and expand fixture coverage for recorder-policy omission, media-type matching, and broader supported schema shapes without weakening fail-closed behavior.
  - Verify: `./gradlew --no-daemon :yanote-recorder-spring-mvc:test && npm -C yanote-js test -- src/spec/openapi.test.ts src/coverage/httpPayloadConformance.test.ts`
  - Done when: HTTP conformance tests distinguish recorder-policy omission from semantic absence, supported schema/media cases expand deterministically, and unsupported cases remain explicit rather than silently ignored.
- [ ] **T02: Surface provenance-aware HTTP truth in report, gates, CLI, and retained proof** `est:1h15m`
  - Why: users only benefit if the richer provenance actually changes the public truth surfaces instead of remaining buried in raw event JSON.
  - Files: `yanote-js/src/gates/httpPayloadSemantics.ts`, `yanote-js/src/gates/httpPayloadSemantics.test.ts`, `yanote-js/src/report/report.ts`, `yanote-js/src/report/report.test.ts`, `yanote-js/src/report/report.contract.test.ts`, `yanote-js/src/cli.ts`, `yanote-js/src/cli.report.test.ts`, `yanote-js/src/cli.failclosed.contract.test.ts`, `yanote-js/src/cli.summary.contract.test.ts`, `scripts/docs/verify-s02-analysis-path.sh`
  - Do: Make report/gate/CLI surfaces explain recorder-policy omission distinctly from semantic mismatch, keep observation coverage numerators untouched, and refresh the retained live verifier so the stronger truth appears in the same proof path users already trust.
  - Verify: `npm -C yanote-js test -- src/gates/httpPayloadSemantics.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts src/cli.summary.contract.test.ts && bash scripts/docs/verify-s02-analysis-path.sh`
  - Done when: public HTTP truth surfaces remain fail-closed, provenance-driven omission is no longer mislabeled as plain missing-body drift, and the live Spring MVC proof still passes.

## Files Likely Touched

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpPayloadCapture.java`
- `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`
- `yanote-js/src/spec/openapi.ts`
- `yanote-js/src/spec/openapi.test.ts`
- `yanote-js/src/coverage/httpPayloadConformance.ts`
- `yanote-js/src/coverage/httpPayloadConformance.test.ts`
- `yanote-js/test/fixtures/openapi/http-payload.yaml`
- `yanote-js/src/gates/httpPayloadSemantics.ts`
- `yanote-js/src/gates/httpPayloadSemantics.test.ts`
- `yanote-js/src/report/report.ts`
- `yanote-js/src/report/report.test.ts`
- `yanote-js/src/report/report.contract.test.ts`
- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.failclosed.contract.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `scripts/docs/verify-s02-analysis-path.sh`
