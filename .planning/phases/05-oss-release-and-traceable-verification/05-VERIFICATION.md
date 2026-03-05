---
phase: 05-oss-release-and-traceable-verification
verified: 2026-03-05T04:57:39Z
status: human_needed
score: 16/17 must-haves passed (code complete; 1 external secret provisioning action pending)
requirements_in_scope:
  - RELS-01
  - RELS-02
  - RELS-03
  - QUAL-01
---

# Phase 5: OSS Release and Traceable Verification Report

**Phase goal:** Maintainers can publish trusted public releases and prove complete v1 requirement coverage through automated tests.

## Goal-Backward Success Criteria Checks

| Success criterion (ROADMAP) | Result | Evidence |
| --- | --- | --- |
| 1) Publish signed Java artifacts to Maven Central from tagged release workflow runs | HUMAN_NEEDED | Release run `22702951749` (tag `v1.0.114`) reached approval-gated `Publish`, was approved by configured reviewer `zuevrs`, and resumed execution. It then failed deterministically in `:jreleaserConfig` because Maven Central credentials were blank (`deploy.maven.mavenCentral.sonatype.username/password must not be blank`). |
| 2) Tagged versions produce GitHub Releases with changelog, usage notes, and versioned assets | HUMAN_NEEDED | Release workflow wiring and contracts are green, but this live run skipped `Create GitHub Release` because publish failed earlier on missing external Maven Central credentials. |
| 3) Release pipelines execute reproducibly from tags and fail deterministically when signing/publishing prerequisites are missing | PASS | Same run proves deterministic fail-closed behavior after approval: `Build deterministic release outputs` fails with explicit JReleaser validation for missing Maven Central credentials. |
| 4) Team can trace every v1 requirement to automated tests with 100% requirement coverage accountability | PASS | `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json --schema .planning/traceability/schema.v1.json` => `canonical=21`, `mapped=21`, `covered=21`, `coverage-percent=100`, `status=pass`. |

## Must-Haves Matrix

| Plan | Must-have truth | Result | Evidence |
| --- | --- | --- | --- |
| 05-01 | Scoped v1 Java modules publish as signed Maven artifacts with sources/javadocs/Central metadata | PASS | `./gradlew :yanote-core:publishToMavenLocal :yanote-recorder-spring-mvc:publishToMavenLocal :yanote-test-tags-restassured:publishToMavenLocal :yanote-test-tags-cucumber:publishToMavenLocal :yanote-gradle-plugin:publishToMavenLocal` => `BUILD SUCCESSFUL`. |
| 05-01 | Release fails before upload when semver/signing/publish prerequisites are invalid or missing | PASS | `node --test scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs` => 6/6 pass. |
| 05-01 | Pre-release and snapshot versions are blocked from v1 Maven Central publication | PASS | `maven-central-preflight.contract.test.mjs` includes prerelease/snapshot rejection assertions (green). |
| 05-01 | Preflight output records deterministic same-tag retry eligibility for transient publish failures | PASS | `release-failclosed.contract.test.mjs` validates `retry-eligible` / `retry_reason` diagnostics (green). |
| 05-01 | Signed-tag gate passes in CI and preserves explicit diagnostics for unsigned/non-annotated tags | PASS | Run `22702951749` preflight logged `preflight-status=pass`; `scripts/release/preflight.sh` retains explicit `unsigned-tag` and `non-annotated-tag` fail diagnostics (tag-object handling fix preserved). |
| 05-02 | Tagged stable versions trigger deterministic release pipeline with no manual-only bypass | PASS | `release.yml` trigger is `on.push.tags: 'v*.*.*'`; workflow contract tests pass; no `workflow_dispatch` entrypoint exists. |
| 05-02 | Publish job pauses for one explicit manual approval before external publication | PASS | Deployment statuses for run `22702951749` show `waiting -> queued -> in_progress` on `production-release`. |
| 05-02 | Approval is traceably performed by configured reviewer in production environment | PASS | `gh api repos/zuevrs/yanote/actions/runs/22702951749/approvals` => `state=approved`, `user.login=zuevrs`, `id=242827918`, environment `production-release`. |
| 05-02 | Post-approval publish path fails deterministically when required external publish credentials are missing | PASS | `gh run view 22702951749 --job 65824000563 --log-failed` shows `:jreleaserConfig FAILED` with explicit errors for blank Maven Central username/password. |
| 05-02 | External release secrets are provisioned so post-approval publish and GitHub Release creation complete | HUMAN_NEEDED | Same run failed because Maven Central credentials were blank (`JRELEASER_MAVENCENTRAL_USERNAME`/`JRELEASER_MAVENCENTRAL_PASSWORD`); `Create GitHub Release` step was skipped. |
| 05-02 | GitHub release output includes required sections and changelog scope since previous release tag | PASS | `node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` => 10/10 pass; `--previous-tag` wiring is contract-guarded. |
| 05-02 | Deterministic release asset bundle includes dist artifacts, SBOM, SHA-256 checksums/proofs, and manifest | PASS | `github-release.contract.test.mjs` validates bundle invariants and required assets (green). |
| 05-03 | Every v1 requirement has explicit automated traceability entries and runnable commands | PASS | Traceability validator reports full canonical mapping and coverage (21/21). |
| 05-03 | Release fails before publish when traceability is <100% or flaky/quarantined tests are mapped | PASS | `node --test scripts/release/traceability.contract.test.mjs` => 7/7 pass. |
| 05-03 | Traceability output is deterministic schema-versioned JSON + concise markdown sharing snapshot reference | PASS | Validator enforces schema/version/deterministic ordering and snapshot parity (`v1-traceability-20260304`). |
| 05-03 | Traceability artifacts are published in repo and bundled in release assets | PASS | Traceability JSON/markdown files exist and release-bundle contract tests assert inclusion/parity. |
| 05-04 | Gap-closure regressions (tag trigger semantics + previous-tag wiring + manual approval invariants) are permanently guarded | PASS | `release-workflow.contract.test.mjs` assertions for `v*.*.*`, previous-tag output wiring, and approval gate are green. |

