# M002/S06 — Research

**Date:** 2026-03-12

## Summary

S06 primarily owns **R030** (repository trust surfaces for a maintained product repo). It also directly supports **R028** (stable support boundaries, limitations, and compatibility story) and **R029** (documentation architecture that separates user docs, maintainer docs, and historical artifacts). The repo already has stronger trust material than it first appears: `README.md`, `docs/README.md`, and `docs/release-and-support.md` give a careful public story; `.github/workflows/release.yml`, `.github/workflows/yanote-ci.yml`, `.github/BRANCH_PROTECTION.md`, and `.github/release.yml` show real operational discipline; `docs/maintainers/README.md` keeps private maintainer mechanics out of the public onboarding path.

What is missing is the **GitHub-native trust layer** that users expect to find without hunting through docs: root legal/support/security surfaces, ownership/routing files under `.github`, and issue/PR intake shaping. The biggest current trust break is not prose polish but **metadata inconsistency**: user-facing docs and the actual remote point to `github.com/zuevrs/yanote`, while `jreleaser.yml` and published POM metadata still point to `github.com/yanote/yanote`. The second hard gap is legal clarity: the published metadata claims `Apache-2.0`, but there is no root `LICENSE` file for GitHub and package consumers to inspect.

The right S06 approach is therefore **curated and additive**, not community-bureaucratic. Fix canonical identity and licensing first, then add a small set of root/`.github` trust files that clarify support, security, contributions, and ownership without pretending Yanote is a high-bandwidth community project. Avoid copying version/support truth out of `docs/release-and-support.md`, avoid public maintainer-only workflow detail, and machine-check the resulting contract with an S06 verifier.

## Recommendation

Implement S06 in four priority steps:

1. **Fix the public identity surfaces before adding more files.**
   - Align `jreleaser.yml` and the published POM metadata blocks in the released modules with the actual repository location (`https://github.com/zuevrs/yanote`).
   - Add a root `LICENSE` file that matches the already-declared `Apache-2.0` metadata.
   - This closes the two biggest trust contradictions visible to package consumers and GitHub visitors.

2. **Add the minimum GitHub-native public trust files that materially help users.**
   - `SECURITY.md` — how to report vulnerabilities, what channel to use, and whether public issues are acceptable for security reports.
   - `SUPPORT.md` — where to ask for help, what kind of support exists, and explicit “no SLA / maintainer-led” boundaries.
   - `CONTRIBUTING.md` — a narrow, truthful contribution contract: docs/bugfix PRs welcome, larger changes by prior discussion, product direction remains maintainer-led.
   - `.github/CODEOWNERS` — explicit review ownership, even if it is just the current maintainer.
   - `.github/ISSUE_TEMPLATE/*` and `.github/PULL_REQUEST_TEMPLATE.md` — lightweight intake shaping so repo interactions ask for the right evidence instead of generic free text.

3. **Be selective about trust files that imply community bandwidth.**
   - `CODE_OF_CONDUCT.md` is optional, not core. It helps community-profile completeness, but it is lower value than `LICENSE`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, and `CODEOWNERS` for a maintainer-led product repo.
   - Avoid adding broad contribution/governance/funding surfaces (`MAINTAINERS.md`, `FUNDING.yml`, elaborate community playbooks, etc.) unless the maintainer explicitly wants them.
   - Keep public trust files short, Russian-first, and boundary-aware.

4. **Lock the result with an S06 verifier.**
   - Add `scripts/docs/verify-s06-trust-surfaces.sh` to check file presence, required wording, canonical repo URL alignment, and that the new files point back to the existing authoritative docs instead of duplicating them.
   - Reuse the S03/S04/S05 shell-verifier style so regressions stay localized and obvious.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Public version/support truth can drift across files | `docs/release-and-support.md` + `scripts/docs/verify-s04-boundaries.sh` | S04 already settled one canonical public owner for stable line, compatibility, and limitations. S06 should point to it, not fork it. |
