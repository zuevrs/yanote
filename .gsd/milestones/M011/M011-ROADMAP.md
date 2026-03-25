# M011: M011: OpenAPI Parameter, Cookie, And Media Semantics

**Vision:** Broaden Yanote’s HTTP/OpenAPI truth from key-presence and JSON-only payload checks into a publishable, safely retained subset of cookie, serialization, media, and format semantics that the recorder → JSONL → analyzer → report path can prove end to end without overclaiming generic OpenAPI support.

## Success Criteria

- The live HTTP path safely retains enough path/query/header/cookie evidence to prove supported scalar semantics, while preserving the existing deterministic recorder → JSONL → analyzer architecture and backward-compatible coverage numerators.
- Yanote evaluates an explicit supported parameter subset — path=simple, query=form, header=simple, cookie=form — starting with scalar values and extending to repeated-value arrays only where retained evidence preserves values honestly.
- Payload conformance enforces a documented supported format policy and chooses the most specific matching declared media type, failing closed when declared semantics are unsupported, redacted, or cannot be proven.
- CLI/report/schema/docs/CI surfaces publish the widened supported HTTP boundary, including redaction/omission visibility and unsupported-subset diagnostics, through the same public entrypoints teams already use.

## Slices

- [x] **S01: Safe Request Evidence And First Scalar Truth** `risk:high` `depends:[]`
  > After this: After this slice, a focused Spring MVC route can be exercised end to end and `yanote report` shows captured/redacted/omitted path/query/header/cookie evidence plus first supported scalar parameter/cookie truth on retained artifacts.

- [x] **S02: Supported Serialization Subset And Cookie Conformance** `risk:high` `depends:[S01]`
  > After this: After this slice, `yanote report` and gates distinguish supported scalar and repeated-value array serialization for query/header/path/cookie parameters, and explicitly call out unsupported style/explode/content constructs instead of implying blanket OpenAPI support.

- [x] **S03: Format Policy And Media Specificity Truth** `risk:medium` `depends:[]`
  > After this: After this slice, declared `format` constraints and competing media types affect real report/gate outcomes: invalid email-like payloads fail, most-specific media declarations win, and declared-but-unsupported/custom formats are surfaced explicitly.

- [x] **S04: Public Contract Closeout For HTTP Semantics** `risk:medium` `depends:[S01,S02,S03]`
  > After this: After this slice, teams running the standard report/CI entrypoints and reading the analyzer guide see the widened supported HTTP boundary, retained proof scripts, and stable additive schema/CLI tokens for cookie/serialization/media/format truth.

## Boundary Map

- **Ingress/runtime boundary** (`yanote-recorder-spring-mvc` → `yanote-core` JSONL)
  - **S01** adds additive request evidence for path/query/header/cookie values with tri-state `captured` / `redacted` / `omitted` provenance.
  - Invariants: canonical `route` stays templated; old events remain readable; legacy `queryKeys` / `headerKeys` stay derivable for existing coverage numerators.
- **Spec/conformance boundary** (`yanote-js/src/spec` → `yanote-js/src/coverage`)
  - **S02** expands parameter contracts only for the publishable subset: `path=simple`, `query=form`, `header=simple`, `cookie=form`, scalar first and repeated-value arrays only when evidence preserves values honestly.
  - Unsupported constructs (`matrix`, `label`, `deepObject`, parameter `content`, nested encoding-heavy shapes, OAS 3.2 `querystring`) surface as diagnostics instead of implied support.
- **Payload semantics boundary** (`yanote-js/src/coverage/httpPayloadConformance.ts`)
  - **S03** adds explicit format policy and most-specific media matching without claiming universal non-JSON media support.
- **Public contract boundary** (`yanote report`, report schema, gates, docs, CI)
  - **S04** exposes the widened semantics through existing CLI/report/CI/docs surfaces and keeps legacy observation metrics stable.
