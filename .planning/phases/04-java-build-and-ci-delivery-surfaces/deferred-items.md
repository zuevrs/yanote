# Deferred Items

- `distNodeAnalyzer` currently reports existing npm audit vulnerabilities in both root and bundled analyzer installs (`10 vulnerabilities` in `yanote-js`, `5 high` in `dist/node-analyzer`). This plan did not change dependency versions; remediation is deferred to a dedicated dependency-security pass.