| Docs trust/navigation can regress silently | `scripts/docs/verify-s03-landing.sh`, `scripts/docs/verify-s04-boundaries.sh`, `scripts/docs/verify-s05-navigation.sh` | The repo already uses targeted shell verifiers for documentation contracts. S06 should extend that pattern instead of relying on prose review. |
| Release/quality discipline needs explanation | `.github/workflows/yanote-ci.yml`, `.github/workflows/release.yml`, `.github/BRANCH_PROTECTION.md`, `.github/release.yml` | These are already the real operational trust surfaces. New trust files should reference this discipline, not invent parallel policy text. |
| Package-consumer trust metadata already exists | `jreleaser.yml` and Maven publication `pom { ... }` blocks | The repo already emits homepage/license/SCM/developer metadata to external consumers. S06 should correct and align those surfaces instead of adding duplicate metadata elsewhere. |

## Existing Code and Patterns

- `README.md` — the public product landing is already conservative and concept-first. It keeps maintainer/history/fallback branches secondary; S06 trust files must not outrank that onboarding path.
- `docs/README.md` — the canonical user-docs map already separates guide-level usage from secondary maintainer/history/reference branches. Reuse it as the “go back here” surface from public trust files when deeper context is needed.
- `docs/release-and-support.md` — the single public owner for stable line `v1.0.x`, latest stable tag `v1.0.122`, compatibility assumptions, limitations, and fallback boundaries. SUPPORT/CONTRIBUTING should defer to it for product boundaries.
- `docs/maintainers/README.md` — model for audience labeling and boundary-aware routing. Useful pattern when public trust files need to say “this repo is maintainer-led” without exposing maintainer-only workflow detail.
- `.github/BRANCH_PROTECTION.md` — stable required-check contract. Good evidence that the repo already behaves like a maintained product even before S06 adds standard trust files.
- `.github/workflows/yanote-ci.yml` — merge-blocking test/validation flow with artifact retention and deterministic summaries. This is real operational trust that public support/contribution files can point at.
- `.github/workflows/release.yml` — tag-driven release preflight, signing checks, production-release environment, traceability gate, release-owner sign-off. Strong existing signal; S06 should surface it rather than duplicate it.
- `.github/release.yml` — deterministic release-note taxonomy. Useful trust signal for “recent changes are structured and maintained.”
- `jreleaser.yml` — highest-impact metadata mismatch today: license is declared, but no root `LICENSE` exists; homepage/docs/bug tracker point to `github.com/yanote/yanote` rather than the actual repo remote.
- `yanote-core/build.gradle.kts` — representative published POM metadata block; same repo-URL/developer wording pattern repeats across released modules and should be normalized once during execution.
- `docs/requirements.md` — explicit scope/deferred/out-of-scope inventory. Useful to link from CONTRIBUTING.md when explaining what kinds of changes fit the current product envelope.

## Constraints

- S06 owns **R030** and directly supports **R028** and **R029**. Any trust surface added here must improve repo trust without weakening the already-set support boundaries or documentation architecture.
- Public documentation remains **Russian-first**. Root trust files can be concise, but they should still be Russian-first and readable to the same target audience.
- The repo posture is explicitly **maintained product, not community-first**. Trust files must set expectations, not advertise broad stewardship or high-touch support.
- `docs/release-and-support.md` is already the canonical public owner for version, support boundaries, compatibility, and limitations. New trust files must point to it rather than duplicate or contradict it.
- `.github/workflows/release.yml` and the release toolchain already consume `docs/requirements.md` and `docs/traceability/*`; S06 should stay additive and avoid path churn that reopens S04/S05.
- The actual git remote is `https://github.com/zuevrs/yanote.git`, and the public docs already point to `https://github.com/zuevrs/yanote/releases`. S06 must reconcile all published metadata to that identity.
- `AGENTS.md` remains out of scope and local-only by decision. S06 must not create a public surrogate for S07.
- GitHub-native health files are only truly discoverable when placed in standard locations (root or `.github`). A custom docs-only location would underserve the slice goal.

## Common Pitfalls

- **Adding community boilerplate that oversells bandwidth** — avoid generic open-source governance bundles. Keep `CONTRIBUTING.md`, `SUPPORT.md`, and templates narrow, explicit, and maintainer-led.
- **Duplicating release/support truth** — do not restate current version line, compatibility matrix, or limitation details in multiple new files. Point back to `docs/release-and-support.md`.
- **Fixing trust surfaces everywhere except published metadata** — if `jreleaser.yml` and POM metadata still point to the wrong repo URL, the repo will keep looking inconsistent to package consumers even after S06 lands.
- **Shipping Apache-2.0 metadata without a root license file** — GitHub and downstream consumers expect a visible `LICENSE`; metadata-only licensing looks incomplete.
- **Making contribution docs the primary onboarding path** — `README.md` and `docs/README.md` already own onboarding. `CONTRIBUTING.md` should not become the first explanation of what Yanote is.
- **Leaking maintainer-only mechanics into public trust files** — release signing details, local maintainer conventions, and future AGENTS workflow belong under `docs/maintainers/` or S07, not in public support/contribution docs.

