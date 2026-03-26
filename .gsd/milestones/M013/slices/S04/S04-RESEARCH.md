# M013 S04 Research: CI, Docs, And Support Truth For Delivery Surfaces

_Gathered: 2026-03-26_

## Skills Discovered

- Installed skill used for this research: `github-workflows`
- Directly relevant installed skills already present in the environment: `github-workflows`, `java-gradle`
- New skill installs: none

## Requirement Focus

- **Primary closeout target:** `R024` still needs the S04 CI/docs/support pass before it can be considered fully validated.
- **Primary supported delivery requirement:** `R003` — the GitHub Action/CI surface has to publish the same truthful analyzer/report contract that CLI and Gradle already expose.
- **Boundary requirements to preserve while closing the slice:**
  - `R004` — keep the stable local/offline baseline explicit and keep remote usage opt-in/narrow rather than blurring it into the default supported path.
  - `R005` — keep HTTP and async delivery/report surfaces separate at every artifact and doc boundary.
  - `R030` — do not drift into hosted dashboard or combined-report language; static offline files remain the supported human-facing surface.
- **Candidate security requirement from the requirements lens that directly affects this slice:** remote credentials must never leak through docs/examples, command sidecars, summaries, uploaded artifacts, or published provenance examples. The public wording needs the exact sanitized remote contract, not vague “URL support”.

## What Exists Now

- `.github/workflows/yanote-ci.yml` already has the stable required-job topology:
  - `build-and-test`
  - `yanote-validation`
  - `v1-e2e` only on push to `main` / `release/**`
- `.github/BRANCH_PROTECTION.md` and `scripts/ci/yanote-ci-workflow.contract.test.mjs` treat those job IDs and the `build-and-test -> yanote-validation -> v1-e2e` dependency chain as a merge-blocking contract.
- `scripts/ci/run-yanote-gradle-check.sh` already accepts the widened Gradle/report surface introduced earlier in the milestone:
  - `INPUT_SPEC_PATH` may already be a supported remote URL
  - `YANOTE_GRADLE_TASK` already switches between `yanoteCheck` and `yanoteReport`
  - the workflow itself still uses the local fixture defaults
- `scripts/ci/collect-yanote-artifacts.sh` currently collects:
  - root `yanote-report.json`
  - command sidecars and validation logs
  - `.yanote-ci/live-kafka-proof/`
  - `.yanote-ci/v1-e2e/`
  - but it does **not** copy a root `yanote-report.html`, and its top-level `artifact-manifest.txt` does not record HTML/spec-source/deprecated-summary facts.
- `scripts/ci/export-async-proof-artifacts.sh` still exports only async JSON + stdout/stderr proof surfaces. It drops the S03 async HTML siblings entirely.
- `scripts/ci/run-v1-e2e.sh` already copies the whole happy-path `out/` directory from the Compose report container (`docker compose cp report:/data/yanote/out ...`). That means `out/yanote-report.html` should already ride along after S03, but `artifact-manifest.txt` / `artifact-source-paths.txt` still only enumerate the JSON file.
- `scripts/ci/render-yanote-summary.mjs` currently ignores:
  - `report.specSource`
  - `summary.deprecatedOperations`
  - HTML sibling artifacts
  - whether an uncovered HTTP operation is deprecated
- The workflow render steps matter here:
  - HTTP `yanote-validation` passes `--report`, `--stderr`, and `--artifacts-dir` only, so any new HTTP summary truth must come from report JSON / artifact filesystem, not from CLI stdout scraping.
  - Async `build-and-test` passes `--report`, `--stdout`, `--stderr`, and `--artifacts-dir`, so async summary can still fall back to `YANOTE_ASYNC_*` tokens when needed.
- Public docs are still pre-M013-S04 on these surfaces:
  - `README.md`
  - `docs/README.md`
  - `examples/README.md`
  - `docs/guides/analyzer-coverage.md`
  - `docs/guides/asyncapi-kafka.md`
  - `docs/release-and-support.md`
  
  They still speak as if analyzer outputs are JSON-only and `--spec` is effectively local-path oriented. They do not publish the narrow remote URL contract, additive deprecated semantics, or the offline `yanote-report.html` / `yanote-async-report.html` boundary.
- Existing focused M013 proof bundles are already on disk and can be reused as authoritative wording/input sources:
  - `.yanote-ci/remote-spec-proof/`
  - `.yanote-ci/deprecated-operations-proof/`
  - `.yanote-ci/static-html-reports-proof/`

## Key Findings And Surprises

### 1. The async CI artifact gap is the one hard blocker; the HTTP happy-path gap is mostly metadata/collection truth

The biggest real artifact gap is `scripts/ci/export-async-proof-artifacts.sh`: build-and-test cannot publish async HTML today because the helper never exports it.

