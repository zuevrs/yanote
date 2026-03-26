# M013: M013: Analyzer Delivery, Remote Spec, And Report UX

**Vision:** Make Yanote's analyzer delivery genuinely consumable beyond operator-only CLI flows by adding explicit remote spec inputs, truthful deprecated-operation reporting, and separate human-friendly static report artifacts that stay aligned with the canonical JSON models and support boundaries.

## Success Criteria

- Supported remote spec inputs work through the real CLI and Gradle entrypoints alongside the current deterministic local file/directory baseline.
- Persisted command, provenance, and report surfaces disclose sanitized spec-source provenance and do not leak remote credentials through args, logs, or uploaded artifacts.
- Deprecated OpenAPI operations are surfaced explicitly in canonical reports and summaries without silently changing legacy coverage numerators by default.
- Yanote emits separate static offline HTML artifacts for HTTP and async reports, each derived from the same canonical report truth as the corresponding JSON file.
- CI artifacts and public docs describe the local-vs-remote support boundary, separate HTTP/async report surfaces, and the out-of-scope dashboard/combined-report boundary honestly.

## Slices

- [x] **S01: Supported Remote Spec Inputs With Sanitized Provenance** `risk:High` `depends:[]`
  > After this: Run Yanote through the real CLI and Gradle entrypoints against a fixture URL, then inspect retained artifacts showing sanitized remote provenance while the same project still works from local file and directory inputs.

- [x] **S02: Deprecated Operation Truth Without Numerator Drift** `risk:Medium` `depends:[S01]`
  > After this: Analyze a spec containing deprecated operations and show JSON plus CLI summaries that call them out separately while legacy operation coverage numerators stay unchanged.

- [x] **S03: Static HTML Reports From Canonical HTTP And Async Truth** `risk:Medium` `depends:[S01,S02]`
  > After this: Open `yanote-report.html` and `yanote-async-report.html` after real analyzer runs and review the same truth as JSON in separate offline-viewable artifacts.

- [x] **S04: CI, Docs, And Support Truth For Delivery Surfaces** `risk:Medium` `depends:[S01,S02,S03]`
  > After this: Inspect a CI-style artifact bundle and published docs that show separate JSON+HTML reports, sanitized remote provenance, and explicit support wording for the local baseline, remote path, deprecated semantics, and out-of-scope dashboard behavior.

## Boundary Map

| Boundary | Slice owner | Contract |
| --- | --- | --- |
| Spec-source resolution (`yanote-js/src/spec`, CLI entrypoints, Gradle tasks) | S01 | Support exactly three first-class source kinds: local file, local directory, remote single-document URL. Local directory discovery stays local-only. Remote auth must avoid credential-bearing URLs in persisted surfaces and use sanitized provenance. |
| Canonical report model (`yanote-js/src/report`, normalization/schema, CLI summaries) | S02 | Deprecated operation metadata is additive truth. Existing legacy coverage numerators stay stable unless a future explicit policy changes them. |
| Human-facing artifact writers (`writeReport`, `writeAsyncReport`, static templates/styles) | S03 | Generate separate static offline HTML artifacts for HTTP and async from canonical normalized report truth; do not introduce a combined dashboard or combined report model. |
| Delivery, artifact, and support surfaces (`scripts/ci`, `.github/workflows`, README, guides, release/support docs) | S04 | Publish JSON + HTML + sanitized provenance evidence and document the narrow remote-support contract, stable local baseline, and explicit out-of-scope boundaries. |

**Guardrails**
- Reuse existing parser/report seams instead of inventing a second analyzer truth path.
- Treat sanitized provenance as part of the feature, not follow-up polish.
- Keep HTTP and async UX parallel but separate at every retained artifact boundary.
