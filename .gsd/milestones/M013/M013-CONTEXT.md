---
depends_on: [M012]
---

# M013: Analyzer Delivery, Remote Spec, And Report UX

**Gathered:** 2026-03-23
**Status:** Queued — pending auto-mode execution.

## Project Description

Yanote’s analyzer surfaces are already deterministic and CI-friendly, but they are still operator-oriented rather than broadly ergonomic. Specs are loaded from local file/directory paths, there is no HTML/human-facing report writer, and deprecated operations have no dedicated first-class handling. M013 is the milestone for analyzer delivery and report UX after the HTTP and async semantic foundations are strong enough to be worth presenting more broadly.

## Why This Milestone

Once M010–M012 strengthen what the analyzer actually proves, the next gap is how teams consume it. A real coverage product benefits from easier spec retrieval, human-friendly report views, and better operator controls around deprecated endpoints. Those improvements should come after the semantic surfaces are stable enough that the new UX is presenting a settled truth rather than a moving target.

## User-Visible Outcome

### When this milestone is complete, the user can:

- run Yanote against local or supported remote spec sources without prefetching everything into the workspace manually
- open a human-friendly report artifact in addition to JSON/stdout and use it for reviews and triage
- treat deprecated operations as a controlled reporting surface instead of an all-or-nothing manual interpretation problem

### Entry point / environment

- Entry point: `node yanote-js/dist/yanote.cjs report`, report artifacts, CI uploads, and maintainer/user docs
- Environment: local development, CI, offline/restricted environments where applicable, and report consumption outside raw JSON parsing
- Live dependencies involved: OpenAPI/AsyncAPI spec loading path, report writers, CLI/report delivery, CI artifact publishing surfaces

## Completion Class

- Contract complete means: supported remote-spec, deprecated-operation, and human-facing report surfaces are explicit and deterministic.
- Integration complete means: the new delivery/report UX works with the existing analyzer/report pipeline instead of forking its semantics.
- Operational complete means: teams can consume the same analyzer truth through machine-readable and human-friendly surfaces in local and CI paths.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- supported remote spec loading works without regressing the current deterministic local-spec path
- HTML/human-friendly report artifacts reflect the same contract truth as `yanote-report.json` and `yanote-async-report.json`
- deprecated-operation handling is explicit in docs/report semantics instead of living as an undocumented manual convention

## Risks and Unknowns

- Remote spec loading adds network/auth/reproducibility concerns. — The supported remote retrieval path has to stay deterministic enough for CI and support.
- A human-facing writer can drift from the JSON truth. — HTML/report UX must be generated from the same canonical report model, not a parallel interpretation layer.
- Deprecated-operation handling can become policy-heavy. — The milestone should provide explicit behavior without overfitting to one team’s governance rules.

## Existing Codebase / Prior Art

- `yanote-js/src/spec/discover.ts` — verified current spec discovery assumes local file/directory paths rather than remote URLs.
- `yanote-js/src/cli.ts` — verified current delivery surface is stdout + JSON report only; there is no HTML writer path.
- `yanote-js/src/report/` — current report model/writers are machine-readable and deterministic, but not yet human-facing document surfaces.
- `docs/guides/analyzer-coverage.md`, `docs/guides/asyncapi-kafka.md`, and `docs/release-and-support.md` — current docs assume local/spec-source setup and JSON/stdout consumption.
- `README.md` and release asset/report bundle surfaces — current product UX references to preserve while broadening delivery ergonomics.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- `R003` — directly extends the usability of the existing CLI/report/CI delivery surfaces
- `R004` — any remote loading/report UX must stay honest about release/support boundaries
- `R005` — async surfaces remain separate even if delivery/report UX becomes friendlier

## Scope

### In Scope

- supported remote spec loading for analyzer execution
- deprecated-operation handling as an explicit report/policy surface
- human-friendly report artifacts generated from the canonical report models
- doc and CI artifact updates for the richer delivery/report UX

### Out of Scope / Non-Goals

- changing the core HTTP/async semantics themselves
- combined HTTP+async report semantics
- broker expansion or broader OpenAPI/AsyncAPI semantic work
- arbitrary templating systems that fork report truth from the canonical models

## Technical Constraints

- Human-facing reports must derive from the same canonical report models as JSON output.
- Remote spec support must keep reproducibility and auth boundaries explicit.
- Preserve the separate HTTP and async report surfaces even if writers and delivery paths become friendlier.

## Integration Points

- spec discovery/loading path in `yanote-js`
- canonical HTTP and async report models/writers
- CI artifact surfaces and release assets
- user-facing docs that explain how to run and consume the analyzer

## Open Questions

- Which remote spec sources should be first-class: raw URL, authenticated URL, or repository-hosted artifacts? — Current leaning: start narrow and deterministic.
- Should deprecated operations be excluded, down-weighted, or simply labeled distinctly? — Current leaning: make the behavior explicit and configurable rather than implicit.
