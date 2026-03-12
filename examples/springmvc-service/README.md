# Spring MVC demo service

Этот пример показывает уже подключённый Spring Boot сервис с `yanote-recorder-spring-mvc`, но каноническая инструкция по интеграции живёт в [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md). Вернуться к карте примеров и общему demo-сценарию можно через [`examples/README.md`](../README.md).

Что здесь уже настроено теми же свойствами, что и в гайде:

- `yanote.recorder.enabled=true`
- `yanote.recorder.events-path=${YANOTE_EVENTS_PATH:/data/yanote/events.jsonl}`
- `yanote.recorder.service-name=examples-service`

Запуск из корня репозитория:

```bash
./gradlew :examples:springmvc-service:bootRun
```

По умолчанию пример пишет в `/data/yanote/events.jsonl`. Для локальной папки можно переопределить путь через env:

```bash
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
mkdir -p "$(dirname "$YANOTE_EVENTS_PATH")"
./gradlew :examples:springmvc-service:bootRun
```

После старта сервиса сделайте любой реальный запрос и проверьте файл так же, как в каноническом гайде:

```bash
export YANOTE_EVENTS_PATH="${YANOTE_EVENTS_PATH:-/data/yanote/events.jsonl}"
curl --fail --silent --show-error "http://localhost:8080/users/123" >/tmp/yanote-example-response.json
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_EVENTS_PATH"
```

Если запрос пришёл **без** заголовков `X-Test-Run-Id` и `X-Test-Suite`, рекордер всё равно запишет поля `test.run_id` и `test.suite`, но со значением `null`. Для сценария с автоподстановкой заголовков и `yanote.suite` смотрите [`examples/tests-restassured/README.md`](../tests-restassured/README.md).

Если нужна не примерная сборка внутри этого multi-module проекта, а обычное dependency-based подключение к вашему сервису, возвращайтесь к [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md). Если Maven-публикация недоступна и нужен только быстрый smoke/offline прогон, используйте fallback [`dist/flatdir-recorder/README.md`](../../dist/flatdir-recorder/README.md).
