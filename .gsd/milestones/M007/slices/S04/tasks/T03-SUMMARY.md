---
id: T03
parent: S04
milestone: M007
provides:
  - Truthful public async guide/owner/support wording and verifier scripts that pin payload-schema drift to the proven Kafka schema-failure path while preserving routing-first, header, broker, and separate-report boundaries.
key_files:
  - docs/guides/asyncapi-kafka.md
  - docs/release-and-support.md
  - docs/requirements.md
  - SUPPORT.md
  - scripts/docs/verify-m005-s01-async-path.sh
  - scripts/docs/verify-m005-s01-async-boundaries.sh
  - .gsd/milestones/M007/slices/S04/tasks/T03-PLAN.md
  - .gsd/KNOWLEDGE.md
  - .gsd/STATE.md
  - .gsd/milestones/M007/slices/S04/S04-PLAN.md
key_decisions:
  - Kept the public async boundary tied to the retained `schema-failure-*` Kafka proof artifacts instead of broadening the claim to generic broker-agnostic or header-level payload enforcement.
patterns_established:
  - For public async docs in this repo, assert retained `schema-failure-*` artifact truth, routing-first coverage wording, and header non-retention through mechanical doc verifiers so stale underclaims cannot return.
observability_surfaces:
  - `bash scripts/docs/verify-m005-s01-async-path.sh`, `bash scripts/docs/verify-m005-s01-async-boundaries.sh`, `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`, `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`, and `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`
duration: ~1h
verification_result: passed
completed_at: 2026-03-20T17:08:00Z
blocker_discovered: false
---

# T03: Rewrite the public async boundary around the proven Kafka schema surface

**Refreshed the public async docs and verifiers around the proven Kafka schema-failure path without widening the product boundary.**

## What Happened

I loaded the `asyncapi-design` and `bash-scripting` skills, fixed the flagged observability gap in `.gsd/milestones/M007/slices/S04/tasks/T03-PLAN.md`, and then rewrote the public async guide, owner boundary, requirements, and support intake surfaces around the runtime truth that T01/T02 now export.

In `docs/guides/asyncapi-kafka.md`, I kept the existing separate async onboarding structure but rewrote the support boundary so it now documents both the canonical happy-path artifact trio and the retained `schema-failure-*` sidecar artifacts from `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`. The guide now states that payload-schema drift is surfaced only for the proven Kafka evidence path, that coverage percentages remain routing-first, and that retained Kafka headers are still unverifiable because they are not preserved in the user-facing proof bundle.

In `docs/release-and-support.md`, `docs/requirements.md`, and `SUPPORT.md`, I removed the stale `payload-schema enforcement пока нет` claim and replaced it with the narrower truthful contract: Kafka-only, Spring Kafka-first, separate async report/gate, payload-schema drift surfaced on the proven Kafka path, routing percentages remain routing-first, retained Kafka headers remain unverifiable, and no broker-agnostic promise. I also narrowed deferred follow-ons in `docs/requirements.md` to deeper schema-keyword/header work, combined report surfaces, and non-Kafka brokers, and I updated the support intake text so payload-drift reports can include the retained `schema-failure-async-report.stderr` and `schema-failure-yanote-async-report.json` sidecars.

I then rewrote `scripts/docs/verify-m005-s01-async-path.sh` and `scripts/docs/verify-m005-s01-async-boundaries.sh` so they no longer enforce the stale underclaim. Instead, they now reject `payload-schema enforcement пока нет`, require the new truthful payload-drift / routing-first / header-boundary clauses, and pin the retained schema-failure artifact wording and support redaction guidance mechanically.

While rereading the owner boundary surface after the main rewrite, I also fixed an unrelated internal contradiction in `docs/release-and-support.md` where the same document still referred to `v1.0.122` in one paragraph after already naming `v1.0.123` as the latest stable release.

Finally, I updated `.gsd/KNOWLEDGE.md` with the non-obvious wording rule that future async-boundary edits must not regress to `payload-schema enforcement пока нет`, marked T03 complete in the slice plan, and advanced `.gsd/STATE.md` out of active execution.

## Verification

I first ran `bash -n` on the two rewritten docs verifier scripts to confirm the bash edits were syntactically sound.

Then I ran the required docs verifiers and the broader slice/runtime verification stack sequentially from this worktree:

- `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/verify-m004-s02-metadata-propagation.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`
- `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs`

All of those checks passed.

