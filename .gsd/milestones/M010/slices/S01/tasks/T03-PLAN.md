---
estimated_steps: 4
estimated_files: 4
skills_used:
  - java-junit
  - bash-scripting
  - openapi-specification-v3.2
---

# T03: Prove live undeclared-status and header/value evidence on the example service

**Slice:** S01 — HTTP Evidence Depth For Undeclared Statuses, Parameter Values, And Response Headers
**Milestone:** M010

## Description

Add a focused live proof path that exercises the richer recorder output on the existing Spring MVC example stack. The proof must leave S02 a real undeclared-status example plus supported parameter/header/response-header evidence, and it must keep the current analyzer-path verifier green so S01 does not silently regress the already-supported HTTP surface.

## Steps

1. Add a dedicated example endpoint that exercises path/query/request-header capture, returns an intentionally undeclared status, and emits safe response headers for later response-header contract checks.
2. Update `demo-openapi.yaml` so the example declares the supported path/query/header/response-header contract for that endpoint while deliberately not declaring the observed live status.
3. Add a focused RestAssured proof test that inspects recorded JSONL directly for additive evidence, compatibility key arrays, and redaction/omission behavior.
4. Wrap the live proof in a focused verifier script that retains failure artifacts, then re-run `verify-s02-analysis-path.sh` as regression safety.

## Must-Haves

- [ ] The example service emits one real undeclared HTTP status on a path that also exercises supported parameter/header/response-header evidence.
- [ ] The demo OpenAPI fixture declares the supported parameter/header/response-header surface without declaring that observed status.
- [ ] The focused verifier proves the richer JSONL shape and the existing analyzer-path verifier still passes afterward.

## Verification

- `bash scripts/docs/verify-m010-s01-http-evidence-depth.sh`
- `bash scripts/docs/verify-s02-analysis-path.sh`

## Observability Impact

- Signals added/changed: retained live `events.jsonl`, verifier logs, and a focused example proof for undeclared-status plus header/value evidence.
- How a future agent inspects this: `HttpEvidenceDepthE2eTest`, the verifier script’s retained temp artifacts, and the existing analyzer-path regression verifier.
- Failure state exposed: live recorder drift, stale example/spec wiring, or broken analyzer compatibility show up as direct event-level mismatches instead of vague end-to-end failures.

## Inputs

- `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java` — recorder output contract from T02 that the live proof must exercise.
- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — current Spring MVC proof service.
- `examples/openapi/demo-openapi.yaml` — current demo OpenAPI contract.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — existing RestAssured proof pattern to mirror.
- `scripts/docs/verify-s02-analysis-path.sh` — existing analyzer-path regression verifier that must stay green.

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java` — dedicated live proof endpoint for richer HTTP evidence.
- `examples/openapi/demo-openapi.yaml` — supported parameter/header/response-header contract plus intentionally undeclared observed status.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java` — focused live JSONL proof for additive evidence.
- `scripts/docs/verify-m010-s01-http-evidence-depth.sh` — focused verifier with retained failure artifacts and regression wiring.
