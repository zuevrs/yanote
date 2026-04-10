# Узкий путь: Spring WebFlux recorder в одном коротком цикле

Назад: [быстрый старт](getting-started.md) · [карта docs](../README.md)

Этот guide описывает отдельный узкий путь для `yanote-recorder-spring-webflux`. Он не заменяет канонический newcomer path через Spring MVC guide и не обещает generic «Spring HTTP recorder» parity.

Product-first loop здесь один: подключить `yanote-recorder-spring-webflux`, явно включить запись, сделать один конечный JSON HTTP-запрос и доказать, что `events.jsonl` появился с route/status/request-evidence и bounded JSON payload truth.

## 1. Подключите зависимость

```kotlin
repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    implementation("io.github.zuevrs:yanote-recorder-spring-webflux:<version>")
}
```

Если нужен runnable companion из этого репозитория, используйте [examples/webflux-service/README.md](../../examples/webflux-service/README.md). Release/support boundaries для этого narrow path описаны в [../release-and-support.md](../release-and-support.md).

## 2. Явно задайте recorder contract

Для Spring Boot держите recorder включённым и задайте writable путь к файлу:

```properties
yanote.recorder.enabled=true
yanote.recorder.events-path=/data/yanote/events.jsonl
yanote.recorder.service-name=orders-webflux-service
```

Что важно:

- `yanote.recorder.enabled=true` — без этого starter ничего не пишет;
- `yanote.recorder.events-path` — путь к реальному `events.jsonl`, который вы потом прочитаете или заберёте как артефакт;
- `yanote.recorder.service-name` — рекомендуемый label для источника события.

Эквивалент через Spring Boot env binding:

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_RECORDER_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
export YANOTE_RECORDER_SERVICE_NAME=orders-webflux-service
mkdir -p "$(dirname "$YANOTE_RECORDER_EVENTS_PATH")"
```

## 3. Сделайте один реальный конечный JSON-запрос

Запустите свой WebFlux service или companion example из `examples/webflux-service`, затем отправьте один обычный JSON request:

```bash
curl --fail --silent --show-error \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'X-Test-Run-Id: webflux-guide-run' \
  -H 'X-Test-Suite: webflux-guide-suite' \
  -H 'X-Request-Flavor: amber' \
  -b 'clientMode=compact; SESSION=guide-session' \
  --data '{"name":"Ada","meta":{"source":"guide"}}' \
  'http://localhost:8080/payload-evidence/users/user-42?expand=true&tags=alpha&tags=bravo' \
  >/tmp/yanote-webflux-response.json
```

Базовый proof loop должен закончиться двумя командами:

```bash
test -s "$YANOTE_RECORDER_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_RECORDER_EVENTS_PATH"
```

Если файл не появился или пустой, интеграция ещё не готова.

## 4. Что вы должны увидеть в первой JSONL-строке

Для базового smoke check достаточно убедиться, что первая строка содержит правдоподобные значения для:

- `method`
- `route`
- `status`
- `service`
- `test.run_id`
- `test.suite`
- `requestBodyState`
- `responseBodyState`

На текущем proved path для конечного JSON exchange ожидайте `requestBodyState=captured` и `responseBodyState=captured`.

## 5. Где появляются test headers

Recorder читает два HTTP заголовка:

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`

Полный handoff до report-level suites описан в [test-tagging.md](test-tagging.md). Здесь достаточно доказать, что ваш WebFlux service вообще пишет `events.jsonl`.

## 6. Что этот guide явно не обещает

Этот narrow path сейчас не обещает:

- `SSE`
- `application/stream+json`
- long-lived / infinite streams
- multipart / file-transfer paths
- broad functional-route parity
- generic «Spring HTTP recorder» wording

## 7. Репозиторный verifier

Для того же loop, но на уже подготовленном узком smoke fixture из репозитория, запустите:

```bash
bash scripts/docs/verify-recorder-spring-webflux-path.sh
```

Этот verifier публикует recorder в `mavenLocal()`, поднимает минимальный Spring Boot WebFlux fixture, делает один реальный JSON request и проверяет реальный `events.jsonl`.

## Связанные поверхности

- Runnable service companion: [../../examples/webflux-service/README.md](../../examples/webflux-service/README.md)
- Test metadata handoff: [test-tagging.md](test-tagging.md)
- Quickstart path: [getting-started.md](getting-started.md)
- Release/support boundary для narrow WebFlux surface: [../release-and-support.md](../release-and-support.md)
