---
estimated_steps: 4
estimated_files: 8
skills_used:
  - debug-like-expert
---

# T02: Align public landing, example, and release surfaces to the final product story

**Slice:** S05 — Final public-surface integration proof
**Milestone:** M016

## Description

Use the composed S05 proof expectations to reconcile the public repo face so it stays product-first and truthful. This task keeps the visible README/docs/examples/release story aligned with the same standalone analyzer, clean-boundary, and release-asset contract that the final verifier will exercise.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public landing/example/release docs | Fail closed until asset names, backlinks, and owner-map order match the final public story | N/A | Reject mixed wording where one surface reintroduces clone-local proof breadcrumbs or stale raw-Node seams |
| Focused doc verifiers | Keep the task red until landing, short-doc, example-boundary, and release-boundary checks all agree on the same claims | N/A | Reject verifiers that still pass outdated wording or miss final-story regressions |

## Load Profile

- **Shared resources**: `README.md`, `docs/README.md`, `examples/README.md`, `docs/release-and-support.md`, and the focused shell verifiers that already guard them.
- **Per-operation cost**: static markdown edits plus several fail-closed shell checks.
- **10x breakpoint**: copy drift across the public docs will break first, long before command runtime becomes the constraint.

## Negative Tests

- **Malformed inputs**: broken relative markdown links, missing quickstart-first ordering, or missing public asset names.
- **Error paths**: public docs mention `.gsd/`, `.tmp*`, `.yanote-ci/`, maintainer-only proof leaves, or raw `node yanote-js/dist/yanote.cjs` seams as part of the happy path.
- **Boundary conditions**: allowed public asset names stay intact, while maintainer-only breadcrumbs remain absent from public onboarding and support surfaces.

## Steps

1. Use the new S05 verifier expectations plus the existing S03/S04 guards to identify any cross-surface drift among `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`.
2. Tighten wording, order, and backlinks so those public surfaces remain quickstart-first, use only public asset names, and keep the standalone analyzer / release-tag publication story consistent.
3. Update the landing, short-doc, example-boundary, and release-boundary verifiers anywhere the final story changes so regressions fail closed.
4. Re-run the focused doc stack until the public repo face is green before the live runtime/release proof task.

## Must-Haves

- [ ] Public root/docs/examples/release surfaces stay product-first and silent about clone-local proof roots.
- [ ] Public asset names and owner-map/backlink order stay consistent across root/docs/examples/release surfaces.
- [ ] The focused doc/boundary verifiers fail closed on final-story regressions instead of relying on manual prose review.

## Verification

- `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`
- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-m016-s04-short-docs.sh`
- `bash scripts/docs/verify-s03-example-boundary.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s05-navigation.sh`

## Observability Impact

- Signals added/changed: deterministic `ERROR[...]` lines from the focused doc/boundary verifiers when asset names, ordering, or public/private wording drifts.
- How a future agent inspects this: rerun the focused doc stack above and inspect the exact failing file/assertion.
- Failure state exposed: the public surface that drifted and the specific wording/order rule it violated.

## Inputs

- `scripts/docs/verify-m016-s05-public-surface.sh` — the new composed proof contract from T01 that defines the final public-story expectations.
- `README.md` — public product landing that must stay quickstart-first.
- `docs/README.md` — docs owner map that must remain aligned to the same public story.
- `examples/README.md` — repo demo landing that must stay product-facing.
- `docs/release-and-support.md` — public release/support owner surface that must stay truthful about asset names and release boundaries.
- `docs/requirements.md` — secondary public reference surface whose owner-map/backlink expectations must continue to pass navigation checks.

## Expected Output

- `README.md` — finalized product-first public landing aligned to the composed proof.
- `docs/README.md` — finalized docs owner map aligned to the same public story.
- `examples/README.md` — repo demo landing that stays truthful about the standalone analyzer/demo path.
- `docs/release-and-support.md` — release/support owner surface aligned to the final public proof.
- `scripts/docs/verify-s03-landing.sh` — landing verifier updated if root/docs/examples ordering changes.
- `scripts/docs/verify-m016-s04-short-docs.sh` — short-doc verifier updated if final-story wording/order changes.
- `scripts/docs/verify-s03-example-boundary.sh` — example-boundary verifier updated if demo wording expectations shift.
- `scripts/docs/verify-s04-boundaries.sh` — release-boundary verifier updated if final-story wording changes.
