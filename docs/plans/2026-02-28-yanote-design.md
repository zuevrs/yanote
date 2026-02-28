# yanote v1 Design

## Goal
Определять, какие REST API эндпоинты сервиса реально были вызваны тестами, и какие — нет, на основе OpenAPI спецификации и фактов вызовов, собранных на стороне сервиса. Выдавать отчёт покрытия и фейлить CI при регрессии/нарушении порога.

## Non-goals (v1)
- Детализация по ролям, payload-формам, параметрам, статусам (кроме опционального status в событии для диагностики).
- Kafka/RabbitMQ, GraphQL/gRPC (закладываем расширяемость, но не реализуем).
- Жёсткая зависимость от OpenTelemetry пайплайна как источника правды.

## Users
- Backend/QA команда Java REST сервисов с интеграционными тестами (RestAssured + Cucumber).

## Done means
- Инструмент строит полный список операций из OpenAPI (multi-file, `$ref`) из `api-specification/`.
- Инструмент собирает факты реальных вызовов API из событий, записанных сервисом, и сопоставляет по ключу `method + templated path`.
- Моки/стабы, не дошедшие до сервиса, не учитываются.
- Отчёт показывает:
  - общий % покрытия (по операциям),
  - список непокрытых эндпоинтов,
  - для покрытых — список suites, которые вызывали эндпоинт.
- Есть режим CI регрессий: сравнение с baseline и fail при ухудшении и/или нарушении порога.

---

## High-level architecture

### Components
1. **Service-side recorder (Spring MVC starter)** (`yanote-recorder-spring-mvc`)
   - Встраивается в сервис.
   - Пишет нормализованные события фактов вызовов в `events.jsonl` в указанный путь (обычно volume в docker-compose/CI).
   - Источник route template: Spring MVC best-matching pattern (не raw URL).
   - Не логирует тела/токены; только метод/route и тестовые метки.
   - OpenTelemetry не обязателен; может опционально добавлять `test.*` атрибуты в текущий span (если OTel есть), но файл остаётся источником правды.

2. **Test traffic tagging** (`yanote-test-tags`)
   - Интеграции для RestAssured и Cucumber, чтобы централизованно добавлять:
     - `X-Test-Run-Id`
     - `X-Test-Suite`
   - Минимизирует ручные правки тестов.

3. **CLI analyzer/report** (`yanote-cli`)
   - Читает OpenAPI из `api-specification/` (или явно заданный путь).
   - Читает `events.jsonl`.
   - Нормализует ключи операций и строит:
     - summary coverage,
     - uncovered list,
     - covered → suites mapping,
     - baseline/regression check.

### Data contracts

#### Canonical event: JSON Lines (`events.jsonl`)
Одна строка = один факт реального вызова операции (или один факт на запрос; дедуп делается в отчёте).

Обязательные поля (v1):
- `ts`: epoch millis
- `kind`: `"http"`
- `method`: `"GET"|"POST"|...`
- `route`: templated path, например `"/v1/users/{id}"`
- `test.run_id`: строка (из `X-Test-Run-Id`, либо `"unknown"` если не задано)
- `test.suite`: строка (из `X-Test-Suite`, либо `"unknown"` если не задано)

Опциональные поля (v1):
- `status`: integer
- `service`: string
- `instance`: string
- `error`: boolean

Дедуп для coverage:
- ключ покрытия: `(kind, method, route, test.suite)`

Security/Safety:
- Не писать query string, headers (кроме тестовых меток), тела запросов/ответов, авторизационные данные.

---

## Matching strategy

### OpenAPI operations
- Источник правды: OpenAPI/Swagger из `api-specification/`.
- Парсер: использовать готовый OSS (например `swagger-parser`) с поддержкой `$ref` и multi-file.
- Ключ операции: `(HTTP method, templated path from spec)`.

### Runtime events → operations
- События содержат `method + route` (templated path) из Spring MVC.
- Сопоставление: по точному совпадению `(method, route)` с ключами OpenAPI.
- Исключение техэндпоинтов (health/metrics/etc): дефолтные правила + конфиг.

Fallback (если route template недоступен) — отложено:
- матчинг raw path → templated path по OpenAPI (не обязателен для Spring MVC v1).

---

## CI workflow (baseline/regression)
- После прогона тестов артефакт `events.jsonl` сохраняется из контейнера/volume.
- `yanote-cli` генерирует отчёт (JSON + console summary).
- Baseline:
  - хранить baseline как файл covered-операций (или отчёт) из main.
  - в PR сравнивать: fail при ухудшении покрытия и/или ниже абсолютного порога (значение порога задаётся конфигом).

---

## Extensibility: AsyncAPI/Kafka (future)
- В `yanote` закладывается расширяемая модель `kind`.
- Для Kafka добавится новый `kind: "kafka"` и отдельный recorder-модуль (Spring Kafka), который пишет нормализованные события с `test.*` в Kafka headers.
- Парсинг AsyncAPI: использовать готовый OSS парсер (не писать свой), подключая его как отдельный “spec-loader” плагин.

---

## Config (shape, v1)
Поддержать CLI flags + YAML (минимально):
- paths: `openapiPath`, `eventsPath`, `outputDir`
- exclude patterns: health/metrics/etc
- thresholds: `minCoveragePercent`
- regression: `baselinePath`, `failOnRegression`

