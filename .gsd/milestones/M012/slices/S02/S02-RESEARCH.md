# S02 Research: Public Boundary Closure And Retained Proof

_Gathered: 2026-03-25_

## Skills Discovered

- Existing installed skills used for this research: `openapi-specification-v3.2`, `bash-scripting`
- New skill installs: none

## Requirements Focus

- There are no still-active requirements owned only by S02; this slice closes the public/doc/proof side of already-validated `R001`, `R002`, and `R003`.
- The missing public-boundary clauses from this milestone should be published literally, not implied:
  1. additive security truth must not mutate legacy `coverage.operations/status/parameters/aggregate` numerators;
  2. root `security` inheritance, operation override, `security: []` clear semantics, `{}` optional branches, OR-across-requirement-objects, and AND-within-one-object must stay deterministic and user-visible;
  3. unsupported broader OpenAPI objects (`examples`, `links`, `callbacks`, `webhooks`) must be documented explicitly instead of remaining silent omissions.

## Summary

S01 already delivered the risky implementation work. The missing slice is mostly **public wording + retained proof plumbing**.

What is still absent is not analyzer capability; it is the repo’s published boundary:

- public docs still describe the widened HTTP surface as request/payload-first and do not yet explain supported security semantics or deferred broader OpenAPI objects;
- the retained `.yanote-ci/v1-e2e/` bundle still contains only happy-path + request sidecar + payload semantic-red sidecar;
- the grep-based docs verifiers still hard-code the old request/payload-only vocabulary.

The cheapest truthful closeout is **fixture-backed security proof**, not new example-service endpoints. The repo already has a deterministic security fixture corpus, the CLI/report/CI renderer already understand it, and the example Spring MVC demo does not naturally prove the supported/unsupported security matrix without widening the product demo itself.

## What Exists Now

### Already shipped in code/tests from S01

These files already provide the security behavior S02 needs to publish; they should mostly stay untouched:

- `yanote-js/src/spec/openapi.ts` — materializes typed per-operation security contracts.
- `yanote-js/src/spec/semantics.ts` — resolves effective document/operation security, including inheritance/override/clear/optional/OR/AND semantics.
- `yanote-js/src/coverage/httpSecurityConformance.ts` — computes truthful `apiKey` security results from retained request evidence.
- `yanote-js/src/gates/httpSecuritySemantics.ts` and `yanote-js/src/gates/failureOrder.ts` — map security drift to fail-closed semantic codes with deterministic precedence.
- `yanote-js/src/report/report.ts`, `schema.ts`, `normalize.ts` — publish additive `httpSecurityConformance` without changing legacy coverage numerators.
- `yanote-js/src/cli.ts` — prints `HTTP Security Conformance`, typed stderr lines, and additive `YANOTE_SUMMARY` security tokens.
- `scripts/ci/render-yanote-summary.mjs` — already renders security observations/truths from report artifacts; CI summary logic does **not** need new behavior.

### Existing deterministic security proof corpus

These are the best inputs for S02 proof work:

- `yanote-js/test/fixtures/openapi/http-security-api-key.yaml`
- `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`
- `yanote-js/src/cli.security.report.test.ts`
- `yanote-js/src/cli.security.summary.contract.test.ts`
- `yanote-js/src/report/report.security.contract.test.ts`
- `scripts/ci/render-yanote-summary.test.mjs`

The fixture command is already stable and useful as the public proof kernel:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml \
  --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl \
  --out <tmp> \
  --profile local
```

Observed current facts from that command on this worktree:

- exit code: `5`
- `HTTP Security Conformance` observations: `declared=12 observed_operations=12 evaluations=12`
- security truths: `satisfied=3 missing=1 unavailable=2 unsupported=4 optional=1 clear=1`
- primary failure: `SEMANTIC_HTTP_MISSING_SECURITY`
- ordered secondary failures: two `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, then four `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`
- legacy coverage numerators remain on their existing surfaces; security truth is additive in `httpSecurityConformance`

### Public docs and proof surfaces that are still outdated

These files still speak in request/payload terms and are the main public closeout surface:

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`

### Retained proof/bundle files that still stop before security

- `scripts/ci/run-v1-e2e.sh` — current bundle produces happy path + request sidecar + payload semantic-red sidecar only.
- `scripts/ci/run-v1-e2e.contract.test.mjs` — hard-codes the current sidecar names, manifest keys, and source-note keys.
- `scripts/ci/collect-yanote-artifacts.sh` — already copies the whole `v1-e2e/` directory; probably no code change needed.
- `scripts/ci/collect-yanote-artifacts.test.mjs` — seeds/locks the current bundle inventory and would need updates only if the public bundle file list or manifest keys change.

### Grep-based docs verifiers that must move in lockstep with wording

- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s04-boundaries.sh`

