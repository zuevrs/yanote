---
estimated_steps: 24
estimated_files: 6
skills_used: []
---

# T01: Add a newcomer quickstart and fail-closed short-doc landing contract

## Description

Create the short newcomer entrypoint that S03 intentionally left for this slice: one explicit quickstart plus trimmed root/docs landings that send readers first to the product loop instead of deep proof, release, or maintainer surfaces.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Public landing markdown (`README.md`, `docs/README.md`) | Fail closed until the new newcomer path is first in the navigation order and the stale long-form tails are removed | N/A | Reject broken or circular newcomer links instead of silently keeping stale navigation |
| Short-doc verifier and contract test | Keep the task red on missing size ceilings, broken backlinks, or reintroduced proof-first wording | N/A | Reject a verifier that passes overlong or maintainer-first landings |

## Load Profile

- **Shared resources**: the root landing, docs landing, and one new quickstart surface.
- **Per-operation cost**: static markdown plus a small shell verifier and fixture-backed contract test.
- **10x breakpoint**: wording drift across entry surfaces becomes the main failure source long before runtime cost matters.

## Negative Tests

- **Malformed inputs**: missing quickstart link, broken local markdown link, or duplicated/garbled tail text left in the landing docs.
- **Error paths**: `README.md` or `docs/README.md` still foreground `scripts/ci`, CI bundle names, maintainer docs, or reference maps before the newcomer path.
- **Boundary conditions**: the new quickstart exists, both landings stay under explicit size ceilings, and deeper release/support guidance stays secondary.

## Steps

1. Add `docs/guides/getting-started.md` as the one short newcomer path for recorder -> tagging -> analyzer -> repo demo.
2. Rewrite `README.md` and `docs/README.md` so they point to that quickstart first, keep release/support as a secondary boundary owner, and remove the duplicated/garbled tail content currently visible in both files.
3. Add `scripts/docs/verify-m016-s04-short-docs.sh` plus `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs` to fail closed on broken newcomer links, proof-first wording, or size drift (for example `README.md` <= 80 lines, `docs/README.md` <= 70 lines, quickstart <= 140 lines).
4. Update the existing landing verifier so the newcomer path/backlinks are part of the contract.

## Must-Haves

- [ ] Root and docs landings become short entry surfaces that send a reader first to `docs/guides/getting-started.md`.
- [ ] The quickstart names the recorder, tagging, analyzer, and example branches without opening with CI/proof archaeology.
- [ ] Verifiers fail closed on overlong landings, missing newcomer links, or reintroduced proof-first wording.

## Inputs

- `README.md`
- `docs/README.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s03-landing.sh`

## Expected Output

- `README.md`
- `docs/README.md`
- `docs/guides/getting-started.md`
- `scripts/docs/verify-m016-s04-short-docs.sh`
- `scripts/docs/verify-m016-s04-short-docs.contract.test.mjs`
- `scripts/docs/verify-s03-landing.sh`

## Verification

bash scripts/docs/verify-m016-s04-short-docs.sh && node --test scripts/docs/verify-m016-s04-short-docs.contract.test.mjs && bash scripts/docs/verify-s03-landing.sh
