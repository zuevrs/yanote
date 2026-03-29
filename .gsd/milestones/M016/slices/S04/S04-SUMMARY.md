---
id: S04
parent: M016
milestone: M016
provides:
  - A quickstart-first public docs path where `README.md` and `docs/README.md` send newcomers to one short `docs/guides/getting-started.md` loop for recorder -> tagging -> analyzer -> repo demo.
  - Short canonical recorder, tagging, analyzer, and example companion docs that all describe the same public product contract and standalone analyzer launcher story.
  - A fail-closed doc verification stack covering landing order, backlinks, local markdown link integrity, size ceilings, analyzer/example boundary wording, extracted-archive analyzer truth, and a real recorder runtime proof.
requires:
  - slice: S01
    provides: The standalone analyzer launcher/archive contract (`yanote-analyzer.zip` -> `bin/yanote`) that the analyzer guide, examples landing, and analysis-path verifier keep as the public doc truth.
  - slice: S03
    provides: The cleaned public repo boundary and product-facing example/maintainer split that S04 builds on while adding the short newcomer path.
affects:
  - S05
key_files:
  - README.md
  - docs/README.md
  - docs/guides/getting-started.md
  - docs/guides/recorder-spring-mvc.md
  - docs/guides/test-tagging.md
  - docs/guides/analyzer-coverage.md
  - examples/README.md
  - examples/springmvc-service/README.md
  - examples/tests-restassured/README.md
  - scripts/docs/verify-m016-s04-short-docs.sh
  - scripts/docs/verify-m016-s04-short-docs.contract.test.mjs
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
  - .gsd/PROJECT.md
key_decisions:
  - D035: Use one quickstart-first docs path (`README.md`/`docs/README.md` -> `docs/guides/getting-started.md`) and keep deeper recorder/tagging/analyzer/example docs as secondary detail surfaces.
  - D038: Allow analyzer security/provenance references only as secondary context after the newcomer install/run section; keep the intro section fail-closed against proof-first wording.
  - D036: Mark R036 validated based on the passing short-doc, landing, example-boundary, S04-boundary, and archive-launcher verification stack.
  - D034: Mark R037 validated based on the shortened recorder guide plus the runtime recorder smoke proof against published local artifacts.
  - D037: Mark R038 validated based on the shortened tagging guide and aligned RestAssured/Cucumber example handoff contract.
