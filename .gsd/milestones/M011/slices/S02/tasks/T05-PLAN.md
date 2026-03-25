---
estimated_steps: 3
estimated_files: 4
skills_used:
  - spring-web
  - java-junit
  - vitest
  - bash-scripting
---

# T05: Prove the supported serialization subset end to end on the focused Spring MVC route

**Slice:** S02 — Supported Serialization Subset And Cookie Conformance
**Milestone:** M011

## Description

Retire the last integration risk with a live retained-artifact proof. This task should extend the focused Spring MVC proof so one request demonstrates supported repeated query-array truth and at least one unsupported request construct on the same report/gate/CLI path.

## Steps

1. Extend the focused example route/spec and RestAssured proof to send repeated query values plus additional unsupported request constructs that the recorder still captures safely.
2. Add a retained verifier script that boots the example service, exercises the proof route, and asserts raw `events.jsonl`, `yanote-report.json`, and CLI stdout/stderr for supported query-array truth, unsupported request-semantic diagnostics, fail-closed exit behavior, and no secret leakage.
3. Prefer module-level or script-level verification over fragile single-file filters when invoking Gradle/Vitest from this worktree.

## Must-Haves

- [ ] Live proof retains ordered repeated query values and shows them as supported request truth in `yanote-report.json`.
- [ ] Live proof also demonstrates at least one unsupported request contract on the same public report/gate/CLI path without leaking sensitive header/cookie values.
- [ ] Retained verifier artifacts localize whether drift came from recorder capture, analyzer truth, or governance/CLI surfacing.

## Inputs

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s01-request-evidence.sh`
- `yanote-js/src/cli.ts`
- `yanote-js/src/report/report.ts`

## Expected Output

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s02-request-semantics.sh`

## Verification

- `bash scripts/ci/verify-m011-s02-request-semantics.sh`

## Observability Impact

- Signals added/changed: the retained proof bundle now captures supported query-array truth, unsupported request-semantic failures, and sanitized CLI failure output for one focused request.
- How a future agent inspects this: rerun `bash scripts/ci/verify-m011-s02-request-semantics.sh` and inspect the retained `events.jsonl`, `yanote-report.json`, stdout, and stderr artifacts.
- Failure state exposed: the proof bundle shows whether the break happened in recorder capture, report truth classification, or semantic-failure publication.
