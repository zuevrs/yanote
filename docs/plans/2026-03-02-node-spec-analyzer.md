# Node spec analyzer (OpenAPI + AsyncAPI) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Node-based `yanote` analyzer CLI that reads OpenAPI/AsyncAPI + `events.jsonl` and produces `yanote-report.json`, then remove `yanote-cli` (Java).

**Architecture:** Keep Java recorders as event producers. Introduce a standalone Node CLI (`yanote-js`) that loads specs (OpenAPI now, AsyncAPI next), reads JSONL events, computes coverage, writes `yanote-report.json`, and enforces `--min-coverage` / baseline regression checks.

**Tech Stack:** Node.js (LTS), TypeScript, `@apidevtools/swagger-parser`, `@asyncapi/parser` (future), `esbuild` (bundle), `vitest` or `node:test`.

---

### Task 1: Add Node workspace (`yanote-js`) skeleton

**Files:**
- Create: `yanote-js/package.json`
- Create: `yanote-js/tsconfig.json`
- Create: `yanote-js/esbuild.config.mjs` (or `tsup.config.ts`)
- Create: `yanote-js/src/cli.ts`
- Create: `yanote-js/src/version.ts`
- Create: `yanote-js/README.md`

**Step 1: Create `package.json` with scripts**

- Scripts:
  - `build`: bundle CLI to `dist/cli.js`
  - `test`: run unit tests
  - `lint` (optional)
- Dependencies:
  - `@apidevtools/swagger-parser`
  - `minimist` / `yargs` / `commander` (pick one)
- Dev deps:
  - `typescript`
  - `esbuild`
  - `vitest` (or use `node:test` and skip vitest)

**Step 2: Create a minimal CLI that prints help**

- Command shape (v1):
  - `yanote report --spec <path> --events <path> --out <dir> [--min-coverage N] [--baseline <file> --fail-on-regression] [--exclude <pattern>...]`

**Step 3: Add smoke test for CLI arg parsing**

Run: `npm -C yanote-js test`  
Expected: PASS (a test that `--help` prints usage and exit code 0).

---

### Task 2: Implement OpenAPI loader → operation keys

**Files:**
- Create: `yanote-js/src/spec/openapi.ts`
- Create: `yanote-js/src/model/operationKey.ts`
- Test: `yanote-js/src/spec/openapi.test.ts`
- Test fixture: `yanote-js/test/fixtures/openapi/simple.yaml`

**Step 1: Write failing test**

- Load `simple.yaml`
- Expect extracted operations include:
  - `GET /health`
  - (and at least one templated route if fixture has it)

**Step 2: Implement loader**

- Use `@apidevtools/swagger-parser` to dereference.
- Extract from `paths`:
  - for each path + method, produce `OperationKey`:
    - `{ kind:"http", method:"GET", route:"/v1/users/{id}" }`

**Step 3: Run tests**

Run: `npm -C yanote-js test`  
Expected: PASS.

---

### Task 3: Implement AsyncAPI loader stub (future-ready)

**Files:**
- Create: `yanote-js/src/spec/asyncapi.ts`
- Test: `yanote-js/src/spec/asyncapi.test.ts`

**Step 1: Write a minimal test**

- Given an AsyncAPI fixture (can be added later), loader returns a list of `OperationKey` with `kind != "http"`.
- For now, allow returning empty list with a clear “not implemented” code path behind a feature flag.

**Step 2: Implement non-breaking stub**

- Parse file type detection, but don’t fail the whole run if AsyncAPI is present (until implemented).
- Ensure OpenAPI-only runs remain green.

---

### Task 4: Read `events.jsonl` and normalize HTTP events

**Files:**
- Create: `yanote-js/src/events/readJsonl.ts`
- Create: `yanote-js/src/model/httpEvent.ts`
- Test: `yanote-js/src/events/readJsonl.test.ts`
- Test fixture: `yanote-js/test/fixtures/events/events.jsonl`

**Step 1: Write failing test**

- Fixture contains:
  - a valid HTTP event with `test.suite:null`
  - an invalid line (non-JSON)
  - an event missing `route`
- Expect:
  - invalid lines ignored (or counted as warnings)
  - missing `route` ignored
  - `test.suite` normalized to `"unknown"`

**Step 2: Implement reader**

