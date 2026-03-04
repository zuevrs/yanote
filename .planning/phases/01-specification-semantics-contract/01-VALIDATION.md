---
phase: 1
slug: specification-semantics-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + JUnit 5 |
| **Config file** | `yanote-js` (Vitest defaults), `yanote-core/build.gradle.kts` (JUnit Platform) |
| **Quick run command** | `npm -C yanote-js run test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts && ./gradlew :yanote-core:test --tests "dev.yanote.core.openapi.OpenApiOperationsTest"` |
| **Full suite command** | `npm -C yanote-js test && ./gradlew test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm -C yanote-js run test -- src/spec/openapi.test.ts src/coverage/coverage.test.ts` plus targeted Java openapi/matcher tests.
- **After every plan wave:** Run `npm -C yanote-js test && ./gradlew :yanote-core:test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SPEC-01 | unit + fixture parity | `npm -C yanote-js run test -- src/spec/openapi.test.ts && ./gradlew :yanote-core:test --tests "dev.yanote.core.openapi.OpenApiOperationsTest"` | ✅ partial | ⬜ pending |
| 01-01-02 | 01 | 1 | SPEC-02 | diagnostics contract | `npm -C yanote-js run test -- src/spec/semantics.diagnostics.test.ts && ./gradlew :yanote-core:test --tests "*OpenApiSemanticDiagnosticsTest"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SPEC-03 | deterministic matcher parity | `npm -C yanote-js run test -- src/coverage/coverage.matching.test.ts && ./gradlew :yanote-core:test --tests "*OperationMatcherTest"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `yanote-js/src/spec/semantics.diagnostics.test.ts` — stubs for SPEC-02
- [ ] `yanote-js/src/coverage/coverage.matching.test.ts` — stubs for SPEC-03
- [ ] `yanote-core/src/test/java/dev/yanote/core/openapi/OpenApiSemanticDiagnosticsTest.java` — stubs for SPEC-02
- [ ] `yanote-core/src/test/java/dev/yanote/core/openapi/OperationMatcherTest.java` — stubs for SPEC-03
- [ ] Shared parity fixtures for template ambiguity and encoded-segment cases (Java + TS)
- [ ] `npm -C yanote-js ci` — install Node test dependencies if environment is cold

---

## Manual-Only Verifications

All phase behaviors have automated verification targets.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
