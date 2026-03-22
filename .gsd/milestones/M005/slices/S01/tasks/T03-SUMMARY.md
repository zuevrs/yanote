---
id: T03
parent: S01
milestone: M005
provides:
  - Root/docs landing-level async discoverability that keeps the HTTP onboarding primary, surfaces the dedicated AsyncAPI/Kafka guide plus separate `async-report` outcome, and closes R047 with a placement-aware verifier.
key_files:
  - README.md
  - docs/README.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - .gsd/REQUIREMENTS.md
  - .gsd/DECISIONS.md
  - .gsd/milestones/M005/slices/S01/S01-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Treat async landing discoverability as a placement-aware contract: the guide and separate `async-report` / `yanote-async-report.json` path must appear inside the primary onboarding sections, not just exist somewhere on the page.
patterns_established:
  - Thin landing pointers should surface the async branch without replacing the concept-first HTTP recorder → analyzer story.
  - Discoverability verifiers should check both wording and placement between primary user-facing headings so async docs cannot drift into maintainer/fallback sections unnoticed.
observability_surfaces:
  - bash scripts/docs/verify-m005-s01-async-path.sh
  - bash scripts/docs/verify-m005-s01-async-boundaries.sh
  - bash scripts/docs/verify-s03-landing.sh
  - bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure
duration: 20m
verification_result: passed
completed_at: 2026-03-14T13:20:44+0300
blocker_discovered: false
---

# T03: Wire async discoverability into the main landings

**Added thin async pointers to the two main landings, tightened the async path verifier to enforce user-facing placement, and closed S01 by validating R047 and marking the slice complete.**

## What Happened

Updated `README.md` so the primary HTTP/OpenAPI onboarding stays intact while explicitly branching to the dedicated AsyncAPI/Kafka guide from the verified cycle and the “Куда идти дальше” navigation. The new copy names the separate `async-report` command and `yanote-async-report.json` artifact instead of implying one combined report surface.

Updated `docs/README.md` so `guides/asyncapi-kafka.md` now lives inside `## Канонические гайды`, not in secondary sections. The guide list now keeps recorder/analyzer as the primary concept-first path, adds the async branch as a deliberate step, and explains that HTTP remains the default route while AsyncAPI/Kafka uses its own `async-report` / `yanote-async-report.json` path.

Tightened `scripts/docs/verify-m005-s01-async-path.sh` beyond raw link existence. It now checks the root/docs landings for the async guide link, `async-report`, and `yanote-async-report.json`, verifies those pointers live inside the main user-facing sections (`README.md` between “Проверенный цикл” and “Вторичные поверхности”; `docs/README.md` between “Канонические гайды” and “Примеры и демо”), and includes the landings in local markdown-link validation.

Since S01 is now complete, promoted `R047` from active to validated in `.gsd/REQUIREMENTS.md`, recorded the placement-aware landing contract in `.gsd/DECISIONS.md`, marked T03 done in `.gsd/milestones/M005/slices/S01/S01-PLAN.md`, and refreshed `.gsd/STATE.md` so it shows S01 complete and points the next unit at the remaining R048/M005 follow-on work.

## Verification

Verified the slice-owned doc stack directly:

- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh && bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure`
  - Result: expected diagnostic nonzero path. The single-service proof, live two-service raw-evidence checks, and deterministic merge all completed first; then the simulated analyzer failure retained temp artifacts and surfaced `YANOTE_ASYNC_SUMMARY` plus typed `YANOTE_ASYNC_ERROR` output as designed.

## Diagnostics

Use these surfaces to inspect the completed landing/discoverability contract later:

- `README.md` — root product landing with the thin async branch from the primary onboarding flow.
- `docs/README.md` — canonical docs landing with the async guide placed inside the user-facing guide path.
- `bash scripts/docs/verify-m005-s01-async-path.sh` — localizes missing/misplaced async landing pointers versus guide-level drift.
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh` — confirms the landing copy still matches the owner/support async boundary.
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh --simulate-analyzer-failure` — retained-failure proof that still exposes raw JSONL, merged JSONL, async stdout/stderr, and `yanote-async-report.json` paths.
- `.gsd/REQUIREMENTS.md` and `.gsd/STATE.md` — planning surfaces showing `R047` validated and S01 complete.

## Deviations

None.

## Known Issues

None; the remaining M005 work is the planned R048/S02 acceptance slice, not a regression from this task.

## Files Created/Modified

- `README.md` — added thin async discoverability copy and a direct guide pointer without replacing the HTTP-first onboarding flow.
- `docs/README.md` — promoted the async guide into the canonical user-facing guide path and clarified the separate async outcome.
- `scripts/docs/verify-m005-s01-async-path.sh` — made landing verification placement-aware and explicit about the separate async command/artifact path.
- `.gsd/REQUIREMENTS.md` — promoted `R047` from active to validated after S01 closure.
- `.gsd/DECISIONS.md` — recorded the placement-aware async landing discoverability contract.
- `.gsd/milestones/M005/slices/S01/S01-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — refreshed the slice status, requirement counts, and next action after S01 completion.