These are strict string-contract scripts. If docs wording changes without corresponding verifier updates, the slice will fail even if the prose is conceptually correct.

## Key Constraints And Forward Intelligence

### 1. Use the OpenAPI security terms literally

The `openapi-specification-v3.2` skill’s security guidance matches S01’s implementation and should drive the public wording:

- root `security` is OR across Security Requirement Objects;
- one requirement object is AND across its listed schemes;
- `{}` is an optional branch;
- operation-level `security` overrides root `security`;
- `security: []` explicitly clears inherited requirements.

S02 docs should state these literally because they are now product boundary, not internal implementation detail.

### 2. Keep the truthful support subset narrow and explicit

Supported now:

- `apiKey` in `query`
- `apiKey` in `header`
- `apiKey` in `cookie`

Must remain explicit fail-closed / unavailable / unsupported:

- redacted/omitted retained evidence → `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`
- `http`, `oauth2`, `openIdConnect`, `mutualTLS` security types → `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`
- unsupported `apiKey` locations such as `path` → `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`

### 3. Deferred broader OpenAPI objects must be named

The roadmap/research stance is already decided; S02 needs to publish it:

- `examples` — deferred
- `links` — deferred
- `callbacks` — deferred
- `webhooks` — deferred

Do not phrase this as “not yet covered in examples” or other soft wording. The public boundary should say these objects are outside the current supported surface.

### 4. Prefer fixture-backed proof over widening the example service

The Spring MVC demo currently proves live request/payload behavior, not the broader security matrix. Relevant constraint files:

- `examples/springmvc-service/src/main/java/dev/yanote/examples/service/ExampleServiceApplication.java`
- `examples/openapi/demo-openapi.yaml`
- `examples/openapi/request-evidence-openapi.yaml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`

Adding real live security routes/tests/specs here would expand the demo surface, not just close docs/proof. For S02, a fixture-backed security verifier is cheaper and more truthful.

### 5. Be honest about artifact provenance inside the retained bundle

Current public docs describe `.yanote-ci/v1-e2e/` as a bundle around the live demo path. If S02 adds security proof via fixtures, docs must say so explicitly:

- happy-path report remains live-demo derived
- request sidecar remains live-demo derived
- payload semantic-red sidecar remains live-demo derived
- new security sidecar is fixture-backed from `yanote-js/test/fixtures/...`

Without this note, users will incorrectly infer that the example service proves the supported/unsupported security family.

### 6. Do not copy the raw security events fixture into the public bundle unless it is sanitized first

`yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl` contains fake secret-like captured values (`header-secret-123`, `query-secret-456`, `oauth-secret`, `oidc-secret`, etc.).

For public retained artifacts, the safer pattern is:

- retain `security-semantics.stdout`
- retain `security-semantics.stderr`
- retain `security-semantics-yanote-report.json`
- record the source fixture paths in `artifact-source-paths.txt`
- avoid copying the raw fixture JSONL into `.yanote-ci/v1-e2e/`

That keeps the bundle secret-safe while preserving rerunnable provenance.

### 7. Decide explicitly whether to pin zero-count security visibility on the live analyzer proof

Current non-security demo output already includes `HTTP Security Conformance` and zeroed machine tokens, e.g. a happy-path-like HTTP run shows:

- `security_declared_operations=0`
- `security_observed_operations=<observed operations>`
- `security_observed_evaluations=0`
- zeroed `security_truths=...`

Implication:

- if docs start describing `HTTP Security Conformance` as part of the generic HTTP report output, `scripts/docs/verify-s02-analysis-path.sh` can safely add a light assertion for that section/tokens;
- if docs describe security mostly as a focused proof/report surface, that live verifier can stay untouched and the new focused security verifier carries the proof burden.

Either path is workable; the planner should choose one and keep docs/verifiers consistent.

## Natural Task Seams

### Seam 1 — Focused retained security verifier

**Best new file:** `scripts/ci/verify-m012-s02-security-semantics.sh` (name can vary, but keep the `M012/S02` prefix stable).

Model it after the fixture-driven structure of `scripts/ci/verify-m011-s03-format-media.sh`, not the live-service structure of `scripts/ci/verify-m011-s02-request-semantics.sh`.

Expected assertions:

- build `yanote-js`
- run the fixture command above
- require exit `5`
- require `HTTP Security Conformance` block in stdout
- require `YANOTE_SUMMARY` security tokens
- require ordered typed stderr failures
- require `httpSecurityConformance` in JSON with expected counts/order
- require `schemaVersion=1.0.0`
- require unchanged legacy coverage surfaces
- require no leak of fake secret-like values into stdout/stderr/report JSON

### Seam 2 — Public retained bundle expansion

Files:

- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`

Recommended sidecar names:

- `security-semantics.stdout`
- `security-semantics.stderr`
- `security-semantics-yanote-report.json`

Recommended manifest/source-note additions:

- `security_semantics_expected_exit=5`
- `security_semantics_primary=SEMANTIC_HTTP_MISSING_SECURITY`
- `security-semantics.stdout=host:node ... --spec yanote-js/test/fixtures/openapi/http-security-api-key.yaml --events yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl ...`
- analogous `stderr`/report entries

This seam should come **after** the focused verifier so the exact contract is already known.

### Seam 3 — Public docs update

Core files:

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/release-and-support.md`

What these docs now need to say explicitly:

- supported security semantics: inheritance, override, clear, optional, OR, AND
- truthful support subset: `apiKey` query/header/cookie only
- fail-closed unsupported/unavailable behavior with the new semantic codes
- additive report surface: `httpSecurityConformance`, CLI block, `YANOTE_SUMMARY` security tokens, CI summary
- unchanged legacy coverage numerators
- deferred broader OpenAPI objects: `examples`, `links`, `callbacks`, `webhooks`
- the proof provenance split between live sidecars and the fixture-backed security sidecar

Optional supporting surface:

- `docs/requirements.md` if you want a centralized public defer table for these broader OpenAPI objects, but this is not required by the roadmap text.

### Seam 4 — Docs verifier sync

Files:

- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s04-boundaries.sh`

These should be updated only **after** final wording and artifact names are settled. They are the brittle last-mile contract.

Likely additions:

- `HTTP Security Conformance`
- `httpSecurityConformance`
- `security_declared_operations`
- `security_observed_operations`
- `security_observed_evaluations`
- `security_truths`
- `SEMANTIC_HTTP_MISSING_SECURITY`
- `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`
- `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`
- the new focused verifier command
- the new `security-semantics.*` sidecar names
- explicit defer wording for `examples`, `links`, `callbacks`, `webhooks`

### Seam 5 — Bundle collector test sync (only if bundle inventory is treated as public contract)

Files:

- `scripts/ci/collect-yanote-artifacts.test.mjs`

`collect-yanote-artifacts.sh` already copies the whole `v1-e2e/` directory, so it probably does not need code changes. The test only needs updates if the widened bundle file list/manifest keys are considered part of the retained artifact contract.

## Recommended Build Order

1. **Choose artifact names and wording anchors first.** The bundle script, docs, and grep tests all lock onto exact strings.
2. **Implement the focused security verifier.** This gives the planner one precise contract for stdout/stderr/report truth.
3. **Expand `scripts/ci/run-v1-e2e.sh` and its contract test** to retain the same security proof inside the public bundle.
4. **Update docs** once the proof command and sidecar names are stable.
5. **Update grep-based docs verifiers last** so they reflect the final prose rather than forcing premature wording.
6. **Optionally update `scripts/docs/verify-s02-analysis-path.sh`** only if you choose to pin zero-count security visibility on the live analyzer demo.

## Verification

Minimum stack for this slice:

```bash
node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs
bash scripts/ci/verify-m012-s02-security-semantics.sh
bash scripts/docs/verify-s03-landing.sh
bash scripts/docs/verify-s02-doc-links.sh
bash scripts/docs/verify-s04-boundaries.sh
git diff --check
```

If the live analyzer proof is updated to assert security visibility too, also run:

```bash
bash scripts/docs/verify-s02-analysis-path.sh
```

For the full retained bundle proof:

```bash
bash scripts/ci/run-v1-e2e.sh
```

## Planner Notes

- Do **not** spend executor time re-opening analyzer internals unless a proof contract fails unexpectedly; S01 already delivered the underlying semantics.
- `scripts/ci/render-yanote-summary.mjs` and its tests already understand security; avoid touching them unless the artifact plumbing itself changes.
- `docs/release-and-support.md` is also under a dynamic verifier that resolves the latest tag/release line at runtime. Add security/defer bullets without disturbing the existing version-truth paragraphs.
- Public repo docs are Russian-first, but internal research/planning can stay English-first. When executors edit public docs, keep the actual prose Russian-first and use exact machine tokens/code names inside backticks.
