# M016: Product-First Repository Surface And Shipping Automation

**Gathered:** 2026-03-28
**Status:** Ready for planning

## Project Description

Yanote needs to stop looking like a repository with “слишком много мусора” and visible “внутренняя кухня” in public `main`. The public GitHub surface should look like a clean top-tier product repository: short docs, clear install/use paths, runnable examples, release/CI truth, and no public-facing GSD/process/proof clutter competing with the product story.

## Why This Milestone

The product capabilities are already broad through M015, but the public repository face now fights the product. README/docs are longer and noisier than desired, tracked `.gsd` / `.tmp*` / `.vite` residue undermines the first impression, and the analyzer still reads too much like an internal `yanote-js` build seam instead of an official shipped CLI surface. This milestone fixes product packaging and public boundaries rather than expanding analyzer semantics.

## User-Visible Outcome

### When this milestone is complete, the user can:

- open the Yanote repository and immediately understand what the tool is, how to connect the recorder, how to enable RestAssured/Cucumber tagging, and how to install and run the analyzer
- rely on a release-tag-driven shipping path that validates and publishes the supported artifacts without hidden maintainer-only cleanup steps after the tag is pushed

### Entry point / environment

- Entry point: GitHub repository README, short guides, examples, release-tag workflow, official analyzer CLI
- Environment: GitHub repository + CI/release automation + local install/use path
- Live dependencies involved: GitHub Actions, GitHub Releases, Maven Central / Sonatype, GPG signing, Node-based analyzer build, Gradle/JVM publication modules

## Completion Class

- Contract complete means: public docs, install commands, artifact names, publication paths, and ignore/tracking rules all describe the same product-facing contract
- Integration complete means: analyzer packaging, repo cleanup, docs, examples, and release workflow fit together without exposing `yanote-js`, `.gsd`, `.tmp*`, or other internal-only surfaces as the public happy path
- Operational complete means: a release tag drives the fail-closed release pipeline for shipping artifacts; public `main` no longer accumulates internal process/runtime residue by default

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a fresh reader can follow the README/docs path for recorder → tagging → analyzer without touching internal maintainer/process surfaces
- the analyzer ships as an official standalone CLI surface with a stable public invocation story, while Gradle remains a secondary Java-team path
- the exact tag-driven release workflow validates and publishes the intended shipping artifacts without manual fixups after the tag is pushed

## Risks and Unknowns

- Analyzer publication shape — the user wants an official shipped CLI and Maven-style publication truth, but the current implementation is a private Node build seam; packaging must hide internals without exploding scope
- Public-boundary cleanup can break existing docs/workflow assumptions — current scripts and docs still reference retained proof and internal paths, so cleanup must rewrite the contract, not just delete files
- Release automation truth — the current release workflow exists, but analyzer delivery and the public install story are not yet one coherent shipping surface
- Repo hygiene drift — tracked `.gsd` runtime/state files and tracked `.tmp*` / `.vite` residue already show that the ignore policy and public-boundary rules are not holding

## Existing Codebase / Prior Art

- `.github/workflows/release.yml` — existing tag-driven release workflow and JReleaser/Maven Central publication path for JVM modules
- `.github/workflows/yanote-ci.yml` — existing CI topology, proof jobs, and artifact publication surfaces
- `build.gradle.kts` — current publication allowlist, dist tasks, Node analyzer build, and JReleaser integration
- `jreleaser.yml` — current Maven Central and GitHub release configuration
- `yanote-js/package.json` — current private analyzer implementation and build/test contract
- `README.md` — current public product story, currently too long/noisy for the desired “top-tier” repo surface
- `docs/README.md` — current docs map, useful but still tied to a wider proof-heavy narrative than the user wants
- `.gitignore` — current local/runtime ignore model; not yet enough to keep all internal/public boundaries clean
- `.gsd/PROJECT.md` and `.gsd/REQUIREMENTS.md` — current internal capability/state contract that should remain useful for local GSD work without dictating the public repository face

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R035 — public repo surface must become product-first
- R036 — public docs must be short, current, and task-oriented
- R037 — recorder integration path must be explicit and minimal
- R038 — RestAssured/Cucumber tagging path must be explicit and minimal
- R039 — analyzer must ship as an official standalone CLI surface
- R040 — release tag must fully automate validation and publication
- R041 — internal GSD/process/proof surfaces must leave public main
- R042 — analyzer install/use path must not expose Node internals to users
- R043 — public release/docs/example surfaces must stay truthful after cleanup

## Scope

### In Scope

- redefine the public repository boundary so the GitHub face reads as a clean product repo rather than “мусор” plus “внутренняя кухня”
- give the analyzer an official standalone CLI shipping surface and stable public install/run path
- shorten and simplify public docs around recorder, tagging, analyzer, examples, and release/install truth
- harden ignore/tracking rules so local GSD/runtime/proof residue stays local
- align tag-driven release automation with the intended shipping surfaces

### Out of Scope / Non-Goals

- rewriting the analyzer from Node to JVM/native in this milestone
- keeping `.gsd`, historical proof bundles, or process-heavy history in public `main` “for trust”
- broadening product semantics beyond the already validated M015 capability set
- inventing a hosted dashboard or other new public product surface

## Technical Constraints

- public docs stay Russian-first
- internal planning artifacts may stay English-first, but this context must preserve the user’s exact framing where it matters: “чистый top-tier уровня репозиторий”, “внутренняя кухня”, “без лишнего мусора”, short docs, and explicit use/install/run paths
- no outward-facing GitHub or publication action happens during planning without explicit confirmation; the milestone may wire the automation, but execution still must respect that rule
- existing JVM publications to Maven Central and the existing GitHub Actions topology should be reused where practical instead of replaced gratuitously
- cleanup must preserve local GSD usefulness: internal surfaces may become local/private, but GSD still needs to work correctly in the clone

## Integration Points

- GitHub Actions — build, test, proof, and release execution
- GitHub Releases — published release notes and release assets
- Maven Central / Sonatype — current JVM publication path and desired analyzer publication truth
- JReleaser / GPG signing — release-time signing and deploy orchestration
- Node-based analyzer build — internal implementation seam that must stop leaking into the public happy path
- examples and docs — public-facing explanation of recorder/tagging/analyzer use

## Open Questions

- What exact analyzer publication artifact shape gives the cleanest standalone CLI UX while still fitting Maven Central and the existing release system? — current leaning: publish a versioned official CLI surface, keep Node as an internal build detail, and do not force source-building `yanote-js` into the public path
- Which existing public proof scripts/artifacts still need to remain as CI/release truth, and which are safe to move fully local/private? — current leaning: keep only release/CI surfaces that directly support product/release truth, not process/history clutter
