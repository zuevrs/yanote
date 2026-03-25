# S04: Public Contract Closeout For HTTP Semantics — UAT

**Milestone:** M011
**Written:** 2026-03-25T19:50:07.130Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice closes a public CI/report/docs contract, so the correct proof is the retained bundle, the exact public wording, and the focused verifier stack rather than a new human UI flow.

## Preconditions

- Work from the M011 worktree with Java, Node, Docker, and the repo scripts available.
- No previous `.yanote-ci/v1-e2e/` bundle needs to exist; the public proof script must recreate it deterministically.
- `yanote-js` build dependencies and Gradle wrapper assets may be prewarmed by `bash scripts/ci/run-v1-e2e.sh` as part of the supported flow.

## Smoke Test

Run `bash scripts/ci/run-v1-e2e.sh`.

**Expected:** the command exits successfully and `.yanote-ci/v1-e2e/` contains the happy-path report, additive request-semantics sidecars, payload semantic-red sidecars, `artifact-manifest.txt`, and `artifact-source-paths.txt`.

## Test Cases

### 1. Public retained bundle publishes additive request semantics truth

1. Run `bash scripts/ci/run-v1-e2e.sh`.
2. Open `.yanote-ci/v1-e2e/artifact-manifest.txt`.
3. Confirm it lists `request-semantics.events.jsonl`, `request-semantics.stdout`, `request-semantics.stderr`, `request-semantics-yanote-report.json`, `semantic-red.stdout`, `semantic-red.stderr`, and `semantic-red-yanote-report.json` with `missing_artifacts=none`.
4. Open `.yanote-ci/v1-e2e/artifact-source-paths.txt`.
5. Confirm the request sidecar is described as filtered from `.yanote-ci/v1-e2e/events.jsonl route=/request-evidence/users/{userId}` and that stdout/stderr/report entries identify the host-side analyzer rerun.
6. Open `.yanote-ci/v1-e2e/request-semantics.stdout` and `.yanote-ci/v1-e2e/request-semantics.stderr`.
7. **Expected:** stdout shows `HTTP Request Conformance`, request `YANOTE_SUMMARY` tokens, and a primary semantic failure of `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`; stderr contains `YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` and does not leak retained request values or secrets.

### 2. Public docs publish the exact supported HTTP request/payload boundary

1. Run `bash scripts/docs/verify-s03-landing.sh`.
2. Run `bash scripts/docs/verify-s02-doc-links.sh`.
3. Run `bash scripts/docs/verify-s04-boundaries.sh`.
4. **Expected:** all three verifiers pass, proving that README/docs/examples/release wording mentions the additive request sidecars, the exact supported request subset (`path=simple`, `query=form`, `header=simple`, `cookie=form`, repeated arrays only for `query=form` + `explode=true` + scalar `items`), the request `YANOTE_SUMMARY` / `declaredSupport*` surfaces, the `email`-only payload format allowlist, and most-specific media matching.

### 3. Focused proofs still back the public summary surface

1. Run `bash scripts/ci/verify-m011-s02-request-semantics.sh`.
2. Run `bash scripts/ci/verify-m011-s03-format-media.sh`.
3. **Expected:** the request proof passes with the focused fail-closed unsupported-request path, and the payload proof passes across valid email, invalid email, unsupported/custom format, and most-specific media-selection scenarios.

## Edge Cases

### Unsupported request serialization stays fail-closed in the retained sidecar

1. Open `.yanote-ci/v1-e2e/request-semantics.stdout` after the public bundle run.
2. Confirm the unsupported `meta` query parameter is reported as a typed fail-closed semantic issue rather than treated as covered support.
3. **Expected:** the sidecar keeps operation/status/parameter coverage green while publishing unsupported request truth separately through `httpRequestConformance` and the request `primary` token.

### Most-specific media declarations still beat wildcard siblings

1. Run `bash scripts/ci/verify-m011-s03-format-media.sh`.
2. Inspect the verifier output for the `application/problem+json` scenario.
3. **Expected:** the request is validated against the more specific declaration, producing the intended fail-closed `INVALID_BODY` path while the response remains valid.

## Failure Signals

- `run-v1-e2e.sh` does not recreate the request sidecars or the manifest/source-path notes.
- Any doc verifier fails because exact support-boundary text drifted from the retained proof surface.
- `request-semantics.stderr` lacks `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` or leaks raw retained values/secrets.
- The focused S02/S03 verifiers fail, meaning the public summary surface no longer matches the authoritative deep proofs.

## Requirements Proved By This UAT

- R022 — proves the widened HTTP/OpenAPI request serialization, cookie, media, and format semantics are published truthfully through the retained analyzer/report/docs/CI path.
- R003 — proves the widened semantics still ship through the standard Yanote entrypoints teams already use instead of a separate product surface.

## Not Proven By This UAT

- Cold-start support for running raw `docker compose up` without the host prebuild path.
- Broader unsupported OpenAPI request styles/content constructs beyond the explicitly published subset.
- Any future combined HTTP+async reporting surface.

## Notes for Tester

- A `partial` happy-path report from the public bundle is expected because retained unmatched `/health` and request-evidence traffic are deliberately preserved in the standard demo events.
- Use the focused S02/S03 verifiers, not the public summary bundle alone, when you need root-cause proof for request serialization or payload format/media failures.
