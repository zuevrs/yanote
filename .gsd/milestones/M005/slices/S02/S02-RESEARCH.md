# M005/S02 — Research

**Date:** 2026-03-14

## Requirement Focus

- **Owns:** `R048` — CI-ready end-to-end async proof and release-grade trust surface.
- **Supports:** `R047` — S01 already validated the public async boundary; S02 must compose that validated contract into the final acceptance runner and CI-visible diagnostics so the public story and the proof chain do not drift apart.

## Summary

S02 is not blocked on missing async runtime capability. The repository already has the real async proof stack: `yanote async-report` is a separate CLI/report/gate surface with deterministic `yanote-async-report.json`, ordered `YANOTE_ASYNC_ERROR*` stderr lines, and one final `YANOTE_ASYNC_SUMMARY` stdout line; `scripts/ci/verify-m004-s02-metadata-propagation.sh` already proves the authoritative single-service HTTP → Kafka → Kafka republish path; and `scripts/ci/verify-m004-s03-live-kafka-proof.sh` already composes that proof with the two-service producer→consumer flow, deterministic merge, and live analyzer verification. S01 also already delivered the async doc/boundary verifiers S02 is supposed to consume.

The main gap for `R048` is the **CI handoff seam**, not the analyzer or broker proof itself. Today the live Kafka proof runs inside `build-and-test`, but the only always-on artifact collection, GitHub summary rendering, and artifact upload live in the downstream `yanote-validation` job. Because `yanote-validation` depends on `build-and-test`, an async proof failure in `build-and-test` prevents the existing collector/summary pipeline from running at all. This is why async is already merge-blocking but still second-class in CI triage UX.

Primary recommendation: keep the required job names and the authoritative proof scripts exactly where they are, but add one durable export seam from the M004 proof scripts into a stable repo-local artifact directory, then generalize the existing collector and summary renderer to understand async outputs as well as HTTP outputs. Finish by adding one S08-style stage runner that composes the two S01 verifiers with the two authoritative M004 proof scripts. That closes `R048` without inventing new proof logic, new required job names, or a second summary/artifact format.

## Recommendation

1. **Build the final acceptance runner by composition, not reinvention.**
   - Add one stage-labeled M005 runner under `scripts/` that follows the `run_stage()` pattern from `scripts/docs/verify-s08-entry-paths.sh`.
   - Compose exactly these stages:
     - `scripts/docs/verify-m005-s01-async-path.sh`
     - `scripts/docs/verify-m005-s01-async-boundaries.sh`
     - `scripts/ci/verify-m004-s02-metadata-propagation.sh`
     - `scripts/ci/verify-m004-s03-live-kafka-proof.sh`
   - This is the cleanest way to prove S01 public truth + M004 runtime truth together while avoiding a second drift surface.

2. **Add a stable async artifact-export seam inside the live-proof path.**
   - The current proof scripts already know every meaningful retained file, but they keep them inside `mktemp` directories and only print the paths on failure.
   - S02 should not scrape those paths back out of logs. Instead, add an explicit export/copy seam from the proof scripts or their wrapper into a stable repo-local directory such as `.yanote-ci/live-kafka-proof/`.
   - The exported bundle should preserve the current truthful artifacts, not reinterpret them: single-service log, two-service log, raw producer/consumer JSONL, merged JSONL, merge log, async stdout, async stderr, `yanote-async-report.json`, and a manifest/source-path note.

3. **Promote async diagnostics inside the existing workflow topology, especially `build-and-test`.**
   - Because the live Kafka proof runs in `build-and-test`, async failure diagnostics must be collected, summarized, and uploaded from that same job or from an always-running wrapper around that same job’s proof step.
   - Extending only `yanote-validation` is insufficient: when `build-and-test` fails, the downstream job never reaches its current `always()` collector/summary/upload steps.
   - The most trustworthy pattern is: capture the live-proof exit code, run always-on async artifact collection + summary rendering + upload inside `build-and-test`, then enforce the saved exit code at the end so merge-blocking behavior stays intact.

4. **Generalize the current CI helpers instead of forking them.**
   - Extend `scripts/ci/collect-yanote-artifacts.sh` so it can collect async proof outputs in addition to the existing HTTP validation bundle.
   - Extend `scripts/ci/render-yanote-summary.mjs` so it can render concise async summaries from `yanote-async-report.json` plus `YANOTE_ASYNC_*` logs, while keeping the current HTTP summary behavior intact.
   - The renderer should no longer assume that a report file is always present; early async proof failures can happen before the analyzer writes a report.

5. **Lock the new behavior with contract tests before wiring the workflow.**
   - Add/extend tests for:
     - workflow topology + async triage placement in `build-and-test`
     - async artifact collection naming and manifest behavior
     - async summary rendering from async report/log fixtures
     - final M005 runner stage ordering
   - Keep the current HTTP contract tests passing so S02 promotes async visibility without regressing the existing validation surface.