- Stream file line-by-line (do not load whole file).
- Parse JSON; filter `kind:"http"`.
- Normalize method upper-case, normalize `test.*`.

**Step 3: Run tests**

Run: `npm -C yanote-js test`  
Expected: PASS.

---

### Task 5: Coverage calculation (OpenAPI ops + HTTP events)

**Files:**
- Create: `yanote-js/src/coverage/coverage.ts`
- Test: `yanote-js/src/coverage/coverage.test.ts`

**Step 1: Write failing test**

- operations:
  - `GET /a`, `POST /b`
- events:
  - `GET /a` with suite `S1`
  - `GET /a` with suite `S1` again (duplicate)
- Expect:
  - coveredOperations = 1
  - suitesByOperation for `GET /a` contains `S1` once
  - uncovered contains `POST /b`

**Step 2: Implement**

- Matching by exact `(method, route)`.
- Dedup by `(operationKey, suite)`.
- Exclude patterns:
  - prefix match
  - wildcard `*` as glob-like (convert to regex), consistent with current Java behavior.

---

### Task 6: Report generation (`yanote-report.json`)

**Files:**
- Create: `yanote-js/src/report/report.ts`
- Create: `yanote-js/src/report/writeReport.ts`
- Test: `yanote-js/src/report/report.test.ts`

**Step 1: Write failing test**

- Run report generation with fixtures (OpenAPI + events).
- Expect output JSON contains:
  - `summary.coveragePercent`
  - `operations.uncovered` non-empty

**Step 2: Implement**

- Always write `yanote-report.json` into `--out`.
- Include `meta.toolVersion` and `meta.generatedAt`.

---

### Task 7: Baseline + regression + exit codes

**Files:**
- Create: `yanote-js/src/baseline/baseline.ts`
- Test: `yanote-js/src/baseline/baseline.test.ts`
- Modify: `yanote-js/src/cli.ts`

**Step 1: Write failing tests**

- min-coverage:
  - if `--min-coverage 100` and actual < 100 → exit code 3
- regression:
  - baseline has `POST /b`, current doesn’t → exit code 4 when `--fail-on-regression`
- invalid args / spec parse error → exit code 2

**Step 2: Implement baseline format**

```json
{
  "format": 1,
  "covered": [ { "kind":"http","method":"GET","route":"/a" } ]
}
```

**Step 3: Wire into CLI**

- Ensure `yanote-report.json` is still written even if checks fail (best-effort), then exit with the right code.

---

### Task 8: Update examples to use Node analyzer

**Files:**
- Modify: `examples/docker-compose.yml`
- Modify: `README.md`
- (Optional) Create: `examples/yanote-js-run.md`

**Step 1: Update docker-compose**

Current flow runs `:yanote-cli:run`. Replace with Node analyzer invocation.

Recommended approach (no Node inside JDK image):
- Keep `api` and `tests` services on `eclipse-temurin`.
- Add a `report` service on `node:lts` that:
  - mounts the repo and `yanote-events` volume
  - waits until a marker file exists (created by `tests` after Gradle tests)
  - runs `node yanote-js/dist/cli.js report --spec ... --events ... --out ... --min-coverage 100`

**Step 2: Verify compose**

Run: `docker compose -f examples/docker-compose.yml up --build --exit-code-from tests`  
Expected: tests pass; report service produces `/data/yanote/out/yanote-report.json`.

---

### Task 9: Remove Java CLI module (`yanote-cli`)

**Files:**
- Modify: `settings.gradle.kts` (remove `include("yanote-cli")`)
- Delete: `yanote-cli/` (module)
- Modify: any docs/examples referencing `:yanote-cli:run`

**Step 1: Replace all `yanote-cli` usage**

- README and examples use Node analyzer.

**Step 2: Delete module and verify build**

Run: `./gradlew test`  
Expected: PASS (all remaining modules/tests green).

---

### Task 10: Polish & guardrails

**Files:**
- Create: `.nvmrc` (or document required Node version in `yanote-js/package.json` `engines`)
- Modify: `yanote-js/README.md`

**Step 1: Document versions**

- Node LTS version and how to run analyzer in CI.

**Step 2: Add deterministic spec discovery rules**

- Document which filenames are auto-detected in `--spec <dir>`.

