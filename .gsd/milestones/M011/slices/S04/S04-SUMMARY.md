---
id: S04
parent: M011
milestone: M011
provides:
  - A standard `.yanote-ci/v1-e2e/` bundle that includes additive request-semantics proof sidecars plus provenance notes.
  - One consistent public wording set across README/docs/examples/release surfaces for the supported request serialization, cookie, media, and format boundary.
  - Verifier-enforced publication of `httpRequestConformance`, `declaredSupport*`, request `YANOTE_SUMMARY` tokens, `email`-only payload formats, and most-specific media matching.
requires:
  - slice: S01
    provides: Additive retained HTTP request evidence plus first-scalar `httpRequestConformance` truth on the Spring MVC recorder → JSONL → analyzer path.
  - slice: S02
    provides: The supported request-serialization contract (`declaredSupport*`, request `YANOTE_SUMMARY` tokens, fail-closed request semantic codes) and the focused request-semantics verifier.
  - slice: S03
    provides: The payload-format allowlist, most-specific media matching behavior, and the focused format/media verifier that backs the public docs.
affects:
  []
key_files:
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/run-v1-e2e.contract.test.mjs
  - scripts/ci/collect-yanote-artifacts.test.mjs
  - docs/guides/analyzer-coverage.md
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/release-and-support.md
  - scripts/docs/verify-s02-doc-links.sh
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s04-boundaries.sh
  - examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java
key_decisions:
  - Derived the public request-semantics proof from filtered retained live `events.jsonl` instead of introducing a second runtime harness.
  - Kept the widened public bundle additive by publishing request-semantics sidecars plus manifest/source-path notes beside the stable happy-path and semantic-red artifacts.
  - Left the deeper request and format/media matrices on the focused `verify-m011-s02-request-semantics.sh` and `verify-m011-s03-format-media.sh` proof commands while making docs and CI point to them explicitly.
  - Reused the shared Gradle home across host prebuild and compose/container execution so the public proof entrypoint stays stable under flaky external dependency resolution.
patterns_established:
  - Widen public proof coverage by replaying filtered retained evidence from the canonical live bundle, not by inventing a parallel runtime harness.
  - Ship retained proof bundles with both an artifact manifest and source-path notes so drift can be localized quickly.
  - Back every public support-boundary sentence with exact-string verifier coverage so docs, CI scripts, and retained artifacts cannot silently diverge.
observability_surfaces:
  - `.yanote-ci/v1-e2e/artifact-manifest.txt` and `.yanote-ci/v1-e2e/artifact-source-paths.txt` for bundle inventory and provenance.
  - `.yanote-ci/v1-e2e/request-semantics.stdout` / `.stderr` / `request-semantics-yanote-report.json` for retained request-sidecar truth.
  - `bash scripts/ci/run-v1-e2e.sh` for the public retained bundle path.
  - `bash scripts/ci/verify-m011-s02-request-semantics.sh` and `bash scripts/ci/verify-m011-s03-format-media.sh` for authoritative deep request/payload proofs.
  - `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` for public wording drift detection.
drill_down_paths:
  - .gsd/milestones/M011/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T19:50:07.130Z
blocker_discovered: false
---

# S04: Public Contract Closeout For HTTP Semantics

**Closed M011’s public HTTP semantics contract by shipping additive request-semantics proof sidecars, exact support-boundary docs, and verifier-enforced CI/report surfaces through the standard Yanote entrypoints.**

## What Happened

S04 finished the M011 closeout work in two coordinated tracks. First, the public `bash scripts/ci/run-v1-e2e.sh` bundle was widened additively instead of spawning a second runtime harness: it now replays a filtered `/request-evidence/users/{userId}` subset from the retained live `.yanote-ci/v1-e2e/events.jsonl`, writes `request-semantics.events.jsonl`, `request-semantics.stdout`, `request-semantics.stderr`, and `request-semantics-yanote-report.json`, and records `artifact-manifest.txt` plus `artifact-source-paths.txt` so downstream readers can tell which artifacts came from live compose capture versus host-side analyzer reruns. The Node contract tests were updated to pin that bundle shape, the source-note wording, and the expected fail-closed `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` outcome while keeping stdout/stderr secret-safe.

