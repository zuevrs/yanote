# S08: Live proof UAT

**Milestone:** M002
**Written:** 2026-03-13 03:16:41 +0300

## Acceptance Command

Run from the repo root in the active clone:

```bash
bash scripts/docs/verify-s08-entry-paths.sh
```

This is the canonical final-assembly proof surface. It is guide-first, stops on the first failing stage, prints a stable `S08-0N` label, and prints the delegated command before running it.

## Preconditions

- Run in the active Yanote clone with Java/Gradle, Node/npm, `rg`, and Git available.
- Do **not** print or copy the contents of the clone-local root `AGENTS.md`.
- The clone-local `AGENTS.md` proof must remain local to this clone and resolve through `.git/info/exclude`, not tracked repo state.

## Live Passing Run — Observed Stage Order And Signals

### 1. Guide-first landing contract
- Delegated command: `scripts/docs/verify-s03-landing.sh`
- Observed signal: `Landing contract verification passed: root/docs/examples surfaces and example backlinks are wired correctly.`

### 2. Recorder guide wiring
- Delegated command: `scripts/docs/verify-s01-doc-links.sh`
- Observed signal: `Doc link verification passed: canonical recorder guide and smoke/offline fallback are wired correctly.`

### 3. Recorder runtime proof
- Delegated command: `scripts/docs/verify-s01-recorder-path.sh`
- Observed signals:
  - `Publishing io.github.zuevrs:yanote-core:0.1.0-SNAPSHOT and recorder module to mavenLocal...`
  - `Starting Spring smoke fixture from published local artifacts...`
  - `Sending proof request to http://127.0.0.1:<port>/orders/42?expand=true...`
  - `Recorder proof passed: method=GET route=/orders/{orderId} status=200 service=recorder-spring-smoke test.run_id=None test.suite=None`

### 4. Tagging/analyzer guide wiring
- Delegated command: `scripts/docs/verify-s02-doc-links.sh`
- Observed signal: `Doc link verification passed: canonical tagging guide, terminology, and local markdown links are wired correctly.`

### 5. Analyzer runtime and gate proof
- Delegated command: `scripts/docs/verify-s02-analysis-path.sh`
- Observed signals from the passing S08 run:
  - `Analysis proof passed: events=4 routes=/admin/ping,/users,/users,/users/{id} run_id=manual-run-s02 suite=restassured-suite; operations=4/4 operation_percent=100.00 status_percent=75.00 parameters_percent=100.00 aggregate_percent=93.75 suite=restassured-suite`
  - `Gate proof passed: exit=3 code=GATE_MIN_AGGREGATE report=<temp>/report-gate/yanote-report.json`
- Analyzer report semantics confirmed from the retained live gate artifacts:
  - persisted report status: `partial`
  - `summary.totalOperations = 4`
  - `summary.coveredOperations = 4`
  - `summary.aggregateCoveragePercent = 93.75`
  - governance diagnostic code: `GATE_MIN_AGGREGATE`
  - per-operation interpretation still shows the known missing POST response: `http POST /users` missing status `201`

### 6. Release and support boundaries
- Delegated command: `scripts/docs/verify-s04-boundaries.sh`
- Observed signals:
  - `INFO: Resolved latest stable tag: v1.0.122`
  - `INFO: Expected release line: v1.0.x`
  - `INFO: Repository state relative to latest tag: HEAD is 26 commit(s) ahead of v1.0.122`
  - `S04 boundary verification passed: release/support surface, landing pointers, and version-source disclaimers align with v1.0.122 (v1.0.x).`

### 7. Secondary navigation surfaces
- Delegated command: `scripts/docs/verify-s05-navigation.sh`
- Observed signal: `S05 navigation verification passed: secondary directory/leaf docs, owner backlinks, and fallback positioning are wired correctly.`

### 8. Trust and intake surfaces
- Delegated command: `scripts/docs/verify-s06-trust-surfaces.sh`
- Observed signals:
  - `INFO: Checking S06 identity/legal trust surfaces`
  - `INFO: Checking S06 public policy trust surfaces`
  - `INFO: Checking S06 GitHub-native trust surfaces`
  - `S06 trust-surface verification passed for mode: all.`

### 9. Tracked local-agent boundary
- Delegated command: `scripts/docs/verify-s07-local-agent.sh`
- Observed signal: `S07 local-agent boundary verification passed: tracked surfaces stay silent and the maintainer-only workflow contract is wired correctly.`

