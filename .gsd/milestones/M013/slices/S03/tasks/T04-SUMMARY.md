---
id: T04
parent: S03
milestone: M013
key_files:
  - scripts/ci/verify-m013-s03-static-html-reports.sh
  - scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs
  - .yanote-ci/static-html-reports-proof/artifact-manifest.txt
  - .yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html
  - .yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html
  - yanote-js/src/cli.report.test.ts
  - yanote-js/src/cli.summary.contract.test.ts
  - yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Retain the proof bundle as separate `http-report/` and `async-report/` subtrees with stdout/stderr/exit-code sidecars plus sibling JSON/HTML artifacts instead of copying raw fixtures or merging the two surfaces.
  - Make the proof fail closed on self-contained HTML drift, sanitized provenance drift, raw-event-shape markers, `SECRET_` leakage, and out-of-scope wording so one rerun proves the supported offline contract end to end.
  - Treat the slice-wide HTTP semantic-status expectation drift and Kotlin raw-string interpolation bug as local verifier-alignment fixes rather than a plan blocker because the shipped runtime feature and proof surfaces were intact.
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:51:04.210Z
blocker_discovered: false
---

# T04: Added a retained static HTML proof bundle for real HTTP and async CLI report runs

**Added a retained static HTML proof bundle for real HTTP and async CLI report runs**

## What Happened

Implemented `scripts/ci/verify-m013-s03-static-html-reports.sh` as a rerunnable retained proof for the supported CLI delivery path. The script rebuilds `yanote-js/dist/yanote.cjs`, runs real `report` and `async-report` commands against the dedicated HTTP and AsyncAPI fixtures, captures stdout/stderr/exit-code sidecars, and retains sibling JSON+HTML artifacts under `.yanote-ci/static-html-reports-proof/` in separate `http-report/` and `async-report/` subtrees. The verifier asserts canonical counts, sanitized `specSource`, self-contained/offline HTML, domain separation between HTTP and async surfaces, and absence of `SECRET_` markers, raw-event-shape fields, and out-of-scope wording before writing `artifact-manifest.txt` with rerun commands and the high-signal claims future agents need for inspection. Added `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` to pin the stable bundle path, manifest claims, supported entrypoints, forbidden-marker checks, and exact retained file layout. While running the final slice gate, I found two small local drifts outside the new proof script itself: stale HTTP CLI contract expectations still assumed `- status: ok` for fully covered semantic-failure runs, and the Gradle remote-spec fixture embedded `${specRef}` inside a Kotlin raw string without escaping it. I updated those tests in place so the slice-wide verification stack matches current runtime behavior, reran the targeted failures, and then reran the full four-command slice stack successfully. I also appended `.gsd/KNOWLEDGE.md` with the non-obvious rule that semantic payload drift keeps coverage dimensions green but still downgrades the top-level report status to `partial`.

## Verification

Ran the new proof script directly and confirmed it retained `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`, per-mode stdout/stderr/exit-code files, and sibling `yanote-report.{json,html}` / `yanote-async-report.{json,html}` artifacts with the expected canonical counts and sanitized provenance. Ran the new Node contract test to pin the verifier source contract and retained bundle layout. After fixing the preexisting local drift in HTTP CLI expectations and the Gradle Kotlin raw-string fixture, reran the exact slice verification stack from `S03-PLAN.md`: the focused yanote-js Vitest command, `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'`, `bash scripts/ci/verify-m013-s03-static-html-reports.sh`, and `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`; all passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm -C yanote-js test -- src/report/writeReport.determinism.test.ts src/report/writeAsyncReport.determinism.test.ts src/report/report.remote-spec.contract.test.ts src/report/asyncReport.remote-spec.contract.test.ts src/cli.summary.contract.test.ts src/cli.report.test.ts src/cli.async-report.contract.test.ts src/cli.async-report.test.ts` | 0 | ✅ pass | 2570ms |
| 2 | `./gradlew :yanote-gradle-plugin:test --tests '*YanoteRemoteSpecContractTest'` | 0 | ✅ pass | 1080ms |
| 3 | `bash scripts/ci/verify-m013-s03-static-html-reports.sh` | 0 | ✅ pass | 2030ms |
| 4 | `node --test scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs` | 0 | ✅ pass | 240ms |


## Deviations

Minor local adaptation: the final slice gate exposed stale HTTP semantic-status assertions in `yanote-js` tests and an unescaped Kotlin raw-string interpolation in the Gradle remote-spec fixture, so I fixed those verifier drifts before rerunning the advertised slice stack. No slice-plan rework was needed.

## Known Issues

None.

## Files Created/Modified

- `scripts/ci/verify-m013-s03-static-html-reports.sh`
- `scripts/ci/verify-m013-s03-static-html-reports.contract.test.mjs`
- `.yanote-ci/static-html-reports-proof/artifact-manifest.txt`
- `.yanote-ci/static-html-reports-proof/http-report/out/yanote-report.html`
- `.yanote-ci/static-html-reports-proof/async-report/out/yanote-async-report.html`
- `yanote-js/src/cli.report.test.ts`
- `yanote-js/src/cli.summary.contract.test.ts`
- `yanote-gradle-plugin/src/test/kotlin/dev/yanote/gradle/YanoteRemoteSpecContractTest.kt`
- `.gsd/KNOWLEDGE.md`
