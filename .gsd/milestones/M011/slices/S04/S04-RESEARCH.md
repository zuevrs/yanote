# S04 — Research

**Date:** 2026-03-25

## Summary

S04 is mostly a public-surface closeout slice, not a new analyzer slice. The request/cookie/serialization semantics from S01–S02 and the format/media semantics from S03 are already implemented in code, schema, CLI output, and focused verifiers. The gap is that the public docs and retained public proof surfaces still narrate the older payload-first boundary.

The biggest stale surface is `docs/guides/analyzer-coverage.md`. It still explains payload semantics well, but it does not publish the M011 request subset, additive `httpRequestConformance` report shape, additive `YANOTE_SUMMARY` request tokens, explicit `email` allowlist semantics, or most-specific media matching. It also has a visibly corrupted duplicated tail after `## Связанные поверхности`, so a whole-file rewrite is safer than incremental patching.

A useful surprise: `scripts/ci/run-v1-e2e.sh` may already be able to expose M011 request truth without any new runtime orchestration. The compose test service runs `:examples:tests-restassured:test --rerun-tasks` with no class filter, and that module now contains both `DemoServiceE2eTest` and `HttpRequestEvidenceE2eTest`. So the retained live `.yanote-ci/v1-e2e/events.jsonl` already contains `/request-evidence/users/{userId}` traffic. If S04 wants the public retained bundle to surface request semantics, it can add a sidecar by filtering the already-recorded live events and rerunning `yanote report` against `examples/openapi/request-evidence-openapi.yaml`.

For S03, the situation is different. The green supported-format path is already exercised by the standard demo because `examples/openapi/demo-openapi.yaml` declares `format: email` on `POST /users`. But the unsupported/custom-format and media-specificity red cases depend on dedicated fixtures and are already well-proven by `scripts/ci/verify-m011-s03-format-media.sh`. The public bundle does not need to absorb that whole matrix unless the team explicitly wants a larger retained artifact surface.

## Skills Discovered

No new skill installation was needed.

Relevant installed skills for this slice:

- `openapi-specification-v3.2`
- `bash-scripting`
- `vitest`
- `json-schema-validator`

Rules worth carrying into planning:

- From `openapi-specification-v3.2`: publish the supported subset explicitly; do not imply blanket `format` or serialization support. Parameter objects use either `schema`/`style` or `content`, so Yanote’s unsupported-`content` boundary should remain visible instead of being softened in docs.
- From `openapi-specification-v3.2`: media ranges should be interpreted by specificity, so docs should say “most specific declaration wins” rather than implying declaration order truth.
- From `bash-scripting`: keep strict mode, explicit exit-code checks, cleanup traps, and deterministic artifact manifests/source notes for proof scripts instead of ad-hoc temp handling.

## Relevant Requirements

- **Primary:** `R022` — this slice closes the public contract for the supported HTTP semantics already implemented in S01–S03.
- **Primary public-surface requirement:** `R003` — the widened truth must be visible through existing CLI/report/docs/CI entrypoints rather than a side channel.
- **Guardrails to preserve:**
  - `R001` — keep recorder → JSONL → analyzer → report deterministic; extend public proof surfaces additively instead of replacing the existing happy path.
  - `R002` — public wording and retained proof must keep fail-closed unsupported/unavailable semantics explicit instead of collapsing them back into green coverage language.

## Recommendation

1. **Rewrite `docs/guides/analyzer-coverage.md` first.**
   It is now the authoritative stale surface. All other public docs mirror it, and it is already malformed at the tail.

2. **Keep the public bundle additive.**
   Do not replace the existing happy path or the current `semantic-red` unsupported-schema sidecars. If S04 widens `scripts/ci/run-v1-e2e.sh`, add a separate request-semantic sidecar derived from the already-retained live events.

3. **Do not force S03’s full fixture matrix into `run-v1-e2e.sh`.**
   The standard demo already proves green `format: email` on live `POST /users`. The red S03 cases are better kept on the existing focused verifier `scripts/ci/verify-m011-s03-format-media.sh`, and public docs should point to it explicitly.

