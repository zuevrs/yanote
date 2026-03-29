# Канонический путь: Spring MVC recorder в одном коротком цикле

Назад: [быстрый старт](getting-started.md) · [карта docs](../README.md)

Этот guide держит один product-first loop: подключить `yanote-recorder-spring-mvc`, явно включить запись, сделать один HTTP-запрос и доказать, что `events.jsonl` появился.

## 1. Подключите зависимость

```kotlin
repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    implementation("io.github.zuevrs:yanote-recorder-spring-mvc:<version>")
}
```

Если нужен только runnable companion из этого репозитория, используйте [examples/springmvc-service/README.md](../../examples/springmvc-service/README.md). Release/support boundaries вынесены в [../release-and-support.md](../release-and-support.md).

## 2. Явно задайте recorder contract

Для Spring Boot держите recorder включённым и задайте writable путь к файлу:

```properties
yanote.recorder.enabled=true
yanote.recorder.events-path=/data/yanote/events.jsonl
yanote.recorder.service-name=orders-service
```

Что важно:

- `yanote.recorder.enabled=true` — без этого starter ничего не пишет;
- `yanote.recorder.events-path` — путь к реальному `events.jsonl`, который вы потом прочитаете или заберёте как артефакт;
- `yanote.recorder.service-name` — рекомендуемый label для источника события.

Эквивалент через Spring Boot env binding:

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_RECORDER_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
export YANOTE_RECORDER_SERVICE_NAME=orders-service
mkdir -p "$(dirname "$YANOTE_RECORDER_EVENTS_PATH")"
```

## 3. Сделайте один реальный HTTP-запрос

Запустите свой сервис или пример из `examples/springmvc-service`, затем отправьте обычный запрос:

```bash
curl --fail --silent --show-error "http://localhost:8080/users/123" >/tmp/yanote-response.json
```

Базовый proof loop должен закончиться двумя командами:

```bash
test -s "$YANOTE_RECORDER_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_RECORDER_EVENTS_PATH"
```

Если файл не появился или пустой, интеграция ещё не готова.

## 4. Что вы должны увидеть в первой JSONL-строке

Recorder пишет HTTP event c теми полями, которые потом читает analyzer. Для базового smoke check достаточно убедиться, что первая строка содержит правдоподобные значения для:

- `method`
- `route`
- `status`
- `service`
- `test.run_id`
- `test.suite`

Если запрос пришёл без тестовых заголовков, `test.run_id` и `test.suite` всё равно останутся в JSONL как ключи со значением `null`.

## 5. Где появляются test headers

Recorder читает два HTTP заголовка:

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`

Полный handoff до report-level `coverage.perOperation[].suites` описан в [test-tagging.md](test-tagging.md). Здесь достаточно доказать, что ваш сервис вообще пишет `events.jsonl`.

## 6. Репозиторный verifier

Для того же loop, но на уже подготовленном smoke fixture из репозитория, запустите:

```bash
bash scripts/docs/verify-recorder-path.sh
```

Этот verifier публикует recorder в `mavenLocal()`, поднимает минимальный Spring Boot fixture, делает HTTP-запрос и проверяет реальный `events.jsonl`.

## Связанные поверхности

- Runnable service companion: [../../examples/springmvc-service/README.md](../../examples/springmvc-service/README.md)
- Test metadata handoff: [test-tagging.md](test-tagging.md)
- Quickstart path: [getting-started.md](getting-started.md)
