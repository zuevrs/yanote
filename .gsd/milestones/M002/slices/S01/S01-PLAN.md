# S01: Verified Recorder Integration Path

**Goal:** Give engineers one short, verified path to connect the recorder to a real Spring-based service and prove that `events.jsonl` is being produced.
**Demo:** Starting from the repository docs, an engineer can follow the recommended Spring integration path, send a real request, confirm a non-empty `events.jsonl`, inspect the captured JSONL fields, and see that flatDir remains a secondary smoke/offline fallback.

## Must-Haves

- A Russian-first canonical guide at `docs/guides/recorder-spring-mvc.md` documents the dependency-based Spring Boot recorder path with the exact recorder properties: `yanote.recorder.enabled`, `yanote.recorder.events-path`, and optional `yanote.recorder.service-name`.
- The slice adds executable proof of the recommended path and evidence retrieval contract: dependency-based wiring produces a non-empty `events.jsonl`, shows the expected JSONL fields (`method`, templated `route`, `status`, optional `service`, `test.run_id`, `test.suite`), and explains how to choose and export a writable path in local, container, and CI environments.
- Root/example/fallback docs all point to the same authoritative guide, explicitly label `dist/flatdir-recorder/` as a smoke/offline fallback, and describe the current metadata/header contract truthfully (`X-Test-Run-Id`, `X-Test-Suite`, `yanote.suite`, and `null` when headers are absent).

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `bash scripts/docs/verify-s01-recorder-path.sh`
- `bash scripts/docs/verify-s01-doc-links.sh`

## Observability / Diagnostics

- Runtime signals: recorder-written `events.jsonl` plus proof-script assertions on line count and expected JSONL fields.
- Inspection surfaces: `scripts/docs/verify-s01-recorder-path.sh`, `scripts/docs/verify-s01-doc-links.sh`, retained temp `events.jsonl`/service logs, and `docs/guides/recorder-spring-mvc.md`.
- Failure visibility: proof scripts fail closed on missing or empty events files, field drift, broken doc links, or missing fallback warnings and print the retained temp/log paths that explain the failure.
- Redaction constraints: proof output must stay limited to method, route, status, service, and test metadata fields; do not dump secrets, auth headers, or payload bodies.

## Integration Closure

- Upstream surfaces consumed: `yanote-recorder-spring-mvc`, `yanote-core` event JSONL model, `examples/springmvc-service`, `examples/tests-restassured`, `README.md`, and `dist/flatdir-recorder/README.md`.
- New wiring introduced in this slice: an external-style Spring fixture and proof scripts for the dependency path, a canonical recorder guide under `docs/guides/`, and root/fallback/example links that point to the same integration contract.
- What remains before the milestone is truly usable end-to-end: analyzer execution and coverage interpretation in S02; concept-first landing and broader docs/navigation work in S03-S05; version/support/trust surfaces in S04-S06.

## Tasks

- [x] **T01: Add executable recorder proof for dependency-based Spring integration** `est:90m`
  - Why: S01 needs an objective, repeatable proof surface before public docs can claim a verified integration path.
  - Files: `scripts/docs/verify-s01-recorder-path.sh`, `test/fixtures/recorder-spring-smoke/build.gradle.kts`, `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java`, `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java`, `test/fixtures/recorder-spring-smoke/src/main/resources/application.properties`
  - Do: Add a minimal external-style Spring Boot fixture that resolves `yanote-recorder-spring-mvc` from `mavenLocal()`, then implement a proof script that publishes the required artifacts, boots the fixture, sends a real request, asserts a non-empty `events.jsonl`, inspects the promised JSONL fields, and preserves temp/log paths on failure.
  - Verify: `bash scripts/docs/verify-s01-recorder-path.sh`
  - Done when: the proof command passes from a clean repo state without using the flatDir bundle and fails loudly when `events.jsonl` is missing, empty, or structurally wrong.
- [x] **T02: Write the canonical Spring recorder guide and align example docs** `est:60m`
  - Why: Engineers need one short authoritative guide that matches the proven runtime path instead of piecing together examples and research notes.
  - Files: `docs/guides/recorder-spring-mvc.md`, `examples/springmvc-service/README.md`, `examples/tests-restassured/README.md`
  - Do: Write the Russian-first dependency-based guide with exact property names, request → `test -s` → sample-line inspection flow, writable/exportable path guidance, a short truthful metadata-header callout, and explicit links to the example docs plus the flatDir fallback; then align the example service and RestAssured READMEs so they point back to the guide instead of drifting into example-only conventions.
  - Verify: `bash scripts/docs/verify-s01-recorder-path.sh && rg -n "yanote\.recorder\.enabled|yanote\.recorder\.events-path|X-Test-Run-Id|X-Test-Suite|yanote\.suite|test -s|flatdir-recorder" docs/guides/recorder-spring-mvc.md examples/springmvc-service/README.md examples/tests-restassured/README.md`
  - Done when: the guide and example docs all use the same property/header names, cross-link the authoritative path, and tell users exactly how to confirm and inspect a non-empty events file.
- [x] **T03: Wire root and fallback docs to the canonical recorder path** `est:45m`
  - Why: The verified path only helps new users if the root repo entry surface and flatDir fallback point to it consistently.
  - Files: `README.md`, `dist/flatdir-recorder/README.md`, `scripts/docs/verify-s01-doc-links.sh`
  - Do: Update the root README to link the canonical guide as the recommended recorder path, demote the flatDir README to a smoke/offline fallback with a link back to the guide, and add a doc-contract script that fails on broken links, missing fallback wording, or missing guide references across the affected docs.
  - Verify: `bash scripts/docs/verify-s01-doc-links.sh`
  - Done when: repo entry surfaces point to one authoritative recorder guide, flatDir is clearly secondary, and the doc-contract script passes.

## Files Likely Touched

- `scripts/docs/verify-s01-recorder-path.sh`
- `scripts/docs/verify-s01-doc-links.sh`
- `test/fixtures/recorder-spring-smoke/build.gradle.kts`
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/RecorderSmokeApplication.java`
- `test/fixtures/recorder-spring-smoke/src/main/java/dev/yanote/fixtures/recorder/OrdersController.java`
- `test/fixtures/recorder-spring-smoke/src/main/resources/application.properties`
- `docs/guides/recorder-spring-mvc.md`
- `examples/springmvc-service/README.md`
- `examples/tests-restassured/README.md`
- `README.md`
- `dist/flatdir-recorder/README.md`
