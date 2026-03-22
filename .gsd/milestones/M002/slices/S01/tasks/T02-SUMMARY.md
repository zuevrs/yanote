---
id: T02
parent: S01
milestone: M002
provides:
  - "Russian-first canonical Spring MVC recorder guide with the verified dependency-based setup, writable path guidance, and request-to-JSONL proof flow."
  - "Aligned example READMEs that defer setup to the canonical guide and describe current metadata propagation truthfully."
key_files:
  - docs/guides/recorder-spring-mvc.md
  - examples/springmvc-service/README.md
  - examples/tests-restassured/README.md
key_decisions:
  - "Made `docs/guides/recorder-spring-mvc.md` the single authoritative setup surface; example READMEs now point back to it instead of restating competing integration instructions."
patterns_established:
  - "Recorder docs should prove capture before analysis: real request, `test -s` non-empty check, then inspect JSONL fields."
  - "Example docs should describe only their local role and link back to the canonical guide for recorder setup and fallback paths."
observability_surfaces:
  - "`docs/guides/recorder-spring-mvc.md` documents the first-line inspection flow, while `scripts/docs/verify-s01-recorder-path.sh` remains the executable proof surface."
duration: 30m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T02: Write the canonical Spring recorder guide and align example docs

**Added the canonical Spring recorder guide and aligned both example READMEs to the same property names, proof flow, and metadata contract.**

## What Happened

I created `docs/guides/recorder-spring-mvc.md` as the Russian-first authoritative guide for the verified dependency-based Spring MVC recorder path. The guide now leads with the normal dependency integration path, the exact recorder properties (`yanote.recorder.enabled`, `yanote.recorder.events-path`, optional `yanote.recorder.service-name`), writable/exportable path guidance for local, container, and CI environments, and a concrete proof sequence of real request → `test -s` → first JSONL line inspection.

I also added a short metadata section that documents the current header contract truthfully: `X-Test-Run-Id` maps to `test.run_id`, `X-Test-Suite` maps to `test.suite`, and missing headers still produce present keys with `null` values. The guide now points readers to the runnable service example, the RestAssured handoff example, and the `flatDir` smoke/offline fallback.

Then I rewrote the example READMEs so they stop acting like alternative setup guides:

- `examples/springmvc-service/README.md` now states that the canonical setup lives in the guide, shows the same three recorder properties, keeps a minimal request/`test -s` verification flow, and explains that missing test headers produce `null` metadata.
- `examples/tests-restassured/README.md` now focuses on the current metadata handoff only: `YANOTE_RUN_ID`, `YANOTE_SUITE`, the `yanote.suite` system-property handoff surface, and how those values become request headers and then JSONL fields.

## Verification

- `bash scripts/docs/verify-s01-recorder-path.sh` ✅
  - passed with `method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`
- `rg -n "yanote\.recorder\.enabled|yanote\.recorder\.events-path|X-Test-Run-Id|X-Test-Suite|yanote\.suite|test -s|flatdir-recorder" docs/guides/recorder-spring-mvc.md examples/springmvc-service/README.md examples/tests-restassured/README.md` ✅
- `rg -n "yanote\.recorder\.service-name" docs/guides/recorder-spring-mvc.md examples/springmvc-service/README.md` ✅
- `bash scripts/docs/verify-s01-doc-links.sh` ❌ expected pending slice work
  - script is still absent in this task window and remains planned for T03

## Diagnostics

Future agents can inspect the documentation contract in `docs/guides/recorder-spring-mvc.md` first, then rerun `bash scripts/docs/verify-s01-recorder-path.sh` to validate that the guide still matches the executable proof path.

The example docs now make the metadata path inspectable without reading test code first:

- `examples/springmvc-service/README.md` shows the same recorder property names and the non-empty file check.
- `examples/tests-restassured/README.md` explains the current `YANOTE_SUITE` → `yanote.suite` → request-header handoff and the resulting JSONL fields.

## Deviations

None.

## Known Issues

- `scripts/docs/verify-s01-doc-links.sh` does not exist yet, so the second slice-level verification check is still pending for T03 as planned.

## Files Created/Modified

- `docs/guides/recorder-spring-mvc.md` — canonical Russian-first guide for dependency-based Spring MVC recorder integration, proof, metadata, and fallback links.
- `examples/springmvc-service/README.md` — aligned service example doc that now defers setup to the guide and documents truthful null-metadata behavior.
- `examples/tests-restassured/README.md` — aligned metadata example doc that now explains the current `yanote.suite` handoff without restating recorder setup.
- `.gsd/milestones/M002/slices/S01/S01-PLAN.md` — marked T02 complete.
