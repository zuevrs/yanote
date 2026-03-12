# yanote

Инструмент для сбора покрытия REST API тестами по OpenAPI и событийным файлам (`events.jsonl`), с поддержкой режима регрессий.

## Основное

- `yanote-core`: модель событий (для рекордеров).
- `yanote-js`: Node CLI для расчёта покрытия и отчётов (OpenAPI сейчас, AsyncAPI далее).
- `yanote-recorder-spring-mvc`: стартер для записи вызовов в `events.jsonl`.
- `yanote-test-tags-restassured`: фильтр для автоподстановки заголовков `X-Test-Run-Id` и `X-Test-Suite`.
- `yanote-test-tags-cucumber`: плагин, который вычисляет suite и записывает её в общее системное свойство `yanote.suite`.

## Проверенный путь интеграции рекордера (Spring MVC)

Рекомендуемый путь настройки рекордера — канонический guide [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md). В корневом README оставлена только навигация по проверенному пути; точные шаги подключения, proof flow и инспекция `events.jsonl` живут в этом гайде.

Проверенный путь S01 выглядит так:

1. **Канонический dependency-based setup** — [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md)
2. **Runnable service example** — [`examples/springmvc-service/README.md`](examples/springmvc-service/README.md)
3. **Metadata handoff example (RestAssured)** — [`examples/tests-restassured/README.md`](examples/tests-restassured/README.md)
4. **Smoke/offline fallback** — [`dist/flatdir-recorder/README.md`](dist/flatdir-recorder/README.md) только когда публикация в Maven-репозиторий или `mavenLocal()` недоступна

Канонические свойства этого пути:

- `yanote.recorder.enabled`
- `yanote.recorder.events-path`
- `yanote.recorder.service-name` (опционально)

Bundle для smoke/offline fallback по-прежнему можно собрать командой `./gradlew distFlatdirRecorder`, но основной и проверенный путь — обычная зависимость из `mavenLocal()` или внутреннего Maven-репозитория по гайду выше.

## Быстрый запуск

```bash
./gradlew test
```

## Для мейнтейнера

- Политика релизных тегов и подписи: `docs/maintainers/release-signing.md`

## Канонический путь анализа покрытия

Рекомендуемый путь запуска analyzer и интерпретации результата описан в [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md). В корневом README оставлена только навигация по проверенному пути.

Проверенный путь S02 выглядит так:

1. **Собрать/получить `events.jsonl`** — [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md)
2. **Канонический source-built analyzer path** — [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md)
3. **Runnable repo example** — [`examples/docker-compose.yml`](examples/docker-compose.yml)
4. **Offline fallback bundle** — [`dist/node-analyzer/README.md`](dist/node-analyzer/README.md) только когда нельзя собрать `yanote-js` из исходников

Минимальная команда из корня репозитория:

```bash
npm -C yanote-js ci
npm -C yanote-js run build
node yanote-js/dist/yanote.cjs report \
  --spec /path/to/openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out
```

Ожидаемые surface-ы этого пути:

- stdout с секцией `Summary`
- финальная machine-readable строка `YANOTE_SUMMARY ...`
- файл `./out/yanote-report.json`
- при gate/input/semantic fail-closed — `stderr` с `YANOTE_ERROR ...`

## Канонический путь тестовых метаданных

Текущий contract RestAssured/Cucumber описан в [`docs/guides/test-tagging.md`](docs/guides/test-tagging.md). В корневом README оставлена только навигация по этому handoff.

Что этот guide фиксирует:

- `YanoteRestAssuredFilter` добавляет `X-Test-Run-Id` и `X-Test-Suite`;
- `YanoteSuiteNamePlugin` заполняет shared property `yanote.suite`;
- рекордер пишет `test.run_id` и `test.suite` в `events.jsonl`;
- analyzer поднимает suite names в `coverage.perOperation[].suites`, но не переносит туда run id.

Runnable demo этого handoff: [`examples/tests-restassured/README.md`](examples/tests-restassured/README.md)

## E2E пример (Spring MVC + RestAssured)

В директории `examples/` есть runnable-сборка:

- `examples/springmvc-service/` — demo Spring MVC сервис с включённым `yanote-recorder-spring-mvc`
- `examples/tests-restassured/` — demo RestAssured тесты с `YanoteRestAssuredFilter`
- `examples/openapi/demo-openapi.yaml` — пример спецификации API
- `examples/docker-compose.yml` — поднимает сервис, форсирует свежий прогон тестов и запускает тот же source-built analyzer path без устаревшего `--exclude /health`

Запуск:

```bash
docker compose -f examples/docker-compose.yml up --build --exit-code-from report
```

После выполнения команда создаст файл отчёта:

- `examples/` → общий volume `./yanote-events:/data/yanote` (в контейнерах)
- `yanote-report.json` в директории `/data/yanote/out`