patterns_established:
  - Use `README.md` -> `docs/README.md` -> `docs/guides/getting-started.md` as one explicit newcomer funnel, then treat deeper guides and examples as companion detail surfaces rather than separate competing entrypoints.
  - Keep recorder, tagging, analyzer, and example docs on one shared vocabulary: `events.jsonl`, `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, `coverage.perOperation[].suites`, `yanote-analyzer.zip`, `bin/yanote`, `yanote-report.json`, and `yanote-report.html`.
  - When a short public doc still needs truthful boundary depth, keep the first screen focused on the newcomer loop and push proof/provenance detail into a later secondary section; enforce that split explicitly in the verifier instead of banning all proof terms everywhere.
  - Pair static short-doc wording checks with one real runtime/archive proof for each boundary that matters: recorder docs stay truthful because `verify-s01-recorder-path.sh` proves real JSONL output, and analyzer docs stay truthful because `verify-s02-analysis-path.sh` proves the extracted archive launcher contract.
observability_surfaces:
  - `scripts/docs/verify-m016-s04-short-docs.sh` localizes drift by category (file/link/size/content/order) and now enforces that proof-first wording stays out of the analyzer guide intro while allowing secondary security provenance later.
  - `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` proves the short-doc verifier fails closed on wrong first links, broken markdown links, size drift, and proof-first regressions, while also proving that later secondary analyzer security wording is allowed.
  - `scripts/docs/verify-s01-recorder-path.sh` publishes recorder modules to `mavenLocal()`, boots a Spring smoke fixture, sends a live request, and validates the exact JSONL contract described by the docs.
  - `scripts/docs/verify-s02-analysis-path.sh` extracts `build/distributions/yanote-analyzer.zip` and proves the analyzer guide against the public archive launcher contract instead of the internal Node seam.
  - `scripts/docs/verify-s03-example-boundary.sh` and `scripts/docs/verify-s04-boundaries.sh` keep public example/docs drift attributable by separating example navigation/launcher regressions from broader release-support/public-doc wording drift.
drill_down_paths:
  - .gsd/milestones/M016/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M016/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M016/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-29T02:31:42.087Z
blocker_discovered: false
---

# S04: Product docs and example reshape

**S04 reshaped Yanote’s public docs into one quickstart-first newcomer path, shortened the recorder/tagging/analyzer/example guides around the real product loop, and hardened fail-closed verifiers so the public docs stay short, truthful, and standalone-launcher-first.**

## What Happened

S04 finished the product-facing doc reshape that S03 intentionally left open. T01 turned the root landing, docs landing, and newcomer quickstart into one short path: `README.md` and `docs/README.md` now point first to `docs/guides/getting-started.md`, and that quickstart walks a first-time reader through the exact product loop the milestone wants to foreground — recorder -> tagging -> analyzer -> repo demo — without sending them through maintainer, release-proof, or CI archaeology first. The root/docs landings stayed well under their size ceilings, backlinks are explicit, and the newcomer path is now the first local link on both landing surfaces.

T02 then compressed the recorder and tagging story to the actual runnable contract. `docs/guides/recorder-spring-mvc.md` now stays on one short dependency -> properties/env -> live request -> `events.jsonl` proof loop, while `docs/guides/test-tagging.md` keeps one exact handoff story for `X-Test-Run-Id` / `X-Test-Suite` -> `test.run_id` / `test.suite` -> `coverage.perOperation[].suites` and keeps `YANOTE_SUITE` explicitly demo-only. The service and RestAssured example READMEs were aligned to the same vocabulary and backlink structure so the examples are companions to the canonical guides instead of competing alternate docs. Runtime proof stayed attached to the docs: the recorder path verifier republishes the recorder to `mavenLocal()`, boots the smoke Spring app, sends a real request, and checks the recorded JSONL fields against the documented contract.

T03 shortened the analyzer and repo-demo side of the story without losing truthful boundary depth. `docs/guides/analyzer-coverage.md` now keeps the official public contract on the first screen — `yanote-analyzer.zip` -> `bin/yanote` -> `report` -> `yanote-report.json` / `yanote-report.html` — and the examples landing now presents one short Compose-based demo route with the two leaf example READMEs as companions. During closeout, the analyzer guide/verifier boundary was tightened further: proof archaeology is still banned from the intro path, but additive `HTTP Security Conformance` provenance remains allowed later in the analyzer guide as secondary context so the existing security doc contract stays truthful without retaking the newcomer path.

For downstream slices, the important dependency summary is: Yanote now has one short public newcomer route that is consistent across the root landing, docs landing, quickstart, canonical recorder/tagging/analyzer guides, and examples landing; the example/demo surfaces still point at the standalone analyzer launcher contract from S01; and the short-doc verifier stack is now the fail-closed owner for size, backlink, link-integrity, wording-order, recorder runtime truth, analyzer archive truth, and example-boundary drift.

## Operational Readiness
- **Health signal:** `bash scripts/docs/verify-m016-s04-short-docs.sh`, `node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-example-boundary.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/docs/verify-s02-analysis-path.sh` all pass, and `bash scripts/docs/verify-s01-recorder-path.sh` records a real `events.jsonl` line with the documented `method`, `route`, `status`, `service`, and null `test.*` keys.
- **Failure signal:** the first local link in `README.md` or `docs/README.md` stops being the quickstart, any landing/guide exceeds its size ceiling, local markdown backlinks break, the analyzer guide drifts back to raw Node or proof-first intro wording, `verify-s01-recorder-path.sh` stops producing the documented JSONL contract, or `verify-s02-analysis-path.sh` stops proving the extracted archive launcher contract.
- **Recovery procedure:** restore the quickstart-first navigation order and the shared recorder/tagging/analyzer vocabulary first, then rerun the short-doc/boundary stack. If runtime proof fails, inspect the recorder smoke publish/app logs retained by `verify-s01-recorder-path.sh`; if analyzer proof fails, rerun `./gradlew distStandaloneAnalyzer`, extract `build/distributions/yanote-analyzer.zip`, and re-run `bash scripts/docs/verify-s02-analysis-path.sh` to localize archive-vs-doc drift.
- **Monitoring gaps:** S04 proves each public docs/example surface individually, but it does not yet prove the full milestone end-to-end story in one pass. S05 still needs to confirm that the cleaned repo face, short docs path, standalone analyzer contract, and tag-driven release truth all cohere together.

## Verification

Passed the full S04 verification stack on current HEAD:

- ✅ `bash scripts/docs/verify-m016-s04-short-docs.sh` — passed; newcomer, analyzer, and repo-demo docs stayed short and product-first.
- ✅ `node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` — passed; clean fixtures, quickstart-order failures, broken-link failures, allowed secondary analyzer proof wording, and size/proof-first regressions all behaved as expected.
- ✅ `bash scripts/docs/verify-s03-landing.sh` — passed; root/docs newcomer links and example backlinks agree.
- ✅ `bash scripts/docs/verify-s01-doc-links.sh` — passed; recorder docs point to the standalone analyzer bundle and the short recorder path.
- ✅ `bash scripts/docs/verify-s02-doc-links.sh` — passed; analyzer/tagging docs and example backlinks match the short shared contract surfaces.
- ✅ `bash scripts/docs/verify-s01-recorder-path.sh` — passed; published the recorder modules to `mavenLocal()`, booted the Spring smoke fixture, sent a real request, and proved the recorded JSONL contract.
- ✅ `bash scripts/docs/verify-s03-example-boundary.sh` — passed; public example docs stayed short, Compose kept the standalone launcher contract, and maintainer rerun breadcrumbs remained secondary.
- ✅ `bash scripts/docs/verify-s04-boundaries.sh` — passed; release/support and public docs aligned on the short standalone analyzer and repo-demo contract.
- ✅ `bash scripts/docs/verify-s02-analysis-path.sh` — passed; the analyzer guide still proved the official archive contract by extracting `yanote-analyzer.zip` and running the launcher from the bundle.

Observability/diagnostic surfaces were confirmed as part of closeout: the short-doc contract test now proves that secondary analyzer security provenance is allowed only after the newcomer section, while the shell verifier stack localizes drift by surface (landing order/backlinks, recorder contract wording/runtime proof, analyzer archive truth, or example-boundary wording).

## Requirements Advanced

- R035 — S04 advanced the product-first repo face by making the cleaned README/docs landings actually usable for a newcomer, so the public boundary from S03 now leads into a short product loop instead of stopping at cleanup.
- R043 — S04 kept the public docs/example cleanup truthful by attaching the short wording surfaces to rerunnable recorder runtime proof, extracted-archive analyzer proof, and fail-closed shell/contract verifiers instead of relying on prose-only simplification.

## Requirements Validated

- R036 — Validated by `bash scripts/docs/verify-m016-s04-short-docs.sh`, `node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s03-example-boundary.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, and `bash scripts/docs/verify-s02-analysis-path.sh` passing on the reshaped root/docs/quickstart/analyzer/examples surfaces.
- R037 — Validated by the shortened recorder guide and service companion plus `bash scripts/docs/verify-s01-doc-links.sh` and the runtime `bash scripts/docs/verify-s01-recorder-path.sh` smoke proof against published local artifacts.
- R038 — Validated by the shortened tagging guide and aligned RestAssured/Cucumber example handoff plus `bash scripts/docs/verify-s02-doc-links.sh` passing with the explicit header -> JSONL -> report suites contract.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Closeout required a small verifier refinement beyond the task buildout: the short-doc and S04 boundary guards originally banned security/provenance terms everywhere in `docs/guides/analyzer-coverage.md`, which conflicted with the still-authoritative S02 analyzer doc contract. The guards were updated to keep proof-first wording banned from the analyzer guide’s intro while still allowing additive `HTTP Security Conformance` provenance later as secondary context.