4. **Prefer extending the existing doc/bundle contract scripts over inventing a new verification layer.**
   The repo already has the right seams:
   - docs landing: `scripts/docs/verify-s03-landing.sh`
   - analyzer guide wording: `scripts/docs/verify-s02-doc-links.sh`
   - public boundary wording: `scripts/docs/verify-s04-boundaries.sh`
   - public bundle contracts: `scripts/ci/run-v1-e2e.contract.test.mjs`, `scripts/ci/collect-yanote-artifacts.test.mjs`

## Implementation Landscape

### 1. Canonical analyzer guide is payload-era and partially corrupted

**File:** `docs/guides/analyzer-coverage.md`

Current gaps:

- no explanation of `HTTP Request Conformance`
- no explanation of top-level `httpRequestConformance` in `yanote-report.json`
- no publication of additive `YANOTE_SUMMARY` request tokens:
  - `request_observed_operations`
  - `request_observed_parameters`
  - `request_truths`
- no explicit support matrix for request semantics:
  - `path=simple`
  - `query=form`
  - `header=simple`
  - `cookie=form`
  - repeated arrays only for `query=form` + `explode=true` + scalar items
- no public explanation of `declaredSupport`, `declaredSupportShape`, `declaredSupportReason`
- no publication of the explicit payload format allowlist (`email` first)
- no explanation of declared-but-unsupported/custom formats as fail-closed truth
- no explanation of most-specific media-type matching
- no public pointer to the focused M011 proof scripts
- duplicated/corrupted tail after `## Связанные поверхности`

**Planning implication:** treat this as a rewrite task, not a small edit task.

### 2. Landing and boundary docs still narrate only payload-first HTTP truth

**Files:**

- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/release-and-support.md`

Current state:

- these files still frame the public HTTP boundary mostly as observation coverage + payload conformance
- `docs/release-and-support.md` still says the supported HTTP boundary is essentially “JSON-first request/response payload validation” and does not publish the supported request subset or the explicit format allowlist/media-specificity boundary
- `examples/README.md` and `README.md` still describe the public retained bundle only as happy path + `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` sidecars

**Planning implication:** after the analyzer guide is rewritten, these four docs should be updated to mirror the exact supported subset and the proof commands. Keep public docs Russian-first.

### 3. The public v1 HTTP bundle can expose request semantics without a second live harness

**Files:**

- `scripts/ci/run-v1-e2e.sh`
- `examples/docker-compose.yml`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/HttpRequestEvidenceE2eTest.java`
- `examples/openapi/request-evidence-openapi.yaml`

Important behavior:

- the compose `tests` service runs `:examples:tests-restassured:test --rerun-tasks` without a test filter
- that means the retained `events.jsonl` already includes the focused request-evidence route from `HttpRequestEvidenceE2eTest`
- public bundle widening can therefore reuse the existing live events instead of spinning up another focused Spring MVC run

**Low-risk extension path if S04 wants a public request sidecar:**

- filter the live `events.jsonl` down to the `/request-evidence/users/{userId}` records
- rerun `node yanote-js/dist/yanote.cjs report` against `examples/openapi/request-evidence-openapi.yaml`
- retain additive sidecars using the current naming pattern (`*.stdout`, `*.stderr`, `*-yanote-report.json`)
- if filtered events are retained too, add them to `artifact-source-paths.txt` / `artifact-manifest.txt`

**Planning implication:** this is the cleanest place to surface M011 request truth on the public CI path if the team wants more than docs-only closeout.

### 4. S03 already has the right focused proof surface; docs should point to it

**Files:**

- `scripts/ci/verify-m011-s03-format-media.sh`
- `yanote-js/test/fixtures/openapi/http-payload-format-media.yaml`
- `yanote-js/test/fixtures/events/http-payload-*.fixture.jsonl`
- `examples/openapi/demo-openapi.yaml`

Current state:

- the normal demo spec already proves the green supported-format case because `POST /users` declares `format: email` and the live request uses `alice@example.com`
- the unsupported-format and media-specificity red cases are fixture-driven and already well localized in `scripts/ci/verify-m011-s03-format-media.sh`

**Planning implication:** S04 docs should link this verifier explicitly instead of trying to stuff all four S03 scenarios into the public `v1-e2e` bundle.

### 5. Existing doc and bundle contract scripts are the natural enforcement seams

**Files:**

