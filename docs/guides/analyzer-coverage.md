# Канонический путь: запуск analyzer и интерпретация покрытия

Это основной и проверенный путь анализа для `yanote`: собирайте `yanote-js` из исходников в этом репозитории, запускайте `report`, читайте `Summary`/`YANOTE_SUMMARY`, затем открывайте `yanote-report.json`.

`dist/node-analyzer/` остаётся только offline fallback, когда в вашем контуре нельзя выполнить `npm -C yanote-js ci && npm -C yanote-js run build`. Командная форма и структура отчёта у fallback-та же; разница только в способе доставки CLI.

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

Что важно про флаги:

- `--min-coverage` проверяет только dimension `operations`.
- `--min-aggregate` включает gate по взвешенному aggregate-coverage.
- `--exclude` используйте только когда хотите сознательно исключить route, который **реально объявлен в spec**. Не копируйте старое `--exclude /health` по инерции: в текущем demo-spec `/health` вообще не объявлен, поэтому такой флаг только создаёт `governance.exclusions.unmatchedRules` и шум в summary.

## 4. Что означает plain-text вывод CLI

У `report` два устойчивых surface-а:

1. **Читаемый stdout** с секциями `Summary`, `Coverage Dimensions`, `Top Issues`, `Report Path`
2. **Финальная machine-readable строка** `YANOTE_SUMMARY ...`

Если есть fail-closed ошибка, CLI дополнительно пишет в `stderr` строку `YANOTE_ERROR ...` и завершает процесс с ненулевым кодом. При gate-failure после построения отчёта `yanote-report.json` всё равно сохраняется.

### Summary

- `status: ok` — нет invalid/ambiguous diagnostics, нет uncovered operations, aggregate dimension имеет состояние `COVERED`, и unmatched semantic diagnostics отсутствуют.
- `status: partial` — отчёт собран, но хотя бы одна coverage-dimension не закрыта полностью или есть unmatched semantics.
- `status: invalid` — есть invalid/ambiguous semantic diagnostics, поэтому CLI работает fail-closed.

`operations: covered/total (percent)` показывает только факт наблюдения операций, а не полноту статусов или параметров.

### Coverage Dimensions

CLI всегда печатает четыре измерения:

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

### Top Issues

`Top Issues` показывает только явные warnings/errors/diagnostics, а не каждую неполную метрику. Поэтому у отчёта со `status: partial` секция может честно содержать `- none`, если причина частичности — только aggregate/status dimension без fail-closed diagnostics.

### Report Path

Это путь к записанному `yanote-report.json`. Для CI это полезнее, чем парсить весь stdout.

### YANOTE_SUMMARY

Последняя строка stdout имеет стабильный формат вида:

```text
YANOTE_SUMMARY status=partial operations=100.00 status_dimension=75.00 parameters=100.00 aggregate=93.75 covered=4/4 diagnostics=0 report=./out/yanote-report.json primary=none class_counts=input:0,semantic:0,gate:0,runtime:0
```

Эту строку удобно grep-ить в CI, не разбирая весь human-readable вывод.

### YANOTE_ERROR

Если вы включили gate и он не выполнен, stderr содержит строку вида:

```text
YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE ...
```

Для текущего proof-path это происходит, если запустить:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec examples/openapi/demo-openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out \
  --min-aggregate 100
```

Ожидаемый эффект:

- exit code `3`
- `stderr` содержит `YANOTE_ERROR class=gate code=GATE_MIN_AGGREGATE`
- `stdout` всё равно заканчивается строкой `YANOTE_SUMMARY ...`
- `./out/yanote-report.json` всё равно записан и пригоден для разбора

## 5. Что искать в `yanote-report.json`

Минимальный каркас отчёта такой:

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-03-12T00:00:00.000Z",
  "toolVersion": "...",
  "phase": { "id": "02", "slug": "coverage-metrics-and-cli-reporting" },
  "status": "partial",
  "summary": {
    "totalOperations": 4,
    "coveredOperations": 4,
    "operationCoveragePercent": 100,
    "aggregateCoveragePercent": 93.75,
    "aggregateExplanation": "..."
  },
  "coverage": {
    "operations": { "state": "COVERED", "percent": 100 },
    "status": { "state": "PARTIAL", "percent": 75 },
    "parameters": { "state": "COVERED", "percent": 100 },
    "aggregate": { "state": "PARTIAL", "percent": 93.75, "explanation": "..." },
    "perOperation": []
  },
  "diagnostics": {
    "counts": { "invalid": 0, "ambiguous": 0, "unmatched": 0 },
    "items": []
  },
  "governance": {
    "exclusions": { "appliedRules": [], "unmatchedRules": [] },
    "diagnostics": []
  }
}
```

