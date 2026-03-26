---
id: T03
parent: S03
milestone: M015
provides: []
requires: []
affects: []
key_files: ["scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml", "scripts/ci/fixtures/m015-s03-combined-http.events.jsonl", "scripts/ci/verify-m015-s03-combined-report.sh", "scripts/ci/verify-m015-s03-combined-report.contract.test.mjs"]
key_decisions: ["Used a deterministic `.tmp/m015-s03-combined-proof/` proof bundle with retained stdout/stderr plus manifest/source-path notes so future drift can be localized to HTTP child generation, retained async input, or combined aggregation."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Reread the four authored output files to confirm the expected fixture names, deterministic proof directory, retained stdout/stderr paths, and explicit child-path assertions are present in the repo surface. Attempted the concrete verifier commands `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh`, but the shell runner in this session returned opaque completed/no-output responses and did not leave observable filesystem side effects for independent confirmation, so runtime proof could not be truthfully confirmed in-session."
completed_at: 2026-03-26T19:58:00.299Z
blocker_discovered: false
---

# T03: Added dedicated HTTP fixtures plus a deterministic combined-report dist proof script and contract coverage.

> Added dedicated HTTP fixtures plus a deterministic combined-report dist proof script and contract coverage.

## What Happened
---
id: T03
parent: S03
milestone: M015
key_files:
  - scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml
  - scripts/ci/fixtures/m015-s03-combined-http.events.jsonl
  - scripts/ci/verify-m015-s03-combined-report.sh
  - scripts/ci/verify-m015-s03-combined-report.contract.test.mjs
key_decisions:
  - Used a deterministic `.tmp/m015-s03-combined-proof/` proof bundle with retained stdout/stderr plus manifest/source-path notes so future drift can be localized to HTTP child generation, retained async input, or combined aggregation.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T19:58:00.300Z
blocker_discovered: false
---

# T03: Added dedicated HTTP fixtures plus a deterministic combined-report dist proof script and contract coverage.

**Added dedicated HTTP fixtures plus a deterministic combined-report dist proof script and contract coverage.**

## What Happened

Added dedicated green HTTP proof fixtures under `scripts/ci/fixtures/` so the dist `report` entrypoint can generate a canonical `yanote-report.json` child report without reusing partial unit-test inputs. Added `scripts/ci/verify-m015-s03-combined-report.sh`, which is authored to rebuild proof state into `.tmp/m015-s03-combined-proof/`, fail closed on missing retained async child inputs, retain `http-report.stdout` / `http-report.stderr` and `combined-report.stdout` / `combined-report.stderr`, assert `yanote-combined-report.json` and `.html` exist, require exactly one final `YANOTE_COMBINED_SUMMARY` line, and pin explicit generated-HTTP versus retained-async child report paths plus `protocols=amqp`. Added `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` to keep the deterministic proof directory, canonical fixture paths, retained async child references, manifest/source-path notes, and pinned bundle layout from drifting silently.

## Verification

Reread the four authored output files to confirm the expected fixture names, deterministic proof directory, retained stdout/stderr paths, and explicit child-path assertions are present in the repo surface. Attempted the concrete verifier commands `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh`, but the shell runner in this session returned opaque completed/no-output responses and did not leave observable filesystem side effects for independent confirmation, so runtime proof could not be truthfully confirmed in-session.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` | -1 | ❌ fail | 26900ms |
| 2 | `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh` | -1 | ❌ fail | 22800ms |


## Deviations

None in the authored repo surface. The only execution deviation was environmental: the shell/async command runner stopped producing trustworthy output or observable side effects, so the runtime proof could not be confirmed inside this session.

## Known Issues

The implementation is written, but the final command-level proof is still unconfirmed in this session because the shell harness stopped executing commands observably. Rerun `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh` in a healthy shell environment to confirm the proof bundle under `.tmp/m015-s03-combined-proof/`.

## Files Created/Modified

- `scripts/ci/fixtures/m015-s03-combined-http.openapi.yaml`
- `scripts/ci/fixtures/m015-s03-combined-http.events.jsonl`
- `scripts/ci/verify-m015-s03-combined-report.sh`
- `scripts/ci/verify-m015-s03-combined-report.contract.test.mjs`


## Deviations
None in the authored repo surface. The only execution deviation was environmental: the shell/async command runner stopped producing trustworthy output or observable side effects, so the runtime proof could not be confirmed inside this session.

## Known Issues
The implementation is written, but the final command-level proof is still unconfirmed in this session because the shell harness stopped executing commands observably. Rerun `node --test scripts/ci/verify-m015-s03-combined-report.contract.test.mjs` and `npm -C yanote-js run build && bash scripts/ci/verify-m015-s03-combined-report.sh` in a healthy shell environment to confirm the proof bundle under `.tmp/m015-s03-combined-proof/`.
