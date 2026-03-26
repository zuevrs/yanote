---
id: S04
parent: M013
milestone: M013
provides:
  - Truthful CI/uploaded artifact bundles that retain separate HTTP/async JSON+HTML outputs plus sanitized provenance and deprecated-operation metadata.
  - GitHub step summaries and branch-protection/workflow contract wording that expose the widened delivery surfaces without changing required job topology.
  - Public docs/support pages and shell verifiers that keep the local-first, remote-opt-in, separate-surface, no-dashboard boundary explicit.
  - The final validation proof needed to mark M013 requirement R024 complete and move the milestone to validation/closeout.
requires:
  - slice: S01
    provides: Supported local file, local directory, and sanitized remote single-document spec inputs with shared `specSource` provenance across CLI, Gradle, and retained reports.
  - slice: S02
    provides: Additive deprecated-operation reporting on the canonical HTTP JSON/CLI path without legacy coverage numerator drift.
  - slice: S03
    provides: Separate self-contained `yanote-report.html` and `yanote-async-report.html` artifacts plus retained static-HTML proof bundles derived from canonical report truth.
affects:
  []
key_files:
  - scripts/ci/collect-yanote-artifacts.sh
  - scripts/ci/export-async-proof-artifacts.sh
  - scripts/ci/run-v1-e2e.sh
  - scripts/ci/render-yanote-summary.mjs
  - .github/BRANCH_PROTECTION.md
  - README.md
  - docs/guides/analyzer-coverage.md
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - scripts/docs/verify-s04-boundaries.sh
key_decisions:
  - CI collectors, manifests, and GitHub step summaries now derive spec-source provenance and deprecated-operation facts from canonical report JSON instead of duplicating hand-maintained strings.
  - Success-path collectors/exporters fail closed when a required `yanote-report.html` or `yanote-async-report.html` sibling is missing, while failure bundles remain truthful and only omit HTML when the analyzer never produced it.
  - HTTP and async delivery surfaces stay explicitly separate across retained artifacts, step summaries, docs, and support wording; no combined report surface or dashboard was introduced.
  - The required-job topology remains stable (`build-and-test`, `yanote-validation`, with `v1-e2e` only on main/release hardening paths) even though the summary and artifact surfaces widened.
  - Public support wording is now pinned to the same local-file/directory baseline, narrow remote single-document `http(s)` opt-in path, sanitized provenance, additive deprecated semantics, and explicit no-dashboard/no-combined boundary.
patterns_established:
  - Use canonical report JSON plus collected artifact directories as the source of truth for CI manifests, source-path notes, and GitHub step summaries.
  - Retain and describe HTTP and async delivery artifacts as parallel but separate JSON+HTML families at every bundle, summary, and docs boundary.
  - Fail closed when required human-facing HTML siblings or literal support-boundary phrases disappear from success-path collectors, docs, or workflow contracts.
  - Treat `artifact-manifest.txt` / `artifact-source-paths.txt` and branch-protection wording as first-class diagnostic surfaces for delivery regressions.
observability_surfaces:
  - `build-and-test-artifacts` and `yanote-validation-artifacts` as the supported CI upload surfaces for separate HTTP/async JSON+HTML families.
  - `GITHUB_STEP_SUMMARY` output rendered by `scripts/ci/render-yanote-summary.mjs`, which now exposes sanitized `specSource`, deprecated counts, and explicit report artifact names.
  - `.yanote-ci/remote-spec-proof/artifact-manifest.txt` and `.yanote-ci/remote-spec-proof/artifact-source-paths.txt` for sanitized remote provenance and source tracking.
  - `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` for preserved legacy denominators plus additive deprecated-operation counts.
  - `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` for separate HTTP/async HTML proof, inline-only assets, and no combined/dashboard drift.
  - `.github/BRANCH_PROTECTION.md`, `README.md`, and `docs/release-and-support.md` as the authoritative human-readable support contract surfaces.
drill_down_paths:
  - .gsd/milestones/M013/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M013/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M013/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T04:11:04.102Z
blocker_discovered: false
---

# S04: CI, Docs, And Support Truth For Delivery Surfaces

