---
id: T02
parent: S04
milestone: M011
key_files:
  - docs/guides/analyzer-coverage.md
  - README.md
  - docs/README.md
  - examples/README.md
  - docs/release-and-support.md
  - scripts/docs/verify-s02-doc-links.sh
  - scripts/docs/verify-s03-landing.sh
  - scripts/docs/verify-s04-boundaries.sh
  - .gsd/KNOWLEDGE.md
  - .gsd/STATE.md
key_decisions:
  - Publish the public HTTP contract around the exact report/CLI surfaces (`HTTP Request Conformance`, `HTTP Payload Conformance`, `httpRequestConformance`, `declaredSupport*`, and additive `YANOTE_SUMMARY` request tokens) instead of broader paraphrase so doc wording matches the real machine surfaces.
  - Make the doc verifier scripts enforce literal retained artifact names, focused proof commands, and the supported request/payload subset so future wording drift fails fast through the standard docs verification entrypoints.
duration: ""
verification_result: passed
completed_at: 2026-03-25T19:41:09.786Z
blocker_discovered: false
---

# T02: Align public HTTP semantics docs and doc verifiers with the retained request sidecar and exact request/payload support limits

**Align public HTTP semantics docs and doc verifiers with the retained request sidecar and exact request/payload support limits**

## What Happened

Rewrote `docs/guides/analyzer-coverage.md` in Russian-first form so it now publishes the real four-surface HTTP story: `Summary`, `HTTP Payload Conformance`, `HTTP Request Conformance`, and the additive `YANOTE_SUMMARY` request tokens. The new guide names the exact supported request subset (`path=simple`, `query=form`, `header=simple`, `cookie=form`, repeated arrays only for `query=form` + `explode=true` + scalar `items`), the additive report contract fields (`httpRequestConformance`, `declaredSupport`, `declaredSupportShape`, `declaredSupportReason`), the `email`-only payload format allowlist, most-specific media matching, the retained `.yanote-ci/v1-e2e/` bundle artifacts, and the focused proof commands for deeper truth. I then propagated the same boundary wording into `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md`, including the additive request sidecar from T01 and explicit references to `bash scripts/ci/verify-m011-s02-request-semantics.sh` and `bash scripts/ci/verify-m011-s03-format-media.sh`. While updating the release/support surface I also corrected the latest stable tag from the stale `v1.0.127` wording to the locally verified `v1.0.128`.

On the enforcement side, I rewrote `scripts/docs/verify-s02-doc-links.sh`, `scripts/docs/verify-s03-landing.sh`, and `scripts/docs/verify-s04-boundaries.sh` so they now fail on drift in the request sidecar artifact names, exact request-subset wording, request `YANOTE_SUMMARY` tokens, focused proof commands, payload format/media wording, and release/support truth. During that work I hit a shell-quoting trap with Markdown backticks inside exact-string verifier needles, fixed the scripts to use safe quoting, and recorded that gotcha in `.gsd/KNOWLEDGE.md`. Finally, I advanced `.gsd/STATE.md` so the local handoff points to slice/milestone closeout instead of back at T02.

## Verification

Verified the rewritten public contract in three layers. First, the doc-verifier layer passed with `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, and `bash scripts/docs/verify-s04-boundaries.sh`, proving the root/docs/examples/release surfaces and exact-string boundary checks all agree on the widened HTTP semantics story. Second, the bundle/test layer passed with `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`, `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh`, and `bash scripts/ci/run-v1-e2e.sh`, proving the retained public bundle, focused request proof, focused payload/media proof, and widened bundle contract all still hold after the doc/verifier rewrite. Third, I directly inspected `.yanote-ci/v1-e2e/artifact-manifest.txt`, `.yanote-ci/v1-e2e/artifact-source-paths.txt`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, and `.yanote-ci/v1-e2e/semantic-red.stderr` to confirm the observability surfaces publish the additive request artifact inventory, `request_semantics_primary=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`, `semantic_red_primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, the retained source-path notes, the request `YANOTE_SUMMARY` tokens, and the fail-closed stderr codes without leaking sensitive values.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/docs/verify-s03-landing.sh` | 0 | ✅ pass | 161ms |
| 2 | `bash scripts/docs/verify-s02-doc-links.sh` | 0 | ✅ pass | 133ms |
| 3 | `bash scripts/docs/verify-s04-boundaries.sh` | 0 | ✅ pass | 195ms |
| 4 | `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs` | 0 | ✅ pass | 243ms |
| 5 | `bash scripts/ci/verify-m011-s02-request-semantics.sh` | 0 | ✅ pass | 29797ms |
| 6 | `bash scripts/ci/verify-m011-s03-format-media.sh` | 0 | ✅ pass | 3582ms |
| 7 | `bash scripts/ci/run-v1-e2e.sh` | 0 | ✅ pass | 27084ms |


## Deviations

Updated `docs/release-and-support.md` to the locally verified latest stable tag `v1.0.128` while doing the boundary rewrite; this was a factual correction uncovered by the verifier rather than a planned content change. I did not run direct `git diff --check` because the auto-mode instructions also explicitly forbade running git commands; all non-git slice verification commands passed.

## Known Issues

None.

## Files Created/Modified

- `docs/guides/analyzer-coverage.md`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/release-and-support.md`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `.gsd/KNOWLEDGE.md`
- `.gsd/STATE.md`
