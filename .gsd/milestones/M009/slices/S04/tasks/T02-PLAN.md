---
estimated_steps: 7
estimated_files: 8
skills_used:
  - best-practices
---

# T02: Surface provenance-aware HTTP truth in report, gates, CLI, and retained proof

**Slice:** S04 — HTTP and OpenAPI Recorder-Policy And Schema Fidelity Hardening
**Milestone:** M009

## Description

Expose the stronger HTTP provenance truth in user-facing report and gate/CLI surfaces and in the retained live Spring MVC proof so recorder-policy omission is reported distinctly from semantic payload mismatch.

## Steps

1. Decide how recorder-policy omission appears in report and gate/CLI without weakening fail-closed semantics.
2. Extend `httpPayloadSemantics` to interpret provenance states explicitly.
3. Update report and CLI surfaces to surface the new distinction.
4. Refresh retained live proof expectations in `verify-s02-analysis-path.sh`.
5. Add or update tests for report status, governance diagnostics, and CLI summaries.
6. Re-run the live Spring MVC proof.
7. Confirm observation coverage numerators remain unchanged.

## Must-Haves

- [ ] Report/gate/CLI surfaces distinguish recorder-policy omission from semantic mismatch.
- [ ] Existing fail-closed behavior for true semantic drift remains intact.
- [ ] The retained live HTTP proof stays green on supported paths.

## Verification

- `npm -C yanote-js test -- src/gates/httpPayloadSemantics.test.ts src/report/report.test.ts src/report/report.contract.test.ts src/cli.report.test.ts src/cli.failclosed.contract.test.ts src/cli.summary.contract.test.ts`
- `bash scripts/docs/verify-s02-analysis-path.sh`

## Observability Impact

- Signals added/changed: provenance-aware governance/report/CLI semantics and updated retained proof output.
- How a future agent inspects this: report/CLI tests and the retained `verify-s02-analysis-path.sh` artifact set.
- Failure state exposed: recorder-policy omission becomes a first-class visible outcome rather than looking like generic missing-body drift.

## Inputs

- `yanote-js/src/gates/httpPayloadSemantics.ts` — current HTTP semantic failure mapping.
- `yanote-js/src/report/report.ts` — current HTTP report surface.
- `yanote-js/src/cli.ts` — current CLI output surface.
- `scripts/docs/verify-s02-analysis-path.sh` — retained live HTTP proof entrypoint.
- `yanote-js/src/cli.summary.contract.test.ts` — machine-summary contract surface.

## Expected Output

- `yanote-js/src/gates/httpPayloadSemantics.ts` — provenance-aware HTTP semantic mapping.
- `yanote-js/src/gates/httpPayloadSemantics.test.ts` — semantic proof for recorder-policy omission.
- `yanote-js/src/report/report.ts` — report semantics for provenance-aware omission vs semantic drift.
- `yanote-js/src/report/report.test.ts` — report proof for the stronger truth surface.
- `yanote-js/src/report/report.contract.test.ts` — contract proof for stable report shape.
- `yanote-js/src/cli.ts` — CLI wording and machine-summary updates.
- `yanote-js/src/cli.report.test.ts` — CLI proof for provenance-aware HTTP truth.
- `scripts/docs/verify-s02-analysis-path.sh` — retained live HTTP proof updated to the stronger semantics.
