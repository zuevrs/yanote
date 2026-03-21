# Канонический путь: запуск analyzer и интерпретация покрытия

Это основной и проверенный путь анализа для `yanote`: собирайте `yanote-js` из исходников в этом репозитории, запускайте `report`, читайте `Summary`/`YANOTE_SUMMARY`, затем открывайте `yanote-report.json`.

Если в вашем контуре нельзя выполнить `npm -C yanote-js ci && npm -C yanote-js run build`, fallback остаётся только через release assets GitHub Releases. Командная форма и структура отчёта у такого fallback-та же; меняется только способ доставки CLI. Текущие границы и release truth смотрите в [`docs/release-and-support.md`](../release-and-support.md).

Если вам нужен не HTTP/OpenAPI путь, а первая волна AsyncAPI/Kafka, не смешивайте этот guide с async semantics: отдельный onboarding вынесен в [`docs/guides/asyncapi-kafka.md`](asyncapi-kafka.md), где описаны Kafka evidence inputs, `async-report`, `YANOTE_ASYNC_SUMMARY` и `yanote-async-report.json`.

Если хотите сначала перепроверить live-path репозитория, а потом редактировать этот гайд, используйте:

```bash
bash scripts/docs/verify-s02-analysis-path.sh
```

## 1. Что нужно на входе

Analyzer всегда ждёт три вещи:

- `--spec` — OpenAPI-файл или директорию со спецификацией;
- `--events` — путь к собранному `events.jsonl`;
- `--out` — директорию, куда будет записан отчёт.

Рекордер и проверенный путь к `events.jsonl` описаны в [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md).

## 2. Соберите CLI из исходников

Из корня репозитория:

```bash
npm -C yanote-js ci
npm -C yanote-js run build
```

После этого основной бинарь лежит здесь:

- `yanote-js/dist/yanote.cjs`

## 3. Запустите анализ

Минимальная команда:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec /path/to/openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out
```

Результат всегда пишется в стабильный файл:

- `./out/yanote-report.json`

Проверенный repo-пример на реальных assets:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec examples/openapi/demo-openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out \
  --min-coverage 100
```

Если хотите проверить именно публичный retained proof bundle репозитория, используйте:

```bash
bash scripts/ci/run-v1-e2e.sh
```

После него happy path остаётся в `.yanote-ci/v1-e2e/out/yanote-report.json`, а retained semantic-red sidecars лежат рядом в `.yanote-ci/v1-e2e/semantic-red.stdout`, `.yanote-ci/v1-e2e/semantic-red.stderr` и `.yanote-ci/v1-e2e/semantic-red-yanote-report.json`.

Что важно про флаги:

- `--min-coverage` проверяет только dimension `operations`.
- `--min-aggregate` включает gate по взвешенному aggregate-coverage.
- `--exclude` используйте только когда хотите сознательно исключить route, который **реально объявлен в spec**. Не копируйте старое `--exclude /health` по инерции: в текущем demo-spec `/health` вообще не объявлен, поэтому такой флаг только создаёт `governance.exclusions.unmatchedRules` и шум в summary.

## 4. Что означает plain-text вывод CLI

У `report` три устойчивых surface-а:

1. **Читаемый stdout** с секциями `Summary`, `Coverage Dimensions`, `HTTP Payload Conformance`, `Top Issues`, `Report Path`
2. **Финальная machine-readable строка** `YANOTE_SUMMARY ...`
3. **Fail-closed stderr** с `YANOTE_ERROR ...`, если semantic/gate boundary не выполнена

Если есть fail-closed ошибка, CLI дополнительно пишет в `stderr` строку `YANOTE_ERROR ...` и завершает процесс с ненулевым кодом. При gate-failure или semantic-red path после построения отчёта `yanote-report.json` всё равно сохраняется.

### Summary

- `status: ok` — нет invalid/ambiguous diagnostics, нет uncovered operations, aggregate dimension имеет состояние `COVERED`, и fail-closed semantic diagnostics отсутствуют.
- `status: partial` — отчёт собран, но хотя бы одна coverage-dimension не закрыта полностью **или** payload boundary сработал как fail-closed semantic path.
- `status: invalid` — есть invalid/ambiguous semantic diagnostics, поэтому CLI работает fail-closed.

`operations: covered/total (percent)` показывает только факт наблюдения операций, а не полноту payload validation.

### Coverage Dimensions

CLI всегда печатает четыре измерения observation coverage:

- `operations` — доля объявленных операций, для которых вообще был matched event;
- `status` — доля объявленных response-status токенов (`200`, `4XX`, `default` и т.д.), реально покрытых событиями;
- `parameters` — доля **required** path/query/header-параметров, для которых есть evidence;
- `aggregate` — взвешенная метрика: `operations * 0.60 + status * 0.25 + parameters * 0.15`.

