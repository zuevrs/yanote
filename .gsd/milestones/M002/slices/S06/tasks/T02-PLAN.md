---
estimated_steps: 4
estimated_files: 3
---

# T02: Add bounded public security, support, and contribution policy surfaces

**Slice:** S06 — Maintained-Product Trust Surfaces
**Milestone:** M002

## Description

Add the root policy files GitHub users expect to find, but keep them intentionally thin and maintainer-led. This task closes the main public-facing policy gap for **R030** while supporting **R028** and **R029** by routing readers back to the existing canonical docs instead of re-explaining release/support truth in multiple places.

## Steps

1. Add `SECURITY.md` in Russian-first copy with `zzuevrs@gmail.com` as the concrete vulnerability-reporting channel, an explicit “do not open public issues for undisclosed vulnerabilities” rule, and a pointer back to the repo docs for non-security questions.
2. Add `SUPPORT.md` with maintainer-led/no-SLA support boundaries, the intended channels for bugs versus integration/doc questions, and links back to `docs/release-and-support.md` and `docs/README.md` for the authoritative product boundary and user-doc map.
3. Add `CONTRIBUTING.md` with a narrow, truthful contribution contract: docs fixes and focused bugfix PRs are welcome, larger changes should start with prior discussion, and the current product envelope is defined by `docs/release-and-support.md` plus `docs/requirements.md`.
4. Re-run the S06 policy checks together with the S04/S05 verifiers to confirm the new root trust files reinforce the established boundary/docs architecture instead of duplicating or contradicting it.

## Must-Haves

- [ ] `SECURITY.md`, `SUPPORT.md`, and `CONTRIBUTING.md` exist at the repository root and stay Russian-first, concise, and maintainer-led.
- [ ] The three policy files link back to `docs/release-and-support.md`, `docs/README.md`, and `docs/requirements.md` where appropriate instead of duplicating version, limitation, or navigation truth.

## Verification

- `bash scripts/docs/verify-s06-trust-surfaces.sh policy && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
- Spot-check that the security and support channels named in the docs are concrete and do not require private maintainer-only workflow context.

## Observability Impact

- Signals added/changed: deterministic verifier failures for missing root policy files, missing backlinks to canonical docs, or wording that overstates support/community bandwidth.
- How a future agent inspects this: read the root trust files and rerun `bash scripts/docs/verify-s06-trust-surfaces.sh policy`.
- Failure state exposed: the exact public policy file or clause that drifted outside the maintained-product contract becomes visible.

## Inputs

- `docs/release-and-support.md` — canonical public owner for stable line, compatibility assumptions, limitations, and support boundaries.
- `docs/README.md` — canonical user-doc map that support/contribution files should route back to.
- `docs/requirements.md` — current scoped product envelope to reference when contribution scope must stay narrow.
- `docs/maintainers/release-signing.md` — already-published maintainer identity surface that provides the concrete maintainer contact needed for a truthful security channel.

## Expected Output

- `SECURITY.md` — root security policy with a concrete private reporting path and explicit public-issue boundary.
- `SUPPORT.md` — root support policy with maintainer-led/no-SLA expectations and routing to the right public docs/issues surfaces.
- `CONTRIBUTING.md` — root contribution guide that invites narrow, relevant changes without implying a community-first governance model.