## Don’t Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Final milestone acceptance runner | [`scripts/docs/verify-s08-entry-paths.sh`](../../../../../scripts/docs/verify-s08-entry-paths.sh) | Already proves the repo’s preferred stage-labeled composed-verifier pattern. |
| Single-service async proof | [`scripts/ci/verify-m004-s02-metadata-propagation.sh`](../../../../../scripts/ci/verify-m004-s02-metadata-propagation.sh) | Already asserts raw mixed JSONL attribution before `async-report`; preserves the raw-evidence-first trust boundary. |
| Two-service async proof | [`scripts/ci/verify-m004-s03-live-kafka-proof.sh`](../../../../../scripts/ci/verify-m004-s03-live-kafka-proof.sh) | Already composes single-service proof, two-service proof, deterministic merge, and `async-report`, plus retained-failure diagnostics. |
| Async machine/human diagnostics contract | [`yanote-js/src/cli.ts`](../../../../../yanote-js/src/cli.ts), [`yanote-js/src/cli.async-report.contract.test.ts`](../../../../../yanote-js/src/cli.async-report.contract.test.ts) | The exact `YANOTE_ASYNC_SUMMARY` and `YANOTE_ASYNC_ERROR*` behavior is already defined and tested; CI should consume it, not invent a new vocabulary. |
| Async report write boundary | [`yanote-js/src/report/writeAsyncReport.ts`](../../../../../yanote-js/src/report/writeAsyncReport.ts) | Keeps `yanote-async-report.json` deterministic and schema-validated; CI should publish this artifact directly. |
| Required job-name stability | [`.github/BRANCH_PROTECTION.md`](../../../../../.github/BRANCH_PROTECTION.md), [`scripts/ci/yanote-ci-workflow.contract.test.mjs`](../../../../../scripts/ci/yanote-ci-workflow.contract.test.mjs) | These files already lock `build-and-test` / `yanote-validation` as stable interfaces. |
| Public async boundary contract | [`scripts/docs/verify-m005-s01-async-path.sh`](../../../../../scripts/docs/verify-m005-s01-async-path.sh), [`scripts/docs/verify-m005-s01-async-boundaries.sh`](../../../../../scripts/docs/verify-m005-s01-async-boundaries.sh) | S01 already paid the cost to machine-check discoverability and boundary wording; S02 should compose those verifiers directly. |
| Deterministic multi-service merge | [`scripts/ci/merge-async-events-jsonl.mjs`](../../../../../scripts/ci/merge-async-events-jsonl.mjs) | The lexicographic path-order merge rule is already chosen and tested; do not replace it with timestamp-based merging. |

## Existing Code and Patterns

- [`.github/workflows/yanote-ci.yml`](../../../../../.github/workflows/yanote-ci.yml) — Current required-check topology. `build-and-test` already runs the live Kafka proof, while `yanote-validation` owns the existing always-on HTTP artifact/summary/upload path.
- [`scripts/ci/yanote-ci-workflow.contract.test.mjs`](../../../../../scripts/ci/yanote-ci-workflow.contract.test.mjs) — Locks job names, dependency chain, Java setup, live Kafka proof placement, and current always-on triage sequence after validation.
- [`.github/BRANCH_PROTECTION.md`](../../../../../.github/BRANCH_PROTECTION.md) — Declares `build-and-test` and `yanote-validation` as stable required check names and documents the current summary/artifact expectations.
- [`scripts/ci/run-yanote-gradle-check.sh`](../../../../../scripts/ci/run-yanote-gradle-check.sh) — Current `yanote-validation` execution helper. It intentionally fabricates an HTTP/OpenAPI fixture and drives `yanoteCheck`; it is not an async runner and should not be overloaded into one for M005.
- [`scripts/ci/collect-yanote-artifacts.sh`](../../../../../scripts/ci/collect-yanote-artifacts.sh) — Existing deterministic artifact collector. Today it only knows `yanote-report.json` and HTTP validation logs, but it is the right seam to extend rather than bypass.
- [`scripts/ci/collect-yanote-artifacts.test.mjs`](../../../../../scripts/ci/collect-yanote-artifacts.test.mjs) — Current collector contract tests. They presently pin only the HTTP artifact names and manifest behavior.
- [`scripts/ci/render-yanote-summary.mjs`](../../../../../scripts/ci/render-yanote-summary.mjs) — Existing GitHub summary renderer. It currently requires a report path, assumes the HTTP report schema, and only parses `YANOTE_ERROR` from stderr.
- [`scripts/ci/render-yanote-summary.test.mjs`](../../../../../scripts/ci/render-yanote-summary.test.mjs) — Concise summary contract tests for the HTTP report. These should be expanded, not duplicated, for async.
- [`scripts/ci/verify-m004-s02-metadata-propagation.sh`](../../../../../scripts/ci/verify-m004-s02-metadata-propagation.sh) — Authoritative single-service async proof runner with retained failure artifacts and raw-evidence assertions.
- [`scripts/ci/verify-m004-s03-live-kafka-proof.sh`](../../../../../scripts/ci/verify-m004-s03-live-kafka-proof.sh) — Authoritative composed async proof runner. The best current evidence for what CI-grade async diagnostics must preserve.
- [`scripts/docs/verify-s08-entry-paths.sh`](../../../../../scripts/docs/verify-s08-entry-paths.sh) — Proven stage-runner template for final milestone acceptance.
- [`scripts/docs/verify-m005-s01-async-path.sh`](../../../../../scripts/docs/verify-m005-s01-async-path.sh) and [`scripts/docs/verify-m005-s01-async-boundaries.sh`](../../../../../scripts/docs/verify-m005-s01-async-boundaries.sh) — Already-shipped S01 verifiers that S02 should consume directly.
- [`yanote-js/src/cli.ts`](../../../../../yanote-js/src/cli.ts) — Async CLI output contract, including the async summary sections, machine line, and typed stderr failure prefixes.
- [`yanote-js/src/cli.async-report.test.ts`](../../../../../yanote-js/src/cli.async-report.test.ts) — Proves that `yanote-async-report.json` is written even on threshold and semantic failure cases, which is exactly what CI should publish when available.
- [`yanote-js/src/report/asyncReport.ts`](../../../../../yanote-js/src/report/asyncReport.ts) — Canonical async report shape: summary totals/percents plus `coverage.channels`, `coverage.operations`, `coverage.messages`, and `diagnostics.counts`.

