# S03: Concept-First Product Landing

**Goal:** Turn the repository root into a concept-first landing that explains what Yanote is, who it is for, and the verified recorder → `events.jsonl` → analyzer → coverage-report loop before readers have to parse deep implementation detail.
**Demo:** A first-time engineer can open `README.md`, understand the product and primary workflow, then navigate directly into the canonical recorder, analyzer, tagging, docs, and examples surfaces without being pushed first into maintainer or historical material.

## Must-Haves

- `README.md` explains the product, target user, problem boundary, and verified primary workflow before deep setup details.
- The root landing keeps direct links to `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, and `docs/guides/test-tagging.md` as the canonical detailed guides.
- `docs/README.md` and `examples/README.md` exist as user-facing navigation landings so directory browsing no longer mixes primary onboarding with raw file discovery.
- Example leaf READMEs link back to `examples/README.md` so users who land inside demo docs can recover the surrounding workflow.
- `scripts/docs/verify-s03-landing.sh` enforces the landing contract with targeted failures for missing sections, missing links, missing example backlinks, or promoted maintainer/historical surfaces.

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s01-doc-links.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`

## Observability / Diagnostics

- Runtime signals: none — this slice adds shell-based contract checks rather than runtime instrumentation.
- Inspection surfaces: `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s01-doc-links.sh`, `bash scripts/docs/verify-s02-doc-links.sh`
- Failure visibility: targeted verifier output naming the missing section, missing link, or misplaced surface so future agents can localize regressions quickly.
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `README.md`, `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/test-tagging.md`, `examples/docker-compose.yml`, `examples/springmvc-service/README.md`, `examples/tests-restassured/README.md`, `docs/maintainers/release-signing.md`, `docs/plans/`, `docs/traceability/`
- New wiring introduced in this slice: root landing routes to canonical guides plus new `docs/README.md` and `examples/README.md`; directory landings route readers to user-facing paths first and keep maintainer/historical surfaces secondary.
- What remains before the milestone is truly usable end-to-end: S04 must expose truthful version/release/support boundaries, S05 must finish the broader docs architecture, S06 must add maintained-product trust surfaces, and S08 must rerun the full concept → recorder → analyzer journey from the docs.

## Tasks

- [x] **T01: Codify the landing contract and seed navigation stubs** `est:45m`
  - Why: The slice needs an executable boundary before README copy changes start drifting, and the new docs/examples landing pages need real entry surfaces to link against.
  - Files: `scripts/docs/verify-s03-landing.sh`, `docs/README.md`, `examples/README.md`
  - Do: Add a verifier that checks required root sections, direct links to the canonical guides, links to the new directory landings, required docs/examples navigation clauses, example leaf backlinks, and secondary treatment of maintainer/historical surfaces; create minimum useful `docs/README.md` and `examples/README.md` stubs that establish those entry paths without pretending to solve S05.
  - Verify: `bash scripts/docs/verify-s03-landing.sh` fails only on the not-yet-rewritten root landing and any still-incomplete directory-navigation clauses, while `bash scripts/docs/verify-s01-doc-links.sh` and `bash scripts/docs/verify-s02-doc-links.sh` still pass.
  - Done when: the S03 verifier exists with targeted diagnostics and both new landing files exist as real user-facing stubs.
- [x] **T02: Rewrite README as the concept-first product landing** `est:1h`
  - Why: R022 is only satisfied if the root entry path explains the product and the main workflow before the reader has to descend into guide archaeology.
  - Files: `README.md`, `scripts/docs/verify-s03-landing.sh`
  - Do: Rework `README.md` around what Yanote is, who it is for, the primary recorder → `events.jsonl` → analysis loop, and the shortest next steps; preserve direct links to the canonical recorder/analyzer/tagging guides; link into `docs/README.md` and `examples/README.md`; demote maintainer/historical surfaces; avoid hardcoded current-version claims or fallback-first positioning.
  - Verify: `bash scripts/docs/verify-s03-landing.sh` fails only on the remaining docs/examples navigation clauses that T03 owns, while `bash scripts/docs/verify-s01-doc-links.sh` and `bash scripts/docs/verify-s02-doc-links.sh` pass.
  - Done when: opening `README.md` alone gives a first-time engineer the product framing and main navigation path, and any remaining S03 verifier failures are isolated to T03-owned docs/examples clauses.
- [x] **T03: Turn docs and examples directories into stable navigation surfaces** `est:1h`
  - Why: The root landing is not enough if directory browsing still drops users into a flat mix of guides, demo assets, maintainer notes, and historical material.
  - Files: `docs/README.md`, `examples/README.md`, `examples/springmvc-service/README.md`, `examples/tests-restassured/README.md`
  - Do: Expand `docs/README.md` into a user-facing map that separates canonical guides from maintainer and historical surfaces; expand `examples/README.md` into a narrative demo map around Compose, service, and test assets; add backlinks from the example sub-READMEs so directory browsing returns to the new landing instead of dead-ending in leaf docs.
  - Verify: `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`
  - Done when: browsing `docs/` or `examples/` keeps the verified user journey visible and clearly demotes maintainer/historical surfaces.

## Files Likely Touched

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `examples/springmvc-service/README.md`
- `examples/tests-restassured/README.md`
- `scripts/docs/verify-s03-landing.sh`