Second, the public docs and doc verifiers were rewritten so every standard surface tells the same truthful boundary story. `docs/guides/analyzer-coverage.md` now publishes the exact supported request subset (`path=simple`, `query=form`, `header=simple`, `cookie=form`, repeated arrays only for `query=form` + `explode=true` + scalar `items`), the additive `httpRequestConformance` / `declaredSupport*` / request `YANOTE_SUMMARY` tokens, the `email`-only payload format allowlist, and most-specific media matching. That wording was propagated to the root landing docs, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`, while `verify-s02-doc-links.sh`, `verify-s03-landing.sh`, and `verify-s04-boundaries.sh` were tightened to exact-string check the retained bundle names, focused proof commands, and published support boundary. Together with the focused S02/S03 proof scripts, the standard CI/report/docs path now exposes one stable, additive, fail-closed public HTTP semantics contract for M011.

## Verification

Passed all slice-level verification from the plan:
- `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/ci/run-v1-e2e.sh`
- `bash scripts/ci/verify-m011-s02-request-semantics.sh`
- `bash scripts/ci/verify-m011-s03-format-media.sh`
- `git diff --check`

Observability surfaces were also confirmed live after the bundle run: `.yanote-ci/v1-e2e/artifact-manifest.txt` and `.yanote-ci/v1-e2e/artifact-source-paths.txt` both existed and described the request sidecars; `request-semantics.stdout` published `HTTP Request Conformance`, request `YANOTE_SUMMARY` tokens, and the typed primary semantic failure; `request-semantics.stderr` surfaced `YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` without leaking retained values or secrets.

## Requirements Advanced

- R003 — Kept the widened HTTP semantics visible through the same existing CLI/report/docs/CI entrypoints instead of requiring a new delivery surface.
- R022 — Closed the public contract side of supported request serialization, cookie, media, and format semantics with retained bundle artifacts, exact docs, and stable summary/report tokens.

## Requirements Validated

- R022 — `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/ci/run-v1-e2e.sh`, `bash scripts/ci/verify-m011-s02-request-semantics.sh`, and `bash scripts/ci/verify-m011-s03-format-media.sh` all passed, proving the additive request sidecar, published request/payload subset, fail-closed request/payload codes, request `YANOTE_SUMMARY`/`declaredSupport*` surfaces, `email`-only formats, and most-specific media matching end to end.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None within the published M011 boundary. Cold-start `docker compose up` without the host prebuild path and broader unsupported OpenAPI request/payload constructs remain explicitly out of scope rather than implied by this slice.

## Follow-ups

None.

## Files Created/Modified

- `scripts/ci/run-v1-e2e.sh` — Added request-semantics sidecar generation from filtered retained events, secret-safe stdout/stderr checks, and bundle manifest/source-path note output.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — Pinned the widened v1 bundle contract, request-sidecar artifact names, provenance-note wording, and fail-closed request semantic exit behavior.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — Locked the collector contract around manifest/source-path note preservation and request-sidecar inventory copying.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java` — Exposed the focused request-evidence proof path consumed by the retained public bundle and request-semantics verification flow.
- `docs/guides/analyzer-coverage.md` — Rewrote the analyzer guide in Russian-first form to publish the exact supported request subset, additive request/payload surfaces, proof bundle artifacts, and focused proof commands.
- `README.md` — Updated the root landing path to describe `HTTP Request Conformance`, request-sidecar artifacts, request `YANOTE_SUMMARY` tokens, and the supported request/payload boundary.
- `docs/README.md` — Aligned the docs landing page with the analyzer guide, supported subset wording, and retained proof commands.
- `examples/README.md` — Documented the widened public demo bundle, additive request sidecars, and the split between public bundle proof and focused deep verifiers.
- `docs/release-and-support.md` — Published the final release/support contract for the widened HTTP request/payload surfaces, retained artifacts, and supported subset wording.
- `scripts/docs/verify-s02-doc-links.sh` — Tightened analyzer-guide verification around request-sidecar artifacts, focused proof commands, and request/payload support-boundary wording.
- `scripts/docs/verify-s03-landing.sh` — Tightened root/docs/examples landing verification around request-sidecar artifacts, subset wording, and request/payload proof references.
- `scripts/docs/verify-s04-boundaries.sh` — Added final boundary checks for release/support wording, request-sidecar publication, and the exact supported request/payload subset.
- `.gsd/REQUIREMENTS.md` — Marked R022 validated with the full S04 proof stack.
- `.gsd/PROJECT.md` — Refreshed project state to show M011 slice-level closeout and the widened public HTTP semantics boundary as implemented.
- `.gsd/KNOWLEDGE.md` — Recorded the retained-bundle manifest/source-note pattern for future drift diagnosis.
