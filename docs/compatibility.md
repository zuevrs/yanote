# Совместимость / Compatibility

Этот файл фиксирует текущие baseline-ожидания и правила чтения совместимости в Yanote.

## Baseline compatibility today

| Axis | Current baseline | Notes |
|---|---|---|
| Java | 21 | Verified baseline для Gradle build, CI и основной Java-first product path. |
| Node.js | `>=20` | Минимальный runtime для analyzer implementation / standalone bundle build path. |
| Spring Boot / Spring MVC | 3.x | Основной и проверенный HTTP recorder path. |
| Spring Boot / Spring WebFlux | published narrow proven path | Отдельный release-published `yanote-recorder-spring-webflux` surface; finite/non-streaming exchanges with bounded JSON proof only, без broad WebFlux parity promise. |
| Spring Kafka | current proven path | Поддержан через `yanote-recorder-spring-kafka` в текущей release surface. |
| RabbitMQ / AMQP | current narrow proven path | Поддержан только как first-wave async path на текущем source-built widened surface. |
| OS | CI-verified GitHub-hosted Linux baseline | Локально проект может работать и в других окружениях, но canonical proof приходит из CI + release artifacts. |

## Что считается authoritative

- Для опубликованной версии authoritative source — signed tags `vMAJOR.MINOR.PATCH` и GitHub Releases.
- Для support/release boundaries authoritative doc — [release-and-support.md](release-and-support.md).
- `gradle.properties` со значением `0.1.0-SNAPSHOT` и `yanote-js/package.json` со значением `0.0.0` не являются публичной compatibility truth для релиза.

## Совместимость по surface

### Java modules

Публично выпускаемые Java-модули и их compatibility expectation остаются привязаны к release line, а не к произвольному `HEAD`:

- `yanote-core`
- `yanote-recorder-spring-mvc`
- `yanote-recorder-spring-kafka`
- `yanote-recorder-spring-webflux`
- `yanote-test-tags-restassured`
- `yanote-test-tags-cucumber`
- `yanote-gradle-plugin`

### Published narrow recorder surface

Текущий release/pipeline path также несёт отдельный `yanote-recorder-spring-webflux` module, но его нужно читать буквально как narrow published surface, а не как замену release-published MVC path:

- отдельный модуль `yanote-recorder-spring-webflux`
- текущая proven boundary: finite/non-streaming exchanges
- bounded JSON request/response capture only on the proved path
- no broad WebFlux parity promise
- no promise for `SSE`, `application/stream+json`, long-lived/infinite streams, multipart/file-transfer paths

### Analyzer

User-facing analyzer compatibility читается через `yanote-analyzer.zip` и launcher `./yanote-analyzer/bin/yanote`.

- Public contract: launcher path + command surface (`report`, `async-report`, `combined-report` where applicable)
- Internal implementation detail: `yanote-js`
- Repo-local equivalent build: `./gradlew distStandaloneAnalyzer`

### Async / combined

Async compatibility intentionally narrow:

- Kafka path — supported
- RabbitMQ/AMQP path — supported as first concrete second broker path
- broker-agnostic compatibility — not promised
- blended HTTP+async denominator compatibility — not promised

## Breaking changes

Yanote предпочитает документировать boundary-affecting changes явно через:

- GitHub Release notes
- [CHANGELOG.md](../CHANGELOG.md)
- [upgrading.md](upgrading.md)
- [deprecations.md](deprecations.md)

Пока проект не делает широких multi-platform promises, compatibility claims нужно читать буквально и только по текущим документированным surfaces.