- `scripts/docs/verify-s02-doc-links.sh`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/collect-yanote-artifacts.test.mjs`

Current state:

- these scripts encode the public story via exact-string assertions and bundle inventories
- right now they still assert the payload-era wording and bundle shape
- any new retained sidecars in `.yanote-ci/v1-e2e/` will require inventory and manifest updates in both Node contract tests

**Planning implication:** update these last, after the docs wording and final bundle shape are settled.

### 6. Report/CLI/schema contract is already implemented; S04 should align docs to it

**Files:**

- `yanote-js/src/cli.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-js/src/report/schema.ts`
- `yanote-js/src/report/report.requestEvidence.contract.test.ts`
- `yanote-js/src/report/report.contract.test.ts`

Current state:

- CLI already prints `HTTP Request Conformance` after `HTTP Payload Conformance`
- `YANOTE_SUMMARY` already includes additive request tokens
- report schema already includes `httpRequestConformance`, request `declaredSupport*` metadata, and payload `UNSUPPORTED_SCHEMA_FORMAT`

**Planning implication:** do not rename tokens or reshape the public contract unless absolutely necessary. S04 should document the already-tested names, not redesign them.

## What To Build / Prove First

1. **Decide the public proof shape.**
   - Minimal closeout: docs point to the existing focused M011 proof scripts.
   - Additive bundle closeout: `run-v1-e2e.sh` also retains a request-semantic sidecar derived from live events.
   Decide this first so docs and contract tests describe a real retained surface.

2. **Rewrite `docs/guides/analyzer-coverage.md`.**
   This is the most stale surface and the source of truth for the outward-facing narrative.

3. **Propagate concise wording outward.**
   Update `README.md`, `docs/README.md`, `examples/README.md`, and `docs/release-and-support.md` after the guide text is stable.

4. **Update the exact-string verifiers and bundle contract tests last.**
   Touch them once, after the content and bundle names are final.

## Don’t Hand-Roll

- Do not invent new CLI/report token names; reuse the names already locked by `yanote-js/src/cli.summary.contract.test.ts` and `yanote-js/src/report/schema.ts`.
- Do not create a second live Spring MVC harness inside `run-v1-e2e.sh` for request semantics; the recorded public `events.jsonl` already contains the request-evidence route.
- Do not replace the existing happy-path or `semantic-red` proof bundle; extend additively if you widen it.
- Do not soften unsupported OpenAPI shapes into vague prose. The implemented boundary is exact and already encoded in `yanote-js/src/spec/openapi.ts`.

## Constraints / Pitfalls

- **Do not overclaim serialization breadth.** The implemented request subset is exactly what `yanote-js/src/spec/openapi.ts` allows:
  - supported styles by location: `path=simple`, `query=form`, `header=simple`, `cookie=form`
  - scalar-first
  - arrays only for `query=form` + `explode=true` + scalar items
  - unsupported: `content`, unsupported styles, unsupported explode shapes, richer/non-scalar schemas
- **Do not imply generic `format` support.** `yanote-js/src/coverage/httpPayloadConformance.ts` hardcodes `SUPPORTED_PAYLOAD_SCHEMA_FORMATS = new Set(["email"])`.
- **Do not blur declared order with matching specificity.** Report output keeps declared media ordering deterministic, while evaluation picks the most specific matching media type.
- **`docs/guides/analyzer-coverage.md` is already malformed.** Whole-file rewrite is safer than many tiny edits.
- **Public docs must stay Russian-first.** Internal planning artifacts can remain English-first; user-facing docs should not switch language.

## Verification

Docs / public contract:

- `bash scripts/docs/verify-s03-landing.sh`
- `bash scripts/docs/verify-s02-doc-links.sh`
- `bash scripts/docs/verify-s04-boundaries.sh`

If `run-v1-e2e.sh` changes:

- `node --test scripts/ci/run-v1-e2e.contract.test.mjs scripts/ci/collect-yanote-artifacts.test.mjs`
- `bash scripts/ci/run-v1-e2e.sh`

Focused truth proofs the public docs should still reference truthfully:

- `bash scripts/docs/verify-s02-analysis-path.sh`
- `bash scripts/ci/verify-m011-s02-request-semantics.sh`
- `bash scripts/ci/verify-m011-s03-format-media.sh`

Repo hygiene:

- `git diff --check`
