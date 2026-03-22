# S08 — Research

**Date:** 2026-03-12

## Summary

S08 is a **final integrated-proof slice**, not a new documentation-design slice. The repo already has the right ingredients: concept-first landing pages, canonical recorder/analyzer/tagging guides, bounded release/support/trust surfaces, a maintainer-only local `AGENTS.md` contract, and executable proofs for both the recorder and analyzer paths. In this clone, every current static verifier from S01-S07 passes, and both live runtime proofs still pass: the recorder proof writes a non-empty `events.jsonl` with the expected templated route and null test metadata, and the analyzer proof still produces the documented `4/4 operations`, `75% status`, `100% parameters`, `93.75% aggregate`, plus the expected `GATE_MIN_AGGREGATE` failure surface.

By the formal traceability table, S08 explicitly supports **R022, R023, R024, R025, R026, R028, R030, and R031**. In practice, the post-slice reassessments for S05-S07 treat S08 as the **final unchecked proof surface for all remaining active M002 requirements**, including **R027** and **R029**, because the milestone is still missing one composed acceptance pass from root concept → recorder setup → `events.jsonl` → analyzer → report interpretation → repo boundary checks.

The gap is composition. Proof is currently fragmented across S01 recorder runtime, S02 analyzer runtime, and S03-S07 documentation/boundary verifiers. S08 should not replace that with a brand-new monolithic flow. It should add one top-level acceptance surface that **orchestrates the existing scripts and the clone-local Git checks in the order a reader would rely on them**. Two constraints shape the approach: the local Docker CLI exists but the daemon is unavailable here, so `examples/docker-compose.yml` cannot be the sole acceptance path; and the real local `AGENTS.md` proof remains clone-local, so tracked verifiers alone are insufficient.

## Recommendation

Take the smallest truthful orchestration path:

1. **Add one S08 acceptance verifier that delegates to existing proofs instead of re-implementing them.**
   - Likely shape: `scripts/docs/verify-s08-entry-paths.sh` (or equivalent).
   - Start with cheap doc/boundary checks, then run the two live runtime proofs, then finish with clone-local Git proof commands for `AGENTS.md`.
   - Preserve the existing failure diagnostics by calling the current scripts directly rather than copying their logic.

2. **Treat the canonical user journey as guide-first, not Compose-first.**
   - Primary proof path should be: `README.md` → `docs/README.md` → `docs/guides/recorder-spring-mvc.md` → `docs/guides/analyzer-coverage.md` → `docs/guides/test-tagging.md`, with the current S01/S02 scripts proving the live parts.
   - `examples/README.md` and `examples/docker-compose.yml` remain valuable secondary demo surfaces, but they should not become the only S08 gate while the current environment lacks a Docker daemon.

3. **Use current verifiers as the acceptance backbone.**
   - Static/documentation/boundary stack:
     - `bash scripts/docs/verify-s01-doc-links.sh`
     - `bash scripts/docs/verify-s02-doc-links.sh`
     - `bash scripts/docs/verify-s03-landing.sh`
     - `bash scripts/docs/verify-s04-boundaries.sh`
     - `bash scripts/docs/verify-s05-navigation.sh`
     - `bash scripts/docs/verify-s06-trust-surfaces.sh`
     - `bash scripts/docs/verify-s07-local-agent.sh`
   - Live/runtime stack:
     - `bash scripts/docs/verify-s01-recorder-path.sh`
     - `bash scripts/docs/verify-s02-analysis-path.sh`
   - Clone-local proof that must remain separate from tracked docs:
     - `git check-ignore -v AGENTS.md`
     - `git status --ignored --short AGENTS.md`
     - `git ls-files | rg '(^|/)AGENTS\.md$' || true`

4. **Anchor S08 summaries in task evidence and live command output, not the placeholder slice summaries.**
   - S01-S06 slice summaries were recovered as placeholders, so the authoritative compressed handoff still lives in task summaries plus the current verifier scripts.
   - S08 should leave a real summary/UAT trail so the milestone no longer depends on placeholder recovery artifacts for operational truth.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Recorder runtime proof | `scripts/docs/verify-s01-recorder-path.sh` | It already handles `mavenLocal()` publication, the external-style Spring fixture, proxy-safe localhost curl, JSONL field assertions, and retained failure artifacts. |
