# yanote

Инструмент для сбора покрытия REST API тестами по OpenAPI и событийным файлам (`events.jsonl`), с поддержкой режима регрессий.

## Основное

- `yanote-core`: модель событий (для рекордеров).
- `yanote-js`: Node CLI для расчёта покрытия и отчётов (OpenAPI сейчас, AsyncAPI далее).
- `yanote-recorder-spring-mvc`: стартер для записи вызовов в `events.jsonl`.
- `yanote-test-tags-restassured`: фильтр для автоподстановки заголовков `X-Test-Run-Id` и `X-Test-Suite`.
- `yanote-test-tags-cucumber`: плагин для определения suite и передачи её в заголовки через системное свойство `yanote.suite`.

## Настройка рекордера (Spring MVC)

По умолчанию `yanote-recorder-spring-mvc` **выключен**. Это сделано специально, чтобы подключение стартера в production не начинало записывать прод-трафик “само собой”.

Чтобы включить запись событий:

- `yanote.recorder.enabled=true`
- `yanote.recorder.events-path=/path/to/events.jsonl` (по умолчанию `events.jsonl`)
- `yanote.recorder.service-name=...` (опционально)

## Быстрый офлайн-тест в закрытой сети (временный вариант)

Если нужно **максимально быстро** проверить, что рекордер пишет `events.jsonl` в вашем Spring Boot 3.x сервисе в закрытом контуре, можно использовать **временный** способ подключения через Gradle `flatDir` (локальные JAR’ы).

- Инструкция: `dist/flatdir-recorder/README.md`
- Сборка bundle JAR’ов в этом репо: `./gradlew distFlatdirRecorder`

> Этот способ удобен для smoke-проверок, но не рекомендуется как долгосрочная интеграция (лучше внутренняя публикация в Maven-репозиторий или `mavenLocal()`).

## Быстрый запуск

```bash
./gradlew test
```

## Генерация отчёта из собранных событий

```bash
npm -C yanote-js install
npm -C yanote-js run build
node yanote-js/dist/yanote.cjs report \
  --spec /path/to/openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out
```

## E2E пример (Spring MVC + RestAssured)

В директории `examples/` есть runnable-сборка:

- `examples/springmvc-service/` — demo Spring MVC сервис с включённым `yanote-recorder-spring-mvc`
- `examples/tests-restassured/` — demo RestAssured тесты с `YanoteRestAssuredFilter`
- `examples/openapi/demo-openapi.yaml` — пример спецификации API
- `examples/docker-compose.yml` — поднимает сервис, выполняет тесты, строит отчёт
- В `examples/docker-compose.yml` для демо установлен порог покрытия `--min-coverage 100` для демонстрации fail-fast поведения.

Запуск:

```bash
docker compose -f examples/docker-compose.yml up --build --exit-code-from report
```

После выполнения команда создаст файл отчёта:

- `examples/` → общий volume `./yanote-events:/data/yanote` (в контейнерах)
- `yanote-report.json` в директории `/data/yanote/out`
