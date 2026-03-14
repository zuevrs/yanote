---
estimated_steps: 4
estimated_files: 4
---

# T03: Wire async discoverability into the main landings

**Slice:** S01 — Async Onboarding And Boundary Truth
**Milestone:** M005

## Description

Expose the new async path from the two main landings without breaking the existing concept-first onboarding. This task closes the slice by adding thin landing pointers and making the async verifiers require those pointers.

## Steps

1. Add thin async discoverability copy and links to `README.md` and `docs/README.md`, keeping the existing HTTP path primary while clearly surfacing the dedicated AsyncAPI/Kafka guide and the separate `async-report` outcome.
2. Make `docs/README.md` place the new async guide inside the canonical user-facing guide path rather than under maintainer/history or fallback sections.
3. Tighten `scripts/docs/verify-m005-s01-async-path.sh` so it now requires the final README/docs landing pointers and checks that the async guide is reachable from the main entry surfaces.
4. Re-run both new async verifiers plus the existing S01-S04 doc verifiers, adjusting wording only as needed so the async additions and older landing/release contracts pass together.

## Must-Haves

- [ ] `README.md` and `docs/README.md` expose the canonical async guide and the separate `async-report` path without replacing the existing concept-first HTTP onboarding flow.
- [ ] `docs/README.md` keeps the new async guide in the user-facing guide path rather than burying it in secondary surfaces.
- [ ] `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh`, and the existing S01-S04 doc verifiers all pass together.

## Verification

- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
- `git diff --check`

## Observability Impact

- Signals added/changed: landing-level discoverability is now covered by the async path verifier instead of being implicit in prose review.
- How a future agent inspects this: start with the two main landings, then run the full verifier stack to see whether the regression is in async discoverability, guide links, or an older landing/boundary contract.
- Failure state exposed: missing async entry links or copy that contradicts the owner surfaces becomes a precise verifier failure and not just a reviewer impression.

## Inputs

- `.gsd/milestones/M005/slices/S01/tasks/T01-PLAN.md` — guide-level async path contract that the landings must expose.
- `.gsd/milestones/M005/slices/S01/tasks/T02-PLAN.md` — owner/support boundary contract the landing copy must not contradict.
- `README.md`, `docs/README.md` — existing main landings that remain concept-first and need only thin async discoverability wiring.
- `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh` — pre-existing documentation contracts that must stay green.
- `scripts/docs/verify-m005-s01-async-path.sh`, `scripts/docs/verify-m005-s01-async-boundaries.sh` — async-specific verifiers from the earlier tasks that now need final landing coverage.

## Expected Output

- `README.md` — root landing with thin async discoverability wiring.
- `docs/README.md` — docs landing with canonical async-guide discoverability.
- `scripts/docs/verify-m005-s01-async-path.sh` — tightened landing-aware async path verifier.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — final async boundary verifier used in the combined slice checks.
