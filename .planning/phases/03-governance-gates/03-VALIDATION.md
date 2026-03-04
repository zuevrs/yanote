---
phase: 03
slug: governance-gates
status: draft
nyquist_compliant: false
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
| **Quick run command** | `npm -C yanote-js run test -- src/gates/*.test.ts src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.test.ts` |
| **Full suite command** | `npm -C yanote-js test && npm -C yanote-js run build && ./gradlew test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm -C yanote-js run test -- src/gates/*.test.ts src/cli.report.test.ts`
- **After every plan wave:** Run `npm -C yanote-js test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | GATE-01 | threshold evaluator | `npm -C yanote-js run test -- src/gates/evaluator.threshold.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | GATE-03 | policy schema + merge/exclusions | `npm -C yanote-js run test -- src/gates/policy.test.ts src/gates/exclusions.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | GATE-02 | regression evaluator + baseline v2 | `npm -C yanote-js run test -- src/gates/evaluator.regression.test.ts src/baseline/baseline.v2.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | GATE-04 | fail-closed integrity contract | `npm -C yanote-js run test -- src/cli.failclosed.contract.test.ts src/events/readJsonl.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | GATE-01/GATE-02/GATE-04 | integrated gate precedence and exit behavior | `npm -C yanote-js run test -- src/cli.report.test.ts src/cli.summary.contract.test.ts src/cli.test.ts` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 3 | GATE-03 | grouped applied exclusions + stale warnings in outputs | `npm -C yanote-js run test -- src/cli.report.test.ts src/report/report.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `yanote-js/src/gates/policy.ts` + `policy.test.ts` - policy DTO/schema/merge stubs for GATE-01/GATE-03
- [ ] `yanote-js/src/gates/exclusions.ts` + `exclusions.test.ts` - auditable exclusion application stubs for GATE-03
- [ ] `yanote-js/src/gates/evaluator.ts` + `evaluator.threshold.test.ts` + `evaluator.regression.test.ts` - gate evaluation stubs for GATE-01/GATE-02
- [ ] `yanote-js/src/gates/failureOrder.ts` tests - deterministic precedence and primary/secondary block ordering for GATE-04
- [ ] `yanote-js/src/baseline/baseline.v2.test.ts` - baseline format/version compatibility tests for GATE-02
- [ ] `yanote-js/src/cli.failclosed.contract.test.ts` - fail-closed matrix tests for GATE-04
- [ ] `npm -C yanote-js ci` - ensure dependencies are installed

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
