---
id: T02
parent: S02
milestone: M002
provides:
  - "One Russian-first canonical analyzer guide for the verified source-built `yanote-js` path, with truthful coverage interpretation and gate semantics."
  - "Aligned entry docs and example command surfaces so the repo points to the same analyzer path and no longer carries the stale `/health` exclude workaround."
key_files:
  - docs/guides/analyzer-coverage.md
  - README.md
  - dist/node-analyzer/README.md
  - examples/docker-compose.yml
  - dist/node-analyzer/verify.sh
key_decisions:
  - "Keep `docs/guides/analyzer-coverage.md` as the single authoritative analyzer guide; use `README.md` only for navigation and `dist/node-analyzer/README.md` only for offline fallback delivery."
  - "Force fresh RestAssured execution in `examples/docker-compose.yml` with `--rerun-tasks` so the example path matches the proof script's fresh-events contract."
patterns_established:
  - "Canonical docs should explain the live proof numbers and output surfaces from the real analyzer path, then keep secondary entry docs as pointers or scoped fallbacks instead of duplicating interpretation logic."
  - "If a doc example depends on regenerated `events.jsonl`, runnable examples should carry the same rerun guard as the proof path rather than relying on Gradle task cache luck."
observability_surfaces:
  - "`bash scripts/docs/verify-s02-analysis-path.sh`, the CLI `Summary` / `YANOTE_SUMMARY` / `YANOTE_ERROR` lines, and the canonical field-by-field guide in `docs/guides/analyzer-coverage.md`."
duration: 55m
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T02: Write the canonical analyzer guide and align analysis entry docs

**Added the canonical analyzer guide, repointed repo entry docs to it, and removed the stale `/health` exclude from the runnable analysis surfaces.**

## What Happened

I added `docs/guides/analyzer-coverage.md` as the Russian-first canonical explanation of the verified analyzer path.

The guide now covers:

- the primary source-built `yanote-js` path and the exact `report --spec --events --out` command shape;
- the stable output surfaces: human-readable `Summary`, final `YANOTE_SUMMARY`, fail-closed `YANOTE_ERROR`, and persisted `yanote-report.json`;
- the report JSON layout (`summary`, `coverage`, `coverage.perOperation[]`, `diagnostics`, `governance`);
- the real interpretation example from the proof path, including why the demo lands on `operations=100%`, `status=75%`, `parameters=100%`, `aggregate=93.75%`, and `report.status=partial`;
- why the old `--exclude /health` flag is wrong for the current demo spec and only creates unmatched exclusion noise.

Then I aligned the entry surfaces around that guide:

- `README.md` now treats analysis as a navigational surface that points to the canonical guide, keeps the minimal source-built command, and describes the stable analyzer outputs instead of duplicating the full explanation.
- `dist/node-analyzer/README.md` is now explicitly scoped as the offline fallback delivery path, with the same command shape and output contract but without pretending to be the primary guide.
- `examples/docker-compose.yml` now matches the proof path better: the test run uses `--rerun-tasks` to force fresh `events.jsonl`, and the analyzer command no longer carries the stale `--exclude /health` flag.
- `dist/node-analyzer/verify.sh` was also cleaned to drop the same stale exclude so the bundle helper does not preserve the old workaround one level down.

I also recorded the documentation-surface decision in `.gsd/DECISIONS.md` so T03 and later navigation work keep one canonical analyzer explanation instead of reintroducing duplicate variants.

## Verification

Task-level verification:

- `bash scripts/docs/verify-s02-analysis-path.sh && rg -n "YANOTE_SUMMARY|yanote-report.json|operations|status|aggregate|node-analyzer|/health" docs/guides/analyzer-coverage.md README.md dist/node-analyzer/README.md examples/docker-compose.yml` ✅
  - analyzer proof passed with `operations=4/4`, `status=75.00`, `parameters=100.00`, `aggregate=93.75`
  - gate proof passed with `exit=3` and `code=GATE_MIN_AGGREGATE`
  - grep contract confirmed the new guide and entry docs mention the expected analyzer/report surfaces

Slice-level verification run during this task:

- `bash scripts/docs/verify-s02-analysis-path.sh` ✅
- `./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test` ✅
- `bash scripts/docs/verify-s02-doc-links.sh` ❌ (`No such file or directory`) — expected at this stage because T03 owns that script and the doc-link contract wiring

## Diagnostics

For any future edit to analyzer-path docs or example commands, rerun:

- `bash scripts/docs/verify-s02-analysis-path.sh`
- `rg -n "YANOTE_SUMMARY|yanote-report.json|operations|status|aggregate|node-analyzer|/health" docs/guides/analyzer-coverage.md README.md dist/node-analyzer/README.md examples/docker-compose.yml`

The canonical interpretation surface now lives in `docs/guides/analyzer-coverage.md`; `README.md` and `dist/node-analyzer/README.md` should stay shallow pointers/fallback docs, not competing sources of truth.

## Deviations

- `.gsd/milestones/M002/slices/S02/tasks/T02-PLAN.md` was absent at execution time, so I used the T02 entry in `S02-PLAN.md` as the authoritative task contract.

## Known Issues

- `scripts/docs/verify-s02-doc-links.sh` still does not exist, so the slice-level doc-link verification remains red until T03 lands the tagging guide and link-contract script.

## Files Created/Modified

- `docs/guides/analyzer-coverage.md` — new canonical analyzer guide for command shape, output surfaces, JSON fields, and coverage interpretation.
- `README.md` — repointed the root analysis section to the canonical guide and cleaned the E2E analyzer path description.
- `dist/node-analyzer/README.md` — reframed as offline fallback documentation with the same truthful analyzer output contract.
- `examples/docker-compose.yml` — forces fresh RestAssured execution and removes the stale `/health` exclude from the analyzer command.
- `dist/node-analyzer/verify.sh` — drops the stale `/health` exclude so the bundle helper matches the documented analyzer path.
- `.gsd/DECISIONS.md` — recorded the canonical analyzer documentation surface decision for downstream work.
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — marked T02 complete.
- `.gsd/STATE.md` — advanced slice state to T03.