For the required observability/manual review pass, I inspected `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr`, `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json`, and `.yanote-ci/live-kafka-proof/artifact-manifest.txt` after the live proof run. The retained sidecar stderr contains typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` lines, the retained sidecar report shows `diagnostics.counts.invalid-payload = 2` with `schemaId: UserCreatedPayload`, and the exported bundle manifest confirms the canonical happy-path trio plus the `schema-failure-*` artifacts are all present. I compared that runtime evidence with the rewritten docs and confirmed the public wording now claims payload drift only for that proven Kafka path, keeps headers unverifiable, and does not introduce any broker-agnostic or combined-report promise.

I did not run `git diff --check` because this auto-mode execution explicitly forbade git commands.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-m005-s01-async-path.sh && bash scripts/docs/verify-m005-s01-async-boundaries.sh` | 0 | ✅ pass | 0.19s |
| 2 | `node --test scripts/ci/export-async-proof-artifacts.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 0.23s |
| 3 | `bash scripts/ci/verify-m004-s02-metadata-propagation.sh` | 0 | ✅ pass | 25.00s |
| 4 | `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh` | 0 | ✅ pass | 71.34s |
| 5 | `bash scripts/ci/verify-m005-s02-async-acceptance.sh` | 0 | ✅ pass | 112.58s |
| 6 | `node --test scripts/ci/verify-m005-s02-async-acceptance.contract.test.mjs scripts/ci/yanote-ci-workflow.contract.test.mjs` | 0 | ✅ pass | 0.17s |
| 7 | `Manual review — compare .yanote-ci/live-kafka-proof/schema-failure-async-report.stderr, .yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json, docs/guides/asyncapi-kafka.md, docs/release-and-support.md, docs/requirements.md, and SUPPORT.md` | n/a | ✅ pass | manual |
| 8 | `git diff --check` | not run | ⚪ skipped | not run |

## Diagnostics

To inspect what this task built later, run:

- `bash scripts/docs/verify-m005-s01-async-path.sh`
- `bash scripts/docs/verify-m005-s01-async-boundaries.sh`
- `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`
- `bash scripts/ci/verify-m005-s02-async-acceptance.sh`

Then inspect:

- `docs/guides/asyncapi-kafka.md` — guide-level wording for the retained Kafka happy-path and schema-failure proof bundle
- `docs/release-and-support.md` — owner boundary for release-vs-HEAD and the narrowed async scope
- `docs/requirements.md` — current async scope plus narrowed async follow-ons/out-of-scope wording
- `SUPPORT.md` — support intake wording and redaction guidance for async payload drift
- `.yanote-ci/live-kafka-proof/artifact-manifest.txt` — confirms the widened deterministic live-proof bundle (`artifact_count=12`, `missing_artifacts=none`)
- `.yanote-ci/live-kafka-proof/schema-failure-async-report.stderr` — typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` stderr lines
- `.yanote-ci/live-kafka-proof/schema-failure-yanote-async-report.json` — retained report-side `invalid-payload` diagnostics with `schemaId: UserCreatedPayload`

If the public docs drift away from this runtime truth, the docs verifier scripts now fail closed with explicit missing/stale clause errors instead of silently allowing the old underclaim back in.

## Deviations

No implementation deviation from the written task plan. The only verification item I left skipped was `git diff --check`, because this auto-mode run explicitly forbade git commands.

## Known Issues

None in the implemented scope.

## Files Created/Modified

- `docs/guides/asyncapi-kafka.md` — rewrote the public async guide around the canonical happy-path bundle, retained schema-failure sidecars, routing-first coverage wording, and the header non-retention boundary.
- `docs/release-and-support.md` — updated the owner boundary to the new truthful Kafka payload-drift wording, added retained sidecar artifact language, and fixed the internal `v1.0.123` release-tag inconsistency.
- `docs/requirements.md` — replaced the stale async underclaim, narrowed deferred async follow-ons to deeper schema/header work plus combined-report and broker scope, and refreshed the out-of-scope wording.
- `SUPPORT.md` — updated the public support intake to the proven Kafka payload-drift truth and added retained schema-failure sidecar guidance plus redaction guidance.
- `scripts/docs/verify-m005-s01-async-path.sh` — now rejects the stale guide wording and asserts retained schema-failure, routing-first, and header-boundary clauses.
- `scripts/docs/verify-m005-s01-async-boundaries.sh` — now rejects the stale owner/support wording and asserts the new truthful boundary, retained sidecar artifacts, narrowed follow-ons, and support redaction guidance.
- `.gsd/milestones/M007/slices/S04/tasks/T03-PLAN.md` — added the missing `## Observability Impact` section required by the execution contract.
- `.gsd/KNOWLEDGE.md` — recorded the repo-specific async-boundary wording rule so future agents do not regress this slice.
- `.gsd/milestones/M007/slices/S04/S04-PLAN.md` — marked T03 complete.
- `.gsd/STATE.md` — advanced the worktree out of active execution and updated the next action after S04 completion.