By contrast, `scripts/ci/run-v1-e2e.sh` already copies the whole happy-path `out/` directory, so `out/yanote-report.html` likely already exists after S03. The remaining HTTP gap is that bundle metadata/tests/docs still describe only `yanote-report.json`.

### 2. CI summaries are leaving already-available M013 truth on the floor

`render-yanote-summary.mjs` already has access to canonical report JSON, so it can surface:

- `specSource.kind` / `specSource.reference`
- `summary.deprecatedOperations`
- explicit JSON vs HTML artifact names

without inventing a second interpretation path.

The current generic `artifacts:` line is not enough because it truncates to the first four sorted filenames, which usually hides HTML even if the file is present.

### 3. The branch-protection / workflow contract is a hard guardrail, not a loose convention

The `github-workflows` skill guidance and the repo’s own contract files both point the same way:

- keep required job IDs stable
- prefer step/internal artifact changes over new required jobs or renamed jobs
- validate workflow behavior by observable artifact/summary differences, not just “the YAML still parses”

For S04 that means artifact/export/summary changes are safer than topology changes.

### 4. Release/support docs need the exact resolver contract from code

`yanote-js/src/spec/specSource.ts` is precise about the supported remote surface:

- supported kinds: `local-file`, `local-directory`, `remote-url`
- remote only supports public single-document `http(s)` URLs
- URLs with userinfo, query strings, or fragments are rejected
- directory-like remote paths are rejected
- persisted provenance is the sanitized URL only

That exact contract needs to appear in support docs/examples. Anything fuzzier risks reintroducing the “credentials in URLs” failure mode the requirements lens called out.

### 5. Deprecated-operation truth is already additive in the canonical model, but CI/docs still hide that fact

The canonical HTTP report already carries:

- `summary.deprecatedOperations`
- `coverage.perOperation[].deprecated`

Yet:

- GitHub summaries never show deprecated counts
- uncovered deprecated operations are rendered as ordinary low-priority uncovered operations
- public docs do not explain that deprecated truth is additive and legacy numerators remain unchanged by default

S04 can close that gap without any analyzer-model change.

## Implementation Landscape

### CI / workflow surfaces

- `.github/workflows/yanote-ci.yml`
  - stable required-job topology; do not rename jobs casually
  - already runs artifact collection + summary rendering in both required jobs
- `.github/BRANCH_PROTECTION.md`
  - mirrors workflow artifact/summary expectations and will need to stay in sync
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
  - best place to pin any workflow/contract wording changes

### Artifact assembly / proof export

- `scripts/ci/collect-yanote-artifacts.sh`
  - top-level HTTP artifact upload contract
  - natural seam for copying `yanote-report.html` and recording it in the top-level manifest
- `scripts/ci/collect-yanote-artifacts.test.mjs`
  - deterministic collector contract; update expected files + manifest assertions here
- `scripts/ci/export-async-proof-artifacts.sh`
  - natural seam for exporting async HTML siblings
  - can likely derive HTML siblings from the JSON report paths instead of requiring new caller env vars
- `scripts/ci/export-async-proof-artifacts.test.mjs`
  - already structured to widen the exported allowlist deterministically
- `scripts/ci/run-v1-e2e.sh`
  - likely needs metadata/source-note widening more than data-copy logic
- `scripts/ci/run-v1-e2e.contract.test.mjs`
  - update if the retained bundle metadata starts acknowledging happy-path HTML

### GitHub summary rendering

- `scripts/ci/render-yanote-summary.mjs`
  - HTTP summary should gain:
    - spec source line
    - deprecated operations line
    - explicit JSON vs HTML artifact lines
  - HTTP issue collector should call out uncovered deprecated operations explicitly
  - async summary should gain:
    - spec source line
    - explicit JSON vs HTML artifact lines
- `scripts/ci/render-yanote-summary.test.mjs`
  - already has focused HTTP/async fixtures; extend expected markdown here instead of adding ad-hoc scripts first

### Public docs / support truth

Primary owner surfaces:

- `docs/release-and-support.md`
- `README.md`
- `docs/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `examples/README.md` if `run-v1-e2e` bundle descriptions change

Support docs need to publish four truths explicitly:

1. local baseline remains stable/default
2. remote spec loading is narrow, opt-in, public single-document `http(s)` only, and provenance-safe
3. deprecated operations are additive truth and do not silently rewrite legacy numerators by default
4. separate offline HTML artifacts exist for HTTP and async, with no dashboard or combined-report contract

### Existing verifier seams

- `scripts/docs/verify-s04-boundaries.sh`
  - current best candidate for boundary-wording expansion
- `scripts/docs/verify-s03-landing.sh`
  - good seam if README/docs/examples need synchronized HTML/remote/deprecated mentions

A new focused `scripts/ci/verify-m013-s04-*.sh` proof would be reasonable only after the collector/export/summary/doc contracts are settled.

## What To Build Or Prove First

1. **Artifact/export plumbing first**
   - Without copied HTML siblings and truthful manifests, docs and workflow summaries would still describe surfaces CI cannot actually upload.
   - Highest-value files first: `collect-yanote-artifacts.sh`, `export-async-proof-artifacts.sh`, and `run-v1-e2e.sh` metadata.

2. **GitHub summary rendering second**
   - Once artifact names/paths are stable, make summaries surface `specSource`, deprecated counts, and explicit JSON vs HTML artifacts.

3. **Docs/support truth third**
   - After artifacts/summaries are real, synchronize README/guides/release-support wording to the actual contract.

4. **Contract/verifier closeout last**
   - Update workflow/artifact/doc tests after the surfaces are settled.
   - Add a focused S04 proof script only if the existing contract tests + doc verifiers are not enough.

## Recommended Scope Boundaries

- Keep `build-and-test` and `yanote-validation` as the stable required jobs unless there is no other path.
- Do **not** make the default CI path remote-first. Keep the local/offline baseline explicit and describe remote as the narrow opt-in path.
- Keep HTTP and async report families separate everywhere:
  - separate JSON files
  - separate HTML files
  - separate summaries
  - no combined dashboard wording
- Prefer manifest/source-path annotations over prose-only claims. Earlier slices already established `artifact-manifest.txt` and `artifact-source-paths.txt` as the trusted quick-inspection layer.

## Verification Hooks

Following the `github-workflows` skill rule, validation should prove an observable before/after artifact or summary difference, not just “no errors”.

### Existing node contract tests likely to update

```bash
node --test \
  scripts/ci/collect-yanote-artifacts.test.mjs \
  scripts/ci/export-async-proof-artifacts.test.mjs \
  scripts/ci/render-yanote-summary.test.mjs \
  scripts/ci/yanote-ci-workflow.contract.test.mjs
```

If `run-v1-e2e.sh` metadata changes:

```bash
node --test scripts/ci/run-v1-e2e.contract.test.mjs
```

### Existing shell doc verifiers likely to extend or rerun

```bash
bash scripts/docs/verify-s03-landing.sh
bash scripts/docs/verify-s04-boundaries.sh
```

### Good candidate focused proof if the executor wants one retained bundle

A new `scripts/ci/verify-m013-s04-delivery-surfaces.sh` would be most valuable if it asserts one CI-style assembled bundle with these properties:

- root HTTP bundle contains `yanote-report.json` + `yanote-report.html`
- async proof bundle contains `yanote-async-report.json` + `yanote-async-report.html`
- bundle manifests mention sanitized spec-source and deprecated/additive truth where appropriate
- rendered summaries mention spec source and JSON vs HTML artifact names
- forbidden-marker checks still fail on secrets, raw event dumps, `combined-report`, and `dashboard`

## Planner Notes

- The lowest-risk implementation is evolutionary: widen the existing collectors/exporters/manifests/summaries and then synchronize docs.
- The sharpest hidden bug is assuming `run-v1-e2e.sh` still needs to copy the happy-path HTML file explicitly; the directory copy already likely does that. Check metadata/tests before changing the copy logic.
- The one place that definitely drops S03 value today is `scripts/ci/export-async-proof-artifacts.sh`.
- If workflow YAML itself changes, follow the `github-workflows` skill rule: fetch only the relevant GitHub Actions syntax section first, and validate with before/after artifact or summary evidence rather than parser-only success.

## Sources

- `.github/workflows/yanote-ci.yml`
- `.github/BRANCH_PROTECTION.md`
- `scripts/ci/run-yanote-gradle-check.sh`
- `scripts/ci/collect-yanote-artifacts.sh`
- `scripts/ci/collect-yanote-artifacts.test.mjs`
- `scripts/ci/export-async-proof-artifacts.sh`
- `scripts/ci/export-async-proof-artifacts.test.mjs`
- `scripts/ci/render-yanote-summary.mjs`
- `scripts/ci/render-yanote-summary.test.mjs`
- `scripts/ci/run-v1-e2e.sh`
- `scripts/ci/run-v1-e2e.contract.test.mjs`
- `scripts/ci/yanote-ci-workflow.contract.test.mjs`
- `scripts/docs/verify-s03-landing.sh`
- `scripts/docs/verify-s04-boundaries.sh`
- `README.md`
- `docs/README.md`
- `examples/README.md`
- `docs/guides/analyzer-coverage.md`
- `docs/guides/asyncapi-kafka.md`
- `docs/release-and-support.md`
- `yanote-js/src/spec/specSource.ts`
- `.yanote-ci/remote-spec-proof/artifact-manifest.txt`
- `.yanote-ci/remote-spec-proof/artifact-source-paths.txt`
- `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`
- `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`
