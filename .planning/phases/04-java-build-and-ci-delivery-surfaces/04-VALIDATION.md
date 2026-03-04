---
phase: 04
slug: java-build-and-ci-delivery-surfaces
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-04
---

# Phase 04 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Gradle test (JUnit 5), Vitest, and Docker Compose e2e flow |
| **Config file** | `build.gradle.kts`, `yanote-js/package.json`, `examples/docker-compose.yml` |
| **Quick run command** | `./gradlew test && npm -C yanote-js test` |
| **Full suite command** | `./gradlew test distNodeAnalyzer && npm -C yanote-js test && docker compose -f examples/docker-compose.yml up --build --exit-code-from report` |
| **Estimated runtime** | ~300 seconds |

---

## Sampling Rate

- **After every task commit:** Run that task's exact `<automated>` verify command from its plan file.
- **After every plan wave:** Run `./gradlew test && npm -C yanote-js test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 300 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DELV-02 | plugin contract (task registration and stable task names) | `./gradlew :yanote-gradle-plugin:test` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DELV-02 | multi-module discovery, excludes, aggregate orchestration | `./gradlew :yanote-gradle-plugin:test` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | DELV-02 | local-vs-ci profile defaults and override precedence via Gradle surface | `./gradlew :yanote-gradle-plugin:test && npm -C yanote-js test -- src/gates/policy.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | DELV-03 | GitHub workflow contract with two stable check jobs | `./gradlew test && npm -C yanote-js test` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | DELV-03 | PR summary parity (metrics, top issues, failure ordering) | `npm -C yanote-js test -- src/cli.summary.contract.test.ts src/cli.report.test.ts` | ✅ | ⬜ pending |
| 04-02-03 | 02 | 2 | DELV-03 | deterministic artifact publication on success and failure paths | `./gradlew test && npm -C yanote-js test -- src/report/report.contract.test.ts` | ⚠️ Partial | ⬜ pending |
| 04-03-01 | 03 | 3 | QUAL-02 | required-check topology for PR merge blocking | `./gradlew test && npm -C yanote-js test` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | QUAL-02 | full e2e gate for `main`/release flows | `docker compose -f examples/docker-compose.yml up --build --exit-code-from report` | ✅ | ⬜ pending |
| 04-03-03 | 03 | 3 | QUAL-03 | Java 21 baseline enforcement across required checks | `./gradlew test && java -version` | ⚠️ Partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/yanote-ci.yml` - required checks orchestration, summaries, and artifact upload contract (DELV-03, QUAL-02, QUAL-03)
- [ ] `yanote-gradle-plugin/build.gradle.kts` - plugin module foundation for Gradle delivery surface (DELV-02)
- [ ] `yanote-gradle-plugin/src/main/kotlin/dev/yanote/gradle/YanotePlugin.kt` - stable task contract and opt-in `check` wiring
- [ ] `yanote-gradle-plugin/src/test/kotlin/...` plugin functional tests (task names, aggregate wiring, profile defaults, overrides)
- [ ] CI summary renderer contract (top metrics + top 5 issues + artifact references) mapped from analyzer outputs
- [ ] Branch-protection checklist documenting exact required check names and expected status sources

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Protected branch requires exactly two stable checks (`build-and-test`, `yanote-validation`) | QUAL-02 | GitHub branch protection settings live outside repository code | In repository settings, enable branch protection and set the two check names as required; open a test PR and verify merge is blocked when either check fails. |
| Artifact retention policy matches medium-term contract (7-14 days) | DELV-03 | Retention is configured in workflow/runtime policy and validated in Actions UI | Run workflow, inspect artifact metadata in GitHub Actions, confirm retention days and naming are deterministic. |

---

## Validation Sign-Off

- [x] Nyquist map is 1:1 with planned phase scope (Gradle surface, GitHub surface, merge-blocking hardening)
- [x] Every phase requirement ID (DELV-02, DELV-03, QUAL-02, QUAL-03) appears in the verification map
- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 300s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
