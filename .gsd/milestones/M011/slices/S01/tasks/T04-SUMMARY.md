---
id: T04
parent: S01
milestone: M011
key_files:
  - examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java
  - examples/openapi/request-evidence-openapi.yaml
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java
  - scripts/ci/verify-m011-s01-request-evidence.sh
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Use a separate focused OpenAPI proof route and verifier instead of widening the existing `run-v1-e2e.sh` happy-path bundle.
  - Use TCP-port readiness checks for focused live-proof scripts/tests so recorder artifacts contain only declared proof traffic and not undeclared readiness requests.
duration: ""
verification_result: passed
completed_at: 2026-03-25T15:15:57.603Z
blocker_discovered: false
---

# T04: Add a focused Spring MVC request-evidence proof route, live RestAssured check, and end-to-end verifier

**Add a focused Spring MVC request-evidence proof route, live RestAssured check, and end-to-end verifier**

## What Happened

I added a focused `GET /request-evidence/users/{userId}` proof route to the Spring MVC example service plus a matching `examples/openapi/request-evidence-openapi.yaml` contract that exercises one supported path scalar (`userId`), one supported query scalar (`expand`), one intentionally omitted oversized query input (`oversizedHint`), one supported request header scalar (`X-Request-Flavor`), one intentionally redacted request header (`Authorization`), one supported cookie scalar (`clientMode`), and one intentionally redacted cookie (`SESSION`). The route returns only safe echoed booleans/lengths for the sensitive and oversized inputs so the live runtime exercises the real capture path without leaking secrets in the HTTP response.

I added `HttpRequestEvidenceE2eTest` as an isolated RestAssured/JUnit proof that hits the live focused route with Yanote run/suite metadata, asserts the safe response payload, then reads the raw `events.jsonl` line and verifies the retained recorder shape directly. The test proves captured/redacted/omitted path/query/header/cookie evidence on the same real request and explicitly asserts that sensitive header/cookie values do not appear in the recorder artifact and that Yanote test-metadata headers are excluded from semantic request-header evidence.

I added `scripts/ci/verify-m011-s01-request-evidence.sh` as the slice’s focused end-to-end verifier. The script builds the boot jar and analyzer, starts the example service, reruns only the focused RestAssured proof against a fresh `events.jsonl`, re-validates the raw recorder artifact in Python for failure localization, runs `yanote report` against the focused OpenAPI contract, and asserts the retained `yanote-report.json` request-conformance summaries/diagnostics and redaction discipline. It retains build/app/test/report paths on failure so later agents can localize drift quickly.

While stabilizing the proof, I found that HTTP readiness probes were being recorded and turning the focused report `partial` via unmatched `/health` diagnostics even though the proof route itself was correct. I fixed that by switching both the verifier script and the JUnit preflight from recorded HTTP readiness calls to TCP-port readiness checks, keeping the focused proof bundle honest and leaving the existing `run-v1-e2e.sh` happy-path boundary untouched.

## Verification

Verified the Java recorder/core slice gate with `./gradlew :yanote-core:test --tests "dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest" :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest"` after prebuilding test classes so the Gradle filters resolved cleanly. Verified the Node request-evidence/report/CLI slice gate with `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts`, which passed all six focused Vitest files. Verified the new live proof path end to end with `./scripts/ci/verify-m011-s01-request-evidence.sh`, which built the focused assets, started the example service, exercised the real Spring MVC route, checked raw `events.jsonl`, ran `yanote report`, and confirmed request-conformance counts plus redaction/omission behavior on retained artifacts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./gradlew :yanote-core:test --tests "dev.yanote.core.events.HttpEventRequestEvidenceJsonlRoundTripTest" :yanote-recorder-spring-mvc:test --tests "dev.yanote.recorder.springmvc.HttpRequestEvidenceCaptureTest"` | 0 | ✅ pass | 1650ms |
| 2 | `npm -C yanote-js test -- src/events/readJsonl.requestEvidence.test.ts src/spec/openapi.test.ts src/coverage/httpRequestConformance.test.ts src/report/report.requestEvidence.contract.test.ts src/cli.requestEvidence.test.ts src/cli.summary.contract.test.ts` | 0 | ✅ pass | 1445ms |
| 3 | `./scripts/ci/verify-m011-s01-request-evidence.sh` | 0 | ✅ pass | 28902ms |


## Deviations

I replaced HTTP `/health` readiness probes with TCP-port readiness checks in both the JUnit proof and the verifier script after the first live run showed that recorded readiness traffic was polluting the focused spec bundle with unmatched diagnostics and forcing `yanote report` to `partial` despite a correct proof route. I also wired the verifier’s temporary Gradle home to the existing local Gradle caches so the isolated script remained stable when plugin resolution was unavailable through the fresh temp home alone.

## Known Issues

None.

## Files Created/Modified

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `scripts/ci/verify-m011-s01-request-evidence.sh`
- `.gsd/KNOWLEDGE.md`
