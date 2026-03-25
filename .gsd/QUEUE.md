# Queue

Append-only log of future milestones queued behind currently active work.

## 2026-03-23

- `M011` — **OpenAPI Parameter, Cookie, And Media Semantics**. Depends on `M010`. Queued to broaden the supported HTTP contract surface beyond current core checks into cookie, serialization, and media/format semantics that can be proven through the recorder → JSONL → analyzer path.
- `M012` — **OpenAPI Surface Expansion Beyond Request/Response Core**. Depends on `M011`. Queued to decide which broader OpenAPI objects become first-class supported analyzer surfaces after the request/response core is complete.
- `M013` — **Analyzer Delivery, Remote Spec, And Report UX**. Depends on `M012`. Queued to improve spec loading, deprecated-operation handling, and human-facing report artifacts after the semantic core settles.
- `M014` — **AsyncAPI Semantic Breadth Within Kafka-First Boundaries**. Depends on `M010`. Queued to deepen the Kafka-only async path with richer AsyncAPI semantics before any transport expansion.
- `M015` — **Async Platform Expansion And Cross-Surface Reporting**. Depends on `M014`. Queued as the late platform-boundary milestone for non-Kafka async support and any future combined HTTP+async report contract.
