---
estimated_steps: 3
estimated_files: 8
skills_used:
  - github-workflows
  - test
---

# T03: Align public docs and support verifiers with the delivery boundary

**Slice:** S04 — CI, Docs, And Support Truth For Delivery Surfaces
**Milestone:** M013

## Description

Finish the slice by making the published docs and verifier scripts describe exactly the delivery contract that CI and artifacts now implement.

## Steps

1. Update the root/docs/examples landings plus the HTTP and async guides so they mention the stable local baseline, narrow remote single-document `http(s)` `--spec` support with sanitized provenance, additive deprecated semantics, and separate JSON+HTML artifacts.
2. Update `docs/release-and-support.md` so the public support boundary names the widened CI bundles, separate HTTP/async HTML artifacts, and the explicit no-dashboard/no-combined-report boundary without overstating release status.
3. Extend the landing/support verifier scripts so docs fail closed when the new HTML, remote-support, deprecated-semantics, or boundary wording disappears or drifts.

## Must-Haves

- [ ] Public docs describe remote support as a narrow opt-in boundary and keep the local baseline explicit.
- [ ] HTTP and async docs name separate JSON and HTML artifacts without inventing a combined report or hosted dashboard.
- [ ] Shell verifiers pin the widened wording so future edits cannot silently regress the support contract.

## Verification

- `bash scripts/docs/verify-s03-landing.sh && bash scripts/docs/verify-s04-boundaries.sh && git diff --check`
- Manually scan the updated README/guides/support pages to confirm they all point to separate HTTP vs async artifact families and the same local-first/remote-opt-in/no-dashboard wording.

## Inputs

- `README.md` — root landing that introduces the supported analyzer path and retained CI proof bundle.
- `docs/README.md` — docs landing that maps users to the analyzer, async, and release/support guides.
- `examples/README.md` — runnable demo landing that names the public proof bundle artifacts.
- `docs/guides/analyzer-coverage.md` — primary HTTP guide that must explain remote-spec scope, deprecated semantics, and HTML siblings.
- `docs/guides/asyncapi-kafka.md` — separate async guide that must name async HTML siblings without collapsing surfaces.
- `docs/release-and-support.md` — public support boundary owner surface for release/support truth.
- `scripts/docs/verify-s03-landing.sh` — landing-page verifier that must pin the widened public wording.
- `scripts/docs/verify-s04-boundaries.sh` — support-boundary verifier that must pin the widened release/support wording.
- `scripts/ci/render-yanote-summary.mjs` — T02 output whose delivery truth the docs must now describe.
- `.github/BRANCH_PROTECTION.md` — T02 output that documents the stable CI delivery path the public docs reference.

## Expected Output

- `README.md` — root landing updated for separate JSON+HTML artifacts and narrow remote/deprecated/support wording.
- `docs/README.md` — docs landing updated to route users through the widened delivery surfaces honestly.
- `examples/README.md` — runnable demo landing updated to describe the widened retained proof bundle.
- `docs/guides/analyzer-coverage.md` — HTTP guide updated for remote-spec scope, additive deprecated semantics, and separate HTTP HTML output.
- `docs/guides/asyncapi-kafka.md` — async guide updated for separate async HTML output and preserved no-combined boundary.
- `docs/release-and-support.md` — public support boundary updated for widened CI bundles, separate HTML artifacts, and no-dashboard wording.
- `scripts/docs/verify-s03-landing.sh` — landing verifier updated to fail closed on widened delivery wording regressions.
- `scripts/docs/verify-s04-boundaries.sh` — support-boundary verifier updated to fail closed on widened release/support wording regressions.
