---
phase: 05
slug: oss-release-and-traceable-verification
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-04
---

# Phase 05 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Java: JUnit 5 via Gradle; Node: Vitest + Node `node:test` contract tests |
| **Config file** | `build.gradle.kts`, module `build.gradle.kts`, `yanote-js/package.json` |
| **Quick run command** | `./gradlew :yanote-gradle-plugin:test && npm -C yanote-js test && node --test scripts/ci/*.test.mjs` |
| **Full suite command** | `./gradlew test distAll && npm -C yanote-js ci && npm -C yanote-js test && bash scripts/ci/run-v1-e2e.sh` |
| **Estimated runtime** | ~420 seconds |

---

## Sampling Rate

- **After every task commit:** Run that task's exact `<automated>` verify command from its plan file.
- **After every plan wave:** Run `./gradlew test publishToMavenLocal cyclonedxBom && npm -C yanote-js test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 420 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | RELS-01 | publication preflight contract | `node --test scripts/release/maven-central-preflight.contract.test.mjs` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | RELS-03 | fail-closed prerequisite contract | `node --test scripts/release/release-failclosed.contract.test.mjs` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | RELS-02 | GitHub release bundle contract | `node --test scripts/release/github-release.contract.test.mjs` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | RELS-03 | deterministic tag-release workflow contract | `node --test scripts/release/release-workflow.contract.test.mjs` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | QUAL-01 | traceability schema + gate integration | `node scripts/release/verify-traceability.mjs --requirements .planning/REQUIREMENTS.md --map .planning/traceability/v1-requirements-tests.json` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | QUAL-01 | traceability publication contract | `node --test scripts/release/traceability.contract.test.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/release.yml` - tag-only release workflow with explicit approval gate
- [ ] `.github/release.yml` - deterministic release notes categorization template
- [ ] module publication/signing config (`withSourcesJar`, `withJavadocJar`, POM metadata, signing)
- [ ] `jreleaser.yml` - Central Portal and GitHub release orchestration configuration
- [ ] `org.cyclonedx.bom` integration and SBOM artifact wiring
- [ ] `scripts/release/preflight.sh` - signed tag, semver, and publishing prerequisites checks
- [ ] `scripts/release/verify-traceability.mjs` + schema + contract tests
- [ ] `.planning/traceability/v1-requirements-tests.json` + generated summary markdown

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Release environment approval gate requires explicit release-owner confirmation | RELS-03 | Environment approval policy lives in GitHub settings and cannot be proven by repo files alone | In GitHub Actions environments, set required reviewer(s), run a tag release dry-run, verify publish job waits for explicit approval and records approver. |

---

## Validation Sign-Off

- [x] All planned requirement areas have explicit automated verification targets
- [x] Sampling continuity is defined at task, wave, and phase gates
- [x] Wave 0 captures current missing artifacts needed for RELS/QUAL closure
- [x] No watch-mode flags
- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] Feedback latency < 420s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
