---
estimated_steps: 4
estimated_files: 2
---

# T02: Rewrite README as the concept-first product landing

**Slice:** S03 — Concept-First Product Landing
**Milestone:** M002

## Description

Replace the current root-hub posture with a product landing that explains Yanote’s value and the primary recorder → `events.jsonl` → analyzer workflow up front, while preserving the canonical guide links and avoiding premature version/support claims that belong to S04.

## Steps

1. Restructure `README.md` so the opening sections answer what Yanote is, what problem it solves, who it is for, and what meaningful result a user gets from the repo.
2. Make the primary workflow explicit in the README using the verified path names from S01/S02: recorder setup, event capture, analysis, and report interpretation.
3. Keep direct links to `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, and `docs/guides/test-tagging.md`, while also routing readers to `docs/README.md` and `examples/README.md` for broader navigation.
4. Demote maintainer and historical surfaces to a secondary section and avoid hardcoded current-version or broad-ecosystem claims that S03 does not actually prove.

## Must-Haves

- [ ] `README.md` explains the product and target user before deep setup detail.
- [ ] The primary workflow is visible from the root landing and uses the verified recorder/event/analyzer stages from S01/S02.
- [ ] The canonical recorder, analyzer, and tagging guides remain directly linked from the root README.
- [ ] Maintainer and historical surfaces are present but clearly secondary, and the README does not invent a release/support story.
- [ ] After the rewrite, any remaining `verify-s03-landing.sh` failures are limited to the docs/examples navigation clauses reserved for T03.

## Verification

- `bash scripts/docs/verify-s03-landing.sh` — expected to fail only on the remaining docs/examples navigation clauses that T03 owns.
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability Impact

- Signals added/changed: none beyond the new verifier coverage introduced in T01.
- How a future agent inspects this: run the landing verifier and inspect the failing README section or link named in its output.
- Failure state exposed: regressions become visible as named contract failures instead of vague “README drift.”

## Inputs

- `README.md` — current root landing to be rewritten, keeping truthful links while changing its posture.
- `.gsd/milestones/M002/slices/S03/S03-RESEARCH.md` — clarifies the concept-first framing and warns against version/support overreach.
- `docs/guides/recorder-spring-mvc.md` — authoritative recorder path to reference directly.
- `docs/guides/analyzer-coverage.md` — authoritative analyzer and report-interpretation path to reference directly.
- `docs/guides/test-tagging.md` — authoritative tagging path to reference directly.
- `docs/README.md` and `examples/README.md` from T01 — navigation surfaces that the root landing must wire in.

## Expected Output

- `README.md` — concept-first product landing with direct canonical guide links and secondary pointers to maintainer/historical material.