## Known Limitations

S04 validates each docs/example boundary independently, but it does not yet prove the whole public product story end to end in one slice-level run. Final cross-surface coherence — short docs + clean repo face + standalone analyzer asset + tag-driven release truth — still belongs to S05.

## Follow-ups

S05 should reuse the S04 short-doc verifier stack together with the S03 public-boundary/example verifiers and the S02 release/analyzer truth surfaces as the final integration proof. Keep the quickstart-first navigation order and the shared recorder/tagging/analyzer vocabulary intact; if any deeper release/support or security wording needs to grow later, it should stay secondary to the newcomer path rather than retaking the first screen.

## Files Created/Modified

- `README.md` — Shortened the public landing into a quickstart-first root entry that foregrounds the recorder/tagging/analyzer/repo-demo path.
- `docs/README.md` — Turned the docs landing into a short navigation surface that points first to the quickstart and then to the canonical guides.
- `docs/guides/getting-started.md` — Added the newcomer quickstart that walks recorder -> tagging -> analyzer -> repo demo with explicit proof checks and backlinks.
- `docs/guides/recorder-spring-mvc.md` — Compressed the recorder guide to one dependency/properties/live-request/`events.jsonl` proof loop and linked it to the runnable service companion.
- `docs/guides/test-tagging.md` — Compressed the tagging guide to one exact `X-Test-Run-Id`/`X-Test-Suite` -> `test.run_id`/`test.suite` -> `coverage.perOperation[].suites` handoff and clarified `YANOTE_SUITE` as demo-only.
- `docs/guides/analyzer-coverage.md` — Reshaped the analyzer guide around the standalone archive launcher contract and preserved additive security provenance as secondary context rather than first-screen proof archaeology.
- `examples/README.md` — Rewrote the examples landing into one short Compose-driven repo demo path with backlinks to the leaf example READMEs and analyzer guide.
- `examples/springmvc-service/README.md` — Aligned the Spring MVC example README to the canonical recorder vocabulary and proof loop.
- `examples/tests-restassured/README.md` — Aligned the RestAssured example README to the canonical tagging vocabulary and the demo-only env bridge wording.
- `scripts/docs/verify-m016-s04-short-docs.sh` — Added the fail-closed short-doc verifier for newcomer path order, backlinks, size ceilings, and proof-first wording drift, with analyzer-intro-specific handling for secondary security provenance.
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` — Added fixture-backed contract coverage for clean fixtures, quickstart-order failures, broken links, size/proof-first regressions, and allowed secondary analyzer proof wording.
- `scripts/docs/verify-s04-boundaries.sh` — Updated the boundary verifier so short public docs stay aligned with release/support truth while allowing analyzer security provenance only after the newcomer section.
- `.gsd/DECISIONS.md` — Recorded the S04 documentation-path and requirement-validation decisions (D035-D038).
- `.gsd/KNOWLEDGE.md` — Captured the verifier lesson that analyzer security provenance must remain secondary context rather than be banned everywhere.
- `.gsd/PROJECT.md` — Refreshed project state to record S04 complete and narrow M016 to the final S05 integration proof.
