---
estimated_steps: 5
estimated_files: 4
---

# T03: Turn docs and examples directories into stable navigation surfaces

**Slice:** S03 — Concept-First Product Landing
**Milestone:** M002

## Description

Finish the slice by turning directory browsing into a coherent extension of the root landing: `docs/` should guide users toward canonical guides before maintainer/history surfaces, and `examples/` should explain how the demo assets fit the verified workflow instead of exposing raw files without narrative.

## Steps

1. Expand `docs/README.md` into a user-facing docs map with sections for the primary user path, deeper reference material, maintainer-only docs, and historical/traceability artifacts.
2. Expand `examples/README.md` into a narrative examples map that explains the role of `docker-compose.yml`, the Spring MVC service example, and the RestAssured tests in the verified S01/S02 journey.
3. Add backlinks from `examples/springmvc-service/README.md` and `examples/tests-restassured/README.md` to `examples/README.md` so users who land in leaf docs can recover the surrounding story.
4. Keep fallback bundles and maintainer/history material clearly secondary so directory readers are not pushed away from the verified primary path.
5. Re-run the S03, S01, and S02 doc-link verifiers to confirm the final navigation graph is stable.

## Must-Haves

- [ ] `docs/README.md` separates user-facing guides from maintainer and historical surfaces.
- [ ] `examples/README.md` explains how the demo assets relate to the recorder → events → analyzer flow.
- [ ] Example leaf READMEs link back to the examples landing so directory browsing remains navigable.
- [ ] The final navigation model keeps fallbacks and maintainer/history material secondary to the verified product path.

## Verification

- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s01-doc-links.sh && bash scripts/docs/verify-s02-doc-links.sh`

## Observability Impact

- Signals added/changed: none beyond the verifier checks already added in T01.
- How a future agent inspects this: run the verifiers, then follow the failing link or section named in the output through `docs/README.md` or `examples/README.md`.
- Failure state exposed: broken navigation becomes a concrete missing-link or misplaced-surface failure instead of an ambiguous browsing complaint.

## Inputs

- `docs/README.md` from T01 — initial docs landing that now needs full audience-aware structure.
- `examples/README.md` from T01 — initial examples landing that now needs the narrative workflow framing.
- `examples/springmvc-service/README.md` — existing example leaf doc that should link back into the new examples landing.
- `examples/tests-restassured/README.md` — existing example leaf doc that should link back into the new examples landing.
- `examples/docker-compose.yml` — demo composition surface that the examples landing must explain.
- `docs/maintainers/release-signing.md`, `docs/plans/`, `docs/traceability/` — real secondary surfaces that must remain discoverable without becoming the primary path.

## Expected Output

- `docs/README.md` — stable user-first docs map with explicit secondary sections for maintainer and historical material.
- `examples/README.md` — stable examples map that explains the demo assets in the verified workflow.
- `examples/springmvc-service/README.md` — leaf example README with a backlink to the examples landing.
- `examples/tests-restassured/README.md` — leaf example README with a backlink to the examples landing.
