# Spring WebFlux demo service

Назад: [examples/README.md](../README.md) · [узкий WebFlux recorder guide](../../docs/guides/recorder-spring-webflux.md)

Это runnable companion к WebFlux recorder guide: пример уже включает `yanote-recorder-spring-webflux`, а канонический contract и proof loop живут в [../../docs/guides/recorder-spring-webflux.md](../../docs/guides/recorder-spring-webflux.md).

Этот example остаётся Boot 3 companion app для narrow guide. Отдельная consumer-style compatibility proof для Boot 2.7 / Spring 5.3 идёт через `bash scripts/ci/verify-recorder-spring-webflux-consumer-docker.sh`, а не через этот example module.

## Что здесь уже настроено

В `application.properties` пример держит те же свойства:

- `yanote.recorder.enabled=true`
- `yanote.recorder.service-name=${EXAMPLE_SERVICE_NAME:examples-webflux-service}`
- `yanote.recorder.events-path=${YANOTE_EVENTS_PATH:/data/yanote/${yanote.recorder.service-name}-${server.port}.events.jsonl}`

То есть shared surface остаётся `yanote.recorder.events-path`, а `YANOTE_EVENTS_PATH` здесь только удобный example/env bridge.

## Быстрый запуск

```bash
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
mkdir -p "$(dirname "$YANOTE_EVENTS_PATH")"
./gradlew :examples:webflux-service:bootRun
```

После старта сделайте один JSON request и проверьте `events.jsonl`:

```bash
curl --fail --silent --show-error \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'X-Test-Run-Id: webflux-example-run' \
  -H 'X-Test-Suite: webflux-example-suite' \
  -H 'X-Request-Flavor: amber' \
  -b 'clientMode=compact; SESSION=example-session' \
  --data '{"name":"Ada","meta":{"source":"example"}}' \
  'http://localhost:8080/payload-evidence/users/user-42?expand=true&tags=alpha&tags=bravo' \
  >/tmp/yanote-webflux-example-response.json

test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_EVENTS_PATH"
```

В записанном событии ищите `X-Test-Run-Id` → `test.run_id`, `X-Test-Suite` → `test.suite`, а для текущего proved JSON path — `requestBodyState=captured` и `responseBodyState=captured`.
