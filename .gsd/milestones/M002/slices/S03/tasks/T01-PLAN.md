---
estimated_steps: 4
estimated_files: 3
---

# T01: Codify the landing contract and seed navigation stubs

**Slice:** S03 — Concept-First Product Landing
**Milestone:** M002

## Description

Create the explicit verification boundary for the new landing contract before rewriting the root README, then add minimum useful `docs/README.md` and `examples/README.md` stubs so the later README rewrite can link to real user-facing destinations instead of future placeholders.

## Steps

1. Create `scripts/docs/verify-s03-landing.sh` to assert the required root landing sections, direct links to the recorder/analyzer/tagging guides, links to `docs/README.md` and `examples/README.md`, required docs/examples navigation clauses, example leaf backlinks, and secondary treatment of maintainer/historical surfaces.
2. Run the new verifier against the current repo state and keep its failure localized to the missing S03 landing contract rather than to the already-verified S01/S02 guide graph.
3. Add initial `docs/README.md` and `examples/README.md` pages with Russian-first framing and short link maps that point to the canonical user-facing guides and demo assets.
4. Re-run the existing S01/S02 doc-link verifiers to confirm the new landing stubs do not disturb the already-verified recorder/analyzer vocabulary and link graph.

## Must-Haves

- [ ] `scripts/docs/verify-s03-landing.sh` exists and fails with targeted diagnostics that name the missing section or missing link.
- [ ] `docs/README.md` exists as a real user-facing docs entry page, not a placeholder note.
- [ ] `examples/README.md` exists as a real user-facing examples entry page, not a raw file list.
- [ ] The new work does not weaken or break the S01/S02 link verifiers.

## Verification

- `bash scripts/docs/verify-s03-landing.sh` — expected to fail on the current root landing and any intentionally incomplete docs/examples clauses until T02/T03 complete, with failures localized to named S03 contract items.
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability Impact

- Signals added/changed: targeted shell assertion messages from `verify-s03-landing.sh` for missing section, missing link, and misplaced-surface regressions.
- How a future agent inspects this: run `bash scripts/docs/verify-s03-landing.sh` first, then the S01/S02 doc-link verifiers to see whether the regression is new to S03 or inherited from earlier slices.
- Failure state exposed: the verifier output identifies which landing contract clause is broken before any README copy diff is inspected.

## Inputs

- `.gsd/milestones/M002/slices/S03/S03-RESEARCH.md` — defines the landing risks, scope limits, and additive-page strategy.
- `scripts/docs/verify-s01-doc-links.sh` — existing recorder doc-graph contract that must remain intact.
- `scripts/docs/verify-s02-doc-links.sh` — existing analyzer/tagging doc-graph contract that must remain intact.
- `docs/guides/recorder-spring-mvc.md` — canonical recorder guide the new landing must preserve.
- `docs/guides/analyzer-coverage.md` — canonical analyzer guide the new landing must preserve.
- `docs/guides/test-tagging.md` — canonical tagging guide the new landing must preserve.

## Expected Output

- `scripts/docs/verify-s03-landing.sh` — executable landing-contract verifier with targeted failure messages.
- `docs/README.md` — initial user-facing docs map for the verified guides and secondary surfaces.
- `examples/README.md` — initial user-facing examples map for the demo assets.
