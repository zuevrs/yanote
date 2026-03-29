# Быстрый старт Yanote

Назад: [корневой README](../../README.md) · [карта документации](../README.md)

Это один короткий newcomer path: подключить recorder, увидеть `events.jsonl`, передать test metadata, запустить analyzer и затем повторить тот же цикл на repo demo.

## 1. Recorder: сначала получите `events.jsonl`

Канонический guide: [recorder-spring-mvc.md](recorder-spring-mvc.md)

Подключите `io.github.zuevrs:yanote-recorder-spring-mvc:<version>` и включите recorder явно:

```properties
yanote.recorder.enabled=true
yanote.recorder.events-path=/data/yanote/events.jsonl
yanote.recorder.service-name=orders-service
```

Эквивалент через env для Spring Boot:

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
export YANOTE_RECORDER_SERVICE_NAME=orders-service
mkdir -p "$(dirname "$YANOTE_EVENTS_PATH")"
```

Сделайте один живой HTTP-запрос или прогон тестов, а затем проверьте exact proof check:

```bash
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
```

Если нужен runnable service example, откройте [../../examples/springmvc-service/README.md](../../examples/springmvc-service/README.md).

## 2. Tagging: привяжите прогон и suite к evidence

Канонический guide: [test-tagging.md](test-tagging.md)

Текущий handoff в продукте такой:

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`
- analyzer поднимает suite names в `coverage.perOperation[].suites`

Для library-level интеграций общей suite surface остаётся `yanote.suite`. Переменная `YANOTE_SUITE` в этом репозитории нужна только как demo/env bridge для repo example.

Runnable example этого handoff: [../../examples/tests-restassured/README.md](../../examples/tests-restassured/README.md).

## 3. Analyzer: превратите события в отчёт

Канонический guide: [analyzer-coverage.md](analyzer-coverage.md)

Опубликованный install/run surface — `yanote-analyzer.zip`. После распаковки запускайте `bin/yanote report`:

```bash
./yanote-analyzer/bin/yanote report \
  --spec /path/to/openapi.yaml \
  --events "$YANOTE_EVENTS_PATH" \
  --out ./out
```

Результат сохраняется в sibling-артефакты `yanote-report.json` и `yanote-report.html`.

Если нужен published bundle, текущая stable line `v1.0.x` и support boundary описаны в [../release-and-support.md](../release-and-support.md).

## 4. Repo demo: пройдите тот же цикл на готовых примерах

Начните с [../../examples/README.md](../../examples/README.md), затем при необходимости откройте [../../examples/docker-compose.yml](../../examples/docker-compose.yml).

Ищите тот же продуктовый цикл, что и выше:

1. demo service пишет `events.jsonl`;
2. demo tests передают run/suite metadata;
3. analyzer строит `yanote-report.json` и `yanote-report.html`.

## Куда идти дальше

- Нужны отдельные детали по recorder path: [recorder-spring-mvc.md](recorder-spring-mvc.md)
- Нужны детали по tagging contract: [test-tagging.md](test-tagging.md)
- Нужны детали по analyzer/report: [analyzer-coverage.md](analyzer-coverage.md)
- Нужна вся карта docs: [../README.md](../README.md)
