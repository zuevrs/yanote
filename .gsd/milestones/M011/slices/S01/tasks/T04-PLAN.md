---
estimated_steps: 4
estimated_files: 4
skills_used:
  - spring-web
  - java-junit
  - bash-scripting
---

# T04: Prove request evidence end to end on a focused Spring MVC route

**Slice:** S01 — Safe Request Evidence And First Scalar Truth
**Milestone:** M011

## Description

Prove the slice end to end on a real Spring MVC route. This keeps S01 honest and gives later slices a retained proof path that does not depend on memory of how the feature is supposed to work.

## Steps

1. Add a focused example route and matching OpenAPI contract that exercise one path variable, one query scalar, one request header scalar, and one cookie scalar, plus at least one intentionally redacted request signal.
2. Add a focused RestAssured/JUnit proof that drives the route with live test metadata, checks the raw `events.jsonl` evidence shape, and avoids contaminating the existing green happy-path denominator.
3. Add `scripts/ci/verify-m011-s01-request-evidence.sh` to run the example proof, build the analyzer, execute `yanote report` against the focused spec, and assert that `yanote-report.json` shows captured/redacted/omitted evidence plus first scalar truth.
4. Retain high-signal failure artifacts (raw JSONL, report JSON, stdout/stderr paths) so later agents can localize drift quickly.

## Must-Haves

- [ ] The focused proof route exercises path/query/header/cookie inputs on a real Spring MVC runtime.
- [ ] The verifier checks both raw recorder evidence and analyzer/report output for the same request.
- [ ] The existing happy-path `run-v1-e2e.sh` boundary stays untouched while S01 proves its narrower route separately.

## Verification

- The focused verifier proves recorder capture and analyzer/report truth on the same live Spring MVC request path.
- `bash scripts/ci/verify-m011-s01-request-evidence.sh`

## Observability Impact

- Signals added/changed: the focused proof route emits raw request-evidence JSONL and a retained `yanote-report.json` request-conformance surface for the same live request.
- How a future agent inspects this: run `bash scripts/ci/verify-m011-s01-request-evidence.sh` and inspect the retained temp-directory artifacts it prints on failure.
- Failure state exposed: the verifier keeps raw JSONL, report JSON, stdout/stderr, and per-step logs so recorder-vs-analyzer drift is easy to localize.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current example service that needs a focused request-evidence route.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — existing demo proof path whose green denominator must remain untouched.
- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpRequestEvidenceCapture.java` — recorder capture behavior the live route must exercise.
- `yanote-js/src/coverage/httpRequestConformance.ts` — analyzer semantics the focused proof must surface end to end.
- `yanote-js/src/report/report.ts` — report builder that the verifier must inspect through `yanote-report.json`.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — focused Spring MVC route that exercises path/query/header/cookie inputs.
- `examples/openapi/request-evidence-openapi.yaml` — matching OpenAPI contract for the focused S01 proof path.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java` — live RestAssured/JUnit proof for raw request evidence.
- `scripts/ci/verify-m011-s01-request-evidence.sh` — end-to-end verifier that checks raw JSONL plus `yanote-report.json` on the focused route.