### 10. Clone-local `AGENTS.md` Git diagnostics
- Delegated command: clone-local checks embedded in `scripts/docs/verify-s08-entry-paths.sh`
- Observed signals from the passing S08 run:
  - `git rev-parse --git-path info/exclude => .git/info/exclude`
  - `git check-ignore -v AGENTS.md => .git/info/exclude:8:/AGENTS.md<TAB>AGENTS.md`
  - `git status --ignored --short AGENTS.md => !! AGENTS.md`
  - `git ls-files | rg '(^|/)AGENTS\.md$' || true => clean`

## Analyzer Gate-Failure Diagnostic Surface

The passing `bash scripts/docs/verify-s08-entry-paths.sh` run proved that `scripts/docs/verify-s02-analysis-path.sh` still reaches the expected failing gate with `exit=3` and `code=GATE_MIN_AGGREGATE`.

To capture the exact diagnostic strings for future reruns, the delegated verifier was re-executed once with an intentionally wrong `YANOTE_EXPECTED_GATE_CODE` so it would preserve the real gate artifacts after the failing analyzer command had already run:

```bash
YANOTE_EXPECTED_GATE_CODE=KEEP_ARTIFACTS_FOR_UAT bash scripts/docs/verify-s02-analysis-path.sh
```

Observed live gate stderr signal:

```text
YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE reason="Aggregate coverage 93.7500% is below required 100.0000%." hint="Improve weighted dimensions or lower aggregate threshold intentionally."
```

Observed live gate stdout tail:

```text
YANOTE_SUMMARY status=partial operations=100.00 status_dimension=75.00 parameters=100.00 aggregate=93.75 covered=4/4 diagnostics=0 report=<temp>/report-gate/yanote-report.json primary=GATE_MIN_AGGREGATE class_counts=input:0,semantic:0,gate:1,runtime:0
```

Use those two lines as the authoritative failure-path surface. If a future rerun loses either line, the analyzer proof contract has drifted even if the wrapper script still exits non-zero.

## Clone-Local `AGENTS.md` Boundary Proof

Run these exact commands in the active clone when `S08-10` fails or when a future agent needs to re-prove the local-only boundary:

```bash
git rev-parse --git-path info/exclude
git check-ignore -v AGENTS.md
git status --ignored --short AGENTS.md
git ls-files | rg '(^|/)AGENTS\.md$' || true
```

Observed results in this clone:

```text
git rev-parse --git-path info/exclude
.git/info/exclude

git check-ignore -v AGENTS.md
.git/info/exclude:8:/AGENTS.md	AGENTS.md

git status --ignored --short AGENTS.md
!! AGENTS.md

git ls-files | rg '(^|/)AGENTS\.md$' || true
<empty>
```

Truthful interpretation:
- the ignore rule resolves through the repo-local `info/exclude` file;
- the rule is anchored as `/AGENTS.md`;
- Git reports the root file as ignored, not tracked;
- no tracked `AGENTS.md` exists anywhere in the index.

## Failure Signals To Keep

- `bash scripts/docs/verify-s08-entry-paths.sh` stops at the first bad `S08-0N` stage and prints the delegated command to rerun.
- `scripts/docs/verify-s02-analysis-path.sh` must continue to expose `GATE_MIN_AGGREGATE`, the `YANOTE_ERROR class=gate ...` stderr line, and the `YANOTE_SUMMARY ... primary=GATE_MIN_AGGREGATE` stdout line.
- `git check-ignore -v AGENTS.md` must continue to resolve through `.git/info/exclude` for `/AGENTS.md`.
- `git status --ignored --short AGENTS.md` must continue to report `!! AGENTS.md`.
- `git ls-files | rg '(^|/)AGENTS\.md$' || true` must continue to return no tracked file.

## Notes For Future Agents

- Prefer rerunning `bash scripts/docs/verify-s08-entry-paths.sh` first; only drop to the delegated stage listed above when the top-level proof names the failing layer.
- Treat this file and the live command output as authoritative for S08. The recovered placeholder slice summaries from earlier M002 slices are not the source of truth for the final milestone proof.
- Do not record `AGENTS.md` contents, secrets, or private prompt material in tracked artifacts.
