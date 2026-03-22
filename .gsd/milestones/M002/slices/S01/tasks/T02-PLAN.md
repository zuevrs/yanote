---
estimated_steps: 4
estimated_files: 3
---

# T02: Write the canonical Spring recorder guide and align example docs

**Slice:** S01 — Verified Recorder Integration Path
**Milestone:** M002

## Description

Turn the proven recorder path into one short Russian-first guide and keep the example docs aligned with the same config, retrieval, and metadata contract so users do not have to reverse-engineer adoption from tests.

## Steps

1. Create `docs/guides/recorder-spring-mvc.md` with the recommended dependency-based integration path and the exact recorder properties users must set.
2. Document evidence retrieval with a real request flow, `test -s` non-empty verification, sample JSONL inspection, and writable/exportable path guidance for local, container, and CI environments.
3. Add a short metadata callout covering `X-Test-Run-Id`, `X-Test-Suite`, and the current `yanote.suite`/RestAssured handoff without spilling into S02's deeper analysis guidance.
4. Add guide links to the example docs and flatDir fallback, then update `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` so they point back to the guide and stop introducing conflicting setup language.

## Must-Haves

- [ ] The guide leads with the dependency-based path and the exact property names `yanote.recorder.enabled`, `yanote.recorder.events-path`, and optional `yanote.recorder.service-name`.
- [ ] The guide tells users how to prove `events.jsonl` is non-empty and inspect the captured JSONL fields before moving to analysis.
- [ ] The example docs describe metadata/header behavior truthfully, including `null` when headers are absent and the `yanote.suite` handoff used by current test-tagging surfaces.

## Verification

- `bash scripts/docs/verify-s01-recorder-path.sh`
- `rg -n "yanote\.recorder\.enabled|yanote\.recorder\.events-path|X-Test-Run-Id|X-Test-Suite|yanote\.suite|test -s|flatdir-recorder" docs/guides/recorder-spring-mvc.md examples/springmvc-service/README.md examples/tests-restassured/README.md`

## Observability Impact

- Signals added/changed: none at runtime; the docs now expose the stable commands and JSONL fields a future agent should inspect first.
- How a future agent inspects this: open `docs/guides/recorder-spring-mvc.md` and rerun `bash scripts/docs/verify-s01-recorder-path.sh`.
- Failure state exposed: documentation drift becomes visible as missing property/header/path references or a guide that no longer matches the executable proof.

## Inputs

- `scripts/docs/verify-s01-recorder-path.sh` — verified command surface created in T01.
- `examples/springmvc-service/README.md` — current service walkthrough that must align to the canonical guide.
- `examples/tests-restassured/README.md` — current test-tagging example surface that must stay truthful about metadata propagation.

## Expected Output

- `docs/guides/recorder-spring-mvc.md` — authoritative user-facing recorder integration guide.
- `examples/springmvc-service/README.md` — example service doc aligned to the guide.
- `examples/tests-restassured/README.md` — example metadata/test doc aligned to the guide.
