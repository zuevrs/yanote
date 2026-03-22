---
estimated_steps: 4
estimated_files: 3
---

# T03: Wire root and fallback docs to the canonical recorder path

**Slice:** S01 — Verified Recorder Integration Path
**Milestone:** M002

## Description

Make the verified recorder guide discoverable from the repository entry surfaces and protect the recommended-vs-fallback boundary with a lightweight doc contract script that future agents can rerun before editing onboarding docs.

## Steps

1. Update `README.md` to point to the canonical guide as the recommended recorder setup path and to name the verified journey stages consistently.
2. Update `dist/flatdir-recorder/README.md` to label the bundle as smoke/offline-only, explain when it is still useful, and link back to the primary guide.
3. Add `scripts/docs/verify-s01-doc-links.sh` to assert that the root README, canonical guide, example docs, and flatDir README all reference each other correctly and preserve the fallback warning language.
4. Run the doc contract script and fix any broken paths or missing warning text until it passes.

## Must-Haves

- [ ] The root README links to the S01 guide as the canonical recorder setup path.
- [ ] The flatDir README no longer reads like the main product story and explicitly links back to the dependency-based guide.
- [ ] The doc contract script fails closed on missing files, missing links, or missing smoke/offline boundary wording.

## Verification

- `bash scripts/docs/verify-s01-doc-links.sh`
- `rg -n "recorder-spring-mvc|smoke|offline" README.md dist/flatdir-recorder/README.md docs/guides/recorder-spring-mvc.md`

## Observability Impact

- Signals added/changed: stable doc-contract failures that pinpoint the missing link or boundary phrase.
- How a future agent inspects this: run `bash scripts/docs/verify-s01-doc-links.sh` before editing recorder onboarding docs.
- Failure state exposed: broken navigation, missing fallback warnings, or mismatched guide references.

## Inputs

- `docs/guides/recorder-spring-mvc.md` — canonical guide produced in T02.
- `README.md` — root entry surface that must advertise the verified path.
- `dist/flatdir-recorder/README.md` — fallback surface that must be explicitly demoted.

## Expected Output

- `README.md` — root landing updated to link the canonical recorder guide.
- `dist/flatdir-recorder/README.md` — fallback doc with explicit smoke/offline positioning.
- `scripts/docs/verify-s01-doc-links.sh` — durable doc wiring check for S01 surfaces.
