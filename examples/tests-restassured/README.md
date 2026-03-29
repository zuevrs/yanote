# RestAssured demo tests

Назад: [examples/README.md](../README.md) · [канонический tagging guide](../../docs/guides/test-tagging.md)

Это runnable companion к tagging guide: пример показывает repo demo bridge для RestAssured, а shared contract живёт в [../../docs/guides/test-tagging.md](../../docs/guides/test-tagging.md).

## Текущий demo bridge

- `YANOTE_RUN_ID` задаёт run id;
- `YANOTE_SUITE` задаёт demo suite value;
- тест копирует suite в `System.setProperty("yanote.suite", ...)`;
- `YanoteRestAssuredFilter` отправляет `X-Test-Run-Id` и `X-Test-Suite`.

`YANOTE_SUITE` здесь только demo/env bridge. Shared surface для suite остаётся `yanote.suite`.

## Быстрый запуск

Сначала поднимите сервис из [../springmvc-service/README.md](../springmvc-service/README.md), затем из корня репозитория:

```bash
export YANOTE_RUN_ID=manual-run-1
export YANOTE_SUITE=restassured-suite
export YANOTE_BASE_URI=http://localhost:8080
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"

./gradlew --no-daemon :examples:tests-restassured:test --rerun-tasks
```

После прогона проверьте handoff в `events.jsonl`:

```bash
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
rg -n 'test\.run_id|test\.suite' "$YANOTE_EVENTS_PATH"
```

Дальше прогоните analyzer и убедитесь, что suite names поднялись в `coverage.perOperation[].suites`.

За настройкой recorder path идите в [../../docs/guides/recorder-spring-mvc.md](../../docs/guides/recorder-spring-mvc.md).
