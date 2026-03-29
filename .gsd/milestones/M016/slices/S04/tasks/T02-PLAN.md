---
estimated_steps: 25
estimated_files: 6
skills_used: []
---

# T02: Condense the recorder and tagging paths around one explicit evidence loop

## Description

Turn the recorder and test-tagging docs into short task-oriented guides that match the real Spring MVC and RestAssured/Cucumber contracts, then align the two leaf example READMEs to the same vocabulary and handoff.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Recorder guide vs runtime recorder proof | Keep the task red until the documented dependency, properties, and `events.jsonl` checks match the real recorder behavior | N/A | Reject docs that omit required properties or promise fields the recorder does not write |
| Tagging guide vs current RestAssured/Cucumber contract | Fail closed if `YANOTE_SUITE` is promoted into the shared contract or if the header -> JSONL -> report mapping drifts | N/A | Reject mixed wording where examples and canonical docs disagree on `yanote.suite`, `X-Test-Run-Id`, or `X-Test-Suite` |
| Leaf example READMEs | Keep the task red until the service and test examples backlink correctly and mirror the short canonical path | N/A | Reject leaf docs that force readers back into long proof narratives |

## Load Profile

- **Shared resources**: recorder/tagging guides, the two example leaf READMEs, and existing shell/runtime verifiers.
- **Per-operation cost**: static markdown plus one runtime recorder proof command.
- **10x breakpoint**: wording drift between canonical guides and leaf examples dominates before command cost matters.

## Negative Tests

- **Malformed inputs**: missing `yanote.recorder.events-path`, missing `X-Test-Run-Id` / `X-Test-Suite` mapping, or missing `coverage.perOperation[].suites` explanation.
- **Error paths**: `YANOTE_SUITE` is described as the shared library surface, or example docs name env/property/header values that no longer match the guides.
- **Boundary conditions**: recorder docs stay short and explicit, tagging docs preserve the true contract boundaries, and the leaf examples remain runnable companions instead of alternate canonical docs.

## Steps

1. Rewrite `docs/guides/recorder-spring-mvc.md` around one short loop: add dependency, set recorder properties/env, send a request, and prove `events.jsonl`.
2. Rewrite `docs/guides/test-tagging.md` around the header/property/dataflow loop and keep the Cucumber + RestAssured boundaries truthful and minimal.
3. Align `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` to the same property/env/header names and backlink structure.
4. Update the recorder/tagging doc verifiers to check the shorter structure and current contract surfaces (for example recorder guide <= 120 lines and tagging guide <= 140 lines) without pinning exact prose.

## Must-Haves

- [ ] The recorder guide names the dependency, required properties/env, and the `events.jsonl` proof check in one short runnable loop.
- [ ] The tagging guide names `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, and `coverage.perOperation[].suites`, while keeping `YANOTE_SUITE` demo-only.
- [ ] The service and RestAssured example READMEs mirror the canonical guide vocabulary and stay short.

## Inputs

- `docs/guides/getting-started.md`
- `docs/guides/recorder-spring-mvc.md`
- `docs/guides/test-tagging.md`
- `examples/springmvc-service/README.md`
- `examples/tests-restassured/README.md`
- `scripts/docs/verify-s01-doc-links.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s01-recorder-path.sh`

## Expected Output

- `docs/guides/recorder-spring-mvc.md`
- `docs/guides/test-tagging.md`
- `examples/springmvc-service/README.md`
- `examples/tests-restassured/README.md`
- `scripts/docs/verify-s01-doc-links.sh`
- `scripts/docs/verify-s02-doc-links.sh`

## Verification

bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh && bash scripts/docs/verify-s01-recorder-path.sh
