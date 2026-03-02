# Node spec analyzer (OpenAPI + AsyncAPI) — design

## Goal

Сделать **Node CLI** основным инструментом анализа покрытия:

`spec files (OpenAPI/AsyncAPI) + events.jsonl → Node analyzer → yanote-report.json`

После миграции **`yanote-cli` (Java)** удаляется.

## Context

- Факты вызовов собираются **на стороне сервиса** и пишутся в `events.jsonl` (JSON Lines).
- v1 покрытие = **inbound REST API** сервиса по OpenAPI.
- Следующая итерация (обязательная): **AsyncAPI** (Kafka/Rabbit) — поэтому выбираем экосистему Node с зрелыми OSS-парсерами.

## Decisions

- **Analyzer**: Node CLI читает спецификации и события, строит отчёт и выполняет CI-проверки (min-coverage, regression).
- **Recorders**: остаются на Java (как есть): `yanote-recorder-spring-mvc` пишет HTTP события.
- **Ключ операции v1**: `(kind, method, route)` где `route` — **templated** (например `/v1/users/{id}`).
- **Status** не участвует в покрытии v1; остаётся как диагностическое поле в event.
- **Single report artifact**: `yanote-report.json` (пишется всегда).

## Data contracts

### Input: `events.jsonl`

Поддерживаем текущий контракт (совместимость с Java recorder).

HTTP event (v1):
- required for matching: `kind:"http"`, `method`, `route`
- recommended: `ts`
- optional: `status`, `service`, `instance`, `error`, `test.run_id`, `test.suite`

Normalization rules (в Node):
- `method` → upper-case
- `test.run_id`, `test.suite`: `null`/blank → `"unknown"`
- события без `method` или `route` → игнорировать

Security:
- не логировать query string, тела, токены, произвольные headers (кроме test-тегов, если они попали в event).

### Output: `yanote-report.json`

Минимальный стабильный контракт (под CI и людей):

- `meta`:
  - `generatedAt` (epoch millis / ISO)
  - `toolVersion` (semver)
  - `inputs` (пути/идентификаторы; по возможности)
- `summary`:
  - `totalOperations`
  - `coveredOperations`
  - `coveragePercent`
- `operations`:
  - `all`: `OperationKey[]`
  - `covered`: `OperationKey[]`
  - `uncovered`: `OperationKey[]`
- `suitesByOperation`: `{ "<serializedKey>": string[] }` (опционально, но желательно для v1)

`OperationKey` (унифицировано под future kinds):

- HTTP:
  - `{ "kind": "http", "method": "GET", "route": "/v1/users/{id}" }`
- AsyncAPI (future; точный ключ уточним при реализации recorder’а):
  - `{ "kind": "kafka", "channel": "users.events", "action": "publish" }`

`serializedKey`:
- стабильная строка для map-ключей (например `http GET /v1/users/{id}` или JSON-canonical).

## Spec loading

### OpenAPI

- OSS парсер с `$ref`/multi-file: **`@apidevtools/swagger-parser`** (или эквивалент).
- Извлекаем операции из `paths`:
  - операция = HTTP method + templated path (как в spec).

### AsyncAPI (future)

- OSS парсер: **`@asyncapi/parser`**.
- Извлекаем список publish/subscribe операций из `channels`.

## Matching & coverage

v1 (HTTP):
- операции берём из OpenAPI как `OperationKey(kind=http, method, route)`
- события берём из `events.jsonl` как `OperationKey(kind=http, method, route)`
- matching: **точное совпадение** `(method, route)`; event route должен быть templated.

Dedup:
- для покрытия: `(operationKey, test.suite)` (suite-level coverage)

Exclude:
- дефолтные исключения (health/metrics) + пользовательские patterns.

## Baseline / regression (CI)

Baseline файл хранит **covered operations** (набор ключей) и версию формата.

Proposed baseline shape:

```json
{
  "format": 1,
  "covered": [
    {"kind":"http","method":"GET","route":"/v1/users/{id}"}
  ]
}
```

Regression:
- `regressed = baseline.covered \ current.covered`
- если `--fail-on-regression` и `regressed` не пуст → fail.

Min coverage:
- если `coveragePercent < --min-coverage` → fail.

Exit codes:
- `0`: ok
- `2`: invalid args / spec parse error
- `3`: min-coverage failed
- `4`: regression failed

## CLI UX

Команда:
- `yanote report --spec <path> --events <events.jsonl> --out <dir> [--min-coverage N] [--baseline <file> --fail-on-regression] [--exclude <pattern>...]`

`--spec` принимает:
- файл спецификации (OpenAPI/AsyncAPI), или
- директорию (анализатор находит `openapi*.{yml,yaml,json}` и `asyncapi*.{yml,yaml,json}`).

Output:
- всегда пишет `yanote-report.json` в `--out`.
- summary печатает в stdout (для логов CI).

## Packaging

- В репо добавляем `yanote-js/` с `package.json`.
- Сборка CLI (bundle):
  - `esbuild`/`tsup` → `yanote-js/dist/cli.js`
  - запуск: `node yanote-js/dist/cli.js report ...`
- (опционально позже) self-contained binary через `pkg`/`nexe`, если потребуется “без Node”.

## Migration plan (high-level)

1. Добавить Node CLI и сделать его зелёным на `examples/` (генерирует совместимый `yanote-report.json`).
2. Перевести `examples/docker-compose.yml` (и README) на Node CLI.
3. Добавить baseline/regression режим в Node и перенести CI usage.
4. Удалить `yanote-cli` и связанные тесты/документацию.

## Risks / mitigations

- **Node runtime в CI**: фиксируем версию Node (например `.nvmrc`/`engines`) и даём single-file сборку.
- **Spec discovery в директории**: правила поиска должны быть детерминированными и документированными.
- **Templated route**: для HTTP v1 требуем route template от recorder’а; fallback raw→templated по OpenAPI — отдельная future задача.

