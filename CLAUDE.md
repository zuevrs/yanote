# CLAUDE.md

- Status: Current
- Last verified: 2026-03-03
- Source of truth: `CLAUDE.md`

## Project Snapshot

- `yanote` is a hybrid repository with Java/Gradle modules and a Node/TypeScript CLI.
- Java modules include `yanote-core`, `yanote-recorder-spring-mvc`, and test-tag integrations.
- Node analyzer lives in `yanote-js/` and builds coverage reports from specs plus `events.jsonl`.

## Tooling Baseline

### Default external tools

- **Context7 MCP**: docs for Spring, Gradle, Node/TS libraries, and parser APIs.
- Tavily skills (`search`, `extract`, `crawl`, `research`): external search and references.
- **context-mode**: analyze large test/log/report outputs via `batch_execute`, `execute`, `execute_file`.
- `agent-browser`: optional; use only if a task truly needs browser interaction.

### MCP scope in this repo

- No project-scoped Supabase MCP is configured.

## Core Commands

```bash
# Root (Gradle)
./gradlew test
./gradlew distFlatdirRecorder
./gradlew distNodeAnalyzer
./gradlew distAll

# Node analyzer
npm -C yanote-js ci
npm -C yanote-js run build
npm -C yanote-js test
```

## Guardrails

- Prefer deterministic CLI/Gradle checks over ad-hoc manual verification.
- Keep recorder behavior explicit; do not assume event recording is enabled by default.
