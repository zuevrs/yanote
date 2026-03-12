# S06: Maintained-Product Trust Surfaces

**Goal:** Add the repo-level trust and policy surfaces that GitHub visitors and package consumers expect from a maintained product repository, while keeping Yanote’s support and contribution posture explicit, thin, and maintainer-led.
**Demo:** A repo visitor can see aligned license/repository metadata, clear security/support/contribution boundaries, and guided GitHub-native issue/PR intake surfaces without mistaking Yanote for a high-bandwidth community project.

## Must-Haves

- Add a machine-checked S06 trust-surface contract in `scripts/docs/verify-s06-trust-surfaces.sh` that enforces canonical repo identity, root legal/policy file presence, bounded wording, and GitHub-native intake/ownership surfaces. This directly advances **R030** and protects supporting **R028** and **R029**.
- Align public identity and legal surfaces with the actual repository by adding a root Apache-2.0 `LICENSE` file and fixing stale `github.com/yanote/yanote` URLs in `jreleaser.yml` and the published module POM metadata blocks. This directly advances **R030** and supports **R028**.
- Add concise Russian-first public trust files (`SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`) plus GitHub-native ownership/intake surfaces (`.github/CODEOWNERS`, issue templates, issue config, and PR template) that point back to `docs/release-and-support.md` and `docs/README.md` instead of duplicating version/support truth. This directly advances **R030** and supports **R028** and **R029**.

## Proof Level

- This slice proves: operational
- Real runtime required: no
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s06-trust-surfaces.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`
- `bash scripts/docs/verify-s05-navigation.sh`
- `git diff --check`

## Observability / Diagnostics

- Runtime signals: none — this slice relies on deterministic verifier output and tracked metadata diffs rather than runtime logging.
- Inspection surfaces: `scripts/docs/verify-s06-trust-surfaces.sh`, targeted `rg` on root trust files and publication metadata, plus the existing S04/S05 verifier scripts.
- Failure visibility: path-specific `ERROR:` lines for missing files, stale repository URLs, missing owner/backlinks, vague support promises, or GitHub intake surfaces that drift outside the maintained-product contract.
- Redaction constraints: public contact channels only; no private maintainer workflow details or secrets may be required by the verifier or copied into public trust files.

## Integration Closure

- Upstream surfaces consumed: `docs/release-and-support.md`, `docs/README.md`, `docs/requirements.md`, `README.md`, `jreleaser.yml`, `yanote-core/build.gradle.kts`, `yanote-recorder-spring-mvc/build.gradle.kts`, `yanote-test-tags-restassured/build.gradle.kts`, `yanote-test-tags-cucumber/build.gradle.kts`, `yanote-gradle-plugin/build.gradle.kts`, `.github/BRANCH_PROTECTION.md`, `.github/workflows/yanote-ci.yml`, `.github/workflows/release.yml`
- New wiring introduced in this slice: a dedicated S06 trust-surface verifier; canonical repo/license metadata aligned to the real remote; root trust files wired back to the canonical docs; and GitHub-native ownership/intake files routed through the new policy surfaces.
- What remains before the milestone is truly usable end-to-end: S07 must define the local-only `AGENTS.md` contract, and S08 must rerun the concept → recorder → analyzer journey plus the final repo-surface checks from the docs.

## Tasks

- [x] **T01: Lock the S06 trust contract and fix identity/legal drift** `est:1h`
  - Why: The biggest current trust break is metadata contradiction — adding more policy files before fixing repo/license drift would polish over the wrong repository identity.
  - Files: `scripts/docs/verify-s06-trust-surfaces.sh`, `LICENSE`, `jreleaser.yml`, `yanote-core/build.gradle.kts`, `yanote-recorder-spring-mvc/build.gradle.kts`, `yanote-test-tags-restassured/build.gradle.kts`, `yanote-test-tags-cucumber/build.gradle.kts`, `yanote-gradle-plugin/build.gradle.kts`
  - Do: Add the dedicated S06 shell verifier in the existing doc-contract style; make it fail on missing trust files, missing `LICENSE`, stale `github.com/yanote/yanote` URLs, and missing GitHub-native intake surfaces; run it once to capture the expected initial failure; then add the root Apache-2.0 license and update JReleaser plus each published module POM metadata block to `https://github.com/zuevrs/yanote` / matching SCM URLs while preserving the existing published module scope and developer identity.
  - Verify: `bash scripts/docs/verify-s06-trust-surfaces.sh identity`
  - Done when: the S06 verifier exists with deterministic identity/legal assertions, the root `LICENSE` exists, and the canonical repo URLs in JReleaser and module publication metadata all match the real remote.
- [x] **T02: Add bounded public security, support, and contribution policy surfaces** `est:1h`
  - Why: S06 owns the public trust layer, but it must set real support and contribution expectations without reopening S04’s release/support owner or implying community-first bandwidth.
  - Files: `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`
  - Do: Add concise Russian-first root policy files; route security reports to `zzuevrs@gmail.com`, keep public issues out of the private-vulnerability path, state maintainer-led/no-SLA support expectations, point larger changes to prior discussion, and link back to `docs/release-and-support.md`, `docs/README.md`, and `docs/requirements.md` instead of duplicating release/version/limitation truth.
  - Verify: `bash scripts/docs/verify-s06-trust-surfaces.sh policy && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh`
  - Done when: the three root policy files exist, stay Russian-first and boundary-aware, and the verifier accepts their links and wording without regressing the existing S04/S05 contracts.
- [x] **T03: Add GitHub-native ownership and intake shaping surfaces** `est:1h`
  - Why: The repo still lacks the standard GitHub-native trust layer users expect for filing bugs, asking integration questions, and understanding who reviews changes.
  - Files: `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/ISSUE_TEMPLATE/bug-report.md`, `.github/ISSUE_TEMPLATE/integration-guidance.md`, `.github/PULL_REQUEST_TEMPLATE.md`
  - Do: Add a truthful maintainer CODEOWNERS file rooted at `@zuevrs`; configure issue-template contact links back to `SUPPORT.md` and `SECURITY.md`; add narrow bug-report and integration/documentation-guidance issue templates that ask for concrete reproduction evidence, version/context, and relevant Yanote artifacts; add a PR template that requires scope, verification, docs impact, and boundary-aware reviewer context; then rerun the full S06 verifier together with the existing S04/S05 checks.
  - Verify: `bash scripts/docs/verify-s06-trust-surfaces.sh && bash scripts/docs/verify-s04-boundaries.sh && bash scripts/docs/verify-s05-navigation.sh && git diff --check`
  - Done when: CODEOWNERS, issue config/templates, and the PR template all exist, point to the correct policy surfaces, avoid feature-marketplace/community-governance language, and the full verifier stack passes.

## Files Likely Touched

- `scripts/docs/verify-s06-trust-surfaces.sh`
- `LICENSE`
- `jreleaser.yml`
- `yanote-core/build.gradle.kts`
- `yanote-recorder-spring-mvc/build.gradle.kts`
- `yanote-test-tags-restassured/build.gradle.kts`
- `yanote-test-tags-cucumber/build.gradle.kts`
- `yanote-gradle-plugin/build.gradle.kts`
- `SECURITY.md`
- `SUPPORT.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/ISSUE_TEMPLATE/bug-report.md`
- `.github/ISSUE_TEMPLATE/integration-guidance.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
