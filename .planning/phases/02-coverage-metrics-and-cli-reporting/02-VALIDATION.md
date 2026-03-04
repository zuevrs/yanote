---
phase: 02
slug: coverage-metrics-and-cli-reporting
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none (Vitest defaults via `npm -C yanote-js test`) |
| **Quick run command** | `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/report/report.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.test.ts` |
| **Full suite command** | `npm -C yanote-js test && ./gradlew test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run task-scoped tests for the current task plus contract smoke set `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/report/report.test.ts src/cli.report.test.ts src/coverage/statusCoverage.test.ts src/coverage/parameterCoverage.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts src/cli.summary.contract.test.ts`
- **After every plan wave:** Run `npm -C yanote-js test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | COVR-03 | ingestion contract | `npm -C yanote-js run test -- src/events/readJsonl.test.ts src/events/readJsonl.parameters.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | COVR-02 | status coverage scorer | `npm -C yanote-js run test -- src/coverage/statusCoverage.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | COVR-03 | parameter coverage scorer | `npm -C yanote-js run test -- src/coverage/parameterCoverage.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | COVR-04 | schema contract | `npm -C yanote-js run test -- src/report/report.contract.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | COVR-04 | deterministic write boundary | `npm -C yanote-js run test -- src/report/writeReport.determinism.test.ts src/report/report.contract.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | COVR-01/COVR-02/COVR-03 | integrated layered coverage | `npm -C yanote-js run test -- src/coverage/coverage.test.ts src/coverage/coverage.matching.test.ts src/coverage/coverage.parity.test.ts` | ✅ | ⬜ pending |
| 02-03-02 | 03 | 2 | COVR-04 | report payload integration | `npm -C yanote-js run test -- src/report/report.test.ts src/report/report.contract.test.ts src/report/writeReport.determinism.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | COVR-05/DELV-01 | CLI summary + no-ANSI + build | `npm -C yanote-js run test -- src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.test.ts && npm -C yanote-js run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `yanote-js/src/coverage/statusCoverage.ts` + `statusCoverage.test.ts` — stubs for COVR-02
- [ ] `yanote-js/src/coverage/parameterCoverage.ts` + `parameterCoverage.test.ts` — stubs for COVR-03
- [ ] `yanote-js/src/report/schema.ts` + `report.contract.test.ts` — strict schema for COVR-04
- [ ] `yanote-js/src/report/writeReport.determinism.test.ts` — deterministic write contract
- [ ] `yanote-js/src/cli.summary.contract.test.ts` — fixed CLI summary contract for COVR-05
- [ ] `yanote-js/src/events/readJsonl.parameters.test.ts` — parameter evidence ingestion contract
- [ ] `npm -C yanote-js ci` — if framework dependencies are missing

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
