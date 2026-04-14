# Матрица поддержки / Support matrix

Этот файл — короткая публичная матрица того, что в Yanote считается **поддерживаемым**, **ограниченно поддерживаемым**, **deferred** или **internal-only**. За полным объяснением boundary-логики оставайтесь в [release-and-support.md](release-and-support.md).

## Supported today

| Surface | Status | Notes |
|---|---|---|
| `yanote-recorder-spring-mvc` | Supported | Основной HTTP recorder path для Spring Boot 3.x / Spring MVC. |
| `yanote-recorder-spring-kafka` | Supported | Release-published Kafka recorder path для evidence capture. |
| Standalone analyzer bundle `yanote-analyzer.zip` | Supported | Официальный install/run artifact для analyzer surface. |
| `bin/yanote report` + `yanote-report.json` / `yanote-report.html` | Supported | Канонический HTTP analyzer/report path. |
| Gradle plugin `io.github.zuevrs.yanote.gradle` | Supported | Публичная Gradle integration surface. |
| `yanote-test-tags-restassured` / `yanote-test-tags-cucumber` | Supported | Поддерживаемая test-tagging surface для Java-first workflow. |
| GitHub Actions / CI delivery artifacts | Supported | `yanote-validation-artifacts` и `build-and-test-artifacts` как доказуемые CI surfaces. |

## Narrow supported surface

| Surface | Status | Notes |
|---|---|---|
| `yanote-recorder-spring-webflux` | Narrow supported | Отдельный release-published WebFlux recorder module; proved compatibility floor — Spring Boot 2.7.x / Spring Framework 5.3.x и Spring Boot 3.x / Spring Framework 6.x для finite/non-streaming exchange proof only, без generic Spring HTTP promises и без замены MVC surface. |
| `async-report` Kafka path | Narrow supported | Поддержан и сохранён как proven async path. |
| `async-report` RabbitMQ/AMQP path | Narrow supported | Первый concrete second broker path; без broker-agnostic promises. |
| `combined-report` | Narrow supported | Child-attributed aggregate surface, без blended denominator. |
| Remote `--spec` over single-document `http(s)` | Narrow opt-in | Поддерживается как узкий opt-in path, не как broad remote spec promise. |

## Supported with explicit limits

| Surface | Limit |
|---|---|
| HTTP payload validation | JSON-first public path; supported format allowlist сейчас intentionally `email`-only. |
| HTTP request serialization | `path=simple`, `query=form`, `header=simple`, `cookie=form`; broader styles/content parameters не входят в supported surface. |
| HTTP security semantics | Truthful `apiKey` query/header/cookie subset; broader security scheme coverage не обещается. |
| Spring WebFlux recorder path | Только отдельный release-published модуль `yanote-recorder-spring-webflux`; proved compatibility floor — Spring Boot 2.7.x / Spring Framework 5.3.x и Spring Boot 3.x / Spring Framework 6.x, а текущая proof boundary — finite/non-streaming exchanges и bounded JSON payload capture, без broad WebFlux parity promise. |
| Async semantics | Kafka + first RabbitMQ/AMQP path only; raw retained headers/payload bodies не становятся public support intake surface. |

## Deferred / not promised yet

| Surface | Status |
|---|---|
| Non-Java first-class onboarding | Deferred |
| Broader OpenAPI objects (`examples`, `links`, `callbacks`, `webhooks`) | Deferred |
| Deeper AsyncAPI schema-keyword coverage beyond current proof families | Deferred |
| Broader Spring WebFlux parity (`SSE`, `application/stream+json`, long-lived/infinite streams, multipart/file-transfer paths, broad body-type parity claims) | Deferred |
| Blended HTTP + async denominator / gate / dashboard | Deferred |
| Broker-agnostic async promise | Not promised |
| Hosted dashboard UI | Not promised |

## Internal / maintainer-only

| Surface | Why internal |
|---|---|
| `docs/maintainers/**` | Clone-local rerun maps, owner workflows и maintainer-only diagnostics. |
| raw `node yanote-js/dist/yanote.cjs` seam | Implementation seam behind the standalone bundle, not public entrypoint. |
| local `.yanote-ci/**` rerun roots | Diagnostic/verification state, не public support contract. |
| source-built marker versions like `yanote-js/package.json: 0.0.0` | Technical implementation markers, не public release truth. |

## Как читать эту матрицу

- **Supported** = surface входит в текущую публичную границу и имеет действующий verification path.
- **Narrow supported** = surface поддержан, но только в явно описанном узком диапазоне.
- **Deferred / Not promised** = project consciously does not promise this today.
- **Internal** = surface может существовать в repo, но не считается user-facing contract.
