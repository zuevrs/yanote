# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M007/S01 planning | M007/S01 async-contract | Payload-bearing async evidence boundary for Kafka | Capture JSON-safe observed Kafka payloads through recorder -> JSONL -> Node reader and retain AsyncAPI payload schema metadata beside the canonical `kafka <action> <channel>` key, while deferring generic header evidence and async report/gate schema semantics to later slices. | R049 requires real observed payload truth before schema validation can be trustworthy. Keeping operation identity unchanged and deferring header/report semantics prevents S01 from mixing contract-depth work with later drift-classification and CLI/report changes. | Yes |
