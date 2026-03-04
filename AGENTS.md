# AGENTS.md

## Agent Operating Guide

### Scope

- Repository: `yanote`.
- Multi-module Gradle setup (Java 21) + Node/TypeScript analyzer in `yanote-js/`.
- Distribution tasks are root-level (`distFlatdirRecorder`, `distNodeAnalyzer`, `distAll`).

### Tooling Policy

- Use **Context7 MCP** first for framework/library docs.
- Use Tavily skills (`search`, `extract`, `crawl`, `research`) for external references.
- Use **context-mode** for large outputs and report/log processing.
- Use `agent-browser` only when browser automation is required.
- Supabase MCP is not project-scoped in this repo.

### Execution Defaults

- Prefer reproducible command paths: `./gradlew ...` and `npm -C yanote-js ...`.
- Run module-specific tests/checks for touched areas before finalizing.

### Guardrails

- Preserve CLI/report contract behavior.
- Avoid changing distribution task semantics unless explicitly requested.
