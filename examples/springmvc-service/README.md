# Spring MVC demo service

Назад: [examples/README.md](../README.md) · [канонический recorder guide](../../docs/guides/recorder-spring-mvc.md)

Это runnable companion к recorder guide: пример уже включает `yanote-recorder-spring-mvc`, а канонический contract и proof loop живут в [../../docs/guides/recorder-spring-mvc.md](../../docs/guides/recorder-spring-mvc.md).

## Что здесь уже настроено

В `application.properties` пример держит те же свойства:

- `yanote.recorder.enabled=true`
- `yanote.recorder.service-name=${EXAMPLE_SERVICE_NAME:examples-service}`
- `yanote.recorder.events-path=${YANOTE_EVENTS_PATH:/data/yanote/${yanote.recorder.service-name}-${server.port}.events.jsonl}`

То есть shared surface остаётся `yanote.recorder.events-path`, а `YANOTE_EVENTS_PATH` здесь только удобный example/env bridge.

## Быстрый запуск

```bash
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
mkdir -p "$(dirname "$YANOTE_EVENTS_PATH")"
./gradlew :examples:springmvc-service:bootRun
```

После старта сделайте один запрос и проверьте `events.jsonl`:

```bash
curl --fail --silent --show-error "http://localhost:8080/users/123" >/tmp/yanote-example-response.json
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_EVENTS_PATH"
```

Если запрос пришёл без `X-Test-Run-Id` и `X-Test-Suite`, recorder всё равно запишет ключи `test.run_id` и `test.suite`, но со значением `null`.

Для runnable handoff с test metadata и заголовками переходите в [../tests-restassured/README.md](../tests-restassured/README.md).
