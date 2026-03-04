---
phase: 03
slug: governance-gates
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-04
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none (Vitest defaults via `npm -C yanote-js test`) |
| **Quick run command** | `npm -C yanote-js run test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.test.ts src/report/report.test.ts src/report/report.contract.test.ts` |
| **Full suite command** | `npm -C yanote-js test && npm -C yanote-js run build && ./gradlew test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run that task's exact `<automated>` verify command from its plan file.
- **After every plan wave:** Run `npm -C yanote-js test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | GATE-01 | policy defaults + deterministic precedence resolver | `npm -C yanote-js run test -- src/gates/policy.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | GATE-03 | auditable exclusion engine + critical exclusion guardrails | `npm -C yanote-js run test -- src/gates/exclusions.test.ts src/coverage/coverage.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | GATE-01 | CLI policy/profile override plumbing | `npm -C yanote-js run test -- src/cli.test.ts src/gates/policy.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | GATE-02 | baseline v2 contract + explicit update workflow | `npm -C yanote-js run test -- src/baseline/baseline.v2.test.ts src/gates/evaluator.regression.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | GATE-01/GATE-02/GATE-04 | evaluator thresholds/regression + failure precedence ordering (`failureOrder`) | `npm -C yanote-js run test -- src/gates/evaluator.threshold.test.ts src/gates/evaluator.regression.test.ts src/gates/failureOrder.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | GATE-01/GATE-04 | fail-closed evidence integrity + CLI hard-fail on critical coverage loss | `npm -C yanote-js run test -- src/cli.failclosed.contract.test.ts src/cli.report.test.ts src/events/readJsonl.test.ts src/cli.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | GATE-04 | integrated deterministic governance verdict rendering in CLI | `npm -C yanote-js run test -- src/cli.report.test.ts src/cli.test.ts` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 3 | GATE-04 | primary + secondary failure rendering contract | `npm -C yanote-js run test -- src/cli.summary.contract.test.ts src/cli.test.ts` | ✅ | ⬜ pending |
| 03-03-03 | 03 | 3 | GATE-03 | exclusion transparency in report schema/artifacts | `npm -C yanote-js run test -- src/report/report.test.ts src/cli.report.test.ts src/report/report.contract.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `yanote-js/src/gates/policy.ts` + `policy.test.ts` - policy DTO/schema/merge stubs for GATE-01/GATE-03
- [ ] `yanote-js/src/gates/exclusions.ts` + `exclusions.test.ts` - auditable exclusion application stubs for GATE-03
- [ ] `yanote-js/src/gates/evaluator.ts` + `evaluator.threshold.test.ts` + `evaluator.regression.test.ts` - gate evaluation stubs for GATE-01/GATE-02
- [ ] `yanote-js/src/gates/failureOrder.ts` + `failureOrder.test.ts` - deterministic precedence and primary/secondary ordering contract for GATE-04
- [ ] `yanote-js/src/baseline/baseline.v2.test.ts` - baseline format/version compatibility tests for GATE-02
- [ ] `yanote-js/src/cli.failclosed.contract.test.ts` - fail-closed matrix tests for GATE-04
- [ ] `yanote-js/src/gates/evaluator.threshold.test.ts` includes explicit `critical operation coverage loss => hard-fail` behavior
- [ ] `yanote-js/src/cli.report.test.ts` includes explicit CLI non-zero/primary-failure assertions for critical coverage loss
- [ ] `npm -C yanote-js ci` - ensure dependencies are installed

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] Nyquist map is 1:1 with all plan tasks (9 tasks across waves 1-3)
- [x] All mapped commands match each task's `<automated>` verify command
- [x] `failureOrder` test creation/verification is explicit in plans and matrix
- [x] Critical-operation coverage-loss hard-fail is explicit at evaluator + CLI test levels
- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