## Constraints

- **Keep required job names stable.** `build-and-test` and `yanote-validation` are part of the branch-protection contract; S02 may extend their internals but should not rename or replace them.
- **The live Kafka proof currently fails inside `build-and-test`.** Any async artifact/snapshot collection that happens only in `yanote-validation` will miss the most important async failures.
- **Raw evidence stays ahead of analysis.** The authoritative proof scripts intentionally assert mixed/raw JSONL ownership before invoking `async-report`; S02 must preserve that proof order.
- **The current Gradle/plugin delivery surface is HTTP-only on purpose.** `run-yanote-gradle-check.sh` drives `yanoteCheck`; M005 should not quietly expand public plugin task names just to surface async CI diagnostics.
- **The current summary renderer is report-required.** `render-yanote-summary.mjs` throws when no report path is available, but early async proof failures can happen before any report is written.
- **Async proof outputs already have a deterministic contract.** `YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR`, `YANOTE_ASYNC_ERROR_SECONDARY`, and `yanote-async-report.json` are the durable CI-facing surfaces.
- **Deterministic merge behavior is already fixed.** Multi-service async evidence is merged by lexicographic input-path order, not timestamps.
- **Public docs are already solved in S01.** S02 should consume those verifiers and avoid reopening wording ownership in landings/support docs.

## Common Pitfalls

- **Extending only `yanote-validation` for async diagnostics** — this misses the real async failure mode because `yanote-validation` depends on `build-and-test` and will not run after a failing live Kafka proof.
- **Scraping retained temp paths back out of shell logs** — the proof scripts already know the exact files; add an explicit export seam instead of brittle stderr parsing.
- **Re-implementing the M004 proof assertions in a new M005 script** — this creates a second runtime drift surface and weakens the raw-evidence-first trust model.
- **Teaching the summary renderer only the async JSON report shape** — early failures may have logs but no report. The renderer needs graceful fallback behavior, not a hard `--report` requirement.
- **Trying to coerce async coverage into the HTTP summary schema** — async has channels, operations, messages, and `unmatched`/`mismatched` diagnostics; forcing it into aggregate/status/parameters vocabulary will hide the real failure.
- **Using `continue-on-error` without a final enforcement step** — build-and-test must still end non-zero when the live Kafka proof fails, or the merge-blocking contract becomes porous.
- **Adding a new required async job for convenience** — the milestone explicitly wants async promotion inside the existing required-check topology, not branch-protection churn.

## Open Risks

- If the proof scripts only materialize exported artifacts on failure, async may still feel second-class on successful CI runs compared to the always-uploaded HTTP validation bundle.
- If build-and-test gains async triage steps but they are not locked with workflow contract tests, later cleanup refactors can silently remove the only async diagnostics path.
- If the generalized summary renderer still assumes a report file exists, raw-evidence or merge-stage async failures will remain opaque even after artifact export is added.
- If artifact export copies entire temp directories without an allowlist/manifest, uploaded bundles may become noisy and harder to triage than the current deterministic HTTP artifact set.
- If the final M005 runner composes the proof scripts but omits stage labels, failure localization will degrade and the acceptance surface will feel less trustworthy than S08.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| GitHub Actions | `dalestudy/skills@github-actions` | installed |