## Open Risks

- The security-reporting channel is not yet explicit. S06 execution will need a concrete choice: GitHub private vulnerability reporting, an email address, or both. `SECURITY.md` is weak if it cannot name a real intake path.
- `CODEOWNERS` needs a truthful owner target (`@zuevrs` or another current reviewer identity). If ownership is ambiguous, the file becomes theater.
- A broad `CONTRIBUTING.md` or `CODE_OF_CONDUCT.md` could accidentally imply a community model that the milestone explicitly does not want.
- Issue templates can improve trust, but poorly chosen forms can create fake support queues. They should steer toward bug report / integration question / documentation issue rather than feature-marketplace behavior.
- If S06 adds root trust files without adding a verifier, future edits can easily reintroduce URL drift, legal mismatch, or vague support promises.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Technical writing for repo trust/policy copy | `supercent-io/skills-template@technical-writing` | available — install with `npx skills add supercent-io/skills-template@technical-writing` |
| Repository documentation writing | `github/awesome-copilot@documentation-writer` | available — install with `npx skills add github/awesome-copilot@documentation-writer` |
| README / docs scaffolding | `github/awesome-copilot@readme-blueprint-generator` | available — install with `npx skills add github/awesome-copilot@readme-blueprint-generator` |
| Installed local skills | none directly relevant | `debug-like-expert`, `frontend-design`, `playwright-cli`, and `swiftui` are installed locally, but none directly fit repo trust-surface research/execution |

## Sources

- The public onboarding path is already concept-first and carefully demotes maintainer/history/fallback surfaces. S06 should preserve that ordering. (source: [`README.md`](../../../../../README.md), [`docs/README.md`](../../../../../docs/README.md))
- Version, release, compatibility, and limitation truth already has a single public owner and should not be duplicated. (source: [`docs/release-and-support.md`](../../../../../docs/release-and-support.md))
- The repo already shows real operational discipline through required-check documentation, CI validation, and a tag-driven signed release flow. (source: [`.github/BRANCH_PROTECTION.md`](../../../../../.github/BRANCH_PROTECTION.md), [`.github/workflows/yanote-ci.yml`](../../../../../.github/workflows/yanote-ci.yml), [`.github/workflows/release.yml`](../../../../../.github/workflows/release.yml), [`.github/release.yml`](../../../../../.github/release.yml))
- Maintainer-only workflow detail is already separated from public onboarding and should stay that way. (source: [`docs/maintainers/README.md`](../../../../../docs/maintainers/README.md), [`docs/maintainers/release-signing.md`](../../../../../docs/maintainers/release-signing.md))
- Published metadata currently disagrees with the real repo location and therefore weakens trust for package consumers. (source: [`jreleaser.yml`](../../../../../jreleaser.yml), [`yanote-core/build.gradle.kts`](../../../../../yanote-core/build.gradle.kts), [`yanote-gradle-plugin/build.gradle.kts`](../../../../../yanote-gradle-plugin/build.gradle.kts), local `git remote -v` output during this slice)
- GitHub-native trust surfaces are recognized through standard community-health locations; S06 should use root/`.github` rather than inventing custom-only docs locations. (source: [GitHub Docs — Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file), [GitHub Docs — Adding support resources to your project](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-support-resources-to-your-project), [GitHub Docs — Adding a license to a repository](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository), [GitHub Docs — About issue and pull request templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates), [GitHub Docs — Adding a security policy to your repository](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/adding-a-security-policy-to-your-repository))
- Current public release truth matches the latest local stable tag `v1.0.122`, so S06 does not need to reopen S04’s version line — only preserve and surface it correctly. (source: [`docs/release-and-support.md`](../../../../../docs/release-and-support.md), local `git tag --list 'v*' --sort=-version:refname` output during this slice)