**Must-have score:** 16/17 passed, 1/17 human action pending, 0 in-repo code gaps found.

## Requirement Matrix (Plan Frontmatter vs REQUIREMENTS Scope)

| Plan | Frontmatter requirement IDs | IDs exist in `.planning/REQUIREMENTS.md` | IDs in Phase 05 scope (`RELS-01/02/03`, `QUAL-01`) |
| --- | --- | --- | --- |
| `05-01-PLAN.md` | RELS-01, RELS-03 | YES | YES |
| `05-02-PLAN.md` | RELS-02, RELS-03 | YES | YES |
| `05-03-PLAN.md` | QUAL-01 | YES | YES |
| `05-04-PLAN.md` | RELS-02, RELS-03 | YES | YES |

Union across all Phase 05 plans: `RELS-01`, `RELS-02`, `RELS-03`, `QUAL-01` (exact match to Phase 05 roadmap requirement scope).

| Requirement | Covered by plans | Status | Evidence |
| --- | --- | --- | --- |
| RELS-01 | 05-01 | HUMAN_NEEDED | Pipeline and approval gate are proven in live run, but external publish completion is blocked by missing Maven Central credentials. |
| RELS-02 | 05-02, 05-04 | HUMAN_NEEDED | Release-notes/asset wiring is contract-tested; live run skipped `Create GitHub Release` after credential-missing publish failure. |
| RELS-03 | 05-01, 05-02, 05-04 | PASS | Live run proves environment wait/approval transition and deterministic post-approval fail-closed behavior when prerequisite secret is missing. |
| QUAL-01 | 05-03 | PASS | Traceability validator and contract tests remain green with 100% canonical coverage. |

## Live GitHub Run Evidence (Run `22702951749`, Tag `v1.0.114`)

| Command | Outcome | Interpretation |
| --- | --- | --- |
| `gh api repos/zuevrs/yanote/environments/production-release` | `required_reviewers` contains `zuevrs` (`id: 242827918`). | Environment policy prerequisite is configured. |
| `gh run view 22702951749 --json ...` | Run `conclusion=failure`; `Preflight=success`; `Publish=failure`. | Tagged release path executes through gate into publish. |
| `gh api repos/zuevrs/yanote/deployments/3984957661/statuses` | Deployment states include `waiting`, then `queued`, then `in_progress`, then `failure`. | Publish reached approval waiting state, then continued after approval. |
| `gh api repos/zuevrs/yanote/actions/runs/22702951749/approvals` | `state=approved`, `user.login=zuevrs`, `id=242827918`, environment `production-release`. | Approval was recorded for the gated deployment (pending-deployments approval path). |
| `gh run view 22702951749 --job 65824000563 --log-failed` | `:jreleaserConfig FAILED`; explicit JReleaser errors for blank Maven Central Sonatype username/password. | Post-approval publish failure is deterministic and attributable to missing external release credentials. |

## Automated Evidence Commands and Outcomes

| Command | Outcome |
| --- | --- |
| `node --test scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs` | PASS (6/6). |
| `node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` | PASS (10/10). |
| `node --test scripts/release/traceability.contract.test.mjs` | PASS (7/7). |
| `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json --schema .planning/traceability/schema.v1.json` | PASS (`canonical=21`, `mapped=21`, `covered=21`, `coverage-percent=100`, `status=pass`). |
| `gh run view 22702951749 --job 65823969109 --log` | Preflight logs include `tag-signing-key-fingerprint=...` and `preflight-status=pass`. |

## Code-Complete vs External Provisioning State

- **Code complete (in-repo):** Yes. No additional implementation gaps were found in release workflow/preflight/traceability contracts.
- **External provisioning:** Not complete. Production release execution still requires Maven Central and signing credential secrets for full end-to-end publish/release success.

## Remaining Human Actions

1. Provision production release credentials in repository secrets: `JRELEASER_MAVENCENTRAL_USERNAME`, `JRELEASER_MAVENCENTRAL_PASSWORD` (or token equivalent), plus signing secrets `JRELEASER_GPG_SECRET_KEY`, `JRELEASER_GPG_PUBLIC_KEY`, `JRELEASER_GPG_PASSPHRASE`.
2. Re-run a stable semver tag release and confirm both `Publish with deterministic same-tag retry policy` and `Create GitHub Release` complete successfully.

## Final Verdict

`status: human_needed`

- Latest goal-backward recheck finds **no code gaps** (`gaps_found = false`).
- Approval gate proof is now complete (environment policy + waiting state + reviewer approval + resume execution).
- Remaining blocker is **external secret provisioning**, not repository code changes.
