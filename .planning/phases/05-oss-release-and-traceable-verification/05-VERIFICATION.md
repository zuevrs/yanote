---
phase: 05-oss-release-and-traceable-verification
verified: 2026-03-05T05:51:32Z
status: human_needed
score: 16/17 must-haves passed (code complete; external Sonatype namespace/key discovery actions pending)
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
| 1) Publish signed Java artifacts to Maven Central from tagged release workflow runs | HUMAN_NEEDED | Release run `22704093554` (tag `v1.0.119`) reached approval-gated `Publish`, uploaded bundle `dev.yanote-yanote-1.0.119-bundle.zip` as deployment `40d06ed4-238a-4277-8cec-7625092d247c`, then failed on Central-side validation (`Namespace 'dev.yanote'/'dev.yanote.gradle' is not allowed`; signing key fingerprint not discoverable on supported keyservers). |
| 2) Tagged versions produce GitHub Releases with changelog, usage notes, and versioned assets | HUMAN_NEEDED | Release workflow wiring and contracts are green, but `Create GitHub Release` is still skipped because Maven Central deployment fails on external Central account/keyserver policy checks. |
| 3) Release pipelines execute reproducibly from tags and fail deterministically when signing/publishing prerequisites are missing | PASS | Run `22704093554` fails deterministically after approval with explicit deploy diagnostics from JReleaser/Sonatype (namespace allowlist + signature key discovery), proving fail-closed publish behavior. |
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
| 05-02 | Post-approval publish path fails deterministically when required external publish prerequisites are not met | PASS | `gh run view 22704093554 --job 65827491652 --log-failed` plus local `jreleaserFullRelease --stacktrace` show deterministic Sonatype deployment diagnostics (namespace policy + key discovery failures). |
| 05-02 | External release credentials and registry-side prerequisites are provisioned so post-approval publish and GitHub Release creation complete | HUMAN_NEEDED | Repository secrets are now present and consumed, but Central-side prerequisites still fail: namespace authorization (`dev.yanote`, `dev.yanote.gradle`) and key fingerprint discovery on supported key servers. |
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
| RELS-01 | 05-01 | HUMAN_NEEDED | Pipeline and approval gate are proven in live run, but external Central onboarding still blocks acceptance (namespace authorization + key discovery). |
| RELS-02 | 05-02, 05-04 | HUMAN_NEEDED | Release-notes/asset wiring is contract-tested; live run still skips `Create GitHub Release` because Central deployment fails first. |
| RELS-03 | 05-01, 05-02, 05-04 | PASS | Live run proves environment wait/approval transition and deterministic post-approval fail-closed behavior with explicit Sonatype diagnostics. |
| QUAL-01 | 05-03 | PASS | Traceability validator and contract tests remain green with 100% canonical coverage. |

## Live GitHub Run Evidence (Run `22704093554`, Tag `v1.0.119`)

| Command | Outcome | Interpretation |
| --- | --- | --- |
| `gh api repos/zuevrs/yanote/environments/production-release` | `required_reviewers` contains `zuevrs` (`id: 242827918`). | Environment policy prerequisite is configured. |
| `gh run view 22704093554 --json ...` | Run `conclusion=failure`; `Preflight=success`; `Publish=failure`. | Tagged release path executes through gate into publish. |
| `gh api repos/zuevrs/yanote/deployments/3985192179/statuses` | Deployment states include `waiting`, then `queued`, then `in_progress`, then `failure`. | Publish reached approval waiting state, then continued after approval. |
| `gh api repos/zuevrs/yanote/actions/runs/22704093554/approvals` | `state=approved`, `user.login=zuevrs`, `id=242827918`, environment `production-release`. | Approval was recorded for the gated deployment (pending-deployments approval path). |
| `gh run view 22704093554 --job 65827491652 --log-failed` | `jreleaserFullRelease` uploads bundle, then fails with Sonatype deployment diagnostics. | Post-approval publish failure is deterministic and attributable to external Central account/keyserver prerequisites. |

## Automated Evidence Commands and Outcomes

| Command | Outcome |
| --- | --- |
| `node --test scripts/release/maven-central-preflight.contract.test.mjs scripts/release/release-failclosed.contract.test.mjs` | PASS (6/6). |
| `node --test scripts/release/release-workflow.contract.test.mjs scripts/release/github-release.contract.test.mjs` | PASS (10/10). |
| `node --test scripts/release/traceability.contract.test.mjs` | PASS (7/7). |
| `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json --schema .planning/traceability/schema.v1.json` | PASS (`canonical=21`, `mapped=21`, `covered=21`, `coverage-percent=100`, `status=pass`). |
| `gh run view 22704093554 --job 65827451481 --log` | Preflight logs include `tag-signing-key-fingerprint=...` and `preflight-status=pass`. |
| `./gradlew -Pversion=1.0.119 publish distAll cyclonedxBom jreleaserConfig jreleaserFullRelease --stacktrace` (with release env vars) | Reproduces Central deploy failure with explicit payload diagnostics (`Namespace ... is not allowed`, `Invalid signature ... public key fingerprint not found`). |

## Code-Complete vs External Provisioning State

- **Code complete (in-repo):** Yes. Release workflow, preflight, staging publish, signing bootstrap, and traceability contracts are complete.
- **External provisioning:** Not complete. Central account-side namespace authorization and supported keyserver discovery are still required for full publish/release completion.

## Remaining Human Actions

1. In Sonatype Central Portal, grant namespace authorization for published coordinates: `dev.yanote` and `dev.yanote.gradle`.
2. Ensure public key fingerprint `E171E81396502206` is discoverable on Sonatype-supported keyservers (upload/verify propagation).
3. Re-run a stable semver tag release and confirm both `Publish with deterministic same-tag retry policy` and `Create GitHub Release` complete successfully.

## Final Verdict

`status: human_needed`

- Latest goal-backward recheck finds **no code gaps** (`gaps_found = false`).
- Approval gate proof is now complete (environment policy + waiting state + reviewer approval + resume execution).
- Remaining blockers are **external Sonatype namespace/keyserver prerequisites**, not repository code changes.