## Sources

- The active slice ownership is `R048`, and S02 also supports the already-validated public async surface by consuming S01 outputs (source: [`.gsd/REQUIREMENTS.md`](../../../../../.gsd/REQUIREMENTS.md)).
- The milestone definition explicitly wants one composed acceptance runner plus first-class async artifacts/summaries without changing required job names (source: [`.gsd/milestones/M005/M005-ROADMAP.md`](../../M005-ROADMAP.md)).
- S01 already delivered the async discoverability and boundary verifiers that S02 is meant to compose rather than restate (source: [`S01-SUMMARY.md`](../S01/S01-SUMMARY.md), [`verify-m005-s01-async-path.sh`](../../../../../scripts/docs/verify-m005-s01-async-path.sh), [`verify-m005-s01-async-boundaries.sh`](../../../../../scripts/docs/verify-m005-s01-async-boundaries.sh)).
- The current CI topology already runs the live Kafka proof in `build-and-test`, while the only always-on artifact/summary/upload flow sits in `yanote-validation` (source: [`.github/workflows/yanote-ci.yml`](../../../../../.github/workflows/yanote-ci.yml)).
- The stable required-check names and the expectation that CI artifacts/summaries are part of the v1 contract are already documented and tested (source: [`.github/BRANCH_PROTECTION.md`](../../../../../.github/BRANCH_PROTECTION.md), [`yanote-ci-workflow.contract.test.mjs`](../../../../../scripts/ci/yanote-ci-workflow.contract.test.mjs)).
- The current validation helper is intentionally HTTP-only and still drives `yanoteCheck` through a generated OpenAPI fixture, so it is not the right place to invent async proof logic (source: [`run-yanote-gradle-check.sh`](../../../../../scripts/ci/run-yanote-gradle-check.sh)).
- The current collector and summary renderer are HTTP-only today: the collector only knows `yanote-report.json`/HTTP logs, and the renderer requires `--report` plus the HTTP report schema (source: [`collect-yanote-artifacts.sh`](../../../../../scripts/ci/collect-yanote-artifacts.sh), [`collect-yanote-artifacts.test.mjs`](../../../../../scripts/ci/collect-yanote-artifacts.test.mjs), [`render-yanote-summary.mjs`](../../../../../scripts/ci/render-yanote-summary.mjs), [`render-yanote-summary.test.mjs`](../../../../../scripts/ci/render-yanote-summary.test.mjs)).
- The async CLI already defines the precise CI-facing contract S02 should reuse: `yanote-async-report.json`, one final `YANOTE_ASYNC_SUMMARY`, and ordered `YANOTE_ASYNC_ERROR*` stderr lines (source: [`yanote-js/src/cli.ts`](../../../../../yanote-js/src/cli.ts), [`cli.async-report.contract.test.ts`](../../../../../yanote-js/src/cli.async-report.contract.test.ts), [`cli.async-report.test.ts`](../../../../../yanote-js/src/cli.async-report.test.ts)).
- The canonical async report structure is already deterministic and specific to async coverage dimensions, so CI should summarize it directly instead of translating it into HTTP-era aggregate/status/parameter language (source: [`asyncReport.ts`](../../../../../yanote-js/src/report/asyncReport.ts), [`writeAsyncReport.ts`](../../../../../yanote-js/src/report/writeAsyncReport.ts)).
- The authoritative single-service and composed two-service proof runners already exist and should remain the only runtime truth surface for S02 (source: [`verify-m004-s02-metadata-propagation.sh`](../../../../../scripts/ci/verify-m004-s02-metadata-propagation.sh), [`verify-m004-s03-live-kafka-proof.sh`](../../../../../scripts/ci/verify-m004-s03-live-kafka-proof.sh)).
- A live retained-failure run confirmed that the shell proof surface is already rich: after raw/merge checks it preserved single-service log, two-service log, producer/consumer JSONL, merged JSONL, merge log, async stdout/stderr, and `yanote-async-report.json`, while emitting both `YANOTE_ASYNC_ERROR` and `YANOTE_ASYNC_SUMMARY` (source: live run of [`verify-m004-s03-live-kafka-proof.sh`](../../../../../scripts/ci/verify-m004-s03-live-kafka-proof.sh) with `--simulate-analyzer-failure`, 2026-03-14).
- The repo already has a proven final-acceptance runner pattern with labeled stages; S02 should mirror that structure instead of inventing a custom runner style (source: [`verify-s08-entry-paths.sh`](../../../../../scripts/docs/verify-s08-entry-paths.sh)).
