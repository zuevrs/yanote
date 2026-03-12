---
id: T02
parent: S04
milestone: M002
provides:
  - `docs/release-and-support.md` now answers the public release/support questions with the current stable line, latest stable tag, GitHub Releases surface, published modules, compatibility baselines, limitations, and fallback boundaries.
  - `scripts/docs/verify-s04-boundaries.sh` now guards the richer S04 contract so content drift is caught separately from the still-missing README/docs landing pointers.
key_files:
  - docs/release-and-support.md
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/DECISIONS.md
key_decisions:
  - Treat `docs/release-and-support.md` as the machine-checked owner for stable module/plugin, compatibility, limitation, and fallback-boundary wording, not only for the current release line.
  - Keep the only expected S04 failure after T02 limited to the missing `README.md` and `docs/README.md` discoverability pointers owned by T03.
patterns_established:
  - Documentation boundary verifiers can lock richer public-product clauses while still tolerating known downstream pointer gaps as the only expected partial failure.
observability_surfaces:
  - bash scripts/docs/verify-s04-boundaries.sh
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/docs/verify-s01-doc-links.sh
  - bash scripts/docs/verify-s02-doc-links.sh
duration: 30m
verification_result: passed
completed_at: 2026-03-13 00:55:20 +0300
blocker_discovered: false
---

# T02: Publish the authoritative release and support reference

**Turned `docs/release-and-support.md` into the authoritative public release/support reference and expanded the S04 verifier to protect the full boundary contract.**

## What Happened

Reworked `docs/release-and-support.md` from the T01 skeleton into a fuller Russian-first owner document. It now states the current public release line `v1.0.x`, the latest stable tag `v1.0.122`, and GitHub Releases as the published change surface; explains why repository `HEAD` may be ahead without being a new release; and makes the tag-driven workflow boundary explicit so `gradle.properties` `0.1.0-SNAPSHOT` is clearly demoted to a workspace marker.

Expanded the stable-surface section so a visitor can see the real published allowlist in one place: `yanote-core`, `yanote-recorder-spring-mvc`, `yanote-test-tags-restassured`, `yanote-test-tags-cucumber`, and `yanote-gradle-plugin`, plus the locked Gradle plugin id `io.github.zuevrs.yanote.gradle`, task names `yanoteReport` / `yanoteCheck`, report schema `1.0.0`, the verified Spring Boot 3.x / Spring MVC recorder path, and the primary source-built analyzer path versus the secondary offline bundle.

Tightened the compatibility, limitation, and fallback wording so the doc now says plainly that Java 21 is the verified baseline, Node `>=20` is the minimum analyzer runtime while `.nvmrc` pins repo/dev work to `22`, the product remains Java-first today, there is no first-class non-Java onboarding yet, and there is still no runnable Cucumber demo in the repository.

Extended `scripts/docs/verify-s04-boundaries.sh` to enforce those richer clauses directly. The S04 verifier now checks for the published modules, plugin contract, schema version, runtime baselines, recorder path, fallback bundles, and the explicit non-Java/Cucumber limitations in addition to the release-line and non-authoritative-version-source wording from T01.

Re-ran the verifiers after the update. S04 still fails only on the two expected T03-owned landing pointers in `README.md` and `docs/README.md`; the S03, S01, and S02 documentation contracts continue to pass unchanged.

Recorded the verifier-scope decision in `.gsd/DECISIONS.md` so downstream tasks know the public boundary doc is now protected as a broader support-envelope contract, not just a version note.

## Verification

- `bash -n scripts/docs/verify-s04-boundaries.sh` — passed
- `git diff --check` — passed
- `bash scripts/docs/verify-s04-boundaries.sh` — expected partial failure, localized to:
  - `README.md` missing `docs/release-and-support.md`
  - `docs/README.md` missing `release-and-support.md`
- `bash scripts/docs/verify-s03-landing.sh` — passed
- `bash scripts/docs/verify-s01-doc-links.sh` — passed
- `bash scripts/docs/verify-s02-doc-links.sh` — passed

## Diagnostics

Run `bash scripts/docs/verify-s04-boundaries.sh` first when touching `docs/release-and-support.md`. It prints the resolved latest stable tag, expected release line, GitHub Releases URL, and `HEAD` vs latest-tag relation before naming the exact missing clause.

If S04 fails while `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, and `bash scripts/docs/verify-s02-doc-links.sh` still pass, the regression is local to the release/support owner surface rather than the broader landing or guide contracts.

## Deviations

None.

## Known Issues

- `README.md` and `docs/README.md` still do not link to `docs/release-and-support.md`, so `bash scripts/docs/verify-s04-boundaries.sh` continues to fail on those two targeted T03-owned discoverability clauses.

## Files Created/Modified

- `docs/release-and-support.md` — expanded the public release/support owner doc with authoritative release visibility, published surfaces, compatibility expectations, limitations, and fallback boundaries.
- `scripts/docs/verify-s04-boundaries.sh` — extended the S04 verifier to assert the richer stable-surface and support-envelope clauses introduced by T02.
- `.gsd/DECISIONS.md` — recorded that the S04 owner doc is now a machine-checked boundary for support-envelope wording, not only version wording.
- `.gsd/milestones/M002/slices/S04/S04-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced the slice state to T03.