**Existing CI, docs, and support surfaces now publish separate HTTP/async JSON+HTML delivery truth with sanitized provenance, additive deprecated-operation reporting, and explicit local-first/no-dashboard boundaries.**

## What Happened

T01 widened the retained delivery bundles so CI and focused proof exports keep the real operator-facing artifacts: the top-level HTTP collector now retains `yanote-report.json` plus sibling `yanote-report.html`, the async proof exporter now keeps happy-path/runtime-selected/schema-failure `yanote-async-report.html` siblings, and all widened manifests/source-path notes publish report-derived `specSource` plus deprecated-operation facts without leaking credentials. The retained `run-v1-e2e.sh` bundle metadata was extended to acknowledge the same JSON+HTML delivery truth and the real live/fixture provenance boundaries.

T02 then made GitHub-facing and workflow-facing contract surfaces tell the same story. `scripts/ci/render-yanote-summary.mjs` now renders sanitized remote provenance, additive deprecated-operation truth, and explicit JSON-vs-HTML artifact names for both HTTP and async bundles. `.github/BRANCH_PROTECTION.md` and the workflow contract suite keep the required-job IDs stable while documenting the widened summary/artifact behavior, and the small `run-yanote-gradle-check.sh` adjustment preserved the rooted Gradle parity path that the workflow contract already expected.

T03 aligned the public support story with the now-proven delivery surfaces. README, docs landing, examples landing, analyzer guide, async guide, and release/support docs all now describe the stable local file/directory baseline, narrow remote single-document `http(s)` `--spec` opt-in path with sanitized provenance, additive deprecated semantics, separate HTTP/async JSON+HTML report families, and the explicit no-dashboard/no-combined-report boundary. The shell verifiers were widened so wording drift fails closed.

For observability, I confirmed the retained proof surfaces that downstream slices should trust: `.yanote-ci/remote-spec-proof/artifact-manifest.txt` and `artifact-source-paths.txt` expose sanitized remote provenance; `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt` restates preserved legacy denominators plus additive deprecated counts; `.yanote-ci/static-html-reports-proof/artifact-manifest.txt` proves separate HTTP/async JSON+HTML artifacts, inline-only assets, and absent combined/dashboard drift; and `.github/BRANCH_PROTECTION.md` plus the public docs surfaces publish the same contract wording.

## Verification

Passed the slice verification stack exactly as planned: `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh`. Because this auto-mode unit forbids git commands, I substituted a targeted whitespace/conflict-marker scan across every S04-touched file for the planned `git diff --check` step. I also directly inspected the retained observability surfaces `.yanote-ci/remote-spec-proof/artifact-manifest.txt`, `.yanote-ci/remote-spec-proof/artifact-source-paths.txt`, `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`, `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`, `.github/BRANCH_PROTECTION.md`, `README.md`, and `docs/release-and-support.md` to confirm the manifests, summary contract, and public support wording all expose sanitized provenance, additive deprecated counts, separate HTTP/async JSON+HTML artifacts, and the explicit no-dashboard/no-combined-report boundary.

## Requirements Advanced

- R001 — Retained HTTP proof bundles, CI artifacts, and public docs now expose the widened HTTP delivery truth through explicit JSON+HTML artifact names, sanitized provenance, and supporting manifests without changing the canonical analyzer path.
- R002 — Collectors, exporters, workflow contracts, and doc verifiers now fail closed on missing HTML siblings, wording drift, or accidental overclaiming of unsupported delivery surfaces.
- R004 — Release/support and branch-protection surfaces now describe the widened artifact/report behavior honestly while preserving stable release/support boundaries.
- R005 — Async delivery remains a separate Kafka-first report family with explicit JSON+HTML artifacts and retained runtime-selected/schema-failure companions rather than any combined HTTP+async promise.
- R030 — Docs, verifiers, and retained proof manifests now restate the explicit no-dashboard/no-combined-report boundary instead of leaving it implicit.

## Requirements Validated