| Analyzer/runtime + gate proof | `scripts/docs/verify-s02-analysis-path.sh` | It already rebuilds `yanote-js`, forces fresh events with `--rerun-tasks`, validates real coverage/report semantics, and proves the `YANOTE_ERROR` gate path. |
| Documentation, navigation, release, trust, and local-agent boundary checks | `scripts/docs/verify-s01-doc-links.sh` through `scripts/docs/verify-s07-local-agent.sh` | These scripts already express the slice contracts in machine-checkable form. S08 should compose them, not duplicate their markdown assertions. |
| Clone-local `AGENTS.md` proof | `git rev-parse --git-path info/exclude`, `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, `git ls-files` | This is the only truthful way to prove the local-only boundary in the active clone; a tracked shell verifier cannot see repo-local Git admin state by itself. |
| Shortest secondary end-to-end demo | `examples/docker-compose.yml` | It is useful when Docker is actually available, but in this environment the daemon is unavailable, so it should stay optional/secondary rather than becoming the single S08 gate. |

## Existing Code and Patterns

- `README.md` — stable concept-first landing that explains Yanote, names the verified loop, and points directly to the canonical recorder/analyzer/tagging guides.
- `docs/README.md` — stable user-doc owner map. It preserves the right order: canonical guides first, demos second, deeper reference next, maintainer/history last.
- `examples/README.md` — stable demo map that explains how repo assets fit the recorder → `events.jsonl` → analyzer → `yanote-report.json` flow without replacing the canonical guides.
- `scripts/docs/verify-s01-recorder-path.sh` — authoritative live recorder proof. Publishes artifacts to `mavenLocal()`, boots an isolated Spring fixture, hits a real endpoint, and asserts method/templated route/status/service/test metadata fields.
- `test/fixtures/recorder-spring-smoke/` — the external-style S01 proof fixture. Reuse it indirectly through the script; do not collapse it back into a project-dependency-based smoke path.
- `scripts/docs/verify-s02-analysis-path.sh` — authoritative live analyzer proof. Builds example service + test classes + `yanote-js`, reruns RestAssured tests with fresh events, validates report semantics, and proves gate-failure persistence/diagnostics.
- `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java` — the runnable demo bridge that reads `YANOTE_RUN_ID` and `YANOTE_SUITE`, copies suite into `yanote.suite`, waits on `/health`, and emits tagged requests.
- `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java` — library-level source of truth for `X-Test-Run-Id`, `X-Test-Suite`, `YANOTE_RUN_ID`, and `yanote.suite`.
- `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java` — source of truth that Cucumber writes `yanote.suite`, not HTTP headers directly.
- `scripts/docs/verify-s03-landing.sh` — protects the concept-first landing contract across `README.md`, `docs/README.md`, `examples/README.md`, and example backlinks.
- `scripts/docs/verify-s04-boundaries.sh` — protects release/support truth dynamically against the latest stable `v*` tag and rejects snapshot/build markers as public release truth.
- `scripts/docs/verify-s05-navigation.sh` — protects secondary owner maps and deep-link recovery paths.
- `scripts/docs/verify-s06-trust-surfaces.sh` — protects identity, root policy, and GitHub-native maintained-product trust surfaces.
- `scripts/docs/verify-s07-local-agent.sh` + `docs/maintainers/local-agent-workflow.md` — protect the public/private `AGENTS.md` boundary and define the clone-local proof commands.
- `.gsd/milestones/M002/slices/S01/tasks/*.md` and `.gsd/milestones/M002/slices/S02/tasks/*.md` — authoritative task-level handoff for S01/S02 because the slice summaries themselves were placeholder recoveries.

## Constraints

- Formal traceability gives S08 explicit support ownership for **R022, R023, R024, R025, R026, R028, R030, R031**. Slice reassessments after S05-S07 treat it as the remaining integrated-proof surface for **all** active M002 requirements, including **R027** and **R029**.
- Public docs remain **Russian-first**. S08 should verify truth and routing, not reopen language strategy.
- The local environment has `docker compose`, but the **Docker daemon is unavailable**. Any S08 acceptance path that requires Compose will fail in this clone even though the secondary demo file exists.
- `scripts/docs/verify-s01-recorder-path.sh` depends on publishing to `mavenLocal()` and on proxy-safe localhost requests (`curl --noproxy '*'`). Re-implementing that logic elsewhere risks reintroducing already-solved flakiness.
- `scripts/docs/verify-s02-analysis-path.sh` depends on **fresh event regeneration**. `:examples:tests-restassured:test` must keep `--rerun-tasks`, or the proof becomes cache-sensitive.
- The analyzer support story is `Node >=20`, while the repo dev pin is `.nvmrc = 22`. S08 must preserve that distinction and avoid treating the local pin as a new public support line.
- `docs/release-and-support.md` deliberately allows `HEAD` to be ahead of the last stable tag. Current verifier output shows `HEAD` is **20 commits ahead of `v1.0.122`**; S08 must not hardcode “HEAD equals latest release” assumptions.
- The clone-local `AGENTS.md` proof cannot be reduced to tracked documentation checks. It requires active Git admin state in `.git/info/exclude`.
- S01-S06 slice summaries are incomplete placeholders in several cases, so S08 should rely on task summaries and live verifier output for operational truth.

## Common Pitfalls

- **Writing a brand-new monolithic end-to-end script** — S01 and S02 already contain the hard-won runtime logic and diagnostics. Compose them; do not fork them.
- **Making Docker Compose the primary acceptance gate** — `examples/docker-compose.yml` is a real demo surface, but the daemon is unavailable here and the canonical product story is still guide-first.
- **Forgetting `--rerun-tasks` on the RestAssured example** — without it, fresh `events.jsonl` generation becomes non-deterministic under Gradle up-to-date checks.
- **Treating `operations = 100%` as full contract proof** — the current documented truth is still `status = 75%`, `aggregate = 93.75%`, and report `status = partial` because `POST /users` still misses declared status `201`.
- **Reintroducing the stale `/health` exclusion idea** — current docs and scripts intentionally reject that old workaround. The S02 proof explicitly checks that `/health` does not survive in the final events file and that unmatched exclusion noise stays absent.
- **Reading `gradle.properties` `0.1.0-SNAPSHOT` or analyzer `0.0.0` markers as release truth** — S04 already established those as workspace/build markers, not public release identity.
- **Using only `scripts/docs/verify-s07-local-agent.sh` to prove the `AGENTS.md` contract** — that script guards tracked/public boundaries, but the real local-only proof still needs the Git commands from `docs/maintainers/local-agent-workflow.md`.
- **Trusting placeholder slice summaries as the main handoff surface** — for S01/S02 especially, the task summaries are more authoritative than the recovered slice-level placeholders.

## Open Risks

- If S08 ships only a narrative summary and no composed acceptance script, the milestone will still depend on scattered slice-local proof instead of one repeatable final gate.
- If the S08 script duplicates exact version, coverage, or navigation assertions that already live in S01-S07 scripts, it creates a second drift surface and weakens maintainability.
- If S08 tries to prove both the canonical guide-first journey and the Docker Compose demo in one hard requirement, the slice may fail on environment setup rather than on doc truth.
- If the clone-local `info/exclude` rule is reset or `AGENTS.md` is force-added, the S07 boundary can silently break even while all tracked docs still look correct.
- If S08 does not leave a real slice summary/UAT artifact, M002 will continue carrying placeholder-summary debt into the final handoff.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Spring Boot | `github/awesome-copilot@java-springboot` | available, not installed — best direct external match found (`npx skills add github/awesome-copilot@java-springboot`) |
| Gradle | `pluginagentmarketplace/custom-plugin-java@java-gradle` | available, not installed — most relevant non-Android Gradle hit found (`npx skills add pluginagentmarketplace/custom-plugin-java@java-gradle`) |
| Node.js | `wshobson/agents@nodejs-backend-patterns` | available, not installed — broad Node skill, only moderately relevant because the analyzer path is already stable (`npx skills add wshobson/agents@nodejs-backend-patterns`) |
| Docker Compose | `manutej/luxor-claude-marketplace@docker-compose-orchestration` | available, not installed — relevant only if S08 later adds optional Compose verification (`npx skills add manutej/luxor-claude-marketplace@docker-compose-orchestration`) |
| Installed local skills | none directly relevant | `debug-like-expert`, `frontend-design`, `playwright-cli`, and `swiftui` exist locally, but this slice is shell/docs verification rather than UI, Swift, or deep-debug work |

## Sources

- The current root/docs/examples path is already coherent and concept-first; the main missing piece is final integrated proof, not new landing design. (source: `README.md`, `docs/README.md`, `examples/README.md`)
- The canonical guide surfaces are already separated correctly: recorder setup, analyzer/report interpretation, and test-tagging vocabulary live in distinct authoritative docs. (source: `docs/guides/recorder-spring-mvc.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/test-tagging.md`)
- All current doc/boundary verifiers pass in this clone. (source: local research rerun of `bash scripts/docs/verify-s01-doc-links.sh`, `bash scripts/docs/verify-s02-doc-links.sh`, `bash scripts/docs/verify-s03-landing.sh`, `bash scripts/docs/verify-s04-boundaries.sh`, `bash scripts/docs/verify-s05-navigation.sh`, `bash scripts/docs/verify-s06-trust-surfaces.sh`, `bash scripts/docs/verify-s07-local-agent.sh`)
- The live recorder proof still passes and remains the right dependency-based external-style proof surface. (source: `scripts/docs/verify-s01-recorder-path.sh`, `test/fixtures/recorder-spring-smoke/*`, local research rerun of `bash scripts/docs/verify-s01-recorder-path.sh`)
- The live analyzer proof still passes and remains the right source-built analyzer + tagged-events + gate-failure proof surface. (source: `scripts/docs/verify-s02-analysis-path.sh`, local research rerun of `bash scripts/docs/verify-s02-analysis-path.sh`)
- The RestAssured/Cucumber metadata bridge described in docs still matches the code: `YANOTE_RUN_ID`, demo-only `YANOTE_SUITE`, shared `yanote.suite`, request headers, and suite propagation behavior. (source: `examples/tests-restassured/src/test/java/dev/yanote/examples/tests/DemoServiceE2eTest.java`, `yanote-test-tags-restassured/src/main/java/dev/yanote/testtags/restassured/YanoteRestAssuredFilter.java`, `yanote-test-tags-cucumber/src/main/java/dev/yanote/testtags/cucumber/YanoteSuiteNamePlugin.java`)
- The current environment can see `docker compose`, but the Docker daemon is unavailable, so Compose cannot be the only S08 proof path here. (source: `examples/docker-compose.yml`, local research command `docker compose version` / `docker info`)
- Release/support truth is dynamic and already handled correctly: the latest stable tag resolves to `v1.0.122`, the stable line is `v1.0.x`, and `HEAD` is ahead of the release instead of equal to it. (source: `docs/release-and-support.md`, local research rerun of `bash scripts/docs/verify-s04-boundaries.sh`)
- The local-only `AGENTS.md` workflow still requires both the tracked boundary verifier and the clone-local Git checks. (source: `docs/maintainers/local-agent-workflow.md`, `scripts/docs/verify-s07-local-agent.sh`, local research rerun of `git check-ignore -v AGENTS.md`, `git status --ignored --short AGENTS.md`, `git ls-files | rg '(^|/)AGENTS\.md$' || true`)
- S05-S07 reassessments explicitly leave the final integrated milestone proof to S08 and treat all remaining active requirements as still needing this acceptance pass. (source: `.gsd/milestones/M002/slices/S05/S05-ASSESSMENT.md`, `.gsd/milestones/M002/slices/S06/S06-ASSESSMENT.md`, `.gsd/milestones/M002/slices/S07/S07-ASSESSMENT.md`)
- S01/S02 task summaries remain the authoritative compressed handoff for the runtime proof surfaces because the slice summaries were placeholder recoveries. (source: `.gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md`, `.gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md`, `.gsd/milestones/M002/slices/S01/tasks/T03-SUMMARY.md`, `.gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md`, `.gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md`, `.gsd/milestones/M002/slices/S02/tasks/T03-SUMMARY.md`)