Состояния измерений:

- `COVERED` — 100%
- `PARTIAL` — между 0% и 100%
- `UNCOVERED` — 0%
- `N/A` — измерение не вычисляется из-за отсутствия объявленного контракта (например, нет required parameters или declared statuses)

Если хотя бы одно из измерений `status` или `parameters` равно `N/A`, то `aggregate` тоже будет `N/A` с пояснением в `aggregate.explanation`.

### HTTP Payload Conformance

Это отдельная поверхность поверх observation coverage. Она отвечает не на вопрос «была ли операция/статус/required parameter замечена», а на вопрос «можно ли честно проверить observed request/response payload против объявленного JSON content».

На этой поверхности важно различать три случая:

- `COVERED` / `VALID` — observed JSON payload удалось сопоставить с declared schema;
- `SKIPPED` + `NO_DECLARED_CONTENT` — observed response был, но spec для этого status не объявляет content; это **не** ломает observation coverage и не считается fail-closed ошибкой;
- fail-closed semantic diagnostics вроде `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` — JSON content объявлен, но usable validation schema нет, поэтому CLI завершает анализ ошибкой даже при `100%` observation coverage.

### Top Issues

`Top Issues` показывает только явные warnings/errors/diagnostics, а не каждую неполную метрику. Поэтому у зелёного happy path секция может содержать `- none`, а у semantic-red path — только retained `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` issues при тех же `100%` observation dimensions.

### Report Path

Это путь к записанному `yanote-report.json`. Для CI это полезнее, чем парсить весь stdout.

### YANOTE_SUMMARY

Последняя строка stdout имеет стабильный формат. Для текущего happy path она выглядит так:

```text
YANOTE_SUMMARY status=ok operations=100.00 status_dimension=100.00 parameters=100.00 aggregate=100.00 covered=4/4 diagnostics=0 payload_diagnostics=covered:2,uncovered:0,skipped:3 report=./out/yanote-report.json primary=none class_counts=input:0,semantic:0,gate:0,runtime:0
```

Semantic-red retained pass на тех же live events меняет именно boundary truth, а не observation numerators: `primary=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, `status=partial`, `payload_diagnostics=covered:0,uncovered:0,skipped:5`, но `operations/status_dimension/parameters/aggregate` остаются `100.00`.

### YANOTE_ERROR

Если вы включили semantic-red retained path из публичного proof bundle, stderr содержит строки вида:

```text
YANOTE_ERROR class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA ...
YANOTE_ERROR_SECONDARY class=semantic code=SEMANTIC_HTTP_UNSUPPORTED_SCHEMA ...
```

Проверяемый public-proof пример — `.yanote-ci/v1-e2e/semantic-red.stderr`: он должен содержать `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`, а `.yanote-ci/v1-e2e/semantic-red-yanote-report.json` должен сохраниться для последующего разбора.

## 5. Что искать в `yanote-report.json`

Минимальный каркас happy-path отчёта такой:

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-03-21T00:00:00.000Z",
  "toolVersion": "...",
  "phase": { "id": "02", "slug": "coverage-metrics-and-cli-reporting" },
  "status": "ok",
  "summary": {
    "totalOperations": 4,
    "coveredOperations": 4,
    "operationCoveragePercent": 100,
    "aggregateCoveragePercent": 100
  },
  "coverage": {
    "operations": { "state": "COVERED", "percent": 100 },
    "status": { "state": "COVERED", "percent": 100 },
    "parameters": { "state": "COVERED", "percent": 100 },
    "aggregate": { "state": "COVERED", "percent": 100 },
    "perOperation": []
  },
  "diagnostics": {
    "counts": { "invalid": 0, "ambiguous": 0, "unmatched": 0 },
    "items": []
  },
  "httpPayloadConformance": {
    "summary": {
      "request": { "coveredOperations": 1, "skippedOperations": 0, "notApplicableOperations": 3 },
      "response": { "coveredOperations": 1, "skippedOperations": 3, "notApplicableOperations": 0 }
    },
    "diagnostics": { "counts": { "covered": 2, "uncovered": 0, "skipped": 3 } }
  },
  "governance": {
    "exclusions": { "appliedRules": [], "unmatchedRules": [] },
    "diagnostics": []
  }
}
```

На практике обычно смотрят поля в таком порядке:

1. `status` — можно ли считать отчёт зелёным (`ok`) или он лишь partial/fail-closed;
2. `summary.totalOperations` / `summary.coveredOperations` / `summary.operationCoveragePercent` — общая видимость операций;
3. `coverage.operations|status|parameters|aggregate` — truth по observation coverage;
4. `httpPayloadConformance.summary` и `httpPayloadConformance.diagnostics` — truth по request/response payload validation;
5. `coverage.perOperation[]` и `httpPayloadConformance.perOperation[]` — где именно не хватает статусов, параметров или usable payload boundary;
6. `diagnostics.counts` и `governance.diagnostics` — есть ли unmatched/ambiguous/semantic fail-closed сигналы;
7. `governance.exclusions.*` — какие исключения применились и какие gate/policy-сигналы сработали.

Особенно полезные поля в `coverage.perOperation[]`:

- `operationKey`, `method`, `route` — стабильная идентификация операции;
- `operation.state` — наблюдалась ли операция хотя бы раз;
- `status.declared` / `status.covered` / `status.missing` — truth по response status tokens;
- `parameters.required.total|covered|missing` — truth по required parameters;
- `parameters.optional.*` — дополнительные сигналы по optional parameters;
- `suites` — какие test suites реально дали покрытие этой операции; происхождение этих значений и граница с `test.run_id` описаны в [`docs/guides/test-tagging.md`](test-tagging.md).

И отдельно полезные поля в `httpPayloadConformance.*`:

- `summary.request` / `summary.response` — сколько операций реально покрыты, skipped или n/a по payload surface;
- `diagnostics.items[]` — чем именно объясняется `VALID`, `NO_DECLARED_CONTENT` или `UNSUPPORTED_SCHEMA`;
- `perOperation[].request|response.state` — где payload boundary зелёная, а где честно skipped/n/a;
- `perOperation[].response.declaredContent` — какие media types и statuses вообще объявлены для payload validation.

## 6. Как читать реальные числа из текущего demo-path

Проверяемый public proof путь — `bash scripts/ci/run-v1-e2e.sh`.

### Happy path: `.yanote-ci/v1-e2e/out/yanote-report.json`

Текущий happy path даёт такие числа:

- `operations`: `4/4`, то есть `100.00%`
- `status`: `100.00%`
- `parameters`: `100.00%`
- `aggregate`: `100.00%`
- `report.status`: `ok`

И это не просто зелёные observation numbers. В `HTTP Payload Conformance` здесь тоже есть проверяемая truth:

- `POST /users` даёт `VALID` для request и response JSON payload;
- `GET /admin/ping`, `GET /users` и `GET /users/{param}` честно дают `NO_DECLARED_CONTENT` для response surface, потому что spec не объявляет content для observed `200` response;
- эти `NO_DECLARED_CONTENT` diagnostics сохраняются как `SKIPPED`, а не как fail-closed ошибка.

Это важная граница: benign `NO_DECLARED_CONTENT` виден в отчёте, но не ломает ни `operations/status/parameters/aggregate`, ни `status: ok`.

### Semantic red path: `.yanote-ci/v1-e2e/semantic-red.*`

Retained semantic-red pass использует те же live events, но OpenAPI variant из `examples/openapi/demo-openapi-unsupported-schema.yaml`.

Что именно он доказывает:

1. Observation coverage не меняется: `operations/status/parameters/aggregate` остаются `100.00%`.
2. `HTTP Payload Conformance` перестаёт быть зелёной для `POST /users`, потому что declared JSON schema intentionally unusable for validation.
3. CLI завершает анализ fail-closed с exit code `5`.
4. `.yanote-ci/v1-e2e/semantic-red.stderr` удерживает `YANOTE_ERROR ... SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`.
5. `.yanote-ci/v1-e2e/semantic-red-yanote-report.json` сохраняет per-operation truth для последующего разбора.

В этом retained отчёте вы увидите два связанных, но разных сигнала:

- `governance.diagnostics` содержит `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` как fail-closed semantic boundary;
- `httpPayloadConformance.diagnostics.items[]` помечает `POST /users` request/response как `UNSUPPORTED_SCHEMA`, а `GET`-ответы по-прежнему остаются benign `NO_DECLARED_CONTENT`.

Главный интерпретационный момент теперь такой: **observation coverage и payload conformance — разные поверхности**. Полное покрытие операций/статусов/параметров не отменяет fail-closed semantic boundary, если JSON content объявлен без usable validation schema.

## 7. Когда использовать offline fallback

Offline fallback нужен только когда основной source-built путь недоступен в вашем контуре. Смысл и интерпретация отчёта остаются теми же; меняется только способ доставки CLI через release assets GitHub Releases. Границы этого пути и актуальную release truth смотрите в [`docs/release-and-support.md`](../release-and-support.md).

## Связанные поверхности

- Проверенный путь рекордера: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Канонический test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Runnable demo-service: [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md)
- RestAssured handoff для тестовых метаданных: [`examples/tests-restassured/README.md`](../../examples/tests-restassured/README.md)
- Release/support boundary и fallback assets: [`docs/release-and-support.md`](../release-and-support.md)
