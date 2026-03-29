---
estimated_steps: 4
estimated_files: 10
skills_used:
  - debug-like-expert
  - bash-scripting
---

# T05: Update public analyzer docs and boundary verifiers to use the standalone CLI

**Slice:** S01 — Standalone analyzer shipping contract
**Milestone:** M016

## Description

Replace source-built analyzer wording across public docs with the new standalone CLI surface and update the doc verifiers so HTTP and async docs stay aligned on the same install/run contract. This is the public-facing closure for `R042`.

## Load Profile

- **Shared resources**: the public README/docs surfaces and the doc verifier scripts that must stay in lockstep.
- **Per-operation cost**: synchronized wording updates plus rerunnable verifier scripts.
- **10x breakpoint**: wording drift across multiple docs/scripts becomes the main failure source long before command execution is expensive.

## Negative Tests

- **Malformed inputs**: stale `node yanote-js/dist/yanote.cjs` commands or source-built wording left in public docs.
- **Error paths**: HTTP guide and async guide describe different install/run stories, or the release/support doc still treats the standalone bundle as a secondary fallback.
- **Boundary conditions**: root README, docs landing, analyzer guide, async guide, and release/support doc all point to one official standalone CLI surface and one fallback story.

## Steps

1. Update root/public docs to describe the standalone analyzer bundle as the canonical install/run path and relegate raw `yanote-js` build details to internal implementation context only when truly needed.
2. Update HTTP and async analyzer command examples to use the standalone launcher surface consistently, while keeping the underlying `report` / `async-report` / `combined-report` semantics unchanged.
3. Rewrite release/support boundary wording so the official bundle is versioned public truth and the raw `yanote-js` build seam is no longer the user-facing contract.
4. Update doc verifier scripts to pin the new standalone CLI wording and reject regressions back to raw `yanote.cjs` commands.

## Must-Haves

- [ ] Public docs expose one standalone analyzer install/run story instead of source-building `yanote-js`.
- [ ] HTTP and async guides share the same launcher contract.
- [ ] Doc verifier scripts fail closed on drift back to the raw Node build seam.

## Verification

- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-analysis-path.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- Expect public docs and doc guards to align on the standalone CLI wording.

## Inputs

- `README.md` — current public product landing.
- `docs/README.md` — docs landing map.
- `docs/guides/analyzer-coverage.md` — canonical HTTP analyzer guide.
- `docs/guides/asyncapi-kafka.md` — canonical async/combined guide.
- `docs/release-and-support.md` — public release/support boundary owner doc.
- `scripts/docs/verify-s01-doc-links.sh` — doc-link verifier.
- `scripts/docs/verify-s02-analysis-path.sh` — analyzer guide verifier.
- `scripts/docs/verify-s04-boundaries.sh` — release/support boundary verifier.
- `scripts/docs/verify-m005-s01-async-path.sh` — async guide verifier.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — async boundary verifier.

## Expected Output

- `README.md` — public analyzer story updated to the standalone CLI.
- `docs/README.md` — docs landing aligned to the standalone CLI contract.
- `docs/guides/analyzer-coverage.md` — HTTP analyzer guide updated to the standalone launcher examples.
- `docs/guides/asyncapi-kafka.md` — async/combined guide updated to the standalone launcher examples.
- `docs/release-and-support.md` — release/support boundary aligned to the standalone CLI truth.
- `scripts/docs/verify-s01-doc-links.sh` — doc guard updated for standalone wording.
- `scripts/docs/verify-s02-analysis-path.sh` — analyzer-guide proof updated for the standalone CLI.
- `scripts/docs/verify-s04-boundaries.sh` — boundary guard updated for the standalone CLI.
- `scripts/docs/verify-m005-s01-async-path.sh` — async guide guard updated for the standalone CLI.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — async boundary guard updated for the standalone CLI.