На практике обычно смотрят поля в таком порядке:

1. `status` — можно ли считать отчёт зелёным (`ok`) или он лишь частичный/invalid;
2. `summary.totalOperations` / `summary.coveredOperations` / `summary.operationCoveragePercent` — общая видимость операций;
3. `coverage.operations|status|parameters|aggregate` — truth по dimension-level coverage;
4. `coverage.perOperation[]` — где именно не хватает статусов или параметров;
5. `diagnostics.counts` и `diagnostics.items` — есть ли unmatched/ambiguous/invalid semantics;
6. `governance.exclusions.*` и `governance.diagnostics` — какие исключения применились и какие gate/policy-сигналы сработали.

Особенно полезные поля в `coverage.perOperation[]`:

- `operationKey`, `method`, `route` — стабильная идентификация операции;
- `operation.state` — наблюдалась ли операция хотя бы раз;
- `status.declared` / `status.covered` / `status.missing` — truth по response status tokens;
- `parameters.required.total|covered|missing` — truth по required parameters;
- `parameters.optional.*` — дополнительные сигналы по optional parameters;
- `suites` — какие test suites реально дали покрытие этой операции; происхождение этих значений и граница с `test.run_id` описаны в [`docs/guides/test-tagging.md`](test-tagging.md).

## 6. Как читать реальные числа из demo-path

Проверенный repo-proof даёт такие цифры:

- `operations`: `4/4`, то есть `100.00%`
- `status`: `75.00%`
- `parameters`: `100.00%`
- `aggregate`: `93.75%`
- `report.status`: `partial`

Почему так:

1. В `examples/openapi/demo-openapi.yaml` объявлены четыре операции: `GET /users`, `POST /users`, `GET /users/{id}`, `GET /admin/ping`.
2. RestAssured demo реально вызывает все четыре route, поэтому `operations = 100%`.
3. `POST /users` считается покрытой операцией, потому что matched event был.
4. Но spec для `POST /users` объявляет статус `201`, а demo-service фактически отвечает `200`, поэтому в `coverage.perOperation[]` для `http POST /users` остаётся `status.missing = ["201"]`.
5. В spec есть один required parameter — `path:id` у `GET /users/{id}`. Тест проходит через этот route, поэтому `parameters = 100%`.
6. Aggregate считается как `100 * 0.60 + 75 * 0.25 + 100 * 0.15 = 93.75`, значит aggregate остаётся `PARTIAL`, а весь отчёт — `partial`, даже при `operations = 100%`.

Это и есть главный интерпретационный момент: **полное покрытие операций не означает полное покрытие контракта**. Операция может считаться observed, но всё ещё иметь пробелы по response statuses или required parameters.

## 7. Когда использовать offline fallback

`dist/node-analyzer/` нужен только когда основной source-built путь недоступен в вашем контуре. Сам fallback описан в [`dist/node-analyzer/README.md`](../../dist/node-analyzer/README.md), но смысл и интерпретация отчёта остаются теми же.

## Связанные поверхности

- Проверенный путь рекордера: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Канонический test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Runnable demo-service: [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md)
- RestAssured handoff для тестовых метаданных: [`examples/tests-restassured/README.md`](../../examples/tests-restassured/README.md)
- Offline fallback analyzer bundle: [`dist/node-analyzer/README.md`](../../dist/node-analyzer/README.md)