- R003 — `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` plus `.github/BRANCH_PROTECTION.md` proved the supported CLI/Gradle/CI delivery surfaces now publish truthful JSON+HTML artifacts, sanitized provenance, and deprecated-operation summaries while keeping the stable required-job topology.
- R024 — `node --test scripts/ci/collect-yanote-artifacts.test.mjs scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/render-yanote-summary.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, and `bash scripts/docs/verify-s04-boundaries.sh` together proved supported remote spec loading, additive deprecated-operation truth, separate static HTTP/async HTML artifacts, and aligned CI/docs/support surfaces without combined-report or dashboard drift.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Did not run `git diff --check` because this auto-mode unit explicitly forbids git commands; instead I ran a targeted whitespace/conflict-marker scan across every S04-touched surface. I also made a behavior-preserving helper adjustment in `scripts/ci/run-yanote-gradle-check.sh` so the existing workflow contract suite could verify the rooted `./gradlew ... yanoteCheck|yanoteReport` execution path without changing job topology.

## Known Limitations

Supported spec loading remains local-file/local-directory first, with remote loading limited to sanitized single-document `http(s)` URLs. HTTP and async reports remain separate surfaces, and combined-report or dashboard UI work is still intentionally out of scope.

## Follow-ups

Milestone validation should rerun the integrated M013 proof stack and treat the updated CI bundles, GitHub summaries, retained manifests, and public docs/support wording as the authoritative delivery boundary for remote-spec, deprecated-operation, and static-HTML support.

## Files Created/Modified

- `scripts/ci/collect-yanote-artifacts.sh` — Retains top-level HTTP JSON+HTML artifacts and report-derived delivery metadata in the CI collector bundle.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — Pins widened HTTP collector bundle layout, manifests, and source-path assertions.
- `scripts/ci/export-async-proof-artifacts.sh` — Exports async happy-path/runtime-selected/schema-failure HTML siblings and fails closed when success HTML artifacts are missing.
- `scripts/ci/export-async-proof-artifacts.test.mjs` — Verifies widened async bundle layout, metadata, and missing-HTML fail-closed behavior.
- `scripts/ci/run-v1-e2e.sh` — Widens retained v1 proof bundle metadata to acknowledge HTML siblings plus spec-source and deprecated-operation facts.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — Locks the retained v1 bundle JSON+HTML layout and delivery metadata contract.
- `scripts/ci/verify-m004-s03-live-kafka-proof.sh` — Feeds the async proof exporter the new HTML artifacts on successful live Kafka proof runs.
- `scripts/ci/render-yanote-summary.mjs` — Publishes sanitized provenance, deprecated counts, and explicit HTTP/async artifact names in GitHub step summaries.
- `scripts/ci/render-yanote-summary.test.mjs` — Pins summary wording, ordering, artifact lines, and secret-safe remote provenance behavior.
- `.github/BRANCH_PROTECTION.md` — Documents the stable required job names together with the widened artifact and summary surfaces.
- `scripts/ci/yanote-ci-workflow.contract.test.mjs` — Enforces the stable workflow topology and updated branch-protection wording in the contract suite.
- `scripts/ci/run-yanote-gradle-check.sh` — Materializes literal rooted `./gradlew` yanote tasks for workflow-contract parity without changing runtime behavior.
- `README.md` — Publishes the local-first spec-loading boundary, separate HTTP/async JSON+HTML artifacts, deprecated truth, and no-dashboard wording on the repo landing page.
- `docs/README.md` — Aligns the docs landing page to the widened delivery/support surfaces and retained proof bundles.
- `examples/README.md` — Points example workflows at the separate HTTP/async artifact families and the same local-first/remote-opt-in boundary.
- `docs/guides/analyzer-coverage.md` — Explains sanitized remote `--spec`, additive deprecated semantics, and retained HTTP JSON+HTML proof surfaces in the analyzer guide.
- `docs/guides/asyncapi-kafka.md` — Explains separate async JSON+HTML artifacts and retained companion bundles without combined-report claims.
- `docs/release-and-support.md` — Publishes the authoritative local-first / remote-opt-in / separate-surface / no-dashboard support contract.
- `scripts/docs/verify-s03-landing.sh` — Fails closed when landing pages drift away from widened HTML/report/support wording.
- `scripts/docs/verify-s04-boundaries.sh` — Fails closed when support-boundary, CI-bundle, or no-dashboard wording drifts.
