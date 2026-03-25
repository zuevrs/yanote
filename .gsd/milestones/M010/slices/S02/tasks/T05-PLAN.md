---
estimated_steps: 5
estimated_files: 5
skills_used:
  - bash-scripting
  - java-junit
  - openapi-specification-v3.2
  - debug-like-expert
---

# T05: Refresh live proof scripts for green and red HTTP core paths

**Slice:** S02 — HTTP Core Contract Completeness In Report And Gates
**Milestone:** M010

## Description

Close the slice against real behavior. The retained proof stack must keep `DemoServiceE2eTest` green while separately proving that the `/evidence/users/{id}` path now fails closed for undeclared status, supported parameter drift, and response-header drift with retained artifacts that make failures obvious.

## Steps

1. Update `scripts/docs/verify-s02-analysis-path.sh` so the green demo path excludes or splits the intentionally red `/evidence/users/{id}` route instead of silently letting it pollute the happy-path denominator.
2. Refresh stale fixture/event assertions inside the verifier to the S01 value-evidence shape and add explicit checks for the new HTTP core report and CLI surfaces.
3. Adjust `DemoServiceE2eTest` and `HttpEvidenceDepthE2eTest` only as needed to keep the green path and red path explicit and reproducible.
4. Update `scripts/ci/run-v1-e2e.sh` so CI continues to assert the retained semantic red path once the new drift codes are wired.
5. Re-run the live verifier stack and keep the retained artifact paths/high-signal failure messaging intact.

## Must-Haves

- [ ] The happy-path verifier still proves a green supported HTTP baseline even though the shared demo spec contains an intentionally red evidence route.
- [ ] The retained red path asserts undeclared-status, parameter-value, and response-header drift through real `yanote report` output and CLI stderr.
- [ ] Verifier artifacts clearly distinguish denominator contamination from real semantic drift failures.

## Verification

- `bash scripts/docs/verify-s02-analysis-path.sh`
- `bash scripts/ci/run-v1-e2e.sh`

## Observability Impact

- Signals added/changed: retained proof artifacts now include HTTP core conformance report/CLI assertions for both green and red paths.
- How a future agent inspects this: inspect the temp directory printed by `verify-s02-analysis-path.sh`, the retained `yanote-report.json`, and the captured stdout/stderr files when verification fails.
- Failure state exposed: green-path denominator drift, stale fixture shape, and semantic HTTP core failures are separated into explicit artifact assertions instead of one opaque verifier failure.

## Inputs

- `scripts/docs/verify-s02-analysis-path.sh` — current retained HTTP proof verifier with stale happy-path assumptions.
- `scripts/ci/run-v1-e2e.sh` — current CI proof wrapper that still expects the old semantic surface.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — green example traffic source used by the verifier.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java` — intentionally red evidence path introduced in S01.
- `examples/openapi/demo-openapi.yaml` — shared demo spec whose `/evidence/users/{id}` route must no longer contaminate the green denominator.
- `yanote-js/src/cli.ts` — final CLI surface from T04 that the verifier must assert.

## Expected Output

- `scripts/docs/verify-s02-analysis-path.sh` — live verifier updated for separate green/red HTTP core proof paths and new report/CLI assertions.
- `scripts/ci/run-v1-e2e.sh` — CI proof wrapper aligned with the new HTTP core semantics.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — green proof traffic kept explicit and reproducible.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpEvidenceDepthE2eTest.java` — red proof traffic and evidence expectations kept aligned with S02 semantics.
- `examples/openapi/demo-openapi.yaml` — demo contract left truthful for both the green baseline and the intentionally red evidence path.
